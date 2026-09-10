import { uid } from "./security.mjs";
import { createLinkChecker } from "./link-check.mjs";

export function createMaintenance(
  db,
  {
    now = () => new Date(),
    check = createLinkChecker(),
    enabled = process.env.MAINTENANCE_ENABLED !== "false",
    interval = 3600000,
  } = {},
) {
  let timer = null,
    running = false;
  async function run() {
    if (running) return { status: "running" };
    running = true;
    const id = uid("job");
    let owned = false,
      checked = 0,
      flagged = 0;
    try {
      owned = await db.transaction(async (client) => {
        await client.query(
          "DELETE FROM maintenance_locks WHERE name='links' AND expires_at<=$1",
          [now()],
        );
        const lock = await client.query(
          "INSERT INTO maintenance_locks(name,holder,expires_at) VALUES('links',$1,$2) ON CONFLICT DO NOTHING RETURNING holder",
          [id, new Date(+now() + 600000)],
        );
        return !!lock.rows.length;
      });
      if (!owned) return { status: "running" };
      await db.query(
        "INSERT INTO maintenance_runs(id,status,started_at) VALUES($1,'running',$2)",
        [id, now()],
      );
      // Expiration is also calculated in every public query, even with jobs off.
      for (const table of ["resources", "articles"]) {
        const result = await db.query(
          `UPDATE ${table} SET review_required=true,featured=false WHERE scope='ai' AND status='online' AND review_required=false AND review_due_at<=$1`,
          [now()],
        );
        flagged += result.rowCount || 0;
      }
      const links = (
        await db.query(
          `SELECT l.* FROM content_links l LEFT JOIN resources r ON l.target_type='resource' AND r.id=l.target_id LEFT JOIN articles a ON l.target_type='article' AND a.id=l.target_id WHERE l.next_check_at<=$1 AND ((r.scope='ai' AND r.status='online' AND r.deleted_at IS NULL) OR (a.scope='ai' AND a.status='online' AND a.deleted_at IS NULL)) ORDER BY l.next_check_at,l.id LIMIT 200`,
          [now()],
        )
      ).rows;
      const domains = new Set();
      for (const link of links) {
        if (checked >= 40) break;
        const domain = new URL(link.url).hostname;
        if (domains.has(domain)) continue; // At most one request chain/domain/run.
        domains.add(domain);
        const row = (
          await db.query(
            `SELECT status,scope,deleted_at FROM ${link.target_type === "article" ? "articles" : "resources"} WHERE id=$1`,
            [link.target_id],
          )
        ).rows[0];
        if (
          !row ||
          row.status !== "online" ||
          row.scope !== "ai" ||
          row.deleted_at
        )
          continue;
        const result = await check(link.url);
        checked++;
        await db.query(
          "INSERT INTO link_check_history(id,link_id,checked_at,result,http_status,note) VALUES($1,$2,$3,$4,$5,$6)",
          [
            uid("check"),
            link.id,
            now(),
            result.status,
            result.httpStatus,
            result.note,
          ],
        );
        const failures =
          result.status === "missing" ? link.failure_count + 1 : 0;
        const state =
          result.status === "missing" && failures >= 2
            ? "needs_review"
            : result.status;
        const next = new Date(
          +now() +
            (result.status === "missing" && failures === 1
              ? 86400000
              : 7 * 86400000),
        );
        await db.query(
          "UPDATE content_links SET last_checked_at=$1,next_check_at=$2,check_status=$3,http_status=$4,failure_count=$5,check_note=$6 WHERE id=$7",
          [
            now(),
            next,
            state,
            result.httpStatus,
            failures,
            result.note,
            link.id,
          ],
        );
        if (["needs_review", "unsafe"].includes(state)) {
          flagged++;
          // This requests review, never automatically confirms invalidity.
          await db.query(
            `UPDATE ${link.target_type === "article" ? "articles" : "resources"} SET review_required=true,featured=false WHERE id=$1`,
            [link.target_id],
          );
        }
      }
      await db.query(
        "UPDATE maintenance_runs SET status='complete',checked_count=$1,flagged_count=$2,finished_at=$3 WHERE id=$4",
        [checked, flagged, now(), id],
      );
      return { id, status: "complete", checked, flagged };
    } catch (error) {
      if (owned)
        await db
          .query(
            "UPDATE maintenance_runs SET status='failed',error=$1,finished_at=$2 WHERE id=$3",
            [String(error.message).slice(0, 1000), now(), id],
          )
          .catch(() => {});
      throw error;
    } finally {
      if (owned)
        await db.query(
          "DELETE FROM maintenance_locks WHERE name='links' AND holder=$1",
          [id],
        );
      running = false;
    }
  }
  function start() {
    if (!enabled || timer) return;
    run().catch((error) => console.error("Maintenance:", error.message));
    timer = setInterval(
      () =>
        run().catch((error) => console.error("Maintenance:", error.message)),
      interval,
    );
    timer.unref();
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  return { enabled, run, start, stop };
}
