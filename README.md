# 拾器 SHIQI

用户共同发布和维护的 AI 工具、软件工具与学习资源社区。当前版本已接入服务端数据库、邮箱注册、会话鉴权、发布管理、举报处理和图片上传，可作为单实例正式服务部署。

## 技术结构

- Node.js 22+ 原生 HTTP 服务
- PostgreSQL 作为唯一业务数据源
- HttpOnly、SameSite、Secure 生产会话 Cookie
- scrypt 密码哈希、邮箱验证码、接口限流和同源写操作保护
- 工具/文章直接发布；后台只处理举报、链接失效和上下架
- 文章图片保存到持久化磁盘，页面数据不再依赖 `localStorage`

## 本地启动

最省事的联调方式不需要安装 PostgreSQL，数据会随进程退出清空：

```powershell
npm install
npm run dev:memory
```

使用真实 PostgreSQL：

```powershell
Copy-Item .env.example .env
npm install
npm run db:setup
npm run dev
```

也可以使用 Docker 启动本地 PostgreSQL 和应用：

```powershell
docker compose up --build
```

开发数据包含：

- 普通用户：`demo@shiqi.cn` / `demo1234`
- 管理员：`admin@shiqi.cn` / `admin1234`

这些账号只会由非生产环境的数据初始化命令创建。

## 生产部署

生产环境至少配置：

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=4173
APP_ORIGIN=https://你的域名
DATABASE_URL=postgres://...
DATABASE_SSL=true
PASSWORD_PEPPER=至少32位且长期固定的随机字符串
ADMIN_EMAIL=你的管理员邮箱
ADMIN_PASSWORD=初始化时使用的强密码
SEED_ON_START=false
EMAIL_PROVIDER=zeabur
EMAIL_FROM=no-reply@你的已验证发件域名
ZSEND_API_KEY=Zeabur Email 只发送权限密钥

# 或改用 SMTP：EMAIL_PROVIDER=smtp，并配置以下变量
SMTP_HOST=邮件服务器
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...
UPLOAD_DRIVER=local
UPLOAD_DIR=/持久化磁盘/uploads
TRUST_PROXY=true
```

首次部署按顺序执行：

```text
npm ci --omit=dev
npm run db:migrate
npm run db:seed
npm start
```

以后启动 `npm start` 会自动执行尚未应用的数据库迁移，不会重复覆盖数据。首次上线或灾备恢复时可临时设置 `SEED_ON_START=true`，用于导入初始公开内容和管理员账号；初始化成功后应立即恢复为 `false`。

### 上线前必须确认

- 域名已启用 HTTPS，`APP_ORIGIN` 与浏览器实际访问域名完全一致。
- PostgreSQL 开启自动备份；数据库连接和 `PASSWORD_PEPPER` 已放入部署平台密钥管理。
- `UPLOAD_DIR` 挂载的是持久化磁盘并纳入备份，不能使用容器临时文件系统。
- 发信域名已配置 SPF、DKIM、DMARC，并实测能收到注册和重置验证码；Zeabur Email 使用仅发送权限 API Key，其他供应商可使用 SMTP。
- 反向代理确实覆盖原始客户端 IP 后才启用 `TRUST_PROXY=true`。
- 已准备用户协议、隐私政策、举报处置和内容删除流程；接入广告前再按供应商要求补充 Cookie/广告披露与同意管理。
- 多实例扩容前，把进程内限流迁移到 Redis，并把图片迁移到 S3/R2 等对象存储。

## 验证

```powershell
npm run check
npm test
```

测试覆盖注册、会话、权限、发布、收藏、评论、举报和后台处置。健康检查接口为 `GET /api/health`。

## 资源页与发布内容

- 工具资源统一入口为 `#/resources`，支持全部、AI工具、软件工具和在线工具；旧 `#/software` 链接会转到统一入口。
- 工具封面读取官网的 Open Graph 图片，按需请求并缓存；无 OG 图或网站拒绝访问时显示图标。服务端仅访问公开网络地址。本地代理若使用 Fake-IP（例如 198.18.0.0/15），需让该 Node 服务使用正常公网 DNS；否则会安全地回退为图标。
- 新迁移 `002_resource_views.sql` 单独记录真实详情页访问量，从 0 开始计数，保留原有历史/演示字段；`npm start` 自动应用迁移。
- 学习资源支持标题、粗体、斜体、列表、引用和链接，摘要可留空；旧纯文本文章仍可阅读和编辑。

发布频道使用工具资源／学习资源 Tab 切换并保留本次填写的草稿；工具资源不再要求二级分类，一句话介绍可以留空。


## 管理看板统计

`003_dashboard_analytics.sql` 新增持久化的每日内容访问记录和文章真实浏览量，`npm start` 自动执行迁移。看板中的公开内容、注册账号（含运营账号）与待处理举报均来自数据库；本月访问与七日趋势只汇总实际记录，按北京时间划分日期。每次打开工具或文章详情记一次 PV，收藏、评分等页面重绘不重复记数。

访问统计从此次迁移启用后开始记录，不导入演示访问数，也不推算没有采集的历史数据。图表把采集开始前的日期标为“未记录”。可用看板的“刷新数据”更新指标。原有旧计数字段保留，工具和文章前台显示独立的真实浏览计数。

## 手动工具封面

工具发布页、“我的发布”编辑及后台资源编辑支持一张可选 OG 封面图，复用现有图片上传接口与持久化上传目录，支持 JPG、PNG、WebP，单张不超过 500KB。列表卡片、搜索结果与详情页统一采用 16:10 比例，依次尝试手动上传的封面、官网 OG 图和原图标。可替换或移除已上传的封面。

`004_resource_cover_image.sql` 仅为资源新增默认空字符串的 `cover_image` 字段，保留现有内容与统计，随 `npm start` 自动应用。资源接口新增可选 `coverImage` 上传路径字段；编辑请求不传此字段时保留原封面，传空字符串则恢复自动读取 OG。部署时继续使用原数据库和挂载到 `UPLOAD_DIR` 的持久化磁盘。
