import { analyticsDay, analyticsWindow, summarizeVisits } from "./analytics.mjs";
import { uid } from "./security.mjs";

function json(value, fallback = []) {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

function dateOnly(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    bio: row.bio || "",
    role: row.role,
    status: row.status,
    joined: dateOnly(row.created_at),
    gender: row.gender || "不公开",
    birthday: row.birthday ? dateOnly(row.birthday) : "",
    emailVerified: Boolean(row.email_verified_at),
  };
}

function resource(row) {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    icon: row.icon_url || "",
    coverImage: row.cover_image || "",
    category: row.category,
    subcategory: row.subcategory,
    tags: json(row.tags),
    color: row.color,
    logoColor: row.logo_color,
    short: row.short_description,
    description: row.description,
    features: json(row.features),
    tutorial: json(row.tutorial),
    scenarios: json(row.scenarios),
    rating: Number(row.rating),
    ratings: Number(row.ratings_count),
    views: Number(row.actual_views_count || 0),
    favorites: Number(row.favorites_count),
    updated: dateOnly(row.updated_at),
    created: dateOnly(row.created_at),
    featured: Boolean(row.featured),
    status: row.status,
    source: row.source,
    userId: row.user_id || null,
    website: row.website,
  };
}

function article(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    tags: json(row.tags),
    author: row.author_name,
    userId: row.user_id || null,
    created: dateOnly(row.created_at),
    updated: dateOnly(row.updated_at),
    readTime: Number(row.read_time),
    views: Number(row.actual_views_count || 0),
    favorites: Number(row.favorites_count),
    featured: Boolean(row.featured),
    status: row.status,
    cover: row.cover,
    images: json(row.images),
    body: json(row.body),
  };
}

function comment(row) {
  return {
    id: row.id,
    resourceId: row.resource_id,
    userId: row.user_id,
    user: row.nickname || row.user_name || "已注销用户",
    rating: Number(row.rating),
    content: row.content,
    likes: Number(row.likes_count),
    created: dateOnly(row.created_at),
    status: row.status === "online" ? "approved" : row.status,
  };
}

function submission(row) {
  return {
    id: row.id,
    targetId: row.target_id,
    contentType: row.content_type,
    name: row.name,
    url: row.url || "",
    category: row.category || "",
    summary: row.summary || "",
    reason: row.reason || "",
    userId: row.user_id,
    user: row.nickname || "",
    status: row.status,
    created: dateOnly(row.created_at),
    updated: dateOnly(row.updated_at),
  };
}

function report(row) {
  return {
    id: row.id,
    targetId: row.target_id,
    targetType: row.target_type,
    type: row.report_type,
    detail: row.detail,
    userId: row.user_id || null,
    status: row.status,
    created: dateOnly(row.created_at),
    handledAt: row.handled_at ? dateOnly(row.handled_at) : "",
    handledBy: row.handled_by || null,
  };
}

export function createRepository(db, { now = () => new Date() } = {}) {
  async function listResources(includeOffline = false) {
    const result = await db.query(`SELECT * FROM resources ${includeOffline ? "" : "WHERE status = 'online'"} ORDER BY created_at DESC`);
    return result.rows.map(resource);
  }

  async function listArticles(includeOffline = false) {
    const result = await db.query(`SELECT * FROM articles ${includeOffline ? "" : "WHERE status = 'online'"} ORDER BY created_at DESC`);
    return result.rows.map(article);
  }

  async function listComments({ userId } = {}) {
    const values = [];
    const clauses = [];
    if (!userId) clauses.push("c.status = 'online'");
    else { values.push(userId); clauses.push(`c.user_id = $${values.length}`); }
    const result = await db.query(`SELECT c.*, u.nickname FROM comments c LEFT JOIN users u ON u.id = c.user_id ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY c.created_at DESC`, values);
    return result.rows.map(comment);
  }

  async function publicBootstrap(userId = null) {
    const [allResources, allArticles, allComments, favoritesResult] = await Promise.all([
      listResources(false),
      listArticles(false),
      listComments(),
      userId ? db.query("SELECT target_type, target_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC", [userId]) : { rows: [] },
    ]);
    return {
      resources: allResources,
      articles: allArticles,
      comments: allComments,
      favorites: favoritesResult.rows.map(row => ({ type: row.target_type, id: row.target_id })),
    };
  }

  async function getUserByEmail(email) {
    const result = await db.query("SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1", [email]);
    return result.rows[0] || null;
  }

  async function getUserById(id) {
    const result = await db.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
    return result.rows[0] || null;
  }

  async function createUser({ email, passwordHash, nickname, verified = true, role = "user" }) {
    const id = uid("u");
    const result = await db.query(`INSERT INTO users (id,email,password_hash,nickname,role,email_verified_at)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [id, email, passwordHash, nickname, role, verified ? new Date() : null]);
    return publicUser(result.rows[0]);
  }

  async function updatePassword(userId, passwordHash) {
    await db.transaction(async client => {
      await client.query("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [passwordHash, userId]);
      await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    });
  }

  async function updateProfile(userId, values) {
    const result = await db.query(`UPDATE users SET nickname=$1,bio=$2,gender=$3,birthday=$4,updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *`,
      [values.nickname, values.bio, values.gender, values.birthday || null, userId]);
    return publicUser(result.rows[0]);
  }

  async function createSession({ userId, tokenHash, expiresAt, ipAddress, userAgent }) {
    const id = uid("session");
    await db.query(`INSERT INTO sessions (id,user_id,token_hash,expires_at,ip_address,user_agent) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, userId, tokenHash, expiresAt, ipAddress, userAgent]);
    return id;
  }

  async function sessionUser(tokenHash) {
    const result = await db.query(`SELECT u.*, s.id AS session_id, s.expires_at AS session_expires_at FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 LIMIT 1`, [tokenHash]);
    if (!result.rows[0] || new Date(result.rows[0].session_expires_at) <= new Date() || result.rows[0].status !== "active") return null;
    await db.query("UPDATE sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=$1", [result.rows[0].session_id]);
    return publicUser(result.rows[0]);
  }

  async function deleteSession(tokenHash) {
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash]);
  }

  async function deleteExpiredSessions() {
    const result = await db.query("SELECT id,expires_at FROM sessions");
    const expiredIds = result.rows.filter(row => new Date(row.expires_at) <= new Date()).map(row => row.id);
    if (expiredIds.length) await db.query("DELETE FROM sessions WHERE id = ANY($1)", [expiredIds]);
  }

  async function saveVerificationCode({ email, purpose, codeHash, expiresAt }) {
    await db.transaction(async client => {
      await client.query("UPDATE verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE lower(email)=lower($1) AND purpose=$2 AND consumed_at IS NULL", [email, purpose]);
      await client.query(`INSERT INTO verification_codes (id,email,purpose,code_hash,expires_at) VALUES ($1,$2,$3,$4,$5)`,
        [uid("verify"), email, purpose, codeHash, expiresAt]);
    });
  }

  async function consumeVerificationCode({ email, purpose, codeHash }) {
    return db.transaction(async client => {
      const result = await client.query(`SELECT * FROM verification_codes WHERE lower(email)=lower($1) AND purpose=$2 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [email, purpose]);
      const code = result.rows[0];
      if (!code || new Date(code.expires_at) <= new Date() || code.attempts >= 5) return false;
      if (code.code_hash !== codeHash) {
        await client.query("UPDATE verification_codes SET attempts=attempts+1 WHERE id=$1", [code.id]);
        return false;
      }
      await client.query("UPDATE verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE id=$1", [code.id]);
      return true;
    });
  }

  async function dashboard(userId) {
    const [userRow, favoritesResult, commentsResult, submissionsResult] = await Promise.all([
      getUserById(userId),
      db.query("SELECT target_type,target_id FROM favorites WHERE user_id=$1 ORDER BY created_at DESC", [userId]),
      listComments({ userId }),
      db.query(`SELECT s.*,u.nickname FROM submissions s JOIN users u ON u.id=s.user_id WHERE s.user_id=$1 AND s.status='published' ORDER BY s.created_at DESC`, [userId]),
    ]);
    return {
      user: publicUser(userRow),
      favorites: favoritesResult.rows.map(row => ({ type: row.target_type, id: row.target_id })),
      comments: commentsResult,
      submissions: submissionsResult.rows.map(submission),
    };
  }

  async function toggleFavorite(userId, targetType, targetId) {
    return db.transaction(async client => {
      const table = targetType === "article" ? "articles" : "resources";
      const exists = await client.query(`SELECT id FROM ${table} WHERE id=$1 AND status='online'`, [targetId]);
      if (!exists.rows[0]) throw Object.assign(new Error("内容不存在或已下架"), { statusCode: 404 });
      const inserted = await client.query(`INSERT INTO favorites (user_id,target_type,target_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING target_id`, [userId, targetType, targetId]);
      const added = Boolean(inserted.rows[0]);
      if (!added) await client.query("DELETE FROM favorites WHERE user_id=$1 AND target_type=$2 AND target_id=$3", [userId, targetType, targetId]);
      const countColumn = "favorites_count";
      await client.query(`UPDATE ${table} SET ${countColumn}=GREATEST(0,${countColumn}+$1) WHERE id=$2`, [added ? 1 : -1, targetId]);
      return { favorite: added };
    });
  }

  async function incrementView(targetType, targetId) {
    const table = targetType === "article" ? "articles" : "resources";
    const day = analyticsDay(now());
    return db.transaction(async client => {
      const result = await client.query(`UPDATE ${table} SET actual_views_count=actual_views_count+1 WHERE id=$1 AND status='online' RETURNING actual_views_count AS views`, [targetId]);
      if (!result.rows[0]) throw Object.assign(new Error("内容不存在或已下架"), { statusCode: 404 });
      await client.query(`INSERT INTO content_view_daily (day,resource_views,article_views) VALUES ($1,$2,$3)
        ON CONFLICT (day) DO UPDATE SET resource_views=content_view_daily.resource_views+EXCLUDED.resource_views,
        article_views=content_view_daily.article_views+EXCLUDED.article_views`, [day, targetType === "resource" ? 1 : 0, targetType === "article" ? 1 : 0]);
      return Number(result.rows[0].views);
    });
  }

  async function createComment({ resourceId, userId, rating, content }) {
    const result = await db.query(`INSERT INTO comments (id,resource_id,user_id,rating,content) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [uid("c"), resourceId, userId, rating, content]);
    const user = await getUserById(userId);
    return comment({ ...result.rows[0], nickname: user?.nickname });
  }

  async function deleteOwnComment(commentId, userId) {
    const result = await db.query("DELETE FROM comments WHERE id=$1 AND user_id=$2 RETURNING id", [commentId, userId]);
    return Boolean(result.rows[0]);
  }

  async function likeComment(commentId, userId) {
    return db.transaction(async client => {
      const inserted = await client.query(`INSERT INTO comment_likes (comment_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING comment_id`, [commentId, userId]);
      if (!inserted.rows[0]) return { liked: true, added: false };
      await client.query("UPDATE comments SET likes_count=likes_count+1 WHERE id=$1", [commentId]);
      return { liked: true, added: true };
    });
  }

  async function createResourceWithSubmission(user, input) {
    return db.transaction(async client => {
      const id = uid("resource");
      const submissionId = uid("s");
      const result = await client.query(`INSERT INTO resources
        (id,name,logo,category,subcategory,tags,color,logo_color,short_description,description,features,tutorial,scenarios,source,user_id,website,cover_image)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
        [id,input.name,input.logo,input.category,input.subcategory,JSON.stringify(input.tags),input.color,input.logoColor,input.short,input.description,JSON.stringify(input.features),JSON.stringify(input.tutorial),JSON.stringify(input.scenarios),user.nickname,user.id,input.website,input.coverImage || ""]);
      await client.query(`INSERT INTO submissions (id,target_id,content_type,user_id,name,url,category,summary,reason) VALUES ($1,$2,'tool',$3,$4,$5,$6,$7,$8)`,
        [submissionId,id,user.id,input.name,input.website,input.subcategory,input.short,input.reason]);
      return resource(result.rows[0]);
    });
  }

  async function createArticleWithSubmission(user, input) {
    return db.transaction(async client => {
      const id = uid("article");
      const submissionId = uid("s");
      const result = await client.query(`INSERT INTO articles
        (id,title,excerpt,category,tags,author_name,user_id,read_time,cover,images,body)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [id,input.title,input.excerpt,input.category,JSON.stringify(input.tags),user.nickname,user.id,input.readTime,input.cover,JSON.stringify(input.images),JSON.stringify(input.body)]);
      await client.query(`INSERT INTO submissions (id,target_id,content_type,user_id,name,category,summary) VALUES ($1,$2,'article',$3,$4,$5,$6)`,
        [submissionId,id,user.id,input.title,input.category,input.excerpt]);
      return article(result.rows[0]);
    });
  }

  async function getSubmission(submissionId) {
    const result = await db.query("SELECT * FROM submissions WHERE id=$1 AND status='published'", [submissionId]);
    return result.rows[0] || null;
  }

  async function updateOwnSubmission(submissionId, userId, input) {
    return db.transaction(async client => {
      const found = await client.query("SELECT * FROM submissions WHERE id=$1 AND user_id=$2 AND status='published' FOR UPDATE", [submissionId, userId]);
      const current = found.rows[0];
      if (!current) throw Object.assign(new Error("没有权限编辑该内容"), { statusCode: 403 });
      if (current.content_type === "article") {
        await client.query(`UPDATE articles SET title=$1,excerpt=$2,category=$3,tags=$4,body=$5,read_time=$6,updated_at=CURRENT_TIMESTAMP WHERE id=$7`,
          [input.title,input.excerpt,input.category,JSON.stringify(input.tags),JSON.stringify(input.body),input.readTime,current.target_id]);
        await client.query("UPDATE submissions SET name=$1,category=$2,summary=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$4", [input.title,input.category,input.excerpt,submissionId]);
      } else {
        await client.query(`UPDATE resources SET name=$1,logo=$2,website=$3,category=$4,subcategory=$5,tags=$6,short_description=$7,description=$8,scenarios=$9,cover_image=COALESCE($11,cover_image),updated_at=CURRENT_TIMESTAMP WHERE id=$10`,
          [input.name,input.logo,input.website,input.channel,input.category,JSON.stringify(input.tags),input.short,input.description,JSON.stringify(input.scenarios),current.target_id,input.coverImage ?? null]);
        await client.query("UPDATE submissions SET name=$1,url=$2,category=$3,summary=$4,reason=$5,updated_at=CURRENT_TIMESTAMP WHERE id=$6", [input.name,input.website,input.category,input.short,input.reason,submissionId]);
      }
      return current.target_id;
    });
  }

  async function deleteOwnSubmission(submissionId, userId) {
    return db.transaction(async client => {
      const found = await client.query("SELECT * FROM submissions WHERE id=$1 AND user_id=$2 AND status='published' FOR UPDATE", [submissionId, userId]);
      const current = found.rows[0];
      if (!current) throw Object.assign(new Error("没有权限删除该内容"), { statusCode: 403 });
      const targetType = current.content_type === "article" ? "article" : "resource";
      const table = targetType === "article" ? "articles" : "resources";
      await client.query(`DELETE FROM ${table} WHERE id=$1`, [current.target_id]);
      await client.query("DELETE FROM favorites WHERE target_type=$1 AND target_id=$2", [targetType,current.target_id]);
      await client.query("DELETE FROM reports WHERE target_type=$1 AND target_id=$2", [targetType,current.target_id]);
      await client.query("DELETE FROM submissions WHERE id=$1", [submissionId]);
      return current.target_id;
    });
  }

  async function createReport({ targetId, targetType, reportType, detail, userId }) {
    const result = await db.query(`INSERT INTO reports (id,target_id,target_type,report_type,detail,user_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uid("r"),targetId,targetType,reportType,detail,userId || null]);
    return report(result.rows[0]);
  }

  async function adminData() {
    const timestamp = now();
    const { from, today } = analyticsWindow(timestamp);
    const [allResources, allArticles, usersResult, reportsResult, dailyResult, trackingResult] = await Promise.all([
      listResources(true),
      listArticles(true),
      db.query("SELECT * FROM users ORDER BY created_at DESC"),
      db.query("SELECT * FROM reports ORDER BY created_at DESC"),
      db.query("SELECT day,resource_views,article_views FROM content_view_daily WHERE day >= $1 AND day <= $2 ORDER BY day", [from, today]),
      db.query("SELECT started_at FROM analytics_tracking WHERE name='content_views'"),
    ]);
    if (!trackingResult.rows[0]) throw new Error("Analytics migration has not been applied");
    return {
      resources: allResources,
      articles: allArticles,
      users: usersResult.rows.map(publicUser),
      reports: reportsResult.rows.map(report),
      stats: {
        publishedContent: allResources.filter(item => item.status === "online").length + allArticles.filter(item => item.status === "online").length,
        registeredUsers: usersResult.rows.length,
        pendingReports: reportsResult.rows.filter(item => item.status === "pending").length,
        ...summarizeVisits(dailyResult.rows, trackingResult.rows[0].started_at, timestamp),
      },
    };
  }

  async function setResourceStatus(resourceId, status, actor) {
    await db.transaction(async client => {
      await client.query("UPDATE resources SET status=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2", [status,resourceId]);
      await client.query("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id) VALUES ($1,$2,$3,'resource',$4)", [uid("audit"),actor,`resource.${status}`,resourceId]);
    });
  }

  async function updateAdminResource(resourceId, input, actor) {
    return db.transaction(async client => {
      const result = await client.query(`UPDATE resources SET
        name=$1,logo=$2,website=$3,category=$4,subcategory=$5,tags=$6,
        short_description=$7,description=$8,status=$9,cover_image=COALESCE($11,cover_image),updated_at=CURRENT_TIMESTAMP
        WHERE id=$10 RETURNING *`,
        [input.name,input.logo,input.website,input.category,input.subcategory,JSON.stringify(input.tags),input.short,input.description,input.status,resourceId,input.coverImage ?? null]);
      if (!result.rows[0]) throw Object.assign(new Error("资源不存在"), { statusCode: 404 });
      await client.query("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id) VALUES ($1,$2,'resource.update','resource',$3)", [uid("audit"),actor,resourceId]);
      return resource(result.rows[0]);
    });
  }

  async function setUserStatus(userId, status, actor) {
    await db.transaction(async client => {
      await client.query("UPDATE users SET status=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND role<>'admin'", [status,userId]);
      if (status === "banned") await client.query("DELETE FROM sessions WHERE user_id=$1", [userId]);
      await client.query("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id) VALUES ($1,$2,$3,'user',$4)", [uid("audit"),actor,`user.${status}`,userId]);
    });
  }

  async function handleReport(reportId, status, actor) {
    await db.transaction(async client => {
      await client.query("UPDATE reports SET status=$1,handled_by=$2,handled_at=CURRENT_TIMESTAMP WHERE id=$3", [status,actor,reportId]);
      await client.query("INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id) VALUES ($1,$2,$3,'report',$4)", [uid("audit"),actor,`report.${status}`,reportId]);
    });
  }

  return {
    article,
    resource,
    publicUser,
    listResources,
    listArticles,
    listComments,
    publicBootstrap,
    getUserByEmail,
    getUserById,
    createUser,
    updatePassword,
    updateProfile,
    createSession,
    sessionUser,
    deleteSession,
    deleteExpiredSessions,
    saveVerificationCode,
    consumeVerificationCode,
    dashboard,
    toggleFavorite,
    incrementView,
    createComment,
    deleteOwnComment,
    likeComment,
    createResourceWithSubmission,
    createArticleWithSubmission,
    getSubmission,
    updateOwnSubmission,
    deleteOwnSubmission,
    createReport,
    adminData,
    setResourceStatus,
    updateAdminResource,
    setUserStatus,
    handleReport,
  };
}
