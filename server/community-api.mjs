import { ApiError, readJSON, sendJSON, sendNoContent } from "./http.mjs";
import { requireUser, requireAdmin, rate } from "./auth-api.mjs";
import { refFrom, contentDTO, detailAllowed } from "./community-policy.mjs";
import { cleanText } from "./content-policy.mjs";
import { uid } from "./security.mjs";
import {
  analyticsDay,
  analyticsWindow,
  summarizeVisits,
} from "./analytics.mjs";

export function createCommunityAPI(db, service, maintenance) {
  const params = (url) => Object.fromEntries(url.searchParams);
  async function pageQuery(sql, args, query, order, size = 20) {
    const page = Math.max(1, Math.min(100000, parseInt(query.page) || 1));
    const count = (
      await db.query(`SELECT COUNT(*) AS total FROM (${sql}) counted`, args)
    ).rows[0];
    const values = [...args, size, (page - 1) * size];
    const rows = (
      await db.query(
        `${sql} ORDER BY ${order} LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values,
      )
    ).rows;
    return {
      rows,
      pagination: { total: Number(count.total), page, pageSize: size },
    };
  }
  async function remindersFor(user, query) {
    const clauses = ["resources", "articles"].map(
      (table, index) =>
        `SELECT id,'${index ? "article" : "resource"}' AS type,review_due_at FROM ${table} WHERE deleted_at IS NULL AND status='online' AND scope='ai' AND (review_required=true OR review_due_at<=$1)${user ? " AND user_id=$2" : ""}`,
    );
    return pageQuery(
      clauses.join(" UNION ALL "),
      [service.now(), ...(user ? [user.id] : [])],
      query,
      "review_due_at ASC NULLS FIRST,id,type",
    );
  }
  async function dashboard(user, query) {
    const [
      resources,
      articles,
      favorites,
      feedback,
      comments,
      reports,
      reminders,
    ] = await Promise.all([
      service.list(
        "resource",
        { ...query, mine: "true", manage: "false" },
        user,
      ),
      service.list(
        "article",
        { ...query, mine: "true", manage: "false" },
        user,
      ),
      pageQuery(
        "SELECT target_type,target_id,created_at FROM favorites WHERE user_id=$1",
        [user.id],
        query,
        "created_at DESC,target_type,target_id",
      ),
      pageQuery(
        "SELECT * FROM reproduction_feedback WHERE user_id=$1",
        [user.id],
        query,
        "updated_at DESC,id",
      ),
      pageQuery(
        "SELECT id,resource_id,article_id,content,created_at FROM comments WHERE user_id=$1",
        [user.id],
        query,
        "created_at DESC,id",
      ),
      pageQuery(
        "SELECT * FROM reports WHERE user_id=$1",
        [user.id],
        query,
        "created_at DESC,id",
      ),
      remindersFor(user, query),
    ]);
    const saved = [];
    for (const ref of favorites.rows) {
      const row = await service.raw(ref.target_type, ref.target_id);
      saved.push(
        row && detailAllowed(row)
          ? contentDTO(row, ref.target_type, service.now())
          : {
              id: ref.target_id,
              type: ref.target_type,
              title: "已下架的收藏",
              freshness: "broken",
            },
      );
    }
    const remindersItems = [];
    for (const ref of reminders.rows)
      remindersItems.push(
        contentDTO(
          await service.raw(ref.type, ref.id),
          ref.type,
          service.now(),
        ),
      );
    return {
      user,
      resources,
      articles,
      favorites: saved,
      feedback: feedback.rows,
      comments: comments.rows,
      reports: reports.rows,
      reminders: remindersItems,
      reminderTotal: reminders.pagination.total,
      pagination: {
        favorites: favorites.pagination,
        feedback: feedback.pagination,
        comments: comments.pagination,
        reports: reports.pagination,
        reminders: reminders.pagination,
      },
    };
  }
  async function adminData(user, query) {
    const { from, today } = analyticsWindow(service.now());
    const [
      resources,
      articles,
      users,
      reports,
      checks,
      runs,
      daily,
      tracking,
      feedback,
      reviews,
      clicks,
    ] = await Promise.all([
      service.list("resource", { ...query, manage: "true" }, user),
      service.list("article", { ...query, manage: "true" }, user),
      pageQuery(
        "SELECT id,nickname,email,role,status,created_at FROM users",
        [],
        query,
        "created_at DESC,id",
      ),
      pageQuery(
        "SELECT * FROM reports WHERE status='pending'",
        [],
        query,
        "created_at,id",
      ),
      pageQuery(
        "SELECT * FROM content_links WHERE check_status NOT IN ('ok','unchecked','reviewed')",
        [],
        query,
        "last_checked_at DESC,id",
      ),
      pageQuery(
        "SELECT * FROM maintenance_runs",
        [],
        query,
        "started_at DESC,id",
      ),
      db.query(
        "SELECT * FROM content_view_daily WHERE day >= $1 AND day <= $2 ORDER BY day",
        [from, today],
      ),
      db.query(
        "SELECT started_at FROM analytics_tracking WHERE name='content_views'",
      ),
      pageQuery(
        "SELECT f.*,u.nickname FROM reproduction_feedback f JOIN users u ON u.id=f.user_id WHERE outcome<>'success' AND handled_at IS NULL",
        [],
        query,
        "f.updated_at DESC,f.id",
      ),
      remindersFor(null, { page: 1 }),
      db.query(
        "SELECT SUM(count) AS total FROM content_events_daily WHERE event='outbound'",
      ),
    ]);
    return {
      resources,
      articles,
      users: users.rows,
      reports: reports.rows,
      checks: checks.rows,
      runs: runs.rows,
      feedback: feedback.rows,
      reviewTotal: reviews.pagination.total,
      outboundClicks: Number(clicks.rows[0].total || 0),
      stats: summarizeVisits(
        daily.rows,
        tracking.rows[0]?.started_at || service.now(),
        service.now(),
      ),
      maintenanceEnabled: maintenance.enabled,
      pagination: {
        users: users.pagination,
        reports: reports.pagination,
        checks: checks.pagination,
        runs: runs.pagination,
        feedback: feedback.pagination,
      },
    };
  }
  return async (context) => {
    const { req, res, url, user, repository: repo } = context;
    const path = url.pathname;
    const query = params(url);
    const send = (data) => sendJSON(res, 200, data);
    if (req.method === "GET") {
      if (path === "/api/bootstrap")
        return send({
          currentUser: user,
          catalog: await service.catalog(),
          home: await service.home(),
        });
      if (path === "/api/catalog") return send(await service.catalog());
      if (path === "/api/search") return send(await service.search(query));
      if (path === "/api/updates") return send(await service.updates(query));
      if (path === "/api/topics")
        return send(await service.topics(query, user));
      if (path === "/api/me/dashboard")
        return send(await dashboard(requireUser(context), query));
      if (path === "/api/admin/data")
        return send(await adminData(requireAdmin(context), query));
      let m = path.match(
        /^\/api\/(resources|articles)(?:\/([^/]+)(?:\/(comments|metadata))?)?$/,
      );
      if (m) {
        const type = m[1] === "articles" ? "article" : "resource",
          id = m[2] && decodeURIComponent(m[2]);
        if (!id) return send(await service.list(type, query, user));
        if (m[3] === "metadata")
          throw new ApiError(404, "媒体请使用内容中的来源链接");
        if (m[3] === "comments") {
          await service.requireContent(type, id, { publicOnly: true });
          return send({ items: await service.listComments(type, id, query) });
        }
        return send(await service.detail(type, id, user));
      }
      m = path.match(/^\/api\/(topics|creators)\/([^/]+)$/);
      if (m)
        return send(
          await (m[1] === "topics"
            ? service.topic(decodeURIComponent(m[2]), user)
            : service.creator(decodeURIComponent(m[2]), query)),
        );
    }
    if (req.method === "POST" && path === "/api/reports") {
      rate(context, "report", { limit: 8, windowMs: 3600000 });
      const body = await readJSON(req),
        ref = refFrom(body);
      await service.requireContent(ref.type, ref.id, { publicOnly: true });
      return sendJSON(res, 201, {
        report: await repo.createReport({
          targetId: ref.id,
          targetType: ref.type,
          reportType: cleanText(body.reportType || body.type, {
            min: 2,
            max: 30,
          }),
          detail: cleanText(body.detail, { min: 5, max: 500 }),
          userId: user?.id,
        }),
      });
    }
    let m = path.match(/^\/api\/(resources|articles)\/([^/]+)\/(view|click)$/);
    if (m && req.method === "POST") {
      rate(context, "event", { limit: 120, windowMs: 60000 });
      const type = m[1] === "articles" ? "article" : "resource",
        id = decodeURIComponent(m[2]);
      await service.requireContent(type, id, { publicOnly: true });
      if (m[3] === "view")
        return send({ views: await repo.incrementView(type, id) });
      const body = await readJSON(req);
      const links = await service.linksFor(type, id);
      if (!links.some((l) => l.id === body.linkId))
        throw new ApiError(400, "链接不存在");
      await db.query(
        "INSERT INTO content_events_daily(day,target_type,target_id,event,count) VALUES($1,$2,$3,'outbound',1) ON CONFLICT(day,target_type,target_id,event) DO UPDATE SET count=content_events_daily.count+1",
        [analyticsDay(service.now()), type, id],
      );
      return send({ ok: true });
    }
    requireUser(context);
    m = path.match(/^\/api\/(resources|articles)(?:\/([^/]+))?$/);
    if (m) {
      const type = m[1] === "articles" ? "article" : "resource",
        id = m[2] && decodeURIComponent(m[2]);
      if ((req.method === "POST" && !id) || (req.method === "PATCH" && id)) {
        rate(context, "publish", { limit: 30, windowMs: 3600000 });
        return sendJSON(
          res,
          id ? 200 : 201,
          await service.save(
            type,
            await readJSON(req, { maxBytes: 512 * 1024 }),
            user,
            id,
          ),
        );
      }
      if (req.method === "DELETE" && id) {
        await service.remove(type, id, user);
        return sendNoContent(res);
      }
    }
    if (req.method === "POST" && path === "/api/favorites/toggle") {
      const ref = refFrom(await readJSON(req));
      return send(
        await db.transaction(async (client) => {
          const removed = await client.query(
            "DELETE FROM favorites WHERE user_id=$1 AND target_type=$2 AND target_id=$3 RETURNING target_id",
            [user.id, ref.type, ref.id],
          );
          if (removed.rows.length) return { favorite: false };
          await service.requireContent(ref.type, ref.id, { publicOnly: true });
          await client.query(
            "INSERT INTO favorites(user_id,target_type,target_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
            [user.id, ref.type, ref.id],
          );
          return { favorite: true };
        }),
      );
    }
    if (
      req.method === "POST" &&
      ["/api/verifications", "/api/feedback", "/api/comments"].includes(path)
    ) {
      rate(context, "contribute", { limit: 30, windowMs: 600000 });
      const body = await readJSON(req),
        ref = refFrom(body);
      return sendJSON(
        res,
        201,
        path === "/api/verifications"
          ? await service.verify(ref, body, user)
          : path === "/api/feedback"
            ? await service.feedback(ref, body, user)
            : { comment: await service.comment(ref, body, user) },
      );
    }
    m = path.match(/^\/api\/comments\/([^/]+)(\/like)?$/);
    if (m) {
      const c = (
        await db.query(
          "SELECT * FROM comments WHERE id=$1 AND status='online'",
          [m[1]],
        )
      ).rows[0];
      if (!c) throw new ApiError(404, "评论不存在");
      await service.requireContent(
        c.article_id ? "article" : "resource",
        c.article_id || c.resource_id,
        { publicOnly: true },
      );
      if (req.method === "POST" && m[2])
        return send(await repo.likeComment(m[1], user.id));
      if (req.method === "DELETE" && !m[2]) {
        if (!(await repo.deleteOwnComment(m[1], user.id)))
          throw new ApiError(403, "只能删除自己的评论");
        return sendNoContent(res);
      }
    }
    if (path.startsWith("/api/admin/")) {
      requireAdmin(context);
      m = path.match(
        /^\/api\/admin\/(resources|articles)\/([^/]+)\/(moderate)$/,
      );
      if (m && req.method === "POST")
        return send(
          await service.moderate(
            {
              type: m[1] === "articles" ? "article" : "resource",
              id: decodeURIComponent(m[2]),
            },
            await readJSON(req),
            user,
          ),
        );
      m = path.match(/^\/api\/admin\/(links|feedback)\/([^/]+)$/);
      if (m && req.method === "PATCH") {
        const body = await readJSON(req);
        const reason = cleanText(body.reason, {
          name: "核对说明",
          min: 5,
          max: 1000,
        });
        await db.transaction(async (client) => {
          const result =
            m[1] === "links"
              ? await client.query(
                  "UPDATE content_links SET check_status='reviewed',check_note=$1 WHERE id=$2 RETURNING id",
                  [reason, m[2]],
                )
              : await client.query(
                  "UPDATE reproduction_feedback SET handled_at=$1,handling_note=$2 WHERE id=$3 RETURNING id",
                  [service.now(), reason, m[2]],
                );
          if (!result.rows.length) throw new ApiError(404, "记录不存在");
          await client.query(
            "INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5,$6)",
            [
              uid("audit"),
              user.id,
              "review.resolve",
              m[1],
              m[2],
              JSON.stringify({ reason }),
            ],
          );
        });
        return send({ ok: true });
      }
      m = path.match(/^\/api\/admin\/topics(?:\/([^/]+))?$/);
      if (m && m[1] && req.method === "DELETE") {
        await service.removeTopic(decodeURIComponent(m[1]), user);
        return sendNoContent(res);
      }
      if (m && ["POST", "PATCH"].includes(req.method))
        return send(
          await service.saveTopic(await readJSON(req), user, m[1] || null),
        );
      if (path === "/api/admin/catalog" && req.method === "POST") {
        const body = await readJSON(req);
        if (!["industry", "platform", "task"].includes(body.category))
          throw new ApiError(400, "标签类型不正确");
        await db.query(
          "INSERT INTO catalog_tags(category,name) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [body.category, cleanText(body.name, { min: 1, max: 40 })],
        );
        return send(await service.catalog());
      }
      if (path === "/api/admin/maintenance" && req.method === "POST")
        return send(await maintenance.run());
      m = path.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
      if (m && req.method === "PATCH") {
        const body = await readJSON(req);
        if (!["active", "banned"].includes(body.status))
          throw new ApiError(400, "账号状态不正确");
        await repo.setUserStatus(m[1], body.status, user.id);
        return send({ ok: true });
      }
      m = path.match(/^\/api\/admin\/reports\/([^/]+)$/);
      if (m && req.method === "PATCH") {
        const body = await readJSON(req);
        if (!["resolved", "dismissed"].includes(body.status))
          throw new ApiError(400, "处理状态不正确");
        await repo.handleReport(m[1], body.status, user.id);
        return send({ ok: true });
      }
    }
    throw new ApiError(404, "接口不存在", "NOT_FOUND");
  };
}
