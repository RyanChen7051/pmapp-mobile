/* ════════════════════════════════════════════════════════════════
 * PMApp AI 助理后端
 * 功能：接收 PWA 提问 → DeepSeek（免费额度，OpenAI 兼容）→
 *       通过 query_module 工具查询 Supabase 真实数据 → 多语言回答
 * 部署：CloudStudio 工作空间运行 `npm install && npm start`
 * ════════════════════════════════════════════════════════════════ */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors()); // 允许任意来源（PWA 在 GitHub Pages 跨域调用）
app.use(express.json({ limit: '2mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nsnmtkukxquhinlmbejg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_YB5z3cQK-vCg67--oKpSrg_63STgMJW';
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.deepseek.com';
const LLM_API_KEY  = process.env.LLM_API_KEY || '';
const LLM_MODEL    = process.env.LLM_MODEL || 'deepseek-chat';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: LLM_API_KEY, baseURL: LLM_BASE_URL });

/* 全部模块说明（给 AI 提示，让它知道能查什么） */
const MODULES_INFO = {
  projects: '项目（海外生产项目：名称、客户、型号、数量、交期、阶段 NPI/EVT/DVT/PVT/MP、状态）',
  issues: '问题/不良（生产或质量问题：标题、严重度、状态、类型、对策、负责人、截止日期）',
  tasks: '生产主计划任务（标题、状态、优先级、负责人、开始/截止日期、工时）',
  factory_info: '工厂信息（工厂名称、区域、国家、PM/PE/TE/ME/EE/质量工程师、日报链接）',
  todos: '生产子计划（任务内容、所属主计划、完成时间、是否完成）',
  shipping_plans: '出货计划（计划编号、状态、目的地、计划/实际出货日、箱数、追踪号）',
  market_reports: '市场报告（日期、内容、市场/品牌/价格数据）',
  ai_industry_news: '行业新闻（日期、标题、摘要、来源、链接、重要性）',
  overseas_material_alerts: '物料预警规则（规则名、阈值、是否启用）',
  users: '用户/人员（用户名、姓名、职位、状态、最后登录）',
  inspection: '客验（客验单位、验货项目、验货时间、数量、订单号）',
  rmd: 'RMD（国家、工厂、签核时间、项目、物料名/批次/编号、数量、内部确认）',
};
const MODULE_KEYS = Object.keys(MODULES_INFO);

/* 工具：查询某模块数据（拉取后在前端侧过滤关键词/状态） */
async function queryModule(module, keyword, status, limit) {
  const lim = Math.min(parseInt(limit) || 50, 500);
  const { data, error } = await supabase
    .from('sync_data')
    .select('payload, updated_at')
    .eq('table_name', module)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw new Error('Supabase 查询失败: ' + error.message);
  let rows = (data || []).map(r => {
    try { return JSON.parse(r.payload); } catch { return null; }
  }).filter(Boolean);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    rows = rows.filter(row => Object.values(row).some(v => v != null && String(v).toLowerCase().includes(kw)));
  }
  if (status) {
    const st = String(status).toLowerCase();
    rows = rows.filter(r => String(r.status || '').toLowerCase() === st);
  }
  return rows.slice(0, lim);
}

/* 工具定义（OpenAI / DeepSeek 兼容格式） */
const TOOLS = [{
  type: 'function',
  function: {
    name: 'query_module',
    description:
      '查询 PMApp 系统内部某个模块的真实数据。你【只能】用此工具取得的数据回答，严禁编造。' +
      '模块清单：' + MODULE_KEYS.map(k => `${k}（${MODULES_INFO[k]}）`).join('；'),
    parameters: {
      type: 'object',
      properties: {
        module: { type: 'string', enum: MODULE_KEYS, description: '要查询的模块名' },
        keyword: { type: 'string', description: '可选，按关键词在该模块所有记录中模糊搜索（如客户名、项目名、物料名）' },
        status: { type: 'string', description: '可选，按状态过滤（如 planning/active/open/closed/done/shipped 等，依模块而定）' },
        limit: { type: 'number', description: '返回条数上限，默认 20，最大 50' },
      },
      required: ['module'],
    },
  },
}];

const SYSTEM_PROMPT = `你是 PMApp 海外生产管理系统的 AI 助理「智能海外助理」。
职责：帮助领导与员工快速找到系统内的资料，回答关于生产计划、品质、客验、出货、问题、项目、物料、市场等方面的问题。
铁律：
1. 你【只能】依据通过 query_module 工具查询到的真实数据来回答，严禁编造任何系统中不存在的信息。
2. 如果系统中没有相关数据，诚实告知「系统中暂未找到相关资料」，不要猜测或捏造。
3. 可多次调用 query_module 查询不同模块，再综合回答。
4. 回答时使用与用户提问相同的语言（中文问→中文答，英文问→英文答，越南文问→越南文答）。
5. 回答要简洁、条理清晰，必要时用列表或要点呈现；可引用具体数字、日期、负责人。
6. 你不知道也无法修改登录账号、密码等敏感凭证，也不执行任何删除/修改操作。
7. 若用户问的内容超出了上述模块范围，说明你只能协助查询系统内的资料。`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 字段必填且非空' });
    }
    if (!LLM_API_KEY) {
      return res.status(500).json({ error: '后端未配置 LLM_API_KEY，请在环境变量中设置 DeepSeek API key（见 .env.example）。' });
    }
    const chatMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
    let finalText = '';
    let loop = 0;
    while (loop < 6) {
      loop++;
      const completion = await openai.chat.completions.create({
        model: LLM_MODEL,
        messages: chatMessages,
        tools: TOOLS,
        tool_choice: 'auto',
      });
      const msg = completion.choices[0].message;
      // 没有工具调用 → 这是最终回答
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalText = msg.content || '';
        break;
      }
      // 把 assistant（含 tool_calls）追加，并逐个执行工具
      chatMessages.push(msg);
      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
        let result;
        try {
          result = await queryModule(args.module, args.keyword, args.status, args.limit || 20);
        } catch (e) {
          result = { error: String(e.message || e) };
        }
        chatMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result).slice(0, 9000),
        });
      }
    }
    res.json({ reply: finalText || '（未能生成回答，请重试）' });
  } catch (e) {
    console.error('[CHAT ERROR]', e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

/* 健康检查 */
app.get('/api/health', (req, res) => res.json({ ok: true, model: LLM_MODEL, modules: MODULE_KEYS.length }));
app.get('/', (req, res) => {
  res.type('html').send(`<pre style="font-family:monospace;padding:20px">PMApp AI backend is running.
POST /api/chat   body: {"messages":[{"role":"user","content":"越南工厂本周有哪些延误的生产子计划？"}]}
GET  /api/health  status check</pre>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PMApp AI backend listening on :${PORT} (model=${LLM_MODEL})`));
