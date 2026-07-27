# PMApp AI 助理后端

让领导/员工用**自然语言**（任何语言）直接问 PWA 里的资料，AI 助理通过工具查询 Supabase 真实数据后回答。AI 只能回答系统内已有的信息，不会编造。

## 免费 LLM 建议
- **首选 DeepSeek**（推荐）：https://platform.deepseek.com 注册 → API Keys → 创建 key。新用户有**免费额度**，`deepseek-chat` 单价极低且**支持工具调用**、多语言好。
- 备选 **智谱 GLM-4-Flash**：完全免费（有速率限制），把 `.env` 里 `LLM_BASE_URL / LLM_API_KEY / LLM_MODEL` 换成智谱即可（示例已在 `.env.example` 中）。

## 在 CloudStudio 运行
1. 用 WorkBuddy 的「部署」把本目录上传到 CloudStudio 工作空间。
2. 在 CloudStudio 工作空间终端执行：
   ```bash
   cd ai-server
   npm install
   cp .env.example .env      # 然后编辑 .env，填入 LLM_API_KEY
   npm start
   ```
3. 点击 CloudStudio 的「预览 / 端口」→ 选择端口 `3000` → 获得一个**公网 URL**（形如 `https://xxx-3000.app.cloudstudio.work`）。
4. 把该 URL 填入 PWA 的 AI 助理浮窗设置中（首次打开浮窗会提示）。

## 接口
- `POST /api/chat`  body: `{ "messages": [{ "role":"user", "content":"越南工厂本周有哪些延误的生产子计划？" }] }`
  返回: `{ "reply": "..." }`
- `GET /api/health` 健康检查

## 环境变量（.env）
见 `.env.example`。`SUPABASE_URL/KEY` 已填默认值（与 PWA 同项目），只需补 `LLM_API_KEY` 等 LLM 配置。
