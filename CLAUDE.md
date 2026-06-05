# server_hub — agent 约定

个人功能中枢。技术栈与架构见 `docs/BUILD.md`；功能清单见 `docs/FEATURES.md`（生成产物）。

## 功能文档规矩（每次动功能必做）

新增 / 删除 / 修改任何功能时，按顺序执行：

1. **机器文档**：写 / 删 / 改 `docs/features/<key>.json`（每个功能一个文件）。
   - `status` 取值：`active` | `planned` | `removed`。
   - 字段：`key, status, summary, endpoints[], tables[], files[], notes, updated`。
   - 删除功能：把 `status` 改成 `removed`（保留文件作历史），或删除文件。
2. **历史**：往 `docs/features/_changelog.jsonl` **追加一行**（只追加，不改旧行）：
   `{"ts":"YYYY-MM-DD","action":"added|changed|removed","key":"<key>","summary":"..."}`
3. **重生成人读文档**：`npm run docs:features` → 产出 `docs/FEATURES.md`。

## 约束

- 功能的 `key/title/route/permissions` 以代码 `lib/features/registry.ts` 为**单一真相源**；`docs/features/<key>.json` 只补充其余字段，不要重复维护这些基础字段。
- `docs/FEATURES.md` 是**生成产物，永远不要手工编辑**。
- 机器文档优先快速准确（小文件整体覆盖 + changelog 只追加）；人读文档一律由脚本生成。
