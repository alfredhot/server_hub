# 功能总览

> 本文件由 `npm run docs:features` 从 `docs/features/*.json` 与 `lib/features/registry.ts` 生成，**请勿手工编辑**。

## 总览

| 功能 | key | 状态 | 入口 | 权限 | 摘要 |
|------|-----|------|------|------|------|
| 账号设置 | `account` | ✅ 可用 | — | — | 用户自助修改登录密码（所有登录用户可用，不受功能权限限制） |
| Beszel 监控 | `beszel` | ✅ 可用 | https://beszel.alfred.co.kr | open | 外部链接：Beszel 服务器资源监控面板 |
| 文件下载器 | `downloader` | 🚧 规划中 | /f/downloader | read, write | Telegram 媒体下载器（占位，尚未实现） |
| Grafana | `grafana` | ✅ 可用 | https://grafana.alfred.co.kr | open | 外部链接：Grafana 监控可视化仪表盘 |
| 速记 | `notes` | ✅ 可用 | /f/notes | read, write | 随手记 + 时间线，按用户隔离的速记功能 |
| 通知中枢 | `webhook` | 🚧 规划中 | /f/webhook | read, write | Webhook → Telegram 通知中枢（占位，尚未实现） |

## 账号设置 `account`

- **状态**：✅ 可用
- **摘要**：用户自助修改登录密码（所有登录用户可用，不受功能权限限制）
- **接口**：`POST /api/auth/change-password (better-auth)`
- **主要文件**：`app/pages/account.vue`、`app/layouts/default.vue (顶栏入口)`
- **备注**：入口：顶栏齿轮图标 / 用户名 → /account。非 registry 功能（账号级自助，人人可用，不进权限编辑器）。用 better-auth changePassword，校验当前密码、新密码≥8 位，改密后吊销其他设备会话（revokeOtherSessions）。
- **更新于**：2026-06-09

## Beszel 监控 `beszel`

- **状态**：✅ 可用
- **入口**：https://beszel.alfred.co.kr
- **权限**：open
- **摘要**：外部链接：Beszel 服务器资源监控面板
- **主要文件**：`lib/features/registry.ts (entry)`、`app/components/FeatureCard.vue (external link support)`
- **备注**：外链功能：点击在新标签打开 Beszel；hub 仅作启动入口，Beszel 有自己的登录。默认仅 admin 可见，可在 /admin/users 给指定用户授予 open。
- **更新于**：2026-06-05

## 文件下载器 `downloader`

- **状态**：🚧 规划中
- **入口**：/f/downloader
- **权限**：read, write
- **摘要**：Telegram 媒体下载器（占位，尚未实现）
- **备注**：规划中：参考 home_hub 的 telegram 模块迁移
- **更新于**：2026-06-05

## Grafana `grafana`

- **状态**：✅ 可用
- **入口**：https://grafana.alfred.co.kr
- **权限**：open
- **摘要**：外部链接：Grafana 监控可视化仪表盘
- **主要文件**：`lib/features/registry.ts (entry)`
- **备注**：外链功能：点击在新标签打开 Grafana；hub 仅作启动入口，Grafana 有自己的登录。默认仅 admin 可见，可在 /admin/users 给指定用户授予 open。
- **更新于**：2026-06-09

## 速记 `notes`

- **状态**：✅ 可用
- **入口**：/f/notes
- **权限**：read, write
- **摘要**：随手记 + 时间线，按用户隔离的速记功能
- **接口**：`GET /api/features/notes`、`POST /api/features/notes`、`DELETE /api/features/notes/:id`
- **数据表**：`note`
- **主要文件**：`app/pages/f/notes.vue`、`server/api/features/notes/*`
- **备注**：首个真实功能，作为新功能扩展的样板（见 docs/BUILD.md §11）
- **更新于**：2026-06-05

## 通知中枢 `webhook`

- **状态**：🚧 规划中
- **入口**：/f/webhook
- **权限**：read, write
- **摘要**：Webhook → Telegram 通知中枢（占位，尚未实现）
- **备注**：规划中：参考 home_hub 的 webhook 模块迁移
- **更新于**：2026-06-05

## 最近变更

- `2026-06-09` **added** `grafana` — 外链功能：Grafana 监控可视化仪表盘（https://grafana.alfred.co.kr），新标签打开，默认仅 admin 可见
- `2026-06-09` **added** `account` — 账号设置页：用户自助修改密码（/account，better-auth changePassword，改密后吊销其他会话）
- `2026-06-05` **added** `beszel` — 外链功能：Beszel 服务器监控面板（https://beszel.alfred.co.kr），新标签打开，默认仅 admin 可见
- `2026-06-05` **added** `webhook` — 占位登记：Webhook→Telegram 通知中枢（规划中）
- `2026-06-05` **added** `downloader` — 占位登记：Telegram 媒体下载器（规划中）
- `2026-06-05` **added** `notes` — 示例速记功能：note 表 + 读写守卫接口 + 页面，跑通功能扩展闭环
