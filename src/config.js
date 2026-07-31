/* ═══ Configuration & Constants ═══ */
export const SUPABASE_URL = 'https://nsnmtkukxquhinlmbejg.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_YB5z3cQK-vCg67--oKpSrg_63STgMJW';
export const APP_VERSION = 'v3.5.0';

export const STAGE_PROGRESS = { NPI: 10, EVT: 25, DVT: 50, PVT: 75, MP: 100, completed: 100 };

export const USER_MAP = {
  'admin': { name: '陈邦杰', dept: '管理员' },
  'admin2': { name: 'Imran Ahmed', dept: '管理员' },
  'leader1': { name: '镇炎总', dept: 'PMC' },
  'leader2': { name: '宋总', dept: '制造中心' },
  'leader3': { name: '朱总', dept: '总裁办' },
  'leader4': { name: '陈科', dept: '开发中心' },
  'leader5': { name: '张云峰', dept: '独立品牌' },
  'leader6': { name: 'Jack', dept: '业务' },
  'leader7': { name: 'Hedy', dept: '独立品牌' },
  'leader8': { name: 'Lucky', dept: '业务' },
  'leader9': { name: '蒋思贵', dept: 'PMC' },
  'leader10': { name: '任森林', dept: '品质' },
  'leader11': { name: '陈晓斌', dept: '品质' },
  'leader12': { name: '侯小飞', dept: '工程' },
  'leader13': { name: '曾长游', dept: 'NPI' },
  'leader14': { name: '方超', dept: '项目' },
  'leader15': { name: '兰健美', dept: '采购' },
  'leader16': { name: 'Tina', dept: '采购' },
  'leader17': { name: '兰启高', dept: '采购' },
  'leader18': { name: '杨芳万', dept: '工程' },
  'leader19': { name: '何东华', dept: '工程' },
  'leader20': { name: '胡冠', dept: '项目' },
  'leader21': { name: '张丽君', dept: '项目' },
  'leader22': { name: '田宏', dept: '项目' },
  'leader23': { name: '曹滂展', dept: '项目' },
  'leader24': { name: '蒋孝文', dept: '独立品牌' },
  'leader25': { name: '胡彩莲', dept: '销售' },
  'leader26': { name: '刘思雨', dept: '项目' },
  'leader27': { name: '杜为良', dept: '品质' },
  'leader28': { name: '黄军', dept: '品质' },
  'leader29': { name: '刁青春', dept: '人事' },
  'leader30': { name: '李双', dept: '广西运营' },
  'admin3': { name: '殷鹏飞', dept: 'IT' },
  'admin4': { name: '朱炳兴', dept: 'IT' },
};

export const MODULES = {
  projects: {
    title: '项目', icon: '📦', table: 'projects',
    listFields: [{key:'name',label:'项目名称'},{key:'status',label:'状态',badge:true},{key:'customer_name_zh',label:'客户'},{key:'product_model',label:'型号'},{key:'quantity',label:'数量'},{key:'delivery_date',label:'交期'}],
    detailFields: [{key:'name',label:'项目名称'},{key:'description',label:'描述'},{key:'status',label:'状态'},{key:'stage',label:'阶段'},{key:'order_no',label:'订单号'},{key:'customer_name_zh',label:'客户(中)'},{key:'customer_name_en',label:'客户(英)'},{key:'product_model',label:'产品型号'},{key:'quantity',label:'数量'},{key:'start_date',label:'开始日期'},{key:'end_date',label:'结束日期'},{key:'delivery_date',label:'交货日期'},{key:'pmo',label:'PMO'},{key:'npm',label:'NPM'},{key:'remarks',label:'备注'}],
    editFields: [{key:'name',label:'项目名称',type:'text',required:true},{key:'description',label:'描述',type:'textarea'},{key:'status',label:'状态',type:'select',options:[{v:'planning',t:'规划中'},{v:'active',t:'进行中'},{v:'on_hold',t:'暂停'},{v:'completed',t:'已完成'},{v:'cancelled',t:'已取消'}]},{key:'stage',label:'阶段',type:'select',options:[{v:'NPI',t:'NPI'},{v:'EVT',t:'EVT'},{v:'DVT',t:'DVT'},{v:'PVT',t:'PVT'},{v:'MP',t:'量产'}]},{key:'order_no',label:'订单号',type:'text'},{key:'customer_name_zh',label:'客户(中)',type:'text'},{key:'customer_name_en',label:'客户(英)',type:'text'},{key:'product_model',label:'产品型号',type:'text'},{key:'quantity',label:'数量',type:'number'},{key:'start_date',label:'开始日期',type:'date'},{key:'end_date',label:'结束日期',type:'date'},{key:'delivery_date',label:'交货日期',type:'date'},{key:'pmo',label:'PMO',type:'text'},{key:'npm',label:'NPM',type:'text'},{key:'remarks',label:'备注',type:'textarea'}],
  },
  issues: {
    title: '问题', icon: '⚠️', table: 'issues',
    listFields: [{key:'title',label:'标题'},{key:'severity',label:'严重度',badge:true},{key:'status',label:'状态',badge:true},{key:'issue_type',label:'类型'},{key:'reported_by',label:'报告人'},{key:'created_at',label:'创建时间'}],
    detailFields: [{key:'title',label:'标题'},{key:'description',label:'描述'},{key:'severity',label:'严重度'},{key:'status',label:'状态'},{key:'issue_type',label:'类型'},{key:'workflow_status',label:'工作流状态'},{key:'reported_by',label:'报告人'},{key:'assigned_to',label:'负责人'},{key:'solution_short',label:'短期对策'},{key:'solution_long',label:'长期对策'},{key:'plan_date',label:'计划解决日期'},{key:'due_date',label:'截止日期'},{key:'priority_score',label:'优先级'},{key:'created_at',label:'创建时间'}],
    editFields: [{key:'title',label:'标题',type:'text',required:true},{key:'description',label:'描述',type:'textarea'},{key:'severity',label:'严重度',type:'select',options:[{v:'low',t:'低'},{v:'medium',t:'中'},{v:'high',t:'高'},{v:'critical',t:'严重'}]},{key:'status',label:'状态',type:'select',options:[{v:'open',t:'待处理'},{v:'assigned',t:'已指派'},{v:'analyzing',t:'分析中'},{v:'fixing',t:'修复中'},{v:'verifying',t:'验证中'},{v:'closed',t:'已关闭'}]},{key:'issue_type',label:'类型',type:'select',options:[{v:'quality',t:'质量'},{v:'production',t:'生产'},{v:'supply',t:'供应链'},{v:'design',t:'设计'},{v:'inspection',t:'检验'},{v:'other',t:'其他'}]},{key:'assigned_to',label:'负责人',type:'text'},{key:'solution_short',label:'短期对策',type:'textarea'},{key:'solution_long',label:'长期对策',type:'textarea'},{key:'plan_date',label:'计划解决日期',type:'date'},{key:'due_date',label:'截止日期',type:'date'},{key:'priority_score',label:'优先级(1-10)',type:'number'}],
  },
  engineering: {
    title: '工程问题', icon: '🔧', table: 'engineering',
    listFields: [{key:'title',label:'标题'},{key:'severity',label:'严重度',badge:true},{key:'status',label:'状态',badge:true},{key:'issue_type',label:'类型'},{key:'reported_by',label:'报告人'},{key:'created_at',label:'创建时间'}],
    detailFields: [{key:'title',label:'标题'},{key:'description',label:'描述'},{key:'severity',label:'严重度'},{key:'status',label:'状态'},{key:'issue_type',label:'类型'},{key:'workflow_status',label:'工作流状态'},{key:'reported_by',label:'报告人'},{key:'assigned_to',label:'负责人'},{key:'solution_short',label:'短期对策'},{key:'solution_long',label:'长期对策'},{key:'plan_date',label:'计划解决日期'},{key:'due_date',label:'截止日期'},{key:'priority_score',label:'优先级'},{key:'created_at',label:'创建时间'}],
    editFields: [{key:'title',label:'标题',type:'text',required:true},{key:'description',label:'描述',type:'textarea'},{key:'severity',label:'严重度',type:'select',options:[{v:'low',t:'低'},{v:'medium',t:'中'},{v:'high',t:'高'},{v:'critical',t:'严重'}]},{key:'status',label:'状态',type:'select',options:[{v:'open',t:'待处理'},{v:'assigned',t:'已指派'},{v:'analyzing',t:'分析中'},{v:'fixing',t:'修复中'},{v:'verifying',t:'验证中'},{v:'closed',t:'已关闭'}]},{key:'issue_type',label:'类型',type:'select',options:[{v:'quality',t:'质量'},{v:'production',t:'生产'},{v:'supply',t:'供应链'},{v:'design',t:'设计'},{v:'inspection',t:'检验'},{v:'other',t:'其他'}]},{key:'assigned_to',label:'负责人',type:'text'},{key:'solution_short',label:'短期对策',type:'textarea'},{key:'solution_long',label:'长期对策',type:'textarea'},{key:'plan_date',label:'计划解决日期',type:'date'},{key:'due_date',label:'截止日期'},{key:'priority_score',label:'优先级(1-10)',type:'number'}],
  },
  factory_process: {
    title: 'EMS制程问题', icon: '🏭', table: 'factory_process',
    listFields: [{key:'title',label:'标题'},{key:'severity',label:'严重度',badge:true},{key:'status',label:'状态',badge:true},{key:'issue_type',label:'类型'},{key:'reported_by',label:'报告人'},{key:'created_at',label:'创建时间'}],
    detailFields: [{key:'title',label:'标题'},{key:'description',label:'描述'},{key:'severity',label:'严重度'},{key:'status',label:'状态'},{key:'issue_type',label:'类型'},{key:'workflow_status',label:'工作流状态'},{key:'reported_by',label:'报告人'},{key:'assigned_to',label:'负责人'},{key:'solution_short',label:'短期对策'},{key:'solution_long',label:'长期对策'},{key:'plan_date',label:'计划解决日期'},{key:'due_date',label:'截止日期'},{key:'priority_score',label:'优先级'},{key:'created_at',label:'创建时间'}],
    editFields: [{key:'title',label:'标题',type:'text',required:true},{key:'description',label:'描述',type:'textarea'},{key:'severity',label:'严重度',type:'select',options:[{v:'low',t:'低'},{v:'medium',t:'中'},{v:'high',t:'高'},{v:'critical',t:'严重'}]},{key:'status',label:'状态',type:'select',options:[{v:'open',t:'待处理'},{v:'assigned',t:'已指派'},{v:'analyzing',t:'分析中'},{v:'fixing',t:'修复中'},{v:'verifying',t:'验证中'},{v:'closed',t:'已关闭'}]},{key:'issue_type',label:'类型',type:'select',options:[{v:'quality',t:'质量'},{v:'production',t:'生产'},{v:'supply',t:'供应链'},{v:'design',t:'设计'},{v:'inspection',t:'检验'},{v:'other',t:'其他'}]},{key:'assigned_to',label:'负责人',type:'text'},{key:'solution_short',label:'短期对策',type:'textarea'},{key:'solution_long',label:'长期对策',type:'textarea'},{key:'plan_date',label:'计划解决日期',type:'date'},{key:'due_date',label:'截止日期'},{key:'priority_score',label:'优先级(1-10)',type:'number'}],
  },
  tasks: {
    title: '任务', icon: '📋', table: 'tasks',
    listFields: [{key:'title',label:'标题'},{key:'status',label:'状态',badge:true},{key:'priority',label:'优先级',badge:true},{key:'assignee',label:'负责人'},{key:'due_date',label:'截止日期'}],
    detailFields: [{key:'title',label:'标题'},{key:'description',label:'描述'},{key:'status',label:'状态'},{key:'priority',label:'优先级'},{key:'assignee',label:'负责人'},{key:'start_date',label:'开始日期'},{key:'due_date',label:'截止日期'},{key:'estimated_hours',label:'预估工时'},{key:'actual_hours',label:'实际工时'}],
    editFields: [{key:'title',label:'标题',type:'text',required:true},{key:'description',label:'描述',type:'textarea'},{key:'status',label:'状态',type:'select',options:[{v:'todo',t:'待办'},{v:'in_progress',t:'进行中'},{v:'review',t:'审核中'},{v:'done',t:'已完成'}]},{key:'priority',label:'优先级',type:'select',options:[{v:'low',t:'低'},{v:'medium',t:'中'},{v:'high',t:'高'},{v:'urgent',t:'紧急'}]},{key:'assignee',label:'负责人',type:'text'},{key:'start_date',label:'开始日期',type:'date'},{key:'due_date',label:'截止日期',type:'date'},{key:'estimated_hours',label:'预估工时',type:'number'}],
  },
  factory_info: {
    title: '工厂信息', icon: '🏭', table: 'factory_info',
    listFields: [{key:'factory_name',label:'工厂名称'},{key:'region',label:'区域'},{key:'country',label:'国家'},{key:'pm',label:'项目经理'}],
    detailFields: [{key:'factory_name',label:'工厂名称'},{key:'region',label:'区域'},{key:'country',label:'国家'},{key:'client_project_code',label:'客户项目代码'},{key:'factory_project_code',label:'工厂项目代码'},{key:'pm',label:'项目经理'},{key:'pe',label:'产品工程师'},{key:'te',label:'测试工程师'},{key:'me',label:'制造工程师'},{key:'ee',label:'电气工程师'},{key:'quality',label:'质量工程师'},{key:'daily_production_report',label:'日报链接'},{key:'daily_problem_management',label:'问题管理链接'}],
    editFields: [{key:'factory_name',label:'工厂名称',type:'text',required:true},{key:'region',label:'区域',type:'text'},{key:'country',label:'国家',type:'text'},{key:'client_project_code',label:'客户项目代码',type:'text'},{key:'factory_project_code',label:'工厂项目代码',type:'text'},{key:'pm',label:'项目经理',type:'text'},{key:'pe',label:'产品工程师',type:'text'},{key:'te',label:'测试工程师',type:'text'},{key:'me',label:'制造工程师',type:'text'},{key:'ee',label:'电气工程师',type:'text'},{key:'quality',label:'质量工程师',type:'text'},{key:'daily_production_report',label:'日报链接',type:'text'},{key:'daily_problem_management',label:'问题管理链接',type:'text'}],
  },
  todos: {
    title: '生产计划（子计划）', icon: '✅', table: 'todos',
    listFields: [{key:'content',label:'任务'},{key:'parent_plan',label:'主计划'},{key:'due_date',label:'完成时间'},{key:'done',label:'完成',toggle:true}],
    detailFields: [{key:'content',label:'任务'},{key:'parent_plan',label:'主计划'},{key:'due_date',label:'完成时间'},{key:'done',label:'完成'}],
    editFields: [{key:'content',label:'任务',type:'text',required:true},{key:'parent_plan',label:'主计划',type:'text'},{key:'due_date',label:'完成时间',type:'date'},{key:'done',label:'完成',type:'text'}],
  },
  shipping_plans: {
    title: '出货计划', icon: '🚢', table: 'shipping_plans',
    listFields: [{key:'plan_no',label:'计划编号'},{key:'status',label:'状态',badge:true},{key:'destination',label:'目的地'},{key:'planned_ship_date',label:'计划出货日'},{key:'total_boxes',label:'箱数'}],
    detailFields: [{key:'plan_no',label:'计划编号'},{key:'status',label:'状态'},{key:'shipping_method',label:'运输方式'},{key:'destination',label:'目的地'},{key:'planned_ship_date',label:'计划出货日'},{key:'actual_ship_date',label:'实际出货日'},{key:'total_boxes',label:'总箱数'},{key:'total_pallets',label:'总栈板数'},{key:'total_weight',label:'总重量(kg)'},{key:'tracking_no',label:'追踪号'}],
    editFields: [{key:'plan_no',label:'计划编号',type:'text',required:true},{key:'status',label:'状态',type:'select',options:[{v:'planned',t:'已计划'},{v:'preparing',t:'准备中'},{v:'packaged',t:'已包装'},{v:'inspected',t:'已检验'},{v:'shipped',t:'已出货'}]},{key:'shipping_method',label:'运输方式',type:'select',options:[{v:'sea',t:'海运'},{v:'air',t:'空运'},{v:'land',t:'陆运'}]},{key:'destination',label:'目的地',type:'text'},{key:'planned_ship_date',label:'计划出货日',type:'date'},{key:'actual_ship_date',label:'实际出货日',type:'date'},{key:'total_boxes',label:'总箱数',type:'number'},{key:'total_pallets',label:'总栈板数',type:'number'},{key:'total_weight',label:'总重量(kg)',type:'number'},{key:'tracking_no',label:'追踪号',type:'text'}],
  },
  market_reports: {
    title: '市场报告', icon: '📊', table: 'market_reports',
    listFields: [{key:'report_date',label:'报告日期'},{key:'report_content',label:'内容摘要',truncate:60}],
    detailFields: [{key:'report_date',label:'报告日期'},{key:'report_content',label:'报告内容'},{key:'market_data',label:'市场数据'},{key:'brand_data',label:'品牌数据'},{key:'price_data',label:'价格数据'}],
    editFields: [{key:'report_date',label:'报告日期',type:'date',required:true},{key:'report_content',label:'报告内容',type:'textarea'},{key:'market_data',label:'市场数据',type:'textarea'},{key:'brand_data',label:'品牌数据',type:'textarea'},{key:'price_data',label:'价格数据',type:'textarea'}],
  },
  ai_industry_news: {
    title: '行业新闻', icon: '📰', table: 'ai_industry_news',
    listFields: [{key:'news_date',label:'日期'},{key:'title',label:'标题'},{key:'importance',label:'重要性',badge:true},{key:'source',label:'来源'}],
    detailFields: [{key:'news_date',label:'日期'},{key:'title',label:'标题'},{key:'summary',label:'摘要'},{key:'source',label:'来源'},{key:'url',label:'链接'},{key:'importance',label:'重要性'}],
    editFields: [{key:'news_date',label:'日期',type:'date',required:true},{key:'title',label:'标题',type:'text',required:true},{key:'summary',label:'摘要',type:'textarea'},{key:'source',label:'来源',type:'text'},{key:'url',label:'链接',type:'text'},{key:'importance',label:'重要性',type:'select',options:[{v:'low',t:'低'},{v:'medium',t:'中'},{v:'high',t:'高'},{v:'critical',t:'重要'}]}],
  },
  overseas_material_alerts: {
    title: '物料预警', icon: '🔔', table: 'overseas_material_alerts',
    listFields: [{key:'rule_name',label:'规则名称'},{key:'threshold_value',label:'阈值'},{key:'is_enabled',label:'启用',toggle:true},{key:'last_check',label:'最后检查'}],
    detailFields: [{key:'rule_name',label:'规则名称'},{key:'threshold_value',label:'阈值'},{key:'is_enabled',label:'启用状态'},{key:'last_check',label:'最后检查时间'}],
    editFields: [{key:'rule_name',label:'规则名称',type:'text',required:true},{key:'threshold_value',label:'阈值',type:'text'},{key:'is_enabled',label:'启用',type:'toggle'}],
  },
  users: {
    title: '用户', icon: '👤', table: 'users',
    listFields: [{key:'username',label:'用户名'},{key:'display_name',label:'姓名'},{key:'position',label:'职位'},{key:'status',label:'状态',badge:true}],
    detailFields: [{key:'username',label:'用户名'},{key:'display_name',label:'姓名'},{key:'email',label:'邮箱'},{key:'phone',label:'电话'},{key:'position',label:'职位'},{key:'status',label:'状态'},{key:'last_login',label:'最后登录'},{key:'login_count',label:'登录次数'}],
    editFields: [{key:'username',label:'用户名',type:'text',required:true},{key:'display_name',label:'姓名',type:'text'},{key:'email',label:'邮箱',type:'text'},{key:'phone',label:'电话',type:'text'},{key:'position',label:'职位',type:'text'},{key:'status',label:'状态',type:'select',options:[{v:'active',t:'启用'},{v:'inactive',t:'禁用'}]}],
  },
  inspection: {
    title: '客验', icon: '🔍', table: 'inspection',
    listFields: [{key:'unit',label:'客验单位'},{key:'item',label:'验货项目'},{key:'inspect_date',label:'验货时间'},{key:'qty',label:'验货数量'},{key:'order_no',label:'验货订单'}],
    detailFields: [{key:'unit',label:'客验单位'},{key:'item',label:'验货项目'},{key:'inspect_date',label:'验货时间'},{key:'qty',label:'验货数量'},{key:'order_no',label:'验货订单'}],
    editFields: [
      {key:'unit',label:'客验单位',type:'text'},
      {key:'item',label:'验货项目',type:'select',options:[{v:'外观',t:'外观检查'},{v:'功能',t:'功能测试'},{v:'包装',t:'包装检查'},{v:'尺寸',t:'尺寸测量'},{v:'性能',t:'性能测试'},{v:'抽样',t:'抽样检验'}]},
      {key:'inspect_date',label:'验货时间',type:'date'},
      {key:'qty',label:'验货数量',type:'number'},
      {key:'order_no',label:'验货订单',type:'text'},
    ],
  },
  rmd: {
    title: 'RMD', icon: '📑', table: 'rmd',
    listFields: [{key:'material_name',label:'物料名'},{key:'material_no',label:'物料编号'},{key:'qty',label:'数量'},{key:'sign_date',label:'签核时间'},{key:'factory',label:'工厂'}],
    detailFields: [{key:'country',label:'国家'},{key:'factory',label:'工厂'},{key:'sign_date',label:'签核时间'},{key:'project',label:'项目'},{key:'material_name',label:'物料名'},{key:'material_batch',label:'物料批次'},{key:'material_no',label:'物料编号'},{key:'qty',label:'数量'},{key:'internal_confirm',label:'内部确认'}],
    editFields: [
      {key:'country',label:'国家',type:'select',options:[{v:'越南',t:'越南'},{v:'印度',t:'印度'}]},
      {key:'factory',label:'工厂',type:'text'},
      {key:'sign_date',label:'签核时间',type:'date'},
      {key:'project',label:'项目',type:'text'},
      {key:'material_name',label:'物料名',type:'text',required:true},
      {key:'material_batch',label:'物料批次',type:'text'},
      {key:'material_no',label:'物料编号',type:'text'},
      {key:'qty',label:'数量',type:'number'},
      {key:'internal_confirm',label:'内部确认（部门/人名）',type:'text'},
    ],
  },
  doa: {
    title: 'DOA', icon: '⚠️', table: 'doa',
    listFields: [{key:'material_name',label:'物料名'},{key:'defect_qty',label:'不良数'},{key:'defect_rate',label:'不良率'},{key:'date',label:'日期'},{key:'factory',label:'工厂'}],
    detailFields: [
      {key:'date',label:'日期'},{key:'project',label:'项目'},{key:'factory',label:'工厂'},
      {key:'material_name',label:'物料名'},{key:'material_batch',label:'物料批次'},
      {key:'received_qty',label:'来料数量'},{key:'defect_qty',label:'不良数量'},{key:'defect_rate',label:'不良率(%)'},
      {key:'description',label:'不良描述'},{key:'internal_confirm',label:'签核'},
    ],
    editFields: [
      {key:'date',label:'日期',type:'date'},
      {key:'project',label:'项目',type:'text'},
      {key:'factory',label:'工厂',type:'text'},
      {key:'material_name',label:'物料名',type:'text',required:true},
      {key:'material_batch',label:'物料批次',type:'text'},
      {key:'received_qty',label:'来料数量',type:'number'},
      {key:'defect_qty',label:'不良数量',type:'number'},
      {key:'description',label:'不良描述',type:'textarea'},
      {key:'internal_confirm',label:'签核',type:'text'},
    ],
  },
  rma: {
    title: 'RMA', icon: '↩️', table: 'rma',
    listFields: [{key:'project',label:'项目'},{key:'return_qty',label:'退货数'},{key:'status',label:'状态'},{key:'date',label:'日期'},{key:'customer',label:'客户'}],
    detailFields: [
      {key:'date',label:'日期'},{key:'project',label:'项目'},{key:'customer',label:'客户'},
      {key:'return_qty',label:'退货数量'},{key:'reason',label:'退货原因'},
      {key:'status',label:'处理状态'},{key:'description',label:'描述'},
    ],
    editFields: [
      {key:'date',label:'日期',type:'date'},
      {key:'project',label:'项目',type:'text'},
      {key:'customer',label:'客户',type:'text'},
      {key:'return_qty',label:'退货数量',type:'number'},
      {key:'reason',label:'退货原因',type:'textarea'},
      {key:'status',label:'处理状态',type:'select',options:[{v:'待处理',t:'待处理'},{v:'维修中',t:'维修中'},{v:'已关闭',t:'已关闭'}]},
      {key:'description',label:'描述',type:'textarea'},
    ],
  },
  field_log: {
    title: '现场记录', icon: '📸', table: 'field_log',
    listFields: [{key:'project',label:'生产项目'},{key:'problem_factory',label:'问题发生工厂'},{key:'description',label:'问题叙述',truncate:40},{key:'created_at',label:'记录时间'},{key:'status',label:'状态',badge:true}],
    detailFields: [{key:'project',label:'生产项目'},{key:'problem_factory',label:'问题发生工厂'},{key:'description',label:'生产问题叙述'},{key:'status',label:'状态'},{key:'reporter',label:'记录人'},{key:'created_at',label:'记录时间'}],
  },
};

/* ═══ 模块级编辑权限 ═══
   admin（admin/admin2）始终拥有全部模块编辑权。
   其余用户默认只读；如需开放某模块的「新建/编辑」权限，
   在该模块键下填入其登录用户名即可。
   周/月报（reports）开放给所有人：REPORTS_ALL_USERS = true。 */
export const MODULE_PERMISSIONS = {
  // 临时基线（2026-07-31）：所有 leader 先恢复只读，待后续按需开放。
  // 周/月报（reports）对所有人开放由 REPORTS_ALL_USERS 控制，不在此列。
  overseas_material_alerts: [],   // 物料栏目（物料预警）→ 暂未开放
  issues: [],                    // 品质 → 暂未开放
  inspection: [],                // 品质（客验）→ 暂未开放
  doa: [],                       // DOA/RMA → 暂未开放
  rma: [],                       // DOA/RMA → 暂未开放
  engineering: [],               // 工程 → 暂未开放
  factory_process: [],           // EMS制程 → 暂未开放
};
export const REPORTS_ALL_USERS = true;     // 周/月报 → 所有人（含 leader）可生成/使用
