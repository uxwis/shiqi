import { uid } from "./security.mjs";
import { ApiError } from "./http.mjs";
import { cleanText, safeExternalURL } from "./content-policy.mjs";
import { articleText } from "../rich-text.js";
import {
  DOMAINS,
  RESOURCE_KINDS,
  ARTICLE_KINDS,
  LINK_KINDS,
  DEFAULT_INDUSTRIES,
} from "../shared/catalog.js";
import {
  tables,
  contentType,
  freshness,
  listed,
  detailAllowed,
  canFeature,
  contentDTO,
  cleanInput,
  parseJSON,
  iso,
} from "./community-policy.mjs";

const json = (value) => JSON.stringify(value);
const daysAfter = (date, days) => new Date(+date + days * 86400000);
function pagination(params = {}) {
  return {
    page: Math.max(1, Math.min(100000, parseInt(params.page) || 1)),
    pageSize: Math.max(1, Math.min(50, parseInt(params.pageSize) || 20)),
  };
}
function material(input, type, links, resourceIds) {
  const details = { ...input.details };
  delete details.updateNote;
  return json({
    aiUse: input.aiUse,
    kind: input.kind,
    website: input.website,
    description: input.description,
    body: type === "article" ? articleText(input.body) : null,
    images:
      type === "article"
        ? input.body.filter((b) => b?.type === "image").map((b) => b.src)
        : [],
    inlineLinks:
      type === "article"
        ? JSON.stringify(input.body).match(/\"href\":\"[^\"]+/g)
        : [],
    details,
    links: links
      .map((l) => ({ kind: l.kind, url: l.url }))
      .sort((a, b) => a.url.localeCompare(b.url)),
    resourceIds: [...resourceIds].sort(),
  });
}

export function createCommunityService(db, { now = () => new Date() } = {}) {
  const tableFor = (type) => tables[contentType(type)];
  function publicWhere(alias, values, { includeDue = false } = {}) {
    const base = `${alias}.scope='ai' AND ${alias}.status='online' AND ${alias}.deleted_at IS NULL`;
    if (includeDue) return base;
    values.push(now());
    return `${base} AND ${alias}.review_required=false AND ${alias}.review_due_at>$${values.length}`;
  }
  async function raw(type, id, client = db) {
    return (
      (
        await client.query(
          `SELECT c.*,u.nickname AS author FROM ${tableFor(type)} c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=$1`,
          [id],
        )
      ).rows[0] || null
    );
  }
  async function requireContent(
    type,
    id,
    { actor, write = false, publicOnly = false } = {},
  ) {
    const row = await raw(type, id);
    if (!row || row.deleted_at)
      throw new ApiError(404, "内容不存在", "NOT_FOUND");
    if (write && actor?.role !== "admin" && actor?.id !== row.user_id)
      throw new ApiError(403, "没有权限修改该内容", "FORBIDDEN");
    if (publicOnly && !detailAllowed(row))
      throw new ApiError(
        410,
        row.unavailable_reason || "内容已下架",
        "CONTENT_UNAVAILABLE",
        { replacementURL: row.replacement_url || "" },
      );
    return row;
  }
  async function linksFor(type, id, client = db) {
    return (
      await client.query(
        "SELECT * FROM content_links WHERE target_type=$1 AND target_id=$2 ORDER BY id",
        [type, id],
      )
    ).rows;
  }
  async function resourceIdsFor(id, client = db) {
    return (
      await client.query(
        "SELECT resource_id FROM article_resources WHERE article_id=$1 ORDER BY position",
        [id],
      )
    ).rows.map((r) => r.resource_id);
  }
  async function list(type, params = {}, actor = null) {
    const { page, pageSize } = pagination(params);
    const values = [];
    const table = tableFor(type);
    const clauses = [];
    if (actor?.role === "admin" && params.manage === "true") {
      clauses.push("c.deleted_at IS NULL");
      if (params.queue === "review") {
        values.push(now());
        clauses.push(
          `c.scope='ai' AND c.status='online' AND (c.review_required=true OR c.review_due_at<=$${values.length})`,
        );
      }
      if (params.scope) {
        values.push(params.scope);
        clauses.push(`c.scope=$${values.length}`);
      }
    } else if (actor && params.mine === "true") {
      values.push(actor.id);
      clauses.push(`c.user_id=$${values.length} AND c.deleted_at IS NULL`);
      if (params.queue === "review") {
        values.push(now());
        clauses.push(
          `c.scope='ai' AND c.status='online' AND (c.review_required=true OR c.review_due_at<=$${values.length})`,
        );
      }
    } else clauses.push(publicWhere("c", values));
    if (params.creator) {
      values.push(params.creator);
      clauses.push(`c.user_id=$${values.length}`);
    }
    for (const [param, column] of [
      ["domain", "domain"],
      ["kind", "content_kind"],
    ])
      if (params[param]) {
        values.push(params[param]);
        clauses.push(`c.${column}=$${values.length}`);
      }
    for (const [param, column] of [
      ["industry", "industries"],
      ["platform", "platforms"],
      ["tag", "tags"],
    ])
      if (params[param]) {
        values.push(`%"${String(params[param]).replace(/[\\%_]/g, "\\$&")}"%`);
        clauses.push(`CAST(c.${column} AS text) ILIKE $${values.length}`);
      }
    const title = type === "article" ? "title" : "name";
    const description = type === "article" ? "excerpt" : "description";
    if (params.q?.trim()) {
      values.push(
        `%${params.q
          .trim()
          .slice(0, 200)
          .replace(/[\\%_]/g, "\\$&")}%`,
      );
      const p = `$${values.length}`;
      clauses.push(
        `(c.${title} ILIKE ${p} OR c.ai_use ILIKE ${p} OR c.${description} ILIKE ${p} OR CAST(c.tags AS text) ILIKE ${p} OR CAST(c.platforms AS text) ILIKE ${p}${type === "article" ? ` OR CAST(c.body AS text) ILIKE ${p}` : ""})`,
      );
    }
    if (params.verified === "true")
      clauses.push(
        "c.verified_revision=c.revision AND c.verification_method<>'unverified'",
      );
    if (params.featured === "true")
      clauses.push(
        `c.featured=true AND c.verified_revision=c.revision AND (c.verification_method='editor_tested'${type === "resource" ? " OR (c.content_kind='tool' AND c.verification_method='source_checked')" : ""})`,
      );
    const where = clauses.join(" AND ");
    const count = await db.query(
      `SELECT COUNT(*) AS total FROM ${table} c WHERE ${where}`,
      values,
    );
    let order =
      params.sort === "popular"
        ? "c.actual_views_count DESC"
        : params.sort === "verified"
          ? "c.verified_at DESC NULLS LAST"
          : params.sort === "updated"
            ? "c.content_changed_at DESC NULLS LAST"
            : "c.created_at DESC";
    if (params.q?.trim() && !params.sort) {
      values.push(
        `%${params.q
          .trim()
          .slice(0, 200)
          .replace(/[\\%_]/g, "\\$&")}%`,
      );
      order = `CASE WHEN c.${title} ILIKE $${values.length} THEN 0 WHEN c.ai_use ILIKE $${values.length} THEN 1 ELSE 2 END, ${order}`;
    }
    values.push(pageSize, (page - 1) * pageSize);
    const rows = await db.query(
      `SELECT c.*,u.nickname AS author FROM ${table} c LEFT JOIN users u ON u.id=c.user_id WHERE ${where} ORDER BY ${order},c.id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const items = [];
    for (const row of rows.rows)
      items.push(
        contentDTO(
          { ...row, ...(await statistics(type, row.id)) },
          type,
          now(),
        ),
      );
    return { items, total: Number(count.rows[0].total), page, pageSize };
  }
  async function statistics(type, id) {
    const [favorites, ratings] = await Promise.all([
      db.query(
        "SELECT COUNT(*) AS count FROM favorites WHERE target_type=$1 AND target_id=$2",
        [type, id],
      ),
      db.query(
        `SELECT COUNT(rating) AS count,AVG(rating) AS average FROM comments WHERE ${type === "article" ? "article_id" : "resource_id"}=$1 AND status='online'`,
        [id],
      ),
    ]);
    return {
      real_favorites: Number(favorites.rows[0].count),
      real_rating: ratings.rows[0].average,
      real_ratings: Number(ratings.rows[0].count),
    };
  }
  async function detail(type, id, actor = null) {
    const row = await requireContent(type, id, {
      publicOnly: !(
        actor?.role === "admin" || actor?.id === (await raw(type, id))?.user_id
      ),
    });
    const [
      links,
      verificationRows,
      revisionRows,
      feedbackRows,
      comments,
      relatedIds,
    ] = await Promise.all([
      linksFor(type, id),
      db.query(
        "SELECT v.*,u.nickname AS actor_name FROM verifications v LEFT JOIN users u ON u.id=v.actor_id WHERE target_type=$1 AND target_id=$2 ORDER BY v.created_at DESC,v.id DESC",
        [type, id],
      ),
      db.query(
        "SELECT revision,summary,created_at FROM content_revisions WHERE target_type=$1 AND target_id=$2 ORDER BY revision DESC",
        [type, id],
      ),
      db.query(
        "SELECT outcome,COUNT(*) AS count FROM reproduction_feedback WHERE target_type=$1 AND target_id=$2 AND revision=$3 GROUP BY outcome",
        [type, id, row.revision],
      ),
      listComments(type, id),
      type === "article" ? resourceIdsFor(id) : Promise.resolve([]),
    ]);
    const relatedResources = [];
    for (const rid of relatedIds) {
      const resource = await raw("resource", rid);
      if (resource && !resource.deleted_at)
        relatedResources.push(
          detailAllowed(resource)
            ? contentDTO(resource, "resource", now())
            : {
                id: rid,
                type: "resource",
                title: "关联资源已下架",
                freshness: "broken",
              },
        );
    }
    let relatedArticles = [];
    if (type === "resource") {
      const values = [id];
      const where = publicWhere("a", values);
      const related = await db.query(
        `SELECT a.* FROM articles a JOIN article_resources ar ON ar.article_id=a.id WHERE ar.resource_id=$1 AND ${where} ORDER BY a.created_at DESC LIMIT 6`,
        values,
      );
      relatedArticles = related.rows.map((a) =>
        contentDTO(a, "article", now()),
      );
    }
    const item = contentDTO(
      { ...row, ...(await statistics(type, id)) },
      type,
      now(),
    );
    return {
      item,
      links,
      verifications: verificationRows.rows.map((v) => ({
        ...v,
        created_at: iso(v.created_at),
      })),
      revisions: revisionRows.rows,
      feedback: feedbackRows.rows.map((r) => ({
        outcome: r.outcome,
        count: Number(r.count),
      })),
      comments,
      relatedResources,
      relatedArticles,
    };
  }
  async function syncLinks(client, type, id, input) {
    const links = [...(input.links || [])];
    if (type === "resource" && !links.some((l) => l.url === input.website))
      links.unshift({
        kind: "website",
        label: "访问工具 / 项目",
        url: input.website,
      });
    if (
      input.details?.sourceURL &&
      !links.some((l) => l.url === input.details.sourceURL)
    )
      links.push({
        kind: "source",
        label: "原始来源",
        url: input.details.sourceURL,
      });
    const old = await linksFor(type, id, client);
    for (const link of old)
      if (!links.some((l) => l.url === link.url))
        await client.query("DELETE FROM content_links WHERE id=$1", [link.id]);
    for (const link of links) {
      const existing = old.find((l) => l.url === link.url);
      if (existing)
        await client.query(
          "UPDATE content_links SET kind=$1,label=$2 WHERE id=$3",
          [link.kind, link.label, existing.id],
        );
      else
        await client.query(
          "INSERT INTO content_links(id,target_type,target_id,kind,label,url,next_check_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [uid("link"), type, id, link.kind, link.label || "", link.url, now()],
        );
    }
  }
  async function save(type, body, actor, id = null) {
    const table = tableFor(type);
    const current = id
      ? await requireContent(type, id, { actor, write: true })
      : null;
    if (current && Number(body.revision) !== current.revision)
      throw new ApiError(
        409,
        "内容已被更新，请重新打开编辑页",
        "REVISION_CONFLICT",
      );
    const input = cleanInput(type, body, current);
    const oldLinks = current ? await linksFor(type, id) : [];
    const oldIds =
      current && type === "article" ? await resourceIdsFor(id) : [];
    const links = [...(input.links ?? oldLinks)].filter(
      (l) =>
        !(
          current &&
          input.website !== current.website &&
          l.url === current.website &&
          l.kind === "website"
        ),
    );
    if (type === "resource" && !links.some((l) => l.url === input.website))
      links.push({ kind: "website", label: "资源入口", url: input.website });
    if (
      input.details.sourceURL &&
      !links.some((l) => l.url === input.details.sourceURL)
    )
      links.push({
        kind: "source",
        label: "原始来源",
        url: input.details.sourceURL,
      });
    const resourceIds = input.resourceIds ?? oldIds;
    for (const rid of resourceIds)
      if (!oldIds.includes(rid))
        await requireContent("resource", rid, { publicOnly: true });
    input.links = links;
    input.resourceIds = resourceIds;
    const prior =
      current && current.scope === "ai" ? cleanInput(type, {}, current) : null;
    const changed =
      !prior ||
      material(input, type, links, resourceIds) !==
        material(prior, type, oldLinks, oldIds);
    const contentId = id || uid(type);
    const timestamp = now();
    await db.transaction(async (client) => {
      if (current) {
        const locked = await client.query(
          `SELECT revision FROM ${table} WHERE id=$1 FOR UPDATE`,
          [id],
        );
        if (locked.rows[0].revision !== current.revision)
          throw new ApiError(
            409,
            "内容已被更新，请重新打开编辑页",
            "REVISION_CONFLICT",
          );
      }
      const values = {
        domain: input.domain,
        content_kind: input.kind,
        ai_use: input.aiUse,
        tags: json(input.tags),
        industries: json(input.industries),
        platforms: json(input.platforms),
        details: json(input.details),
        updated_at: timestamp,
      };
      if (type === "resource")
        Object.assign(values, {
          name: input.name,
          website: input.website,
          description: input.description,
          cover_image: input.coverImage,
        });
      else
        Object.assign(values, {
          title: input.title,
          excerpt: input.excerpt,
          body: json(input.body),
          cover: input.cover,
          read_time: input.readTime,
        });
      if (input.originalPublishedAt !== undefined)
        values.original_published_at = input.originalPublishedAt;
      if (current && input.kind !== current.content_kind)
        Object.assign(values, {
          review_days: input.reviewDays,
          review_due_at: new Date(
            Math.min(
              +new Date(current.review_due_at || timestamp),
              +daysAfter(timestamp, input.reviewDays),
            ),
          ),
        });
      if (changed)
        Object.assign(values, {
          revision: (current?.revision || 0) + 1,
          content_changed_at: timestamp,
          featured: false,
          review_required: !!current?.review_required || !!current?.verified_at,
        });
      if (!current) {
        Object.assign(values, {
          id: contentId,
          user_id: actor.id,
          scope: "ai",
          status: "online",
          created_at: timestamp,
          review_days: input.reviewDays,
          review_due_at: daysAfter(timestamp, input.reviewDays),
        });
        if (type === "article") values.images = "[]";
        const keys = Object.keys(values);
        await client.query(
          `INSERT INTO ${table}(${keys.join(",")}) VALUES(${keys.map((_, i) => `$${i + 1}`).join(",")})`,
          Object.values(values),
        );
      } else {
        const keys = Object.keys(values);
        await client.query(
          `UPDATE ${table} SET ${keys.map((key, i) => `${key}=$${i + 1}`).join(",")} WHERE id=$${keys.length + 1}`,
          [...Object.values(values), id],
        );
      }
      await syncLinks(client, type, contentId, input);
      if (type === "article") {
        await client.query(
          "DELETE FROM article_resources WHERE article_id=$1",
          [contentId],
        );
        for (const [position, rid] of resourceIds.entries())
          await client.query(
            "INSERT INTO article_resources(article_id,resource_id,position) VALUES($1,$2,$3)",
            [contentId, rid, position],
          );
      }
      if (changed)
        await client.query(
          "INSERT INTO content_revisions(id,target_type,target_id,revision,snapshot,actor_id,summary,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            uid("rev"),
            type,
            contentId,
            (current?.revision || 0) + 1,
            json(input),
            actor.id,
            input.details.updateNote || (current ? "更新任务内容" : "首次发布"),
            timestamp,
          ],
        );
    });
    return detail(type, contentId, actor);
  }
  async function verify(ref, body, actor) {
    const row = await requireContent(ref.type, ref.id, { actor, write: true });
    if (row.scope !== "ai" || row.status !== "online")
      throw new ApiError(409, "请先完成 AI 范围确认并恢复内容");
    const method = body.method;
    if (!["author_tested", "source_checked", "editor_tested"].includes(method))
      throw new ApiError(400, "核验方式不正确");
    if (actor.role !== "admin" && method !== "author_tested")
      throw new ApiError(403, "编辑核验仅限管理员", "FORBIDDEN");
    if (method === "author_tested" && actor.id !== row.user_id)
      throw new ApiError(403, "作者自测只能由原作者提交");
    if (Number(body.revision) !== row.revision)
      throw new ApiError(409, "请选择当前内容版本", "REVISION_CONFLICT");
    const environment = cleanText(body.environment, {
      name: "版本与环境",
      min: 4,
      max: 1000,
    });
    const evidence = cleanText(body.evidence, {
      name: "核验说明",
      min: 10,
      max: 3000,
    });
    const days =
      actor.role === "admin" && body.reviewDays
        ? Number(body.reviewDays)
        : row.review_days;
    if (!Number.isInteger(days) || days < 1 || days > 90)
      throw new ApiError(400, "复核周期应为 1—90 天");
    if (days !== row.review_days)
      cleanText(body.reason, { name: "调整周期的原因", min: 5, max: 300 });
    const timestamp = now();
    await db.transaction(async (client) => {
      const lock = await client.query(
        `SELECT * FROM ${tableFor(ref.type)} WHERE id=$1 FOR UPDATE`,
        [ref.id],
      );
      if (
        !lock.rows[0] ||
        lock.rows[0].deleted_at ||
        lock.rows[0].status !== "online" ||
        lock.rows[0].scope !== "ai" ||
        lock.rows[0].revision !== row.revision
      )
        throw new ApiError(409, "内容已更新，请重新核验", "REVISION_CONFLICT");
      await client.query(
        "INSERT INTO verifications(id,target_type,target_id,revision,method,environment,evidence,actor_id,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          uid("v"),
          ref.type,
          ref.id,
          row.revision,
          method,
          environment,
          evidence,
          actor.id,
          timestamp,
        ],
      );
      const preserveEditor =
        method === "author_tested" &&
        ["source_checked", "editor_tested"].includes(
          freshness(lock.rows[0], timestamp),
        );
      if (!preserveEditor)
        await client.query(
          `UPDATE ${tableFor(ref.type)} SET verification_method=$1,verified_revision=$2,verified_at=$3,review_due_at=$4,review_days=$5,review_required=false,featured=false WHERE id=$6`,
          [
            method,
            row.revision,
            timestamp,
            daysAfter(timestamp, days),
            days,
            ref.id,
          ],
        );
      await audit(client, actor.id, "content.verify", ref, {
        method,
        days,
        reason: body.reason || "",
      });
    });
    return detail(ref.type, ref.id, actor);
  }
  async function audit(client, actor, action, ref, metadata = {}) {
    await client.query(
      "INSERT INTO audit_logs(id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$5,$6)",
      [uid("audit"), actor, action, ref.type, ref.id, json(metadata)],
    );
  }
  async function moderate(ref, body, actor) {
    if (actor.role !== "admin") throw new ApiError(403, "需要管理员权限");
    const row = await requireContent(ref.type, ref.id, { actor, write: true });
    const table = tableFor(ref.type);
    if (Number(body.revision) !== row.revision)
      throw new ApiError(
        409,
        "内容版本已变化，请刷新后处理",
        "REVISION_CONFLICT",
      );
    const action = body.action;
    const reason = cleanText(body.reason, {
      name: "处理说明",
      min: 4,
      max: 1000,
    });
    const replacement = body.replacementURL
      ? safeExternalURL(body.replacementURL)
      : "";
    if (action === "feature" && !canFeature(row, ref.type, now()))
      throw new ApiError(409, "当前版本尚不符合编辑精选条件");
    if (action === "feature") {
      const details = parseJSON(row.details, {});
      if (!details.cost || !details.requirements || !details.output)
        throw new ApiError(409, "精选需要补充费用、使用条件和功能或成果说明");
      const unresolved = await db.query(
        "SELECT id FROM content_links WHERE target_type=$1 AND target_id=$2 AND check_status IN ('needs_review','unsafe') LIMIT 1",
        [ref.type, ref.id],
      );
      if (unresolved.rows.length)
        throw new ApiError(409, "存在尚未处理的关键链接异常，请先完成人工核对");
    }
    if (action === "admit") cleanInput(ref.type, {}, row);
    const changes = {
      feature: { featured: true },
      unfeature: { featured: false },
      review: { review_required: true, featured: false },
      broken: {
        status: "offline",
        featured: false,
        unavailable_reason: reason,
        replacement_url: replacement,
      },
      exclude: {
        scope: "excluded",
        status: "offline",
        featured: false,
        unavailable_reason: reason,
      },
      admit: {
        scope: "ai",
        status: "online",
        review_required: true,
        featured: false,
        unavailable_reason: "",
      },
      restore: {
        status: "online",
        review_required: true,
        featured: false,
        unavailable_reason: "",
      },
    }[action];
    if (!changes) throw new ApiError(400, "管理操作不正确");
    await db.transaction(async (client) => {
      const locked = await client.query(
        `SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,
        [ref.id],
      );
      if (locked.rows[0]?.revision !== row.revision)
        throw new ApiError(409, "内容版本已变化");
      if (action === "feature" && !canFeature(locked.rows[0], ref.type, now()))
        throw new ApiError(409, "核验状态已变化");
      const keys = Object.keys(changes);
      await client.query(
        `UPDATE ${table} SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(",")} WHERE id=$${keys.length + 1}`,
        [...Object.values(changes), ref.id],
      );
      if (
        ref.type === "resource" &&
        ["broken", "exclude", "review"].includes(action)
      )
        await client.query(
          "UPDATE articles SET review_required=true,featured=false WHERE id IN (SELECT article_id FROM article_resources WHERE resource_id=$1)",
          [ref.id],
        );
      await audit(client, actor.id, `content.${action}`, ref, {
        reason,
        replacement,
      });
    });
    return detail(ref.type, ref.id, actor);
  }
  async function remove(type, id, actor) {
    await requireContent(type, id, { actor, write: true });
    await db.transaction(async (client) => {
      await client.query(
        `UPDATE ${tableFor(type)} SET status='offline',deleted_at=$1,featured=false WHERE id=$2`,
        [now(), id],
      );
      if (type === "resource")
        await client.query(
          "UPDATE articles SET review_required=true,featured=false WHERE id IN (SELECT article_id FROM article_resources WHERE resource_id=$1)",
          [id],
        );
      await audit(client, actor.id, "content.delete", { type, id });
    });
  }
  async function listComments(type, id, params = {}) {
    const { page, pageSize } = pagination(params);
    const column = type === "article" ? "article_id" : "resource_id";
    const result = await db.query(
      `SELECT c.*,u.nickname FROM comments c LEFT JOIN users u ON u.id=c.user_id WHERE c.${column}=$1 AND c.status='online' ORDER BY c.created_at DESC,c.id DESC LIMIT $2 OFFSET $3`,
      [id, pageSize, (page - 1) * pageSize],
    );
    return result.rows.map((c) => ({
      id: c.id,
      targetType: type,
      targetId: id,
      userId: c.user_id,
      user: c.nickname || "已注销用户",
      rating: c.rating == null ? null : Number(c.rating),
      content: c.content,
      likes: Number(c.likes_count),
      createdAt: iso(c.created_at),
    }));
  }
  async function comment(ref, body, actor) {
    await requireContent(ref.type, ref.id, { publicOnly: true });
    const rating =
      body.rating == null || body.rating === "" ? null : Number(body.rating);
    if (
      rating !== null &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    )
      throw new ApiError(400, "评分必须为 1—5");
    const id = uid("c");
    await db.query(
      "INSERT INTO comments(id,resource_id,article_id,user_id,rating,content) VALUES($1,$2,$3,$4,$5,$6)",
      [
        id,
        ref.type === "resource" ? ref.id : null,
        ref.type === "article" ? ref.id : null,
        actor.id,
        rating,
        cleanText(body.content, { name: "评论", min: 2, max: 2000 }),
      ],
    );
    return { id };
  }
  async function feedback(ref, body, actor) {
    const row = await requireContent(ref.type, ref.id, { publicOnly: true });
    if (Number(body.revision) !== row.revision)
      throw new ApiError(409, "请为当前内容版本提交反馈");
    if (!["success", "partial", "failed"].includes(body.outcome))
      throw new ApiError(400, "请选择复现结果");
    await db.query(
      `INSERT INTO reproduction_feedback(id,target_type,target_id,revision,user_id,outcome,environment,content,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(target_type,target_id,revision,user_id) DO UPDATE SET outcome=EXCLUDED.outcome,environment=EXCLUDED.environment,content=EXCLUDED.content,updated_at=EXCLUDED.updated_at,handled_at=NULL,handling_note=''`,
      [
        uid("f"),
        ref.type,
        ref.id,
        row.revision,
        actor.id,
        body.outcome,
        cleanText(body.environment, { name: "使用环境", min: 2, max: 1000 }),
        cleanText(body.content, { name: "反馈说明", max: 2000 }),
        now(),
      ],
    );
    return { ok: true };
  }
  async function topicSummaries(rows) {
    if (!rows.length) return [];
    const summaries = new Map(
      rows.map((row) => [row.id, { ...row, itemCount: 0, totalViews: 0, previewCover: "" }]),
    );
    const coverPositions = new Map();
    // Read only public item metadata in two batches. Keep the optional preview
    // cover separate from the editor's own cover field and preserve item order.
    const contents = await Promise.all(
      ["resource", "article"].map((type) => {
        const values = rows.map((row) => row.id);
        const ids = values.map((_, index) => `$${index + 1}`).join(",");
        const visible = publicWhere("c", values);
        return db.query(
          `SELECT ti.topic_id,ti.position,c.actual_views_count,${type === "resource" ? "c.cover_image" : "c.cover"} AS cover
           FROM topic_items ti JOIN ${tableFor(type)} c ON c.id=ti.target_id
           WHERE ti.target_type='${type}' AND ti.topic_id IN (${ids}) AND ${visible}
           ORDER BY ti.position`,
          values,
        );
      }),
    );
    for (const result of contents)
      for (const row of result.rows) {
        const summary = summaries.get(row.topic_id);
        summary.itemCount += 1;
        summary.totalViews += Number(row.actual_views_count || 0);
        if (
          row.cover && !String(row.cover).startsWith("#") &&
          row.position < (coverPositions.get(row.topic_id) ?? Infinity)
        ) {
          summary.previewCover = row.cover;
          coverPositions.set(row.topic_id, row.position);
        }
      }
    return [...summaries.values()];
  }
  async function topics(params = {}, actor = null) {
    const { page, pageSize } = pagination(params);
    const values = [];
    let where =
      actor?.role === "admin" && params.manage === "true"
        ? "1=1"
        : "status='online'";
    if (params.q) {
      values.push(`%${params.q.slice(0, 200)}%`);
      where += ` AND (title ILIKE $1 OR description ILIKE $1)`;
    }
    const count = await db.query(
      `SELECT COUNT(*) AS total FROM topics WHERE ${where}`,
      values,
    );
    values.push(pageSize, (page - 1) * pageSize);
    const rows = await db.query(
      `SELECT * FROM topics WHERE ${where} ORDER BY updated_at DESC,id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return {
      items: await topicSummaries(rows.rows),
      total: Number(count.rows[0].total),
      page,
      pageSize,
    };
  }
  async function topic(slug, actor = null) {
    const row = (await db.query("SELECT * FROM topics WHERE slug=$1", [slug]))
      .rows[0];
    if (!row || (row.status !== "online" && actor?.role !== "admin"))
      throw new ApiError(404, "专题不存在");
    const refs = (
      await db.query(
        "SELECT * FROM topic_items WHERE topic_id=$1 ORDER BY position",
        [row.id],
      )
    ).rows;
    const items = [];
    for (const ref of refs) {
      const item = await raw(ref.target_type, ref.target_id);
      if (item && (listed(item, now()) || actor?.role === "admin"))
        items.push(contentDTO(item, ref.target_type, now()));
    }
    const [summary] = await topicSummaries([row]);
    return { ...summary, items };
  }
  async function saveTopic(body, actor, id = null) {
    if (actor.role !== "admin") throw new ApiError(403, "需要管理员权限");
    const slug = String(body.slug || "").trim();
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(slug))
      throw new ApiError(400, "专题地址使用 2—80 位小写字母、数字或短横线");
    const oldRefs = id
      ? (
          await db.query(
            "SELECT target_type,target_id FROM topic_items WHERE topic_id=$1",
            [id],
          )
        ).rows
      : [];
    const refs = Array.isArray(body.items) ? body.items : [];
    if (refs.length > 100) throw new ApiError(400, "专题最多包含 100 项内容");
    const seen = new Set();
    for (const ref of refs) {
      contentType(ref.type);
      if (seen.has(`${ref.type}:${ref.id}`))
        throw new ApiError(400, "专题包含重复内容");
      seen.add(`${ref.type}:${ref.id}`);
      if (
        !oldRefs.some(
          (r) => r.target_type === ref.type && r.target_id === ref.id,
        )
      )
        await requireContent(ref.type, ref.id, { publicOnly: true });
    }
    const topicId = id || uid("topic");
    const title = cleanText(body.title, { name: "专题标题", min: 4, max: 100 });
    const description = cleanText(body.description, {
      name: "专题说明",
      min: 10,
      max: 2000,
    });
    const cover = body.cover ? safeExternalURL(body.cover) : "";
    const status = ["draft", "online", "offline"].includes(body.status)
      ? body.status
      : "draft";
    await db.transaction(async (client) => {
      if (id) {
        const updated = await client.query(
          "UPDATE topics SET slug=$1,title=$2,description=$3,cover=$4,status=$5,updated_at=$6 WHERE id=$7 RETURNING id",
          [slug, title, description, cover, status, now(), id],
        );
        if (!updated.rows[0]) throw new ApiError(404, "专题不存在");
      } else
        await client.query(
          "INSERT INTO topics(id,slug,title,description,cover,status,created_by,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8)",
          [topicId, slug, title, description, cover, status, actor.id, now()],
        );
      await client.query("DELETE FROM topic_items WHERE topic_id=$1", [
        topicId,
      ]);
      for (const [position, ref] of refs.entries())
        await client.query(
          "INSERT INTO topic_items(topic_id,target_type,target_id,position) VALUES($1,$2,$3,$4)",
          [topicId, ref.type, ref.id, position],
        );
    });
    return topic(slug, actor);
  }
  async function removeTopic(id, actor) {
    if (actor.role !== "admin") throw new ApiError(403, "需要管理员权限");
    await db.transaction(async (client) => {
      const removed = await client.query(
        "DELETE FROM topics WHERE id=$1 RETURNING id,title",
        [id],
      );
      if (!removed.rows.length) throw new ApiError(404, "专题不存在");
      await audit(
        client,
        actor.id,
        "topic.delete",
        { type: "topic", id },
        { title: removed.rows[0].title },
      );
    });
  }
  async function catalog() {
    const tags = (
      await db.query("SELECT category,name FROM catalog_tags ORDER BY name")
    ).rows;
    return {
      domains: DOMAINS,
      resourceKinds: RESOURCE_KINDS,
      articleKinds: ARTICLE_KINDS,
      linkKinds: LINK_KINDS,
      industries: [
        ...new Set([
          ...DEFAULT_INDUSTRIES,
          ...tags.filter((t) => t.category === "industry").map((t) => t.name),
        ]),
      ],
      platforms: tags
        .filter((t) => t.category === "platform")
        .map((t) => t.name),
      tasks: tags.filter((t) => t.category === "task").map((t) => t.name),
    };
  }
  async function search(params = {}) {
    const [resources, articles, collections] = await Promise.all([
      list("resource", params),
      list("article", params),
      topics(params),
    ]);
    return {
      resources,
      articles,
      topics: collections,
      total: resources.total + articles.total + collections.total,
    };
  }
  async function home() {
    const [resources, articles, featured, verified, collections] =
      await Promise.all([
        list("resource", { pageSize: 6 }),
        list("article", { pageSize: 3 }),
        list("resource", { featured: "true", pageSize: 6 }),
        list("resource", { verified: "true", sort: "verified", pageSize: 3 }),
        topics({ pageSize: 3 }),
      ]);
    return { resources, articles, featured, verified, topics: collections };
  }
  async function creator(id, params = {}) {
    const author = (
      await db.query(
        "SELECT id,nickname,bio,created_at FROM users WHERE id=$1 AND status='active'",
        [id],
      )
    ).rows[0];
    if (!author) throw new ApiError(404, "作者不存在");
    const [resources, articles] = await Promise.all([
      list("resource", {
        page: params.page,
        pageSize: params.pageSize,
        creator: id,
      }),
      list("article", {
        page: params.page,
        pageSize: params.pageSize,
        creator: id,
      }),
    ]);
    return { author, resources, articles };
  }
  async function updates(params = {}) {
    const { page, pageSize } = pagination(params);
    const clauses = [];
    const values = [];
    for (const type of ["resource", "article"]) {
      const table = tableFor(type);
      const where = publicWhere("c", values);
      clauses.push(
        `SELECT r.id,c.id AS target_id,'${type}' AS target_type,${type === "resource" ? "c.name" : "c.title"} AS title,r.revision,r.summary,r.created_at AS event_at,CASE WHEN r.revision=1 THEN 'published' ELSE 'updated' END AS event FROM content_revisions r JOIN ${table} c ON r.target_id=c.id WHERE r.target_type='${type}' AND ${where}`,
      );
      const verifiedWhere = publicWhere("c", values);
      clauses.push(
        `SELECT v.id,c.id AS target_id,'${type}' AS target_type,${type === "resource" ? "c.name" : "c.title"} AS title,v.revision,v.method AS summary,v.created_at AS event_at,'verified' AS event FROM verifications v JOIN ${table} c ON v.target_id=c.id WHERE v.target_type='${type}' AND ${verifiedWhere}`,
      );
    }
    const union = clauses.join(" UNION ALL ");
    const count = await db.query(
      `SELECT COUNT(*) AS total FROM (${union}) events`,
      values,
    );
    values.push(pageSize, (page - 1) * pageSize);
    const rows = await db.query(
      `SELECT * FROM (${union}) events ORDER BY event_at DESC,id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return {
      items: rows.rows,
      total: Number(count.rows[0].total),
      page,
      pageSize,
    };
  }

  return {
    now,
    raw,
    list,
    detail,
    save,
    verify,
    moderate,
    remove,
    requireContent,
    linksFor,
    listComments,
    comment,
    feedback,
    topics,
    topic,
    saveTopic,
    removeTopic,
    catalog,
    search,
    home,
    creator,
    updates,
    publicWhere,
  };
}
