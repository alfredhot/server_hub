# Server Hub

个人功能中枢（hub）：聚合各种自建功能，带**多用户认证**与**细粒度权限**——主账号创建/管理用户，并逐用户分配可用功能与权限。可按需扩展：新功能 = 注册表加一行 + 一个页面/接口。

完整设计与决策见 [`docs/BUILD.md`](docs/BUILD.md)。

## 技术栈

Nuxt 4（Vue 3 + Nitro）· Nuxt UI 4 · better-auth（admin 插件）· Drizzle ORM · SQLite（better-sqlite3）· Tailwind 4 · Docker + Caddy。

## 本地开发

```bash
cp .env.example .env          # 填好 BETTER_AUTH_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD
#   生成 secret： openssl rand -base64 32
npm install
npm run dev                   # http://localhost:3000
```

服务器**启动时自动**执行迁移并幂等创建主账号（`server/plugins/0.bootstrap.ts`）。
也可手动 seed：`npm run seed:admin`。首次登录后请尽快改密码。

### 常用脚本

| 命令 | 作用 |
|------|------|
| `npm run dev` | 开发服务器（HMR） |
| `npm run build` | 生产构建（`.output/`） |
| `npm run db:generate` | 由 schema 生成迁移 |
| `npm run db:migrate` | 应用迁移（容器启动也会自动跑） |
| `npm run auth:generate` | 由 better-auth 配置生成认证表 schema |
| `npm run seed:admin` | 手动创建主账号 |

## 加一个新功能

1. `lib/features/registry.ts` 追加一个 `FeatureDef`。
2. 页面 `app/pages/f/<key>.vue`，用 `<FeatureGuard feature="<key>">` 包裹。
3. 后端 `server/api/features/<key>/*.ts`，用 `requireFeature(event, '<key>', 'write')` 守卫。
4. 需要存储就在 `db/schema.app.ts` 加表并 `db:generate && db:migrate`。
5. 主账号到 `/admin/users/:id` 给目标用户授予该功能。

详见 `docs/BUILD.md` §5 / §11。

## 部署（全 Docker + Caddy 边缘反代）

业务容器只走内网，公网入口只有 Caddy（独立部署在 `~/caddy`，证书自动签发/续签）。

```bash
# 1) 一次性：共享网络
docker network create edge

# 2) 边缘反代（配置在 deploy/caddy，部署到 ~/caddy）
cp -r deploy/caddy ~/caddy
#    按需修改 ~/caddy/Caddyfile 里的域名
cd ~/caddy && docker compose up -d

# 3) 业务
cd ~/server_hub && docker compose up -d --build
```

Oracle Cloud 需在 **VCN 安全列表** 与 **实例 iptables** 两层放行 80/443，并把域名 A/AAAA 指向公网 IP。详见 `docs/BUILD.md` §9。

## 目录

```
app/        前端（页面/组件/布局/中间件/composables）
server/     Nitro 后端（API、全局认证中间件、守卫、启动插件）
lib/        better-auth 实例、auth client、功能注册表、bootstrap
db/         Drizzle schema（认证表 + 业务表）与连接
drizzle/    迁移文件
deploy/     Caddy 边缘反代模板
docs/       设计与搭建文档
```
