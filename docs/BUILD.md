# Server Hub — 搭建文档（Nuxt 4 栈）

> 一个运行在自有服务器上的**个人功能中枢（hub）**：聚合各种自建功能，带**多用户认证**与**细粒度权限**——主账号可创建/管理用户，并**逐用户分配可用功能与权限**，偶尔邀请朋友共享部分功能。
>
> 设计目标：**灵活、可按需扩展**。新功能 = 一个自包含模块 + 在「功能注册表」里登记一行，hub 首页按当前用户权限自动渲染卡片。

参考来源：家里那台 `home_hub`（FastAPI + Jinja2 + SQLite 单 admin）。本项目沿用其「单容器 + SQLite + Tailwind + 服务端会话」的思路，但把认证升级为**多用户 + RBAC + 功能注册表**。

---

## 1. 技术栈（最终选型）

| 层 | 选型 | 说明 |
|----|------|------|
| 元框架 | **Nuxt 4**（Vue 3 + Nitro，TS） | 全栈一体：`app/` 前端 + `server/` 后端 API（Nitro），Vite 驱动，HMR 快 |
| UI 组件 | **Nuxt UI 3**（基于 Tailwind v4 + Reka UI） | 自带表格/弹窗/表单/通知等,管理后台开箱即用；与 home_hub 的 Tailwind 一致 |
| 认证 | **better-auth** + **admin 插件** | 服务端会话、邮箱+密码登录、用户 CRUD/封禁/角色/会话管理/模拟登录现成 |
| 权限 | better-auth **access control**（角色）+ 自建**功能授权表**（逐用户覆盖） | 角色给默认能力，按用户细调具体功能开关与权限 |
| ORM | **Drizzle ORM** | 轻量、TS 原生、迁移清晰 |
| 数据库 | **SQLite**（`better-sqlite3` 驱动，WAL 模式） | 单文件、零运维、备份=复制文件；后期可平滑迁 Postgres |
| 部署 | **Docker 单容器** + **Caddy**（自动 HTTPS） | ARM64 友好；公网可访问但全站需登录 |

> 运行环境已确认：Oracle Cloud **ARM64 (Ampere)**、Ubuntu 24.04、3 核 / 17GB、Docker + Node 22 就绪。资源充裕。

---

## 2. 整体架构

```
                         ┌──────────────────────────────────────┐
   浏览器 ──HTTPS──▶ Caddy ──▶ Nuxt(Nitro) 服务进程
                         │                                      │
                         │  app/        (Vue 页面/组件, SSR)      │
                         │   ├─ /login                           │
                         │   ├─ /              hub 首页(功能卡片) │
                         │   ├─ /f/<feature>   各功能模块页       │
                         │   └─ /admin/*       用户/权限管理后台  │
                         │                                      │
                         │  server/                              │
                         │   ├─ /api/auth/[...all]  better-auth   │
                         │   ├─ /api/admin/*        用户/授权管理  │
                         │   ├─ /api/features/*     各功能后端     │
                         │   └─ middleware/auth     全局认证守卫   │
                         │                                      │
                         │  lib/auth.ts  better-auth 实例(admin+AC)│
                         │  lib/features/  功能注册表(扩展核心)    │
                         │  db/  Drizzle schema + SQLite 文件      │
                         └──────────────────────────────────────┘
                                        │
                                  data/hub.db (WAL)  ← 持久化卷
```

**请求与认证流程**（对应你的「新浏览器需输入账号密码」需求）：

1. 任意请求先过 **Nitro 全局中间件**（`server/middleware/`）校验 better-auth 会话 cookie。
2. 无有效会话 → 重定向 `/login`（白名单:`/login`、`/api/auth/**`、静态资源放行）。
3. 登录成功 → 写入**服务端会话**（cookie，长有效期，例如 30–90 天）。**只要这台浏览器的会话没过期/没被撤销，就保持登录**；换一个新浏览器/设备没有该 cookie，就必须重新输账号密码——这正是「每个新浏览器首次需登录」的标准实现。
4. 页面/接口再按**权限**做二次校验(下文「权限模型」)。

> 进阶可选(后续按需开):**2FA / Passkey**(better-auth 有对应插件)、**设备信任 / 受信任设备列表**、**会话集中撤销**(admin 插件已支持列出并撤销某用户的会话)。

---

## 3. 权限模型（核心设计）

分两层,既简单又灵活:

### 3.1 角色（粗粒度，better-auth access control）

| 角色 | 含义 | 默认能力 |
|------|------|----------|
| `admin` | 主账号(你) | 全部功能 + 用户管理后台 + 授权管理 |
| `user` | 常规用户 | 一组「默认开放」的功能 |
| `guest` | 受邀朋友 | 仅被显式授予的功能,默认几乎为空 |

角色用 better-auth 的 `createAccessControl` 定义,admin 插件据此判断谁能进 `/admin/*`、谁能调用管理接口。

### 3.2 功能授权（细粒度，自建表，逐用户覆盖）

**功能定义在代码里**(注册表,见 §5,作为唯一真相源);**授权落在数据库**里:

- 每个用户对每个功能有一条**授权记录**:`enabled`(能不能看到/进入)+ `permissions`(功能内的细权限,JSON,如 `["read","write"]`)。
- **有效权限 = 角色默认值(代码里按角色给) ⊕ 该用户的授权覆盖(数据库)**。
- 主账号在 `/admin/users/:id` 后台逐用户勾选「开放哪些功能」「每个功能给什么权限」。

这样:
- 加新功能 → 注册表加一行,默认按角色继承,无需改表结构。
- 给朋友单独开一个功能 → 后台勾一下,落一条授权记录。
- 既有「角色批量」也有「按人微调」,覆盖你「管理各用户能用哪些功能 + 管理权限」的全部诉求。

---

## 4. 数据模型（Drizzle / SQLite）

### 4.1 better-auth 自带表（由 better-auth CLI 生成）

- `user` — 含 admin 插件字段:`role`、`banned`、`banReason`、`banExpires`
- `session` — 含 admin 插件字段:`impersonatedBy`(模拟登录用)
- `account` — 凭据(密码哈希等)
- `verification` — 邮箱验证/重置令牌

> 这些**不要手写**,用 `npx @better-auth/cli generate` 依据 `lib/auth.ts` 的配置自动生成到 Drizzle schema,保证与插件版本匹配。

### 4.2 应用自建表

```ts
// db/schema.app.ts (示意，最终以脚手架为准)
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 逐用户的功能授权（功能本身定义在代码注册表里，这里只存授权）
export const featureGrant = sqliteTable('feature_grant', {
  id:          text('id').primaryKey(),                 // nanoid
  userId:      text('user_id').notNull(),               // → user.id
  featureKey:  text('feature_key').notNull(),           // → 注册表 key，如 'notes'
  enabled:     integer('enabled', { mode: 'boolean' }).notNull().default(true),
  permissions: text('permissions', { mode: 'json' }).$type<string[]>().notNull().default([]),
  grantedBy:   text('granted_by'),                      // 谁授予的（admin user.id）
  createdAt:   integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt:   integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// 可选：审计日志（谁在何时改了谁的权限 / 登录事件）
export const auditLog = sqliteTable('audit_log', {
  id:        text('id').primaryKey(),
  actorId:   text('actor_id'),
  action:    text('action').notNull(),                  // 'grant.update' | 'user.create' ...
  targetId:  text('target_id'),
  meta:      text('meta', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

> `(userId, featureKey)` 建唯一索引。SQLite 开 **WAL**(更好的并发读)。备份直接复制 `data/hub.db*` 或 `sqlite3 hub.db .dump`。

---

## 5. 功能注册表（扩展性的核心）

每个功能是一个**自包含模块**,在注册表登记元信息。hub 首页和权限后台都读这个表。

```ts
// lib/features/registry.ts
export interface FeatureDef {
  key: string                 // 唯一 id，URL 与授权都用它，如 'notes'
  title: string               // 卡片标题
  description: string         // 卡片副文案
  icon: string                // Nuxt UI 图标名，如 'i-lucide-notebook'
  route: string               // 入口路由，如 '/f/notes'
  permissions: string[]       // 该功能支持的细权限，如 ['read','write']
  defaultByRole: {            // 各角色默认是否开放 + 默认权限
    admin?: string[] | 'all'
    user?:  string[] | false
    guest?: string[] | false
  }
}

export const FEATURES: FeatureDef[] = [
  {
    key: 'notes',
    title: '速记',
    description: '随手记 + 标签检索',
    icon: 'i-lucide-notebook',
    route: '/f/notes',
    permissions: ['read', 'write'],
    defaultByRole: { admin: 'all', user: ['read', 'write'], guest: false },
  },
  // …以后每加一个功能，在这里追加一行
]
```

**加一个新功能的完整步骤**(可重复套用,§11 有完整示例):
1. 在 `FEATURES` 加一行。
2. 建页面 `app/pages/f/<key>.vue`(用 `<FeatureGuard :feature="'<key>'">` 包住)。
3. 建后端 `server/api/features/<key>/*.ts`(用 `requireFeature(event,'<key>','write')` 守卫)。
4. (可选)在 `db/schema.app.ts` 给该功能加自己的表,生成迁移。

无需改动认证/权限框架——这就是「按需扩展」的落点。

---

## 6. 目录结构

```
server_hub/
├── app/                          # Nuxt 4 前端（默认 srcDir）
│   ├── pages/
│   │   ├── index.vue             # hub 首页：按权限渲染功能卡片
│   │   ├── login.vue
│   │   ├── f/                     # 各功能页面（按 feature key）
│   │   └── admin/
│   │       ├── users/index.vue    # 用户列表（创建/封禁/改角色）
│   │       └── users/[id].vue     # 单用户：功能授权 + 权限编辑
│   ├── components/
│   │   ├── FeatureCard.vue
│   │   └── FeatureGuard.vue       # 前端按权限守卫/兜底
│   ├── composables/
│   │   ├── useAuth.ts             # better-auth vue client 封装
│   │   └── usePermissions.ts      # 当前用户有效权限
│   ├── middleware/
│   │   └── auth.global.ts         # 前端路由守卫（未登录跳 /login）
│   └── app.vue
├── server/                       # Nitro 后端
│   ├── api/
│   │   ├── auth/[...all].ts        # better-auth handler
│   │   ├── admin/                  # 用户/授权管理接口
│   │   └── features/               # 各功能后端
│   ├── middleware/
│   │   └── 0.auth.ts               # 全局会话校验
│   └── utils/
│       ├── auth.ts                 # 取 session、requireUser/requireRole
│       └── permissions.ts          # requireFeature / 计算有效权限
├── lib/
│   ├── auth.ts                    # better-auth 实例（admin + access control）
│   ├── auth-client.ts             # 浏览器端 client（adminClient 插件）
│   └── features/registry.ts       # 功能注册表
├── db/
│   ├── index.ts                   # drizzle 实例（better-sqlite3 + WAL）
│   ├── schema.auth.ts             # better-auth 生成的表
│   └── schema.app.ts              # 应用自建表
├── data/                          # SQLite 文件（持久化卷，勿提交）
├── drizzle/                       # 迁移
├── nuxt.config.ts
├── drizzle.config.ts
├── Dockerfile
├── docker-compose.yml
├── Caddyfile
├── .env / .env.example
└── docs/BUILD.md                  # 本文档
```

---

## 7. 关键实现片段（参考，脚手架时按版本微调）

### 7.1 better-auth 实例（服务端）

```ts
// lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '../db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: {
    enabled: true,
    // 个人 hub：默认关闭自助注册，用户一律由主账号创建
    disableSignUp: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,   // 30 天；可调到 90 天
    updateAge: 60 * 60 * 24,        // 每天滑动续期
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
  ],
})
```

### 7.2 Nitro 挂载 + 全局守卫

```ts
// server/api/auth/[...all].ts
import { auth } from '~~/lib/auth'
export default defineEventHandler((event) => auth.handler(toWebRequest(event)))
```

```ts
// server/middleware/0.auth.ts —— 全站默认需登录，白名单放行
const WHITELIST = ['/api/auth', '/login', '/_nuxt', '/__nuxt', '/favicon']
export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (WHITELIST.some((p) => path.startsWith(p))) return
  const session = await auth.api.getSession({ headers: event.headers })
  event.context.session = session
  if (!session && path.startsWith('/api')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
```

### 7.3 功能级守卫（后端）

```ts
// server/utils/permissions.ts
import { FEATURES } from '~~/lib/features/registry'
// 计算有效权限：角色默认 ⊕ feature_grant 覆盖
export async function requireFeature(event, featureKey: string, perm?: string) {
  const session = event.context.session
  if (!session) throw createError({ statusCode: 401 })
  const perms = await effectivePermissions(session.user, featureKey) // 查表+角色
  if (!perms || (perm && !perms.includes(perm))) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return session.user
}
```

### 7.4 客户端 client + 管理操作

```ts
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/vue'
import { adminClient } from 'better-auth/client/plugins'
export const authClient = createAuthClient({ plugins: [adminClient()] })

// 主账号后台可直接调用（admin 插件提供）：
// authClient.admin.createUser({ email, password, name, role })
// authClient.admin.listUsers({ query })
// authClient.admin.setRole({ userId, role })
// authClient.admin.banUser({ userId, banReason })
// authClient.admin.listUserSessions / revokeUserSession
// 功能授权是自建接口：POST /api/admin/grants  { userId, featureKey, enabled, permissions }
```

### 7.5 hub 首页（按权限渲染卡片）

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { data: cards } = await useFetch('/api/features/visible') // 后端按有效权限过滤
</script>
<template>
  <UContainer>
    <UPageGrid>
      <FeatureCard v-for="f in cards" :key="f.key" :feature="f" />
    </UPageGrid>
  </UContainer>
</template>
```

---

## 8. 从零搭建步骤

```bash
# 0) 进项目目录
cd ~/server_hub

# 1) 初始化 Nuxt 4
npx nuxi@latest init . --packageManager npm --no-gitInit
npm install

# 2) UI + 认证 + ORM + 数据库驱动
npm i @nuxt/ui
npm i better-auth
npm i drizzle-orm better-sqlite3
npm i -D drizzle-kit @better-auth/cli

# 3) nuxt.config.ts 里加模块
#    modules: ['@nuxt/ui']

# 4) 配 .env
#    BETTER_AUTH_SECRET=<openssl rand -base64 32>
#    BETTER_AUTH_URL=http://localhost:3000   # 上线改成你的域名
#    DATABASE_URL=./data/hub.db
#    ADMIN_EMAIL=you@example.com
#    ADMIN_PASSWORD=<首次启动用于初始化主账号>

# 5) 写好 lib/auth.ts、db/index.ts 后，生成认证表 schema
npx @better-auth/cli generate          # 产出 better-auth 的 Drizzle 表

# 6) 生成并执行迁移（认证表 + 自建表）
npx drizzle-kit generate
npx drizzle-kit migrate

# 7) 跑初始化脚本：创建主账号 + 给 admin 全功能（幂等）
npm run seed:admin

# 8) 起开发服务
npm run dev      # http://localhost:3000，用 ADMIN_EMAIL/PASSWORD 登录
```

> 主账号初始化采用「环境变量 + 幂等 seed」(对齐 home_hub 的 `ensure_admin_user` 思路):首次启动若不存在该邮箱用户则创建并赋 `admin` 角色;**登录后立即改密码**。

---

## 9. 部署（单容器 + Caddy 自动 HTTPS）

**Dockerfile**(多阶段,产出 Nuxt 精简产物):

```dockerfile
# 构建阶段
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build              # 产出 .output/

# 运行阶段
FROM node:22-slim
WORKDIR /app
COPY --from=build /app/.output ./.output
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/db ./db
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
# 入口：先迁移再起服务
CMD ["sh","-c","node .output/server/scripts/migrate.mjs && node .output/server/index.mjs"]
```

**docker-compose.yml**:

```yaml
services:
  hub:
    build: .
    restart: unless-stopped
    env_file: .env
    environment:
      - DATABASE_URL=/app/data/hub.db
    volumes:
      - ./data:/app/data         # SQLite 持久化（必需）
    expose: ["3000"]

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on: [hub]

volumes:
  caddy_data:
  caddy_config:
```

**Caddyfile**(把 `hub.example.com` 换成你的域名,Caddy 自动签发/续期证书):

```
hub.example.com {
    encode zstd gzip
    reverse_proxy hub:3000
}
```

```bash
docker compose up -d --build
```

> **安全基线**:全站默认需登录(中间件已覆盖);`disableSignUp` 关自助注册;Caddy 强制 HTTPS;`BETTER_AUTH_SECRET` 用强随机;`data/` 仅容器卷,不进 git;朋友账号建议用 `guest` 角色 + 按需授予单个功能。
> **更私密的可选项**:不暴露公网,改用 Tailscale,Caddy 只监听内网——但朋友也要装 Tailscale。当前默认走公网+登录,最适合「偶尔邀请朋友」。

---

## 10. 开发工作流

- **改代码**:`npm run dev`,Vite HMR 保存即生效。
- **改数据模型**:改 `db/schema.app.ts` → `npx drizzle-kit generate` 产出迁移 → `migrate` 应用。迁移文件提交 git,容器启动时自动 `migrate`(对齐 home_hub 的「迁移随启动执行」)。
- **加功能**:见 §5 / §11。
- **备份**:`cp data/hub.db* backup/` 或 `sqlite3 data/hub.db .dump > backup.sql`。

---

## 11. 实战示例：新增一个「速记 notes」功能

1. **注册表**(`lib/features/registry.ts`):加上 §5 里的 `notes` 那条。
2. **数据表**(`db/schema.app.ts`):

   ```ts
   export const note = sqliteTable('note', {
     id: text('id').primaryKey(),
     userId: text('user_id').notNull(),
     body: text('body').notNull(),
     createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
   })
   ```
   然后 `drizzle-kit generate && migrate`。
3. **后端**(`server/api/features/notes/index.ts`):

   ```ts
   export default defineEventHandler(async (event) => {
     const user = await requireFeature(event, 'notes', 'read')
     return db.select().from(note).where(eq(note.userId, user.id))
   })
   ```
   写操作再用 `requireFeature(event,'notes','write')`。
4. **页面**(`app/pages/f/notes.vue`):用 `<FeatureGuard feature="notes">` 包裹,内部用 Nuxt UI 的 `UTable`/`UTextarea`/`UButton` 拼界面。
5. **授权**:主账号到 `/admin/users/:id` 给目标用户勾上 `notes` 并选 `read`/`write`。完成。

全程没碰认证与权限框架——这就是这套架构「按需扩展」的体现。

---

## 12. 里程碑建议

| 阶段 | 产出 |
|------|------|
| **M1 骨架** | Nuxt 4 + Nuxt UI + better-auth 登录跑通,全站需登录,主账号 seed |
| **M2 权限框架** | 功能注册表 + featureGrant 表 + 有效权限计算 + 守卫(前后端) |
| **M3 管理后台** | `/admin/users`:创建/封禁/改角色 + 逐用户功能授权 UI |
| **M4 首个功能** | 用 §11 流程落一个真实功能(如速记或一个你常用的小工具),验证扩展闭环 |
| **M5 部署** | Docker + Caddy 上线到 Oracle ARM,域名 + 自动 HTTPS |
| **M6 增强(按需)** | 2FA/Passkey、审计日志、设备信任、把 home_hub 的某些模块搬进来 |

---

## 附:与 home_hub 的对应关系

| home_hub(FastAPI) | server_hub(Nuxt 4) | 备注 |
|---|---|---|
| AuthMiddleware + 白名单 | `server/middleware/0.auth.ts` | 同思路 |
| PBKDF2 + 服务端 session | better-auth 会话 | 升级为多用户 |
| `ensure_admin_user`(env) | `seed:admin`(env,幂等) | 同思路 |
| 单 admin | 角色(admin/user/guest)+ 功能授权 | 新增能力 |
| Jinja2 模板 | Vue 3 + Nuxt UI | 模板心智相近 |
| Alembic 随启动迁移 | drizzle-kit 随启动迁移 | 同思路 |
| 单容器 + SQLite | 单容器 + SQLite | 一致 |
