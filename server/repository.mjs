import { analyticsDay } from "./analytics.mjs";
import { uid } from "./security.mjs";
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
  async function getUserByEmail(email) {
    const result = await db.query(
      "SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email],
    );
    return result.rows[0] || null;
  }

  async function getUserById(id) {
    const result = await db.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [
      id,
    ]);
    return result.rows[0] || null;
  }

  async function createUser({
    email,
    passwordHash,
    nickname,
    verified = true,
    role = "user",
  }) {
    const id = uid("u");
    const result = await db.query(
      `INSERT INTO users (id,email,password_hash,nickname,role,email_verified_at)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, email, passwordHash, nickname, role, verified ? new Date() : null],
    );
    return publicUser(result.rows[0]);
  }

  async function updatePassword(userId, passwordHash) {
    await db.transaction(async (client) => {
      await client.query(
        "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [passwordHash, userId],
      );
      await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    });
  }

  async function updateProfile(userId, values) {
    const result = await db.query(
      `UPDATE users SET nickname=$1,bio=$2,gender=$3,birthday=$4,updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *`,
      [
        values.nickname,
        values.bio,
        values.gender,
        values.birthday || null,
        userId,
      ],
    );
    return publicUser(result.rows[0]);
  }

  async function createSession({
    userId,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
  }) {
    const id = uid("session");
    await db.query(
      `INSERT INTO sessions (id,user_id,token_hash,expires_at,ip_address,user_agent) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, userId, tokenHash, expiresAt, ipAddress, userAgent],
    );
    return id;
  }

  async function sessionUser(tokenHash) {
    const result = await db.query(
      `SELECT u.*, s.id AS session_id, s.expires_at AS session_expires_at FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 LIMIT 1`,
      [tokenHash],
    );
    if (
      !result.rows[0] ||
      new Date(result.rows[0].session_expires_at) <= new Date() ||
      result.rows[0].status !== "active"
    )
      return null;
    await db.query(
      "UPDATE sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=$1",
      [result.rows[0].session_id],
    );
    return publicUser(result.rows[0]);
  }

  async function deleteSession(tokenHash) {
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash]);
  }

  async function deleteExpiredSessions() {
    const result = await db.query("SELECT id,expires_at FROM sessions");
    const expiredIds = result.rows
      .filter((row) => new Date(row.expires_at) <= new Date())
      .map((row) => row.id);
    if (expiredIds.length)
      await db.query("DELETE FROM sessions WHERE id = ANY($1)", [expiredIds]);
  }

  async function saveVerificationCode({ email, purpose, codeHash, expiresAt }) {
    await db.transaction(async (client) => {
      await client.query(
        "UPDATE verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE lower(email)=lower($1) AND purpose=$2 AND consumed_at IS NULL",
        [email, purpose],
      );
      await client.query(
        `INSERT INTO verification_codes (id,email,purpose,code_hash,expires_at) VALUES ($1,$2,$3,$4,$5)`,
        [uid("verify"), email, purpose, codeHash, expiresAt],
      );
    });
  }

  async function consumeVerificationCode({ email, purpose, codeHash }) {
    return db.transaction(async (client) => {
      const result = await client.query(
        `SELECT * FROM verification_codes WHERE lower(email)=lower($1) AND purpose=$2 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [email, purpose],
      );
      const code = result.rows[0];
      if (
        !code ||
        new Date(code.expires_at) <= new Date() ||
        code.attempts >= 5
      )
        return false;
      if (code.code_hash !== codeHash) {
        await client.query(
          "UPDATE verification_codes SET attempts=attempts+1 WHERE id=$1",
          [code.id],
        );
        return false;
      }
      await client.query(
        "UPDATE verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE id=$1",
        [code.id],
      );
      return true;
    });
  }

  async function incrementView(targetType, targetId) {
    const table = targetType === "article" ? "articles" : "resources";
    const day = analyticsDay(now());
    return db.transaction(async (client) => {
      const result = await client.query(
        `UPDATE ${table} SET actual_views_count=actual_views_count+1 WHERE id=$1 AND status='online' RETURNING actual_views_count AS views`,
        [targetId],
      );
      if (!result.rows[0])
        throw Object.assign(new Error("内容不存在或已下架"), {
          statusCode: 404,
        });
      await client.query(
        `INSERT INTO content_view_daily (day,resource_views,article_views) VALUES ($1,$2,$3)
        ON CONFLICT (day) DO UPDATE SET resource_views=content_view_daily.resource_views+EXCLUDED.resource_views,
        article_views=content_view_daily.article_views+EXCLUDED.article_views`,
        [
          day,
          targetType === "resource" ? 1 : 0,
          targetType === "article" ? 1 : 0,
        ],
      );
      return Number(result.rows[0].views);
    });
  }

  async function deleteOwnComment(commentId, userId) {
    const result = await db.query(
      "DELETE FROM comments WHERE id=$1 AND user_id=$2 RETURNING id",
      [commentId, userId],
    );
    return Boolean(result.rows[0]);
  }

  async function likeComment(commentId, userId) {
    return db.transaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO comment_likes (comment_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING comment_id`,
        [commentId, userId],
      );
      if (!inserted.rows[0]) return { liked: true, added: false };
      await client.query(
        "UPDATE comments SET likes_count=likes_count+1 WHERE id=$1",
        [commentId],
      );
      return { liked: true, added: true };
    });
  }

  async function createReport({
    targetId,
    targetType,
    reportType,
    detail,
    userId,
  }) {
    const result = await db.query(
      `INSERT INTO reports (id,target_id,target_type,report_type,detail,user_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uid("r"), targetId, targetType, reportType, detail, userId || null],
    );
    return report(result.rows[0]);
  }

  async function setUserStatus(userId, status, actor) {
    await db.transaction(async (client) => {
      await client.query(
        "UPDATE users SET status=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND role<>'admin'",
        [status, userId],
      );
      if (status === "banned")
        await client.query("DELETE FROM sessions WHERE user_id=$1", [userId]);
      await client.query(
        "INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id) VALUES ($1,$2,$3,'user',$4)",
        [uid("audit"), actor, `user.${status}`, userId],
      );
    });
  }

  async function handleReport(reportId, status, actor) {
    await db.transaction(async (client) => {
      await client.query(
        "UPDATE reports SET status=$1,handled_by=$2,handled_at=CURRENT_TIMESTAMP WHERE id=$3",
        [status, actor, reportId],
      );
      await client.query(
        "INSERT INTO audit_logs (id,actor_user_id,action,target_type,target_id) VALUES ($1,$2,$3,'report',$4)",
        [uid("audit"), actor, `report.${status}`, reportId],
      );
    });
  }

  return {
    now,
    publicUser,
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
    incrementView,
    deleteOwnComment,
    likeComment,
    createReport,
    setUserStatus,
    handleReport,
  };
}
