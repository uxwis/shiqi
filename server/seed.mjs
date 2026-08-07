import { ALL_SEED_RESOURCES, SEED_ARTICLES, SEED_COMMENTS, SEED_REPORTS, SEED_USERS } from "../app.js";
import { config } from "./config.mjs";
import { hashPassword } from "./security.mjs";

async function seedUser(client, { id, email, password, nickname, role = "user", bio = "", status = "active" }) {
  if (!email || !password) return;
  const passwordHash = await hashPassword(password);
  await client.query(`INSERT INTO users (id,email,password_hash,nickname,bio,role,status,email_verified_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,nickname=EXCLUDED.nickname,bio=EXCLUDED.bio,role=EXCLUDED.role,status=EXCLUDED.status`,
    [id,email,passwordHash,nickname,bio || "",role,status || "active"]);
}

export async function seedDatabase(database, { production = config.production } = {}) {
  if (production && (!config.admin.email || !config.admin.password)) throw new Error("生产初始化需要 ADMIN_EMAIL 和 ADMIN_PASSWORD");

  await database.transaction(async client => {
    if (production) {
      await seedUser(client, { id: "u-admin", email: config.admin.email, password: config.admin.password, nickname: config.admin.nickname, role: "admin" });
    } else {
      await seedUser(client, { id: "u-demo", email: "demo@shiqi.cn", password: "demo1234", nickname: "林一格", bio: "正在把 AI 变成日常生产力。" });
      await seedUser(client, { id: "u-admin", email: "admin@shiqi.cn", password: "admin1234", nickname: "拾器运营", role: "admin", bio: "持续收录值得被看见的好工具。" });
      for (const user of SEED_USERS.filter(user => !["u-demo", "u-admin"].includes(user.id))) {
        await seedUser(client, { ...user, password: `Seed-only-${user.id}-not-for-login` });
      }
      await seedUser(client, { id: "u-paper", email: "paper@example.com", password: "Seed-only-u-paper-not-for-login", nickname: "纸飞机" });
    }

    for (const item of ALL_SEED_RESOURCES) {
      await client.query(`INSERT INTO resources
        (id,name,logo,category,subcategory,tags,color,logo_color,short_description,description,features,tutorial,scenarios,rating,ratings_count,views_count,favorites_count,featured,status,source,website,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
        ON CONFLICT (id) DO NOTHING`,
        [item.id,item.name,item.logo,item.category,item.subcategory,JSON.stringify(item.tags),item.color,item.logoColor,item.short,item.description,JSON.stringify(item.features),JSON.stringify(item.tutorial),JSON.stringify(item.scenarios),item.rating,item.ratings,item.views,item.favorites,item.featured,item.status,item.source,item.website,item.created,item.updated]);
    }

    for (const item of SEED_ARTICLES) {
      const ownerId = production && item.userId !== "u-admin" ? null : (item.userId || null);
      await client.query(`INSERT INTO articles
        (id,title,excerpt,category,tags,author_name,user_id,read_time,views_count,favorites_count,featured,status,cover,images,body,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO NOTHING`,
        [item.id,item.title,item.excerpt,item.category,JSON.stringify(item.tags),item.author,ownerId,item.readTime,item.views,item.favorites || 0,item.featured,item.status || "online",item.cover,JSON.stringify(item.images || []),JSON.stringify(item.body),item.created,item.updated]);
      if (ownerId) {
        await client.query(`INSERT INTO submissions (id,target_id,content_type,user_id,name,category,summary,created_at,updated_at)
          VALUES ($1,$2,'article',$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
          [`seed-${item.id}`,item.id,ownerId,item.title,item.category,item.excerpt,item.created,item.updated]);
      }
    }

    if (!production) {
      for (const item of SEED_COMMENTS) {
        await client.query(`INSERT INTO comments (id,resource_id,user_id,rating,content,likes_count,status,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,'online',$7) ON CONFLICT (id) DO NOTHING`, [item.id,item.resourceId,item.userId,item.rating,item.content,item.likes || 0,item.created]);
      }
      for (const item of SEED_REPORTS) {
        await client.query(`INSERT INTO reports (id,target_id,target_type,report_type,detail,user_id,status,created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`, [item.id,item.targetId,item.targetType,item.type,item.detail,item.userId,item.status,item.created]);
      }
    }
  });

  return { resources: ALL_SEED_RESOURCES.length, articles: SEED_ARTICLES.length };
}
