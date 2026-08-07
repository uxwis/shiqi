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

以后启动 `npm start` 会自动执行尚未应用的数据库迁移，不会重复覆盖数据。`db:seed` 只需要在首次上线时执行，用于导入初始公开内容和管理员账号。

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
