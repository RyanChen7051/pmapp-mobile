/* ═══════════════════════════════════════════════════════════════
 * PMApp 外部协作端框架
 *   同一份源码，构建期注入 __VARIANT__ → 产出 FPWA（工厂端）/ CPWA（客户端）
 *   VARIANT = 'factory'  : 合作工厂使用，按 factory_id 隔离
 *   VARIANT = 'customer' : 客户使用，按 customer_project_no 隔离
 * ═══════════════════════════════════════════════════════════════ */
import { SUPABASE_URL, SUPABASE_KEY } from '../src/env.js';

const VARIANT = __VARIANT__;          // esbuild --define 注入
const IS_FACTORY = VARIANT === 'factory';
const IS_CUSTOMER = VARIANT === 'customer';

/* ─────────── 端配置 ─────────── */
const CFG = {
  factory: __VARIANT__ === 'factory' ? {
    code: 'FPWA', appName: 'PMApp Factory', appNameEn: 'PMApp Factory',
    theme: '#1e6b3a', themeDark: '#155230', accentBg: '#eaf5ec',
    tagline: '合作工厂协同平台', taglineEn: 'Partner Factory Portal',
    roleLabel: '选择工厂', roleLabelEn: 'Select Factory',
    idKey: 'factory_id', idLabel: '工厂', accessCode: 'fpwa2026',
    sessionKey: 'pmapp_fpwa_session', reportTable: 'fpwa_report',
    idSource: 'factory_info', idValueKey: 'id', idTextKey: 'factory_name',
    hideFields: [],                                    // 工厂可见全部项目字段
  } : undefined,
  customer: __VARIANT__ === 'customer' ? {
    code: 'CPWA', appName: 'PMApp 客户中心', appNameEn: 'PMApp Customer Portal',
    theme: '#0e5a8a', themeDark: '#0a4370', accentBg: '#e8f2f9',
    tagline: '客户项目协同平台', taglineEn: 'Customer Project Portal',
    roleLabel: '选择客户', roleLabelEn: 'Select Customer',
    idKey: 'customer_id', idLabel: '客户', accessCode: 'cpwa2026',
    sessionKey: 'pmapp_cpwa_session', reportTable: 'cpwa_feedback',
    // 客户身份取自「客户基础资料」(customer_info)，以 客户代码(code) 为唯一标识
    idSource: 'customer_info', idValueKey: 'code', idTextKey: 'customer_name',
    hideFields: ['factory_id', 'production_factory'],   // 客户不可见工厂信息
  } : undefined,
}[VARIANT];

const STAGE_PROGRESS = { NPI: 10, EVT: 25, DVT: 50, PVT: 75, MP: 100, completed: 100 };
const STAGES = ['NPI', 'EVT', 'DVT', 'PVT', 'MP'];

/* ─────────── 9 语言清单（与完整版 PWA 对齐）─────────── */
const LANGUAGES = {
  zh: { name: '中文', flag: '🇨🇳', rtl: false },
  en: { name: 'English', flag: '🇬🇧', rtl: false },
  es: { name: 'Español', flag: '🇪🇸', rtl: false },
  ja: { name: '日本語', flag: '🇯🇵', rtl: false },
  fr: { name: 'Français', flag: '🇫🇷', rtl: false },
  de: { name: 'Deutsch', flag: '🇩🇪', rtl: false },
  ar: { name: 'العربية', flag: '🇸🇦', rtl: true },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳', rtl: false },
  hi: { name: 'हिन्दी', flag: '🇮🇳', rtl: false },
};

/* ─────────── i18n（中 / 英；后续可扩越南语等）─────────── */
const I18N = {
  zh: {
    login: '登录', selectRole: CFG.roleLabel, accessCode: '访问码', enter: '进入',
    custAccount: '客户账号', custCode: '客户代码', password: '密码', errLogin: '账号、代码或密码错误',
    errLoginF: '账号、工厂代码或密码错误',
    errLoginA: '账号或密码错误',
    loginAccount: '登录账号', factoryCode: '工厂代码',
    myProjects: '我的项目', noProject: '暂无项目', loading: '加载中…',
    stage: '阶段', progress: '项目进度', custNo: '客户项目号', factoryNo: '工厂项目号',
    submit: '提交', cancel: '取消', remark: '备注', qty: '数量', date: '日期',
    reportTitle: IS_FACTORY ? '上报生产进度' : '提交反馈',
    myRecords: IS_FACTORY ? '我的上报记录' : '我的反馈记录',
    noRecord: '暂无记录', logout: '退出登录', settings: '设定', language: '语言',
    detail: '项目详情', submitted: '提交成功', errCode: '访问码错误',
    errNet: '网络异常，请重试', errSelect: '请先选择' + CFG.idLabel,
    allFields: '全部信息', refresh: '刷新', ok: '成功',
    problems: '问题记录', noProblem: '暂无相关问题记录', submitComplaint: '提交客诉',
    complaintCat: '问题类别', complaintProject: '关联项目', complaintDesc: '问题描述',
    commentPlaceholder: '写留言…', cmtTitle: '留言板', custComplaint: '客户投诉', intIssue: '内部问题',
    appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp 客户中心',
    tagline: IS_FACTORY ? '合作工厂协同平台' : '客户项目协同平台',
    extPortal: '外部协作端',
    lblCat: '类',
    lblTitle: '题',
    lblLevel: '级',
    notSelected: '（未选）',
    catProd: '生产',
    catEng: '工程',
    catProc: '制程',
    catQual: '品质',
    descPlaceholder: '请描述您遇到的问题…',
  },
  en: {
    login: 'Sign In', selectRole: CFG.roleLabelEn, accessCode: 'Access Code', enter: 'Enter',
    custAccount: 'Customer Account', custCode: 'Customer Code', password: 'Password', errLogin: 'Invalid account, code or password',
    errLoginF: 'Invalid account, factory code or password',
    errLoginA: 'Invalid account or password',
    loginAccount: 'Login Account', factoryCode: 'Factory Code',
    myProjects: 'My Projects', noProject: 'No projects yet', loading: 'Loading…',
    stage: 'Stage', progress: 'Progress', custNo: 'Customer Program', factoryNo: 'Factory P/N',
    submit: 'Submit', cancel: 'Cancel', remark: 'Remarks', qty: 'Quantity', date: 'Date',
    reportTitle: IS_FACTORY ? 'Report Production' : 'Submit Feedback',
    myRecords: IS_FACTORY ? 'My Reports' : 'My Feedback',
    noRecord: 'No records', logout: 'Sign Out', settings: 'Settings', language: 'Language',
    detail: 'Project Detail', submitted: 'Submitted', errCode: 'Invalid access code',
    errNet: 'Network error, please retry', errSelect: 'Please select ' + CFG.idLabel,
    allFields: 'Full Information', refresh: 'Refresh', ok: 'OK',
    problems: 'Issues', noProblem: 'No related issues', submitComplaint: 'Submit Complaint',
    complaintCat: 'Category', complaintProject: 'Project', complaintDesc: 'Description',
    commentPlaceholder: 'Write a comment…', cmtTitle: 'Comments', custComplaint: 'Customer Complaint', intIssue: 'Internal Issue',
    appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp Customer Portal',
    tagline: IS_FACTORY ? 'Partner Factory Portal' : 'Customer Project Portal',
    extPortal: 'External Portal',
    lblCat: 'Cat',
    lblTitle: 'Title',
    lblLevel: 'Level',
    notSelected: '(Not selected)',
    catProd: 'Production',
    catEng: 'Engineering',
    catProc: 'Process',
    catQual: 'Quality',
    descPlaceholder: 'Describe the issue…',
  },
};
/* ─────────── 7 种扩展语言（真实翻译，非英文占位）─────────── */
I18N.es = {
  login: 'Iniciar sesión',
  selectRole: IS_FACTORY ? 'Seleccionar fábrica' : 'Seleccionar cliente',
  accessCode: 'Código de acceso', enter: 'Entrar',
  custAccount: 'Cuenta de cliente', custCode: 'Código de cliente', password: 'Contraseña',
  errLogin: 'Cuenta, código o contraseña incorrectos',
  errLoginF: 'Cuenta, código de fábrica o contraseña incorrectos',
  errLoginA: 'Cuenta o contraseña incorrectos',
  loginAccount: 'Cuenta de acceso', factoryCode: 'Código de fábrica',
  myProjects: 'Mis proyectos', noProject: 'Sin proyectos', loading: 'Cargando…',
  stage: 'Etapa', progress: 'Progreso del proyecto', custNo: 'Proyecto del cliente', factoryNo: 'N.º de fábrica',
  submit: 'Enviar', cancel: 'Cancelar', remark: 'Nota', qty: 'Cantidad', date: 'Fecha',
  reportTitle: IS_FACTORY ? 'Reportar progreso' : 'Enviar comentarios',
  myRecords: IS_FACTORY ? 'Mis reportes' : 'Mis comentarios',
  noRecord: 'Sin registros', logout: 'Cerrar sesión', settings: 'Ajustes', language: 'Idioma',
  detail: 'Detalle del proyecto', submitted: 'Enviado', errCode: 'Código de acceso incorrecto',
  errNet: 'Error de red, inténtelo de nuevo',
  errSelect: IS_FACTORY ? 'Seleccione la fábrica' : 'Seleccione el cliente',
  allFields: 'Información completa', refresh: 'Actualizar', ok: 'Hecho',
  problems: 'Problemas', noProblem: 'Sin problemas relacionados', submitComplaint: 'Enviar queja',
  complaintCat: 'Categoría', complaintProject: 'Proyecto', complaintDesc: 'Descripción',
  commentPlaceholder: 'Escriba un comentario…', cmtTitle: 'Comentarios',
  custComplaint: 'Queja del cliente', intIssue: 'Problema interno',
  appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp Customer Portal',
  tagline: IS_FACTORY ? 'Portal de fábrica asociada' : 'Portal de proyectos de clientes',
  extPortal: 'Portal externo',
  lblCat: 'Cat.',
  lblTitle: 'Título',
  lblLevel: 'Nivel',
  notSelected: '(Sin seleccionar)',
  catProd: 'Producción',
  catEng: 'Ingeniería',
  catProc: 'Proceso',
  catQual: 'Calidad',
  descPlaceholder: 'Describa el problema…',
};
I18N.ja = {
  login: 'ログイン',
  selectRole: IS_FACTORY ? '工場を選択' : '顧客を選択',
  accessCode: 'アクセスコード', enter: '入室',
  custAccount: '顧客アカウント', custCode: '顧客コード', password: 'パスワード',
  errLogin: 'アカウント、コード、またはパスワードが正しくありません',
  errLoginF: 'アカウント、工場コード、またはパスワードが正しくありません',
  errLoginA: 'アカウントまたはパスワードが正しくありません',
  loginAccount: 'ログインアカウント', factoryCode: '工場コード',
  myProjects: 'マイプロジェクト', noProject: 'プロジェクトはありません', loading: '読み込み中…',
  stage: '段階', progress: 'プロジェクト進捗', custNo: '顧客プロジェクト番号', factoryNo: '工場品番',
  submit: '送信', cancel: 'キャンセル', remark: '備考', qty: '数量', date: '日付',
  reportTitle: IS_FACTORY ? '生産進捗を報告' : 'フィードバックを送信',
  myRecords: IS_FACTORY ? 'マイ報告' : 'マイフィードバック',
  noRecord: '記録はありません', logout: 'ログアウト', settings: '設定', language: '言語',
  detail: 'プロジェクト詳細', submitted: '送信しました', errCode: 'アクセスコードが正しくありません',
  errNet: 'ネットワークエラー、再試行してください',
  errSelect: IS_FACTORY ? '工場を選択してください' : '顧客を選択してください',
  allFields: 'すべての情報', refresh: '更新', ok: '完了',
  problems: '問題記録', noProblem: '関連する問題はありません', submitComplaint: '苦情を送信',
  complaintCat: 'カテゴリ', complaintProject: '関連プロジェクト', complaintDesc: '説明',
  commentPlaceholder: 'コメントを入力…', cmtTitle: 'コメント',
  custComplaint: '顧客クレーム', intIssue: '内部問題',
  appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp 顧客ポータル',
  tagline: IS_FACTORY ? '協力工場ポータル' : '顧客プロジェクトポータル',
  extPortal: '外部連携ポータル',
  lblCat: '分類',
  lblTitle: '件名',
  lblLevel: 'レベル',
  notSelected: '（未選択）',
  catProd: '生産',
  catEng: 'エンジニアリング',
  catProc: '工程',
  catQual: '品質',
  descPlaceholder: '問題を記述してください…',
};
I18N.fr = {
  login: 'Connexion',
  selectRole: IS_FACTORY ? 'Choisir l\'usine' : 'Choisir le client',
  accessCode: 'Code d\'accès', enter: 'Entrer',
  custAccount: 'Compte client', custCode: 'Code client', password: 'Mot de passe',
  errLogin: 'Compte, code ou mot de passe incorrect',
  errLoginF: 'Compte, code usine ou mot de passe incorrect',
  errLoginA: 'Compte ou mot de passe incorrect',
  loginAccount: 'Compte de connexion', factoryCode: 'Code usine',
  myProjects: 'Mes projets', noProject: 'Aucun projet', loading: 'Chargement…',
  stage: 'Étape', progress: 'Avancement du projet', custNo: 'Projet client', factoryNo: 'N° d\'usine',
  submit: 'Envoyer', cancel: 'Annuler', remark: 'Remarque', qty: 'Quantité', date: 'Date',
  reportTitle: IS_FACTORY ? 'Rapporter l\'avancement' : 'Envoyer un commentaire',
  myRecords: IS_FACTORY ? 'Mes rapports' : 'Mes commentaires',
  noRecord: 'Aucun enregistrement', logout: 'Déconnexion', settings: 'Paramètres', language: 'Langue',
  detail: 'Détail du projet', submitted: 'Envoyé', errCode: 'Code d\'accès incorrect',
  errNet: 'Erreur réseau, réessayez',
  errSelect: IS_FACTORY ? 'Veuillez sélectionner l\'usine' : 'Veuillez sélectionner le client',
  allFields: 'Informations complètes', refresh: 'Actualiser', ok: 'OK',
  problems: 'Problèmes', noProblem: 'Aucun problème associé', submitComplaint: 'Envoyer une réclamation',
  complaintCat: 'Catégorie', complaintProject: 'Projet associé', complaintDesc: 'Description',
  commentPlaceholder: 'Écrivez un commentaire…', cmtTitle: 'Commentaires',
  custComplaint: 'Réclamation client', intIssue: 'Problème interne',
  appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp Customer Portal',
  tagline: IS_FACTORY ? 'Portail des usines partenaires' : 'Portail des projets clients',
  extPortal: 'Portail externe',
  lblCat: 'Cat.',
  lblTitle: 'Titre',
  lblLevel: 'Niveau',
  notSelected: '(Non sélectionné)',
  catProd: 'Production',
  catEng: 'Ingénierie',
  catProc: 'Processus',
  catQual: 'Qualité',
  descPlaceholder: 'Décrivez le problème…',
};
I18N.de = {
  login: 'Anmelden',
  selectRole: IS_FACTORY ? 'Werk auswählen' : 'Kunde auswählen',
  accessCode: 'Zugangscode', enter: 'Eintreten',
  custAccount: 'Kundenkonto', custCode: 'Kundencode', password: 'Passwort',
  errLogin: 'Konto, Code oder Passwort falsch',
  errLoginF: 'Konto, Werkscode oder Passwort falsch',
  errLoginA: 'Konto oder Passwort falsch',
  loginAccount: 'Anmeldekonto', factoryCode: 'Werkscode',
  myProjects: 'Meine Projekte', noProject: 'Keine Projekte', loading: 'Wird geladen…',
  stage: 'Phase', progress: 'Projektfortschritt', custNo: 'Kundenprojekt', factoryNo: 'Werks-Nr.',
  submit: 'Senden', cancel: 'Abbrechen', remark: 'Bemerkung', qty: 'Menge', date: 'Datum',
  reportTitle: IS_FACTORY ? 'Fortschritt melden' : 'Feedback senden',
  myRecords: IS_FACTORY ? 'Meine Berichte' : 'Mein Feedback',
  noRecord: 'Keine Einträge', logout: 'Abmelden', settings: 'Einstellungen', language: 'Sprache',
  detail: 'Projektdetails', submitted: 'Gesendet', errCode: 'Falscher Zugangscode',
  errNet: 'Netzwerkfehler, bitte erneut versuchen',
  errSelect: IS_FACTORY ? 'Bitte Werk auswählen' : 'Bitte Kunde auswählen',
  allFields: 'Alle Informationen', refresh: 'Aktualisieren', ok: 'OK',
  problems: 'Probleme', noProblem: 'Keine zugehörigen Probleme', submitComplaint: 'Beschwerde senden',
  complaintCat: 'Kategorie', complaintProject: 'Projekt', complaintDesc: 'Beschreibung',
  commentPlaceholder: 'Kommentar schreiben…', cmtTitle: 'Kommentare',
  custComplaint: 'Kundenbeschwerde', intIssue: 'Internes Problem',
  appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp Kundenportal',
  tagline: IS_FACTORY ? 'Partnerwerk-Portal' : 'Kundenprojekt-Portal',
  extPortal: 'Externes Portal',
  lblCat: 'Kat.',
  lblTitle: 'Titel',
  lblLevel: 'Stufe',
  notSelected: '(Nicht ausgewählt)',
  catProd: 'Produktion',
  catEng: 'Engineering',
  catProc: 'Prozess',
  catQual: 'Qualität',
  descPlaceholder: 'Beschreiben Sie das Problem…',
};
I18N.ar = {
  login: 'تسجيل الدخول',
  selectRole: IS_FACTORY ? 'اختر المصنع' : 'اختر العميل',
  accessCode: 'رمز الوصول', enter: 'دخول',
  custAccount: 'حساب العميل', custCode: 'رمز العميل', password: 'كلمة المرور',
  errLogin: 'الحساب أو الرمز أو كلمة المرور غير صحيحة',
  errLoginF: 'الحساب أو رمز المصنع أو كلمة المرور غير صحيحة',
  errLoginA: 'الحساب أو كلمة المرور غير صحيحة',
  loginAccount: 'حساب الدخول', factoryCode: 'رمز المصنع',
  myProjects: 'مشاريعي', noProject: 'لا توجد مشاريع', loading: 'جارٍ التحميل…',
  stage: 'المرحلة', progress: 'تقدم المشروع', custNo: 'مشروع العميل', factoryNo: 'رقم المصنع',
  submit: 'إرسال', cancel: 'إلغاء', remark: 'ملاحظة', qty: 'الكمية', date: 'التاريخ',
  reportTitle: IS_FACTORY ? 'إبلاغ عن التقدم' : 'إرسال ملاحظات',
  myRecords: IS_FACTORY ? 'تقاريري' : 'ملاحظاتي',
  noRecord: 'لا توجد سجلات', logout: 'تسجيل الخروج', settings: 'الإعدادات', language: 'اللغة',
  detail: 'تفاصيل المشروع', submitted: 'تم الإرسال', errCode: 'رمز الوصول غير صحيح',
  errNet: 'خطأ في الشبكة، حاول مرة أخرى',
  errSelect: IS_FACTORY ? 'يرجى اختيار المصنع' : 'يرجى اختيار العميل',
  allFields: 'جميع المعلومات', refresh: 'تحديث', ok: 'موافق',
  problems: 'المشاكل', noProblem: 'لا توجد مشاكل ذات صلة', submitComplaint: 'إرسال شكوى',
  complaintCat: 'الفئة', complaintProject: 'المشروع المرتبط', complaintDesc: 'الوصف',
  commentPlaceholder: 'اكتب تعليقًا…', cmtTitle: 'التعليقات',
  custComplaint: 'شكوى العميل', intIssue: 'مشكلة داخلية',
  appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp بوابة العملاء',
  tagline: IS_FACTORY ? 'بوابة المصنع الشريك' : 'بوابة مشاريع العملاء',
  extPortal: 'البوابة الخارجية',
  lblCat: 'الفئة',
  lblTitle: 'العنوان',
  lblLevel: 'المستوى',
  notSelected: '(غير محدد)',
  catProd: 'الإنتاج',
  catEng: 'الهندسة',
  catProc: 'العملية',
  catQual: 'الجودة',
  descPlaceholder: 'صف المشكلة…',
};
I18N.vi = {
  login: 'Đăng nhập',
  selectRole: IS_FACTORY ? 'Chọn nhà máy' : 'Chọn khách hàng',
  accessCode: 'Mã truy cập', enter: 'Vào',
  custAccount: 'Tài khoản khách hàng', custCode: 'Mã khách hàng', password: 'Mật khẩu',
  errLogin: 'Tài khoản, mã hoặc mật khẩu không đúng',
  errLoginF: 'Tài khoản, mã nhà máy hoặc mật khẩu không đúng',
  errLoginA: 'Tài khoản hoặc mật khẩu không đúng',
  loginAccount: 'Tài khoản đăng nhập', factoryCode: 'Mã nhà máy',
  myProjects: 'Dự án của tôi', noProject: 'Chưa có dự án', loading: 'Đang tải…',
  stage: 'Giai đoạn', progress: 'Tiến độ dự án', custNo: 'Mã dự án khách hàng', factoryNo: 'Mã nhà máy',
  submit: 'Gửi', cancel: 'Hủy', remark: 'Ghi chú', qty: 'Số lượng', date: 'Ngày',
  reportTitle: IS_FACTORY ? 'Báo cáo tiến độ' : 'Gửi phản hồi',
  myRecords: IS_FACTORY ? 'Báo cáo của tôi' : 'Phản hồi của tôi',
  noRecord: 'Chưa có bản ghi', logout: 'Đăng xuất', settings: 'Cài đặt', language: 'Ngôn ngữ',
  detail: 'Chi tiết dự án', submitted: 'Đã gửi', errCode: 'Mã truy cập không đúng',
  errNet: 'Lỗi mạng, vui lòng thử lại',
  errSelect: IS_FACTORY ? 'Vui lòng chọn nhà máy' : 'Vui lòng chọn khách hàng',
  allFields: 'Tất cả thông tin', refresh: 'Làm mới', ok: 'Xong',
  problems: 'Vấn đề', noProblem: 'Chưa có vấn đề liên quan', submitComplaint: 'Gửi khiếu nại',
  complaintCat: 'Danh mục', complaintProject: 'Dự án liên quan', complaintDesc: 'Mô tả',
  commentPlaceholder: 'Viết bình luận…', cmtTitle: 'Bình luận',
  custComplaint: 'Khiếu nại khách hàng', intIssue: 'Vấn đề nội bộ',
  appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp Cổng khách hàng',
  tagline: IS_FACTORY ? 'Cổng nhà máy đối tác' : 'Cổng dự án khách hàng',
  extPortal: 'Cổng đối tác',
  lblCat: 'Loại',
  lblTitle: 'Tiêu đề',
  lblLevel: 'Mức',
  notSelected: '(Chưa chọn)',
  catProd: 'Sản xuất',
  catEng: 'Kỹ thuật',
  catProc: 'Quy trình',
  catQual: 'Chất lượng',
  descPlaceholder: 'Mô tả vấn đề…',
};
I18N.hi = {
  login: 'लॉग इन',
  selectRole: IS_FACTORY ? 'कारखाना चुनें' : 'ग्राहक चुनें',
  accessCode: 'एक्सेस कोड', enter: 'प्रवेश',
  custAccount: 'ग्राहक खाता', custCode: 'ग्राहक कोड', password: 'पासवर्ड',
  errLogin: 'खाता, कोड या पासवर्ड गलत है',
  errLoginF: 'खाता, फ़ैक्टरी कोड या पासवर्ड गलत है',
  errLoginA: 'खाता या पासवर्ड गलत है',
  loginAccount: 'लॉगिन खाता', factoryCode: 'कारखाना कोड',
  myProjects: 'मेरी परियोजनाएँ', noProject: 'कोई परियोजना नहीं', loading: 'लोड हो रहा है…',
  stage: 'चरण', progress: 'परियोजना प्रगति', custNo: 'ग्राहक परियोजना संख्या', factoryNo: 'कारखाना संख्या',
  submit: 'जमा करें', cancel: 'रद्द करें', remark: 'टिप्पणी', qty: 'मात्रा', date: 'तारीख',
  reportTitle: IS_FACTORY ? 'उत्पादन प्रगति रिपोर्ट' : 'प्रतिक्रिया भेजें',
  myRecords: IS_FACTORY ? 'मेरी रिपोर्ट' : 'मेरी प्रतिक्रिया',
  noRecord: 'कोई रिकॉर्ड नहीं', logout: 'लॉग आउट', settings: 'सेटिंग्स', language: 'भाषा',
  detail: 'परियोजना विवरण', submitted: 'जमा हुआ', errCode: 'गलत एक्सेस कोड',
  errNet: 'नेटवर्क त्रुटि, पुनः प्रयास करें',
  errSelect: IS_FACTORY ? 'कृपया कारखाना चुनें' : 'कृपया ग्राहक चुनें',
  allFields: 'संपूर्ण जानकारी', refresh: 'रीफ्रेश', ok: 'ठीक है',
  problems: 'समस्याएँ', noProblem: 'कोई संबंधित समस्या नहीं', submitComplaint: 'शिकायत भेजें',
  complaintCat: 'श्रेणी', complaintProject: 'संबंधित परियोजना', complaintDesc: 'विवरण',
  commentPlaceholder: 'टिप्पणी लिखें…', cmtTitle: 'टिप्पणियाँ',
  custComplaint: 'ग्राहक शिकायत', intIssue: 'आंतरिक समस्या',
  appName: IS_FACTORY ? 'PMApp Factory' : 'PMApp ग्राहक पोर्टल',
  tagline: IS_FACTORY ? 'साझेदार कारखाना पोर्टल' : 'ग्राहक परियोजना पोर्टल',
  extPortal: 'बाहरी पोर्टल',
  lblCat: 'श्रेणी',
  lblTitle: 'शीर्षक',
  lblLevel: 'स्तर',
  notSelected: '(चयनित नहीं)',
  catProd: 'उत्पादन',
  catEng: 'इंजीनियरिंग',
  catProc: 'प्रक्रिया',
  catQual: 'गुणवत्ता',
  descPlaceholder: 'समस्या का वर्णन करें…',
};
let LANG = localStorage.getItem(CFG.sessionKey + '_lang') || 'zh';
const T = k => (I18N[LANG] && I18N[LANG][k]) || k;

/* ─────────── Supabase 数据层（与现有 PWA 同构）─────────── */
const H = () => ({
  apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
});
const uuid = () => (crypto?.randomUUID
  ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }));

async function sbGet(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query || ''}`, { headers: H() });
  if (!r.ok) throw new Error('GET ' + r.status);
  return r.json();
}
async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: { ...H(), Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('POST ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return r.json();
}
async function sbPatch(table, query, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query || ''}`, {
    method: 'PATCH', headers: { ...H(), Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('PATCH ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return r.json();
}

/** 读取某张业务表（sync_data 通用表），payload 兼容 JSON 字符串与 jsonb 对象 */
async function loadTable(tableName, limit = 1000) {
  const rows = await sbGet('sync_data',
    `select=supabase_id,table_name,payload,updated_at&table_name=eq.${encodeURIComponent(tableName)}&limit=${limit}`);
  return (rows || []).map(r => {
    let p = r.payload;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = {}; } }
    return { _sb: r.supabase_id, ...(p || {}) };
  }).filter(r => !r.is_deleted);
}

/** 写入一条外部上报/反馈记录 */
async function writeRecord(payload) {
  const now = new Date().toISOString();
  return sbPost('sync_data', {
    table_name: CFG.reportTable,
    payload: JSON.stringify({ ...payload, variant: VARIANT, created_at: now }),
    local_id: Date.now(),
    supabase_id: uuid(),
    is_deleted: false,
    updated_at: now,
    device_id: 'ext-' + VARIANT,
  });
}

/* ─────────── 会话 ─────────── */
function getSession() {
  try { return JSON.parse(localStorage.getItem(CFG.sessionKey) || 'null'); }
  catch { return null; }
}
function setSession(s) { localStorage.setItem(CFG.sessionKey, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(CFG.sessionKey); }

/* ─────────── 状态 ─────────── */
const S = { idents: [], projects: [], records: [], fieldlog: [], issues: [], problems: [], news: [], current: null };

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* 代码/账号比较：忽略大小写、空格、连字符、下划线（HIP-PH = hipph = hip ph） */
const nrm = s => String(s == null ? '' : s).toLowerCase().replace(/[\s\-_]/g, '');

/* 客户身份容错：登录客户代码 / 内部品牌码 / 客户名称，任一命中即视为本人数据 */
function sessVals(sess) {
  if (!sess) return [];
  return [sess.value, sess.brand, sess.name]
    .map(x => String(x == null ? '' : x).trim().toLowerCase())
    .filter(Boolean);
}

/* 三端统一区块的多语言标签（不污染 I18N 主字典，en 兜底） */
const LBL = {
  onsite:      {zh:'现场', en:'Onsite', es:'Sitio', ja:'現場', fr:'Site', de:'Vor Ort', ar:'الموقع', vi:'Tại chỗ', hi:'साइट'},
  newsTab:     {zh:'耳机行业新闻', en:'Headphone News', es:'Noticias Auriculares', ja:'ヘッドホン業界ニュース', fr:'Actualités Casques', de:'Headphone-News', ar:'أخبار سماعات الرأس', vi:'Tin ngành Tai nghe', hi:'हेडफोन उद्योग समाचार'},
  recFactory:  {zh:'上报问题记录汇总', en:'Reported Issues', es:'Informes de Problemas', ja:'報告問題集計', fr:'Problèmes Signalés', de:'Gemeldete Probleme', ar:'المشاكل المبلّغة', vi:'Tổng hợp Sự cố Báo cáo', hi:'रिपोर्ट किए गए मुद्दे'},
  recCustomer: {zh:'问题汇总', en:'Issue Summary', es:'Resumen de Problemas', ja:'問題集計', fr:'Résumé des Problèmes', de:'Problemübersicht', ar:'ملخص المشاكل', vi:'Tổng hợp Sự cố', hi:'मुद्दों का सारांश'},
  syncing:     {zh:'同步中…', en:'Syncing…', es:'Sincronizando…', ja:'同期中…', fr:'Synchronisation…', de:'Synchronisiere…', ar:'جارٍ المزامنة…', vi:'Đang đồng bộ…', hi:'सिंक हो रहा है…'},
  pending:     {zh:'待处理问题', en:'Pending Issues', es:'Problemas Pendientes', ja:'未処理の問題', fr:'Problèmes en Attente', de:'Offene Probleme', ar:'المشاكل المعلقة', vi:'Sự cố Đang xử lý', hi:'लंबित मुद्दे'},
  weeklyDoa:   {zh:'每周DOA增加数', en:'Weekly DOA Added', es:'DOA Semanales', ja:'週間DOA増加数', fr:'DOA Hebdo', de:'Wöchentl. DOA', ar:'زيادة DOA أسبوعياً', vi:'DOA tăng hàng tuần', hi:'साप्ताहिक DOA वृद्धि'},
  weeklyComp:  {zh:'每周新增客诉投诉', en:'Weekly New Complaints', es:'Quejas Nuevas Sem.', ja:'週間新規苦情', fr:'Nouvelles Réclamations', de:'Wöchentl. Beschwerden', ar:'شكاوى جديدة أسبوعياً', vi:'Khiếu nại mới hàng tuần', hi:'साप्ताहिक नई शिकायतें'},
  submitReport:{zh:'上报生产进度', en:'Report Production', es:'Reportar Producción', ja:'生産報告', fr:'Reporter Production', de:'Produktion melden', ar:'إبلاغ الإنتاج', vi:'Báo cáo Sản xuất', hi:'उत्पादन रिपोर्ट'},
  lblUser:     {zh:'使用者', en:'User', es:'Usuario', ja:'使用者', fr:'Utilisateur', de:'Benutzer', ar:'المستخدم', vi:'Người dùng', hi:'उपयोगकर्ता'},
  lblAcct:     {zh:'登录账号', en:'Account', es:'Cuenta', ja:'アカウント', fr:'Compte', de:'Konto', ar:'الحساب', vi:'Tài khoản', hi:'खाता'},
  lblCode:     {zh:'客户代码', en:'Customer Code', es:'Código de Cliente', ja:'顧客コード', fr:'Code Client', de:'Kundencode', ar:'رمز العميل', vi:'Mã khách hàng', hi:'ग्राहक कोड'},
  lblRole:     {zh:'属性', en:'Role', es:'Rol', ja:'属性', fr:'Rôle', de:'Rolle', ar:'الدور', vi:'Vai trò', hi:'भूमिका'},
  lblAuth:     {zh:'权限', en:'Authority', es:'Permiso', ja:'権限', fr:'Autorisation', de:'Berechtigung', ar:'الصلاحية', vi:'Quyền hạn', hi:'अधिकार'},
  lblPersons:  {zh:'本公司使用者', en:'Company Users', es:'Usuarios', ja:'会社の使用者', fr:'Utilisateurs', de:'Benutzer', ar:'المستخدمون', vi:'Người dùng', hi:'उपयोगकर्ता'},
};
const TL = k => (LBL[k] && LBL[k][LANG]) || (LBL[k] && LBL[k].en) || k;

/* 编辑/删除相关多语言标签（与 LBL 同构，不污染 I18N 主字典） */
const EXT = {
  editRecord:  {zh:'编辑记录', en:'Edit Record', es:'Editar registro', ja:'記録を編集', fr:"Modifier l'enregistrement", de:'Datensatz bearbeiten', ar:'تحرير السجل', vi:'Sửa bản ghi', hi:'रिकॉर्ड संपादित करें'},
  btnSave:     {zh:'保存', en:'Save', es:'Guardar', ja:'保存', fr:'Enregistrer', de:'Speichern', ar:'حفظ', vi:'Lưu', hi:'सहेजें'},
  btnDelete:   {zh:'删除', en:'Delete', es:'Borrar', ja:'削除', fr:'Supprimer', de:'Löschen', ar:'حذف', vi:'Xóa', hi:'हटाएँ'},
  deleted:     {zh:'已删除', en:'Deleted', es:'Borrado', ja:'削除済み', fr:'Supprimé', de:'Gelöscht', ar:'تم الحذف', vi:'Đã xóa', hi:'हटाया गया'},
  saved:       {zh:'已保存', en:'Saved', es:'Guardado', ja:'保存済み', fr:'Enregistré', de:'Gespeichert', ar:'تم الحفظ', vi:'Đã lưu', hi:'सहेजा गया'},
  confirmDelete:{zh:'确定删除这条记录？此操作不可撤销。', en:'Delete this record? This cannot be undone.', es:'¿Eliminar este registro? No se puede deshacer.', ja:'この記録を削除しますか？元に戻せません。', fr:'Supprimer cet enregistrement ? Action irréversible.', de:'Diesen Datensatz löschen? Kann nicht rückgängig gemacht werden.', ar:'حذف هذا السجل؟ لا يمكن التراجع.', vi:'Xóa bản ghi này? Không thể hoàn tác.', hi:'इस रिकॉर्ड को हटाएं? इसे पूर्ववत नहीं किया जा सकता।'},
  /* ─── 现场记录编辑器（与 PWA 现场记录模块对齐）─── */
  flOnsite:        {zh:'现场记录', en:'Onsite Record'},
  flRaiseIssue:    {zh:'上报现场问题', en:'Report On-site Issue', es:'Reportar problema', ja:'現場問題を報告', fr:"Signaler un problème", de:'Problem melden', ar:'الإبلاغ عن مشكلة', vi:'Báo cáo sự cố', hi:'समस्या रिपोर्ट करें'},
  flReportProd:    {zh:'生产上报', en:'Production Report'},
  flProject:       {zh:'生产项目', en:'Project'},
  flFactory:       {zh:'问题发生工厂', en:'Problem Factory'},
  flCategory:      {zh:'问题类别', en:'Category'},
  flDesc:          {zh:'生产问题叙述', en:'Description'},
  flDescPh:        {zh:'描述产线遇到的状况、异常、数量等…', en:'Describe the issue on the line…'},
  flStatus:        {zh:'处理状态', en:'Status'},
  flPhotos:        {zh:'现场照片', en:'Photos'},
  flPickPhoto:     {zh:'📷 选择照片', en:'📷 Pick Photo'},
  flGPS:           {zh:'📍 记录现场定位', en:'📍 Capture Location'},
  flReporterEmail: {zh:'报告人邮箱', en:'Reporter Email'},
  flRespEmail:     {zh:'负责处理人邮箱', en:'Assignee Email'},
  flNew:           {zh:'新建现场记录', en:'New Record'},
  flEdit:          {zh:'编辑现场记录', en:'Edit Record'},
  flSaved:         {zh:'已保存现场记录', en:'Saved'},
  flIssued:        {zh:'已提交', en:'Submitted'},
  flFillProjOrDesc:{zh:'请至少填写项目或问题叙述', en:'Fill project or description'},
  flMaxPhotos:     {zh:'照片已达上限（最多 3 张）', en:'Max 3 photos'},
  flPhotoFail:     {zh:'照片处理失败', en:'Photo processing failed'},
  flNoGeo:         {zh:'此设备不支持定位', en:'Geolocation not supported'},
  flLocating:      {zh:'📍 定位中…', en:'📍 Locating…'},
  flLocOk:         {zh:'✅ 已记录', en:'✅ Recorded'},
  flLocRec:        {zh:'现场定位已记录', en:'Location recorded'},
  flLocFail:       {zh:'定位失败: ', en:'Location failed: '},
  /* ─── 现场分类大标题（生产/工程/制程/品质 + 问题 后缀）─── */
  catProd:       {zh:'生产', en:'Production', es:'Producción', ja:'生産', fr:'Production', de:'Produktion', ar:'الإنتاج', vi:'Sản xuất', hi:'उत्पादन'},
  catEng:        {zh:'工程', en:'Engineering', es:'Ingeniería', ja:'技術', fr:'Ingénierie', de:'Konstruktion', ar:'الهندسة', vi:'Kỹ thuật', hi:'इंजीनियरिंग'},
  catProc:       {zh:'制程', en:'Process', es:'Proceso', ja:'工程', fr:'Procédé', de:'Prozess', ar:'العملية', vi:'Quy trình', hi:'प्रक्रिया'},
  catQual:       {zh:'品质', en:'Quality', es:'Calidad', ja:'品質', fr:'Qualité', de:'Qualität', ar:'الجودة', vi:'Chất lượng', hi:'गुणवत्ता'},
  probSuffix:    {zh:'问题', en:'Issues', es:'Problemas', ja:'問題', fr:'Problèmes', de:'Probleme', ar:'المشاكل', vi:'Sự cố', hi:'मुद्दे'},
  catComp:       {zh:'客诉', en:'Complaint', es:'Queja', ja:'クレーム', fr:'Réclamation', de:'Beschwerde', ar:'شكوى', vi:'Khiếu nại', hi:'शिकायत'},
  stPend:        {zh:'待处理', en:'Pending', es:'Pendiente', ja:'未処理', fr:'En attente', de:'Offen', ar:'معلق', vi:'Chờ xử lý', hi:'लंबित'},
  stDoing:       {zh:'处理中', en:'In Progress', es:'En progreso', ja:'処理中', fr:'En cours', de:'In Bearbeitung', ar:'قيد المعالجة', vi:'Đang xử lý', hi:'प्रगति में'},
  stDone:        {zh:'已处理', en:'Resolved', es:'Resuelto', ja:'処理済', fr:'Résolu', de:'Gelöst', ar:'تم الحل', vi:'Đã xử lý', hi:'हल हो गया'},
  newsUpdNote:   {zh:'每天 08:00 (GMT+8) 自动更新', en:'Auto-updated daily 08:00 (GMT+8)', es:'Actualización automática 08:00 (GMT+8)', ja:'毎日 08:00 (GMT+8) 自動更新', fr:'Mise à jour auto 08:00 (GMT+8)', de:'Täglich 08:00 (GMT+8) auto-aktualisiert', ar:'تحديث تلقائي 08:00 (GMT+8)', vi:'Tự động cập nhật 08:00 (GMT+8)', hi:'दैनिक 08:00 (GMT+8) ऑटो-अपडेट'},
  flRecorder:    {zh:'问题记录人', en:'Issue Recorder', es:'Reportador', ja:'記録者', fr:'Déclarant', de:'Erfasser', ar:'مسجل المشكلة', vi:'Người ghi nhận', hi:'समस्या रिकॉर्डर'},
};
const TE = k => (EXT[k] && EXT[k][LANG]) || (EXT[k] && EXT[k].en) || k;

/* 超级管理员：内置账号，登录时跳过工厂/客户代码，仅账号+密码 */
const ADMINS = {
  admin:  { name: '超级管理员', pass: 'taiwangunbase' },
  admin2: { name: '授权管理员', pass: 'admin123' },
};
const isAdminAcct = a => ADMINS.hasOwnProperty(nrm(a));

function toast(msg, bad) {
  const el = $('toast');
  el.textContent = msg;
  el.style.background = bad ? '#b8461f' : '#1e6b3a';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}

/* ─────────── 数据加载 ─────────── */
async function loadIdents() {
  if (__VARIANT__ === 'factory') return loadTable('factory_info');
  if (CFG.idSource === 'customer_info') {
    // ① 优先读「客户使用者」表（customer_user）：同一客户公司多人，一人一号
    //    每家客户的使用者账号各不相同，密码可为同一预设密码
    let users = [];
    try { users = await loadTable('customer_user'); } catch (e) { users = []; }
    const covered = new Set();   // 已有独立使用者账号的客户 → 停用其公司级共用账号
    const out = [];
    (users || []).forEach(u => {
      if (!u || u.active === false) return;
      const idv = (u.customer_code || '').toString().trim();
      const brand = (u.brand_code || '').toString().trim();
      if (idv) covered.add(nrm(idv));
      if (brand) covered.add(nrm(brand));
      if (!idv || !u.account) return;
      out.push({
        id: idv, brand: brand,
        name: (u.company || u.customer_name || idv).toString().trim(),
        user_name: (u.user_name || '').toString().trim(),
        account: (u.account || '').toString().trim(),
        password: (u.password || '').toString(),
        role: (u.role || '').toString(),
        authority: (u.authority || '').toString(),
      });
    });
    // ② 尚无独立使用者账号的客户，保留公司级账号（过渡兼容）
    const rows = await loadTable('customer_info');
    const seen = new Set();
    rows.forEach(r => {
      const v = (r[CFG.idValueKey] || '').toString().trim();
      if (!v || seen.has(v)) return;
      seen.add(v);
      if (covered.has(nrm(v)) || covered.has(nrm(r.brand_code || ''))) return;
      out.push({
        id: v, brand: (r.brand_code || '').toString().trim(),
        name: (r[CFG.idTextKey] || r.customer_name || v).toString().trim(),
        user_name: '',
        account: (r.account || '').toString().trim(),
        password: (r.password || '').toString(),
        role: '', authority: '',
      });
    });
    return out.sort((a, b) => (a.name + a.account).localeCompare(b.name + b.account));
  }
  const ps = await loadTable('project_info');
  const seen = new Set(), out = [];
  ps.forEach(p => {
    const v = (p[CFG.idValueKey] || '').toString().trim();
    if (v && !seen.has(v)) { seen.add(v); out.push({ id: v, name: v }); }
  });
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function loadProjects() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable('project_info');
  if (sess.role === 'super') {
    return all.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }
  const v = nrm(sess.value);
  if (IS_FACTORY) {
    // 工厂端：项目以 factory_id 关联工厂账号（兼容项目编号/客户名兜底）
    return all.filter(p => {
      const fid = nrm(p[CFG.idKey] ?? '');
      const cno = nrm(p.customer_project_no ?? '');
      const cnm = nrm(p.customer_name_display ?? p.customer_name ?? '');
      return fid === v || (v.length >= 3 && (cno.includes(v) || cnm.includes(v)));
    });
  }
  // 客户端：解析 customer_info 数字主键，按 customer_id 关联真实项目；
  // 兜底：项目编号本身含客户代码（如 HARMAN-CP-001）
  let custId = null;
  try {
    const custs = await loadTable('customer_info');
    const me = custs.find(c => nrm(c.code ?? '') === v
      || nrm(c.customer_name ?? '') === v
      || String(c.id) === String(sess.value));
    custId = me ? me.id : null;
  } catch (e) { custId = null; }
  return all.filter(p => {
    const cno = nrm(p.customer_project_no ?? '');
    const cnm = nrm(p.customer_name_display ?? p.customer_name ?? '');
    return (custId != null && String(p.customer_id) === String(custId))
        || (v.length >= 3 && (cno.includes(v) || cnm.includes(v)));
  });
}

async function loadRecords() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable(CFG.reportTable, 500);
  if (sess.role === 'super') {
    return all.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }
  return all.filter(r => String(r.ident) === String(sess.value))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

/* 耳机/音频产业新闻（全英文）：主源 Supabase ai_industry_news，缺失时回落 fpwa/news.json */
async function loadNews() {
  // 耳机行业新闻要求「全英文」：过滤掉含中文标题/摘要的条目
  const cjk = s => /[一-鿿]/.test(s || '');
  try {
    const rows = await loadTable('ai_industry_news', 200);
    if (rows && rows.length) {
      const out = rows.map(n => ({
        title: n.title || '', summary: n.summary || '', source: n.source || '',
        url: n.url || '', date: n.news_date || n.date || '', importance: n.importance || ''
      })).filter(n => n.title && !cjk(n.title) && !cjk(n.summary));
      if (out.length) return out;
    }
  } catch (e) {}
  try {
    const r = await fetch('news.json', { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      const items = (j.items || []).map(n => ({
        title: n.title || '', summary: n.summary || '', source: n.source || '',
        url: n.url || '', date: n.date || '', importance: ''
      })).filter(n => n.title && !cjk(n.title) && !cjk(n.summary));
      if (items.length) return items;
    }
  } catch (e) {}
  return [];
}

/* ─────────── 渲染：登录页 ─────────── */
function loginLangGrid() {
  return `<div class="lang-block" style="margin-top:8px">
    <div class="lang-block-title">🌐 ${T('language')}</div>
    <div class="lang-grid">
      ${Object.entries(LANGUAGES).map(([k, o]) => `<button class="lang-chip ${LANG === k ? 'on' : ''}" data-l="${k}">${o.flag} ${o.name}</button>`).join('')}
    </div>
  </div>`;
}

function renderLogin() {
  const isC = IS_CUSTOMER;
  $('app').innerHTML = `
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <div class="brand-badge">${CFG.code}</div>
        <div>
          <div class="brand-name">${esc(T('appName'))}</div>
          <div class="brand-sub">${esc(T('tagline'))}</div>
        </div>
      </div>
      ${isC ? `
      <label class="lbl">${T('custAccount')}</label>
      <input id="inp-account" class="inp" type="text" placeholder="${T('custAccount')}" autocomplete="off">
      <div id="code-row">
      <label class="lbl">${T('custCode')}</label>
      <input id="inp-code" class="inp" type="text" placeholder="${T('custCode')}" autocomplete="off">
      </div>
      ` : `
      <label class="lbl">${T('loginAccount')}</label>
      <input id="inp-account" class="inp" type="text" placeholder="${T('loginAccount')}" autocomplete="off">
      <div id="code-row">
      <label class="lbl">${T('factoryCode')}</label>
      <input id="inp-code" class="inp" type="text" placeholder="${T('factoryCode')}" autocomplete="off">
      </div>
      `}
      <label class="lbl">${T('password')}</label>
      <input id="inp-pass" class="inp" type="password" placeholder="${T('password')}" autocomplete="off">
      <button class="btn-main" id="btn-login">${T('enter')}</button>
      ${loginLangGrid()}
      <div class="hint">${CFG.code} · ${T('extPortal')} · v0.1.0</div>
    </div>
  </div>`;
  document.querySelectorAll('#app [data-l]').forEach(b => {
    b.onclick = () => {
      LANG = b.dataset.l;
      localStorage.setItem(CFG.sessionKey + '_lang', LANG);
      renderLogin();
    };
  });
  $('btn-login').onclick = doLogin;
  const accEl = $('inp-account');
  if (accEl) {
    accEl.oninput = () => {
      const cr = $('code-row');
      if (cr) cr.style.display = isAdminAcct(accEl.value.trim()) ? 'none' : '';
    };
    accEl.oninput();
  }
  if (isC) $('inp-pass').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
  else $('inp-pass').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
}

function doLogin() {
  const _acct = $('inp-account').value.trim();
  const _pass = $('inp-pass').value;
  // 超级管理员：跳过工厂/客户代码，仅账号+密码
  if (isAdminAcct(_acct)) {
    if (!_acct || !_pass) return toast(T('errLoginA'), true);
    const _a = ADMINS[nrm(_acct)];
    if (_pass !== _a.pass) return toast(T('errLoginA'), true);
    setSession({ value: '*', name: _a.name, account: nrm(_acct), role: 'super', at: Date.now() });
    return boot();
  }
  if (IS_CUSTOMER) {
    const account = $('inp-account').value.trim();
    const code = $('inp-code').value.trim();
    const pass = $('inp-pass').value;
    if (!account || !code || !pass) return toast(T('errLogin'), true);
    const row = S.idents.find(o =>
      nrm(o.account) === nrm(account) &&
      (nrm(o.id) === nrm(code) || nrm(o.brand) === nrm(code)) &&
      (o.password || '') === pass);
    if (!row) return toast(T('errLogin'), true);
    setSession({
      value: row.id, brand: row.brand || '', name: row.name,
      user_name: row.user_name || '', account: row.account,
      role: row.role || '', authority: row.authority || '', at: Date.now(),
    });
    return boot();
  }
  const account = $('inp-account').value.trim();
  const code = $('inp-code').value.trim();
  const pass = $('inp-pass').value;
  if (!account || !code || !pass) return toast(T('errLoginF'), true);
  const row = S.idents.find(o =>
    nrm(o.account) === nrm(account) &&
    nrm(o.code) === nrm(code) &&
    (o.password || '') === pass);
  if (!row) return toast(T('errLoginF'), true);
  setSession({ value: row.id, name: row.factory_name || row.name, account: row.account, at: Date.now() });
  boot();
}

/* ─────────── 渲染：主界面 ─────────── */
function renderShell() {
  const sess = getSession();
  const recLabel = IS_FACTORY ? TL('recFactory') : TL('recCustomer');
  $('app').innerHTML = `
  <header class="topbar">
    <div class="tb-left">
      <div class="tb-badge">${CFG.code}</div>
      <div>
        <div class="tb-title">${esc(sess.name)}${sess.user_name ? ' · ' + esc(sess.user_name) : ''}</div>
        <div class="tb-sub">${sess.user_name ? esc(sess.account + (sess.authority ? ' · ' + sess.authority : '')) : esc(T('tagline'))}</div>
      </div>
    </div>
    <div class="tb-right">
      <button class="tb-btn" id="btn-sync" title="Sync">🔄<span class="tb-sync-tx">${TL('syncing').slice(0,2)}</span></button>
      <button class="tb-btn" id="btn-lang2" title="Language">🌐</button>
      <button class="tb-btn" id="btn-out" title="Logout">⏻</button>
    </div>
  </header>
  <main id="main"></main>
  <nav class="tabbar">
    <button class="tab active" data-tab="onsite">🛠<span>${TL('onsite')}</span></button>
    <button class="tab" data-tab="records">📋<span>${esc(recLabel)}</span></button>
    <button class="tab" data-tab="news">🎧<span>${TL('newsTab')}</span></button>
    <button class="tab" data-tab="settings">⚙️<span>${T('settings')}</span></button>
  </nav>
  <div id="modal" class="modal"></div>`;

  $('btn-out').onclick = () => { clearSession(); S.current = null; boot(); };
  $('btn-sync').onclick = () => { toast(TL('syncing')); refreshData(); };
  $('btn-lang2').onclick = () => {
    LANG = LANG === 'zh' ? 'en' : 'zh';
    localStorage.setItem(CFG.sessionKey + '_lang', LANG);
    renderShell(); switchTab(S.tab || 'onsite');
  };
  document.querySelectorAll('.tab').forEach(b => {
    b.onclick = () => switchTab(b.dataset.tab);
  });
  switchTab('onsite');
}

function switchTab(tab) {
  S.tab = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'onsite') renderOnsite();
  else if (tab === 'records') renderSummary();
  else if (tab === 'news') renderNews();
  else renderSettings();
}

function projCard(p) {
  const stage = (p.project_stage || '').toUpperCase();
  const pct = STAGE_PROGRESS[stage] ?? 5;
  const idx = STAGES.indexOf(stage);
  return `
  <div class="card" data-id="${esc(p.id)}">
    <div class="card-head">
      <div class="card-title">${esc(p.factory_project_no || p.customer_project_no || '—')}</div>
      <span class="stage-badge">${esc(stage || '—')}</span>
    </div>
    <div class="card-meta">
      ${p.customer_project_no && !CFG.hideFields.includes('customer_project_no')
        ? `<div><span>${T('custNo')}</span>${esc(p.customer_project_no)}</div>` : ''}
      ${!CFG.hideFields.includes('production_factory')
        ? `<div><span>${T('factoryNo')}</span>${esc(p.production_factory || '—')}</div>` : ''}
    </div>
    <div class="pbar"><div class="pbar-in" style="width:${pct}%"></div></div>
    <div class="pbar-txt">${T('progress')} ${pct}% · ${idx >= 0 ? (idx + 1) + '/' + STAGES.length : '—'}</div>
  </div>`;
}

function renderProjects() {
  const m = $('main');
  if (!S.projects.length) {
    m.innerHTML = `<div class="empty"><div class="empty-ico">📦</div><div>${T('noProject')}</div>
      <button class="btn-ghost" id="btn-reload">${T('refresh')}</button></div>`;
    const b = $('btn-reload'); if (b) b.onclick = refreshData;
    return;
  }
  m.innerHTML = `<div class="list">${S.projects.map(projCard).join('')}</div>`;
  document.querySelectorAll('.card').forEach(c => {
    c.onclick = () => {
      const p = S.projects.find(x => String(x.id) === String(c.dataset.id));
      if (p) openDetail(p);
    };
  });
}

function openDetail(p) {
  const skip = new Set(['id', 'is_deleted', '_sb', 'supabase_id', 'synced_at', 'created_at', 'updated_at']);
  const rows = Object.entries(p)
    .filter(([k, v]) => !skip.has(k) && !CFG.hideFields.includes(k) && v !== '' && v != null)
    .map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  const stage = (p.project_stage || '').toUpperCase();
  const pct = STAGE_PROGRESS[stage] ?? 5;

  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div>
        <div class="sheet-title">${esc(p.factory_project_no || p.customer_project_no || '—')}</div>
        <div class="sheet-sub">${T('detail')} · ${esc(stage || '—')}</div>
      </div>
      <button class="sheet-x" id="m-x">✕</button>
    </div>
    <div class="pbar big"><div class="pbar-in" style="width:${pct}%"></div></div>
    <div class="kv-list">${rows || '<div class="empty-sm">—</div>'}</div>
    <button class="btn-main" id="m-report">${T('reportTitle')}</button>
    <div class="spacer"></div>
  </div>`;
  $('modal').classList.add('open');
  $('m-x').onclick = closeModal;
  $('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
  $('m-report').onclick = () => { if (IS_CUSTOMER) openFieldLogEditor(null, p); else openReport(p); };
}

function closeModal() { $('modal').classList.remove('open'); $('modal').innerHTML = ''; }

function openReport(p, rec) {
  const isEdit = !!(rec && rec._sb);
  const projOpts = `<option value="">${T('notSelected')}</option>` + (S.projects || []).map(pr => { const v = pr.factory_project_no || pr.customer_project_no || pr.name || pr.id || ''; const sel = (rec && rec.project === v) ? ' selected' : ''; return `<option value="${esc(v)}"${sel}>${esc(v)}</option>`; }).join('');
  const today = new Date().toISOString().slice(0, 10);
  const dateVal = (rec && rec.date) ? rec.date : today;
  const qtyVal = (rec && rec.qty != null) ? rec.qty : '';
  const noteVal = (rec && rec.note) ? rec.note : '';
  const projVal = (rec && rec.project) ? rec.project : (p ? (p.factory_project_no || p.customer_project_no || '') : '');
  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div><div class="sheet-title">${isEdit ? TE('editRecord') : T('reportTitle')}</div>
      <div class="sheet-sub">${esc(projVal)}</div></div>
      <button class="sheet-x" id="m-x2">✕</button>
    </div>
    <label class="lbl">${T('date')}</label>
    <input id="f-date" class="inp" type="date" value="${esc(dateVal)}">
    ${IS_FACTORY ? `<label class="lbl">${T('qty')}</label>
    <input id="f-qty" class="inp" type="number" placeholder="0" value="${esc(qtyVal)}">` : ''}
    ${!p ? `<label class="lbl">${T('complaintProject')}</label>\n    <select id="f-project" class="inp">${projOpts}</select>` : ''}
    <label class="lbl">${T('remark')}</label>
    <textarea id="f-note" class="inp" rows="4" placeholder="${T('remark')}">${esc(noteVal)}</textarea>
    <button class="btn-main" id="f-send">${isEdit ? TE('btnSave') : T('submit')}</button>
    <button class="btn-ghost" id="f-cancel">${T('cancel')}</button>
    ${isEdit ? `<button class="btn-main danger" id="f-del" style="background:#b8461f">${TE('btnDelete')}</button>` : ''}
    <div class="spacer"></div>
  </div>`;
  $('modal').classList.add('open');
  $('m-x2').onclick = closeModal;
  $('f-cancel').onclick = closeModal;
  if (isEdit) {
    $('f-del').onclick = () => deleteExtRecord(rec, 'records');
  }
  $('f-send').onclick = async () => {
    const btn = $('f-send'); btn.disabled = true; btn.textContent = '…';
    try {
      const projVal2 = p ? (p.factory_project_no || p.customer_project_no || '') : ($('f-project') ? $('f-project').value.trim() : '');
      const payload = {
        ident: String(getSession().value),
        project: String(projVal2),
        customer_no: String(p ? (p.customer_project_no || '') : projVal2),
        date: $('f-date').value,
        qty: IS_FACTORY ? Number($('f-qty')?.value || 0) : null,
        note: $('f-note').value,
        variant: VARIANT,
        created_at: (rec && rec.created_at) || new Date().toISOString(),
      };
      if (isEdit) {
        await sbPatch('sync_data', `supabase_id=eq.${rec._sb}`, { payload: JSON.stringify(payload), updated_at: new Date().toISOString(), device_id: 'ext-' + VARIANT });
        const idx = (S.records || []).findIndex(x => String(x._sb) === String(rec._sb));
        if (idx >= 0) S.records[idx] = { ...S.records[idx], project: payload.project, date: payload.date, qty: payload.qty, note: payload.note, customer_no: payload.customer_no, updated_at: new Date().toISOString() };
      } else {
        await writeRecord(payload);
      }
      closeModal(); toast(isEdit ? TE('saved') : T('submitted'));
      await refreshData(); switchTab('records');
    } catch (e) {
      btn.disabled = false; btn.textContent = isEdit ? TE('btnSave') : T('submit'); toast(T('errNet'), true);
    }
  };
}

function recordCard(r) {
  return `<div class="card flat">
    <div class="card-head">
      <div class="card-title">${esc(r.project || '—')}</div>
      <span class="date-badge">${esc((r.date || (r.created_at || '').slice(0, 10)) || '')}</span>
    </div>
    ${r.qty ? `<div class="card-meta"><div><span>${T('qty')}</span>${esc(r.qty)}</div></div>` : ''}
    ${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}
  </div>`;
}
function renderSummary() {
  const m = $('main');
  let html = '';
  if (IS_FACTORY) {
    html += `<div class="cat-head"><span>${TE('flReportProd')}</span><button class="rec-edit" id="btn-new-report" style="margin-left:auto">＋ ${T('reportTitle')}</button></div>`;
    const recs = (S.records || []).slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    html += `<div class="cat-head"><span>${T('myRecords')}</span><span class="cat-count">${recs.length}</span></div>`;
    html += recs.length
      ? `<div class="list">${recs.map(r => `<div class="rec-item">${recordCard(r)}${recordActions(r)}</div>`).join('')}</div>`
      : `<div class="empty-sm">${T('noRecord')}</div>`;
    const probs = (S.problems || []).slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    html += `<div class="cat-head"><span>${TL('recFactory')} · ${T('problems')}</span><span class="cat-count">${probs.length}</span></div>`;
    html += probs.length
      ? `<div class="list">${probs.map(r => { const card = r._kind === 'issues' ? issueCard(r) : problemCard(r); return `<div class="sum-item">${card}${problemCommentsHtml(r)}</div>`; }).join('')}</div>`
      : `<div class="empty-sm">${T('noProblem')}</div>`;
  } else {
    const list = (S.problems || []).slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    if (!list.length) {
      m.innerHTML = `<div class="empty"><div class="empty-ico">📋</div><div>${TL('recCustomer')}：${T('noProblem')}</div></div>`;
      return;
    }
    html = `<div class="list">${list.map(r => { const card = r._kind === 'issues' ? issueCard(r) : problemCard(r); return `<div class="sum-item">${card}${problemCommentsHtml(r)}</div>`; }).join('')}</div>`;
  }
  m.innerHTML = html;
  if (IS_FACTORY) {
    const nr = $('btn-new-report'); if (nr) nr.onclick = () => openReport(null);
    document.querySelectorAll('.rec-edit').forEach(b => { if (!b.dataset.sb) return; b.onclick = () => { const r = findRecord(b.dataset.sb); if (r) openReport(null, r); }; });
    document.querySelectorAll('.rec-del').forEach(b => { b.onclick = () => deleteExtRecord(findRecord(b.dataset.sb), 'records'); });
  }
  document.querySelectorAll('.sum-item .card').forEach(c => {
    c.onclick = () => { const r = findProblem(c.dataset.id); if (r) openProblem(r); };
  });
}

function renderSettings() {
  const me = getSession() || {};
  $('main').innerHTML = `
  <div class="list">
    <div class="card flat">
      <div class="card-head"><div class="card-title">${CFG.code} v0.1.0</div></div>
      <div class="card-meta">
        <div><span>Variant</span>${VARIANT}</div>
        <div><span>${CFG.idLabel}</span>${esc(me.name || '')}</div>
        ${IS_CUSTOMER ? `
        <div><span>${TL('lblUser')}</span>${esc(me.user_name || '—')}</div>
        <div><span>${TL('lblAcct')}</span>${esc(me.account || '—')}</div>
        <div><span>${TL('lblCode')}</span>${esc(me.value || '—')}</div>
        <div><span>${TL('lblRole')}</span>${esc(me.role || '普通使用者')}</div>
        <div><span>${TL('lblAuth')}</span>${esc(me.authority || '只可读、写')}</div>` : ''}
        <div><span>${T('myProjects')}</span>${S.projects.length}</div>
        <div><span>${T('myRecords')}</span>${S.records.length}</div>
      </div>
    </div>
    ${IS_CUSTOMER ? `
    <div class="card flat">
      <div class="card-head"><div class="card-title">${TL('lblPersons')}</div></div>
      <div class="card-meta">
        ${((S.idents || []).filter(o => o.user_name &&
            (nrm(o.id) === nrm(me.value) || (me.brand && nrm(o.brand) === nrm(me.brand))))
          .map(o => `<div><span>${esc(o.user_name)}</span>${esc(o.account)}</div>`).join(''))
          || `<div><span>—</span>${esc(me.user_name || '')}</div>`}
      </div>
    </div>` : ''}
    <div class="card flat">
      <div class="lang-block">
        <div class="lang-block-title">🌐 ${T('language')}</div>
        <div class="lang-grid">
          ${Object.entries(LANGUAGES).map(([k, o]) => `<button class="lang-chip ${LANG === k ? 'on' : ''}" data-l="${k}">${o.flag} ${o.name}</button>`).join('')}
        </div>
      </div>
    </div>
    <button class="btn-main danger" id="btn-out2">${T('logout')}</button>
  </div>`;
  document.querySelectorAll('[data-l]').forEach(b => {
    b.onclick = () => {
      LANG = b.dataset.l;
      localStorage.setItem(CFG.sessionKey + '_lang', LANG);
      renderShell(); switchTab('settings');
    };
  });
  $('btn-out2').onclick = () => { clearSession(); boot(); };
}

/* ─────────── CPWA：问题记录（只读）+ 留言板 + 客诉提交 ─────────── */
// 说明：CPWA 是 FPWA 子系统。客户登录后可见其项目相关的全部 field_log 问题（只读），
// 每条问题下方有留言板供客户与内部团队沟通；客户亦可通过「提交客诉」把现场记录
// 作为客户投诉写入 field_log（is_customer_complaint=true），自动归类到 生产/工程/制程/品质，
// 并汇总进 PWA 首页「每周新增客户投诉」「待处理问题」看板。

function cmtFmt(iso) {
  if (!iso) return '';
  try { const d = new Date(iso); if (isNaN(d.getTime())) return String(iso).slice(5, 16);
    const p = n => String(n).padStart(2, '0');
    return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  } catch (e) { return String(iso).slice(5, 16); }
}

// 兼容 comments 在 Supabase 中以 JSON 字符串 '[]' 存储（payload 序列化后），统一转回数组
function asCmtArr(c) {
  if (Array.isArray(c)) return c;
  if (typeof c === 'string') { try { const a = JSON.parse(c); if (Array.isArray(a)) return a; } catch (e) {} }
  return [];
}

// 读取客户可见的 field_log：自己提交的客诉(customer_code) + 其项目相关的全部问题
async function loadFieldLog() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable('field_log', 2000);
  const vals = sessVals(sess);
  const projSet = new Set((S.projects || []).map(p =>
    [p.name, p.factory_project_no, p.customer_project_no, p.id]
      .map(x => String(x || '').trim()).filter(Boolean)).flat());
  return all.filter(r => {
    if (vals.includes(String(r.customer_code || '').trim().toLowerCase())) return true;
    return projSet.has(String(r.project || '').trim());
  }).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map(r => ({ ...r, _kind: 'field_log' }));
}

// 写/更新一条 field_log（客诉或留言均走此）
async function saveFieldLogRecord(r) {
  const now = new Date().toISOString();
  let sbId = r._sb;
  const { _sb, _table, _cat, _kind, ...clean } = r;
  const payload = JSON.stringify(clean);
  if (sbId) {
    await sbPatch('sync_data', `supabase_id=eq.${sbId}`, { payload, updated_at: now, device_id: 'ext-' + VARIANT });
  } else {
    sbId = uuid();
    await sbPost('sync_data', { table_name: 'field_log', local_id: Date.now(), payload, supabase_id: sbId, is_deleted: false, updated_at: now, device_id: 'ext-' + VARIANT });
    r._sb = sbId;
  }
}

// 读取客户可见的 issues（内部问题）：通过 project_id 映射项目讯息(project_info.id)
async function loadIssues() {
  const sess = getSession();
  if (!sess) return [];
  const all = await loadTable('issues', 2000);
  const projIds = new Set((S.projects || []).map(p => String(p.id)).filter(Boolean));
  return all.filter(r => projIds.has(String(r.project_id)))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map(r => ({ ...r, _kind: 'issues' }));
}

async function loadProblems() {
  const sess = getSession();
  if (!sess) return [];
  // 主 PWA 的问题分布在多张表：issues(issue_type) + engineering/factory_process/production/quality 独立表 + field_log(客诉)
  const tables = ['issues', 'engineering', 'factory_process', 'production', 'quality', 'field_log'];
  let all = [];
  for (const t of tables) {
    const rows = await loadTable(t, 2000);
    all = all.concat(rows.map(r => ({ ...r, _table: t, _kind: t === 'field_log' ? 'field_log' : 'issues' })));
  }
  // 客户端：仅看其项目相关的问题（project_id 关联）及其客诉（customer_code）
  if (sess.role !== 'super' && IS_CUSTOMER) {
    const projIds = new Set((S.projects || []).map(p => String(p.id)).filter(Boolean));
    const projSet = new Set((S.projects || []).map(p =>
      [p.name, p.factory_project_no, p.customer_project_no, p.id]
        .map(x => String(x || '').trim()).filter(Boolean)).flat());
    const vals = sessVals(sess);
    all = all.filter(r => {
      if (r._table === 'field_log') {
        if (vals.includes(String(r.customer_code || '').trim().toLowerCase())) return true;
        return projSet.has(String(r.project || '').trim());
      }
      return projIds.has(String(r.project_id));
    });
  }
  return all.map(r => ({ ...r, _cat: normCat(r, r._table) }));
}

function projRefById(id) {
  const p = (S.projects || []).find(x => String(x.id) === String(id));
  if (!p) return '';
  return p.factory_project_no || p.customer_project_no || p.name || String(id);
}

async function saveIssueRecord(r) {
  const now = new Date().toISOString();
  let sbId = r._sb;
  const { _sb, _table, _cat, _kind, ...clean } = r;
  const payload = JSON.stringify(clean);
  if (sbId) {
    await sbPatch('sync_data', `supabase_id=eq.${sbId}`, { payload, updated_at: now, device_id: 'ext-' + VARIANT });
  } else {
    sbId = uuid();
    await sbPost('sync_data', { table_name: 'issues', local_id: Date.now(), payload, supabase_id: sbId, is_deleted: false, updated_at: now, device_id: 'ext-' + VARIANT });
    r._sb = sbId;
  }
}

function problemCard(r) {
  const isC = r.is_customer_complaint;
  return `<div class="card" data-id="${esc(r.id)}">
    <div class="card-head">
      <div class="card-title">📸 ${esc(r.project || '—')}</div>
      ${isC ? `<span class="badge" style="background:#378ADD;color:#fff">${T('custComplaint')}</span>` : ''}
      ${r.status ? `<span class="badge ${r.status === '已处理' ? 'badge-green' : r.status === '处理中' ? 'badge-orange' : 'badge-red'}">${esc(dispTr(r.status))}</span>` : ''}
    </div>
    <div class="card-meta">
      ${r.problem_category ? `<span>${T('lblCat')}:${esc(dispTr(r.problem_category))}</span>` : ''}
      ${isC && r.customer_code ? `<span>🗣️ ${esc(r.customer_code)}</span>` : ''}
      <span>🕒 ${esc((r.created_at || '').slice(0, 16))}</span>
    </div>
    ${r.description ? `<div class="card-desc">${esc((r.description || '').slice(0, 120))}</div>` : ''}
  </div>`;
}

function issueCard(r) {
  const proj = projRefById(r.project_id);
  const sev = r.severity || 'medium';
  return `<div class="card" data-id="${esc(r.id)}">
    <div class="card-head">
      <div class="card-title">🛠 ${esc(proj || '—')}</div>
      <span class="badge" style="background:#7a4fb5;color:#fff">${T('intIssue')}</span>
      ${r.status ? `<span class="badge ${r.status === 'closed' || r.status === '已解决' || r.status === 'resolved' ? 'badge-green' : (r.status === '处理中' || r.status === 'in_progress' || r.status === 'open') ? 'badge-orange' : 'badge-red'}">${esc(dispTr(r.status))}</span>` : ''}
    </div>
    <div class="card-meta">
      ${r.title ? `<span>${T('lblTitle')}:${esc(r.title)}</span>` : ''}
      ${r.severity ? `<span>${T('lblLevel')}:${esc(sev)}</span>` : ''}
      ${r.issue_type ? `<span>${T('lblCat')}:${esc(r.issue_type)}</span>` : ''}
      <span>🕒 ${esc((r.created_at || '').slice(0, 16))}</span>
    </div>
    ${r.description ? `<div class="card-desc">${esc((r.description || '').slice(0, 120))}</div>` : ''}
  </div>`;
}

function problemCommentsHtml(r) {
  const cmts = asCmtArr(r.comments);
  return `<div class="cmt-box">
    <div class="cmt-title">💬 ${T('cmtTitle')}</div>
    ${cmts.length ? cmts.map(c => `<div class="cmt">
      <div class="cmt-top"><span class="cmt-u">${esc(c.u || '?')}</span>${c.country ? `<span class="cmt-c">🏳️ ${esc(c.country)}</span>` : ''}<span class="cmt-t">${esc(cmtFmt(c.t))}</span></div>
      <div class="cmt-m">${esc(c.m || '')}</div></div>`).join('') : '<div class="empty-sm">—</div>'}
    <div class="cmt-row"><input type="text" id="cmt-${esc(r.id)}" maxlength="500" placeholder="${T('commentPlaceholder')}" onkeydown="if(event.key==='Enter')cpwaAddComment('${esc(r.id)}')">
      <button type="button" class="btn btn-primary" style="width:auto;padding:8px 14px;font-size:13px" onclick="cpwaAddComment('${esc(r.id)}')">${T('submit')}</button></div>
  </div>`;
}

async function cpwaAddComment(id) {
  const r = findProblem(id);
  const inp = $('cmt-' + id);
  if (!r || !inp) return;
  const m = inp.value.trim();
  if (!m) return toast(T('commentPlaceholder'));
  const sess = getSession();
  r.comments = asCmtArr(r.comments);
  r.comments.push({ u: sess ? sess.name : '?', m, t: new Date().toISOString() });
  try {
    if (r._table === 'field_log') await saveFieldLogRecord(r);
    else await saveIssueRecord(r);
    toast(T('submitted')); if (S.tab === 'records') renderSummary(); else if (S.tab === 'onsite') renderOnsite(); else if (S.tab === 'news') renderNews();
  } catch (e) { toast(T('errNet'), true); }
}
// 留言发送由 inline onclick 字符串调用，esbuild 会改名顶层函数名；
// 显式挂到 window，保证 onclick="cpwaAddComment('id')" 在运行时能命中。
window.cpwaAddComment = cpwaAddComment;

function findProblem(id) {
  return (S.problems || []).find(x => String(x.id) === String(id));
}



// 只读详情：展示完整字段 + 留言板（客户可在下方留言，但不可改记录字段）
function openProblem(r) {
  const sess = getSession();
  const canManage = (r._table === 'field_log' || r.is_customer_complaint) && (
    sess.role === 'super' ||
    (IS_CUSTOMER && String(r.customer_code || '').toLowerCase() === String(sess.value).toLowerCase()) ||
    (IS_FACTORY && String(r.problem_factory || '').toLowerCase() === String(sess.name || '').toLowerCase())
  );
  const skip = new Set(['id', '_sb', 'is_deleted', 'created_at', 'updated_at', 'comments', 'photos']);
  const rows = Object.entries(r)
    .filter(([k, v]) => !skip.has(k) && v !== '' && v != null)
    .map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  const photosHtml = (Array.isArray(r.photos) && r.photos.length)
    ? `<div class="photo-row">${r.photos.map(p => `<div class="photo-thumb"><img src="${p.data}" alt="${esc(p.name)}"></div>`).join('')}</div>` : '';
  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head"><div><div class="sheet-title">${esc(r.project || projRefById(r.project_id) || '—')}</div>
      <div class="sheet-sub">${r.is_customer_complaint ? T('custComplaint') : (r._kind === 'issues' ? T('intIssue') : T('problems'))} · ${esc(r.status || '')}</div></div>
      <button class="sheet-x" id="m-xo">✕</button></div>
    <div class="kv-list">${rows || '<div class="empty-sm">—</div>'}</div>
    ${photosHtml}
    ${problemCommentsHtml(r)}
    ${canManage ? `<div class="sheet-actions" style="display:flex;gap:8px;margin-top:10px">
      <button class="btn-main" id="op-edit" style="flex:1">✎ ${TE('editRecord')}</button>
      <button class="btn-main danger" id="op-del" style="flex:1;background:#b8461f">🗑 ${TE('btnDelete')}</button>
    </div>` : ''}
    <div class="spacer"></div>
  </div>`;
  $('modal').classList.add('open');
  $('m-xo').onclick = closeModal;
  $('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
  if (canManage) {
    $('op-edit').onclick = () => openComplaintForm(null, r);
    $('op-del').onclick = () => deleteExtRecord(r, 'complaint');
  }
}

function renderComplaintFab() {
  let fab = $('complaint-fab');
  if (!fab) {
    fab = document.createElement('button');
    fab.id = 'complaint-fab';
    fab.className = 'fab';
    fab.textContent = '＋';
    fab.title = T('submitComplaint');
    fab.onclick = () => openComplaintForm(null);
    $('app').appendChild(fab);
  }
}

// 客诉/现场记录提交表单：客户自选 生产/工程/制程/品质 类别（rec 存在则进入编辑模式）
function openComplaintForm(p, rec) {
  const isEdit = !!(rec && rec._sb);
  const projOpts = `<option value="">${T('notSelected')}</option>` + (S.projects || []).map(pr => {
    const val = pr.factory_project_no || pr.customer_project_no || pr.name || pr.id || '';
    const sel = (rec && rec.project === val) ? ' selected' : '';
    return `<option value="${esc(val)}"${sel}>${esc(val)}</option>`;
  }).join('');
  const sess = getSession();
  const projVal = (rec && rec.project) ? rec.project : (p ? (p.factory_project_no || p.customer_project_no || '') : '');
  const catVal = (rec && rec.problem_category) ? rec.problem_category : '生产';
  const descVal = (rec && rec.description) ? rec.description : '';
  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head"><div><div class="sheet-title">${isEdit ? TE('editRecord') : T('submitComplaint')}</div>
      <div class="sheet-sub">${T('custComplaint')} · CPWA</div></div>
      <button class="sheet-x" id="m-xc">✕</button></div>
    <label class="lbl">${T('complaintProject')}</label>
    <select id="cf-project" class="inp">${projOpts}</select>
    <label class="lbl">${T('complaintCat')}</label>
    <select id="cf-cat" class="inp">
      <option value="生产"${catVal === '生产' ? ' selected' : ''}>${T('catProd')}</option><option value="工程"${catVal === '工程' ? ' selected' : ''}>${T('catEng')}</option>
      <option value="制程"${catVal === '制程' ? ' selected' : ''}>${T('catProc')}</option><option value="品质"${catVal === '品质' ? ' selected' : ''}>${T('catQual')}</option>
    </select>
    <label class="lbl">${T('complaintDesc')}</label>
    <textarea id="cf-desc" class="inp" rows="5" placeholder="${T('descPlaceholder')}">${esc(descVal)}</textarea>
    <button class="btn-main" id="cf-send">${isEdit ? TE('btnSave') : T('submit')}</button>
    <button class="btn-ghost" id="cf-cancel">${T('cancel')}</button>
    ${isEdit ? `<button class="btn-main danger" id="cf-del" style="background:#b8461f">${TE('btnDelete')}</button>` : ''}
    <div class="spacer"></div>
  </div>`;
  if (p && !rec) { const pe = $('cf-project'); if (pe) pe.value = (p.factory_project_no || p.customer_project_no || ''); }
  if (rec) { const pe = $('cf-project'); if (pe && projVal) pe.value = projVal; }
  $('modal').classList.add('open');
  $('m-xc').onclick = closeModal;
  $('cf-cancel').onclick = closeModal;
  if (isEdit) {
    $('cf-del').onclick = () => deleteExtRecord(rec, 'complaint');
  }
  $('cf-send').onclick = async () => {
    const btn = $('cf-send'); btn.disabled = true; btn.textContent = '…';
    const base = isEdit ? { ...rec } : {
      id: 'cf_' + Date.now(),
      status: '待处理', is_customer_complaint: true,
      customer_code: sess ? sess.value : '', brand_code: sess ? (sess.brand || '') : '',
      customer_name: sess ? sess.name : '', reporter: sess ? (sess.user_name || sess.name) : '客户',
      reporter_account: sess ? (sess.account || '') : '',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), comments: [],
    };
    base.project = $('cf-project').value.trim();
    base.problem_category = $('cf-cat').value;
    base.description = $('cf-desc').value.trim();
    base.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (!base.description) { btn.disabled = false; btn.textContent = isEdit ? TE('btnSave') : T('submit'); return toast(T('complaintDesc'), true); }
    if (!base.project) { btn.disabled = false; btn.textContent = isEdit ? TE('btnSave') : T('submit'); return toast(T('complaintProject'), true); }
    try {
      await saveFieldLogRecord(base);
      closeModal(); toast(isEdit ? TE('saved') : T('submitted'));
      await refreshData(); switchTab('records');
    } catch (e) { btn.disabled = false; btn.textContent = isEdit ? TE('btnSave') : T('submit'); toast(T('errNet'), true); }
  };
}

/* ══════════════════════════════════════════════════════════════════════
 * 现场记录编辑器（与 PWA「现场记录」模块对齐）
 * 工厂端：提交「生产问题」(field_log, is_customer_complaint=false)
 * 客户端：提交「客诉」(field_log, is_customer_complaint=true)
 * 字段：生产项目 / 问题发生工厂 / 问题类别 / 生产问题叙述 / 处理状态 /
 *       现场照片(自动压缩，最多3张) / 现场定位(GPS) / 报告人邮箱。
 * 保存写入 sync_data(field_log) → 自动同步进 PWA 现场记录模块，
 * 工厂端的「问题」、客户端的「客诉」因此与 PWA 完全打通。
 * ══════════════════════════════════════════════════════════════════════ */
const FL_MAX_PHOTOS = 3;

async function flAddPhotos(input) {
  const files = Array.from(input.files || []).filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  let added = 0;
  for (const f of files) {
    if ((S._flPhotos || []).length >= FL_MAX_PHOTOS) { toast(TE('flMaxPhotos')); break; }
    try {
      const dataUrl = await flCompress(f, 1280, 0.55);
      S._flPhotos = S._flPhotos || [];
      S._flPhotos.push({ data: dataUrl, name: f.name || ('photo_' + Date.now()), size: Math.round(dataUrl.length * 0.75) });
      added++;
    } catch (e) { toast(TE('flPhotoFail')); }
  }
  input.value = '';
  flRenderPhotos();
  if (added > 0 && (S._flPhotos || []).length >= FL_MAX_PHOTOS) toast(TE('flMaxPhotos'));
}

function flCompress(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const r = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * r); height = Math.round(height * r);
        }
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        c.toBlob(b => {
          if (!b) return reject(new Error('compress'));
          const rd = new FileReader();
          rd.onerror = () => reject(new Error('encode'));
          rd.onload = () => resolve(rd.result);
          rd.readAsDataURL(b);
        }, 'image/jpeg', quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function flRenderPhotos() {
  const box = $('fl-photos');
  if (!box) return;
  const photos = S._flPhotos || [];
  if (!photos.length) { box.innerHTML = ''; return; }
  box.innerHTML = photos.map((p, i) => `<div class="photo-thumb"><img src="${p.data}" alt="${esc(p.name)}"><span class="photo-x" onclick="flDelPhoto(${i})">✕</span></div>`).join('');
}
window.flDelPhoto = function (i) { (S._flPhotos || []).splice(i, 1); flRenderPhotos(); };

async function flReverseGeocode(lat, lon) {
  const out = { country: '', city: '', region: '' };
  const tryBigData = async () => {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error('bdc');
    const d = await r.json();
    out.country = d.countryName || ''; out.city = d.city || d.locality || ''; out.region = d.principalSubdivision || '';
    if (!out.country) throw new Error('nocity');
  };
  const tryNominatim = async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=zh`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error('nom');
    const d = await r.json(); const a = d.address || {};
    out.country = a.country || ''; out.city = a.city || a.town || a.village || a.municipality || ''; out.region = a.state || a.county || a.region || '';
    if (!out.country) throw new Error('nocity');
  };
  try { await tryBigData(); } catch (e) { try { await tryNominatim(); } catch (e2) {} }
  return out;
}

function flLocText(rec) {
  const country = (rec && rec.gps_country) || '';
  const region = (rec && rec.gps_region) || '';
  const city = (rec && rec.gps_city) || '';
  const parts = [country, region, city].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  if (rec && rec.gps) return rec.gps;
  return '';
}

function flCaptureGPS() {
  if (!navigator.geolocation) { toast(TE('flNoGeo')); return; }
  const btn = $('fl-gps-btn'); if (btn) btn.textContent = TE('flLocating');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    S._flGps = lat.toFixed(5) + ',' + lon.toFixed(5);
    let place = '';
    try { const g = await flReverseGeocode(lat, lon); S._flGpsCountry = g.country || ''; S._flGpsCity = g.city || ''; S._flGpsRegion = g.region || ''; place = flLocText({ gps_country: g.country, gps_region: g.region, gps_city: g.city, gps: S._flGps }); } catch (e) {}
    if (btn) btn.textContent = place ? ('✅ ' + place) : (TE('flLocOk') + ' ' + S._flGps);
    toast(TE('flLocRec'));
  }, err => { if (btn) btn.textContent = TE('flGPS'); toast(TE('flLocFail') + err.message); }, { enableHighAccuracy: true, timeout: 8000 });
}
window.flCaptureGPS = flCaptureGPS;
window.flAddPhotos = flAddPhotos;

function openFieldLogEditor(rec, p) {
  const sess = getSession();
  const isEdit = !!(rec && rec._sb);
  const isComplaint = rec ? !!rec.is_customer_complaint : IS_CUSTOMER;
  const projects = S.projects || [];
  const facs = (S.factories || []);
  const projOpts = `<option value="">${T('notSelected')}</option>` + projects.map(pr => {
    const v = pr.factory_project_no || pr.customer_project_no || pr.name || pr.id || '';
    const sel = (rec && rec.project === v) ? ' selected' : '';
    return `<option value="${esc(v)}"${sel}>${esc(v)}</option>`;
  }).join('');
  const facOpts = `<option value="">${T('notSelected')}</option>` + facs.map(f => {
    const v = f.factory_name || '';
    const sel = (rec && rec.problem_factory === v) ? ' selected' : '';
    return `<option value="${esc(v)}"${sel}>${esc(v)}</option>`;
  }).join('');
  const newRec = rec || { id: 'fl_' + Date.now(), status: '待处理', is_customer_complaint: isComplaint, created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), comments: [] };
  S._flPhotos = rec && rec.photos ? rec.photos.slice() : [];
  S._flEditingId = newRec.id;
  S._flGps = rec && rec.gps ? rec.gps : '';
  S._flGpsCountry = rec && rec.gps_country ? rec.gps_country : '';
  S._flGpsCity = rec && rec.gps_city ? rec.gps_city : '';
  S._flGpsRegion = rec && rec.gps_region ? rec.gps_region : '';
  const catVal = (rec && rec.problem_category) || '生产';
  const descVal = (rec && rec.description) ? rec.description : '';
  const statusVal = (rec && rec.status) ? rec.status : '待处理';
  const projVal = (rec && rec.project) ? rec.project : (p ? (p.factory_project_no || p.customer_project_no || '') : (projects[0] ? (projects[0].factory_project_no || projects[0].customer_project_no || '') : ''));
  const facVal = (rec && rec.problem_factory) ? rec.problem_factory : (IS_FACTORY ? (sess ? sess.name : '') : '');
  const repEmail = (rec && rec.reporter_email) || '';
  const respEmail = (rec && rec.responsible_email) || '';
  const repName = (rec && rec.reporter) || (sess ? (sess.user_name || sess.name) : '');
  $('modal').innerHTML = `
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head"><div><div class="sheet-title">${isEdit ? TE('flEdit') : TE('flNew')}</div>
      <div class="sheet-sub">${isComplaint ? T('custComplaint') : TE('flOnsite')} · ${CFG.code}</div></div>
      <button class="sheet-x" id="m-xf">✕</button></div>
    <label class="lbl">${TE('flProject')}</label>
    <select id="fl-project" class="inp">${projOpts}</select>
    ${IS_FACTORY ? `<label class="lbl">${TE('flFactory')}</label><select id="fl-factory" class="inp">${facOpts}</select>` : ''}
    <label class="lbl">${TE('flCategory')}</label>
    <select id="fl-cat" class="inp">
      ${['工程','品质','制程','生产','客诉'].map(c => `<option value="${esc(c)}"${catVal === c ? ' selected' : ''}>${esc(dispTr(c))}</option>`).join('')}
    </select>
    <label class="lbl">${TE('flDesc')}</label>
    <textarea id="fl-desc" class="inp" rows="5" placeholder="${esc(TE('flDescPh'))}">${esc(descVal)}</textarea>
    <label class="lbl">${TE('flStatus')}</label>
    <select id="fl-status" class="inp">
      ${['待处理','处理中','已处理'].map(s => `<option value="${esc(s)}"${statusVal === s ? ' selected' : ''}>${esc(dispTr(s))}</option>`).join('')}
    </select>
    <label class="lbl">${TE('flRecorder')}</label>
    <input id="fl-rep" class="inp" type="text" placeholder="${esc(TE('flRecorder'))}" value="${esc(repName)}">
    <label class="lbl">${TE('flPhotos')}</label>
    <input type="file" id="fl-photos-input" accept="image/*" multiple style="display:none" onchange="flAddPhotos(this)">
    <button type="button" class="btn btn-secondary" style="width:100%;margin-bottom:8px" onclick="document.getElementById('fl-photos-input').click()">📷 ${TE('flPickPhoto')}</button>
    <div class="photo-row" id="fl-photos"></div>
    <button class="btn btn-secondary" id="fl-gps-btn" onclick="flCaptureGPS()" style="margin-bottom:8px">${TE('flGPS')}</button>
    <label class="lbl">${TE('flReporterEmail')}</label>
    <input id="fl-rep-email" class="inp" type="email" placeholder="name@gunbase.com" value="${esc(repEmail)}">
    <label class="lbl">${TE('flRespEmail')}</label>
    <input id="fl-resp-email" class="inp" type="email" placeholder="负责同事邮箱" value="${esc(respEmail)}">
    <button class="btn-main" id="fl-save">${isEdit ? TE('btnSave') : T('submit')}</button>
    <button class="btn-ghost" id="fl-cancel">${T('cancel')}</button>
    ${isEdit ? `<button class="btn-main danger" id="fl-del" style="background:#b8461f">${TE('btnDelete')}</button>` : ''}
    <div class="spacer"></div>
  </div>`;
  if (projVal) { const pe = $('fl-project'); if (pe) pe.value = projVal; }
  if (IS_FACTORY && facVal) { const fe = $('fl-factory'); if (fe) fe.value = facVal; }
  $('modal').classList.add('open');
  $('m-xf').onclick = closeModal;
  $('fl-cancel').onclick = closeModal;
  flRenderPhotos();
  const gpsBtn = $('fl-gps-btn'); if (gpsBtn) { const ep = flLocText(newRec); gpsBtn.textContent = ep ? ('📍 ' + ep) : TE('flGPS'); }
  if (isEdit) { const dr = rec; $('fl-del').onclick = () => deleteExtRecord(dr, 'fieldlog'); }
  $('fl-save').onclick = async () => {
    const btn = $('fl-save'); btn.disabled = true; btn.textContent = '…';
    const base = isEdit ? { ...rec } : {
      id: newRec.id, is_customer_complaint: isComplaint,
      customer_code: isComplaint ? (sess ? sess.value : '') : '',
      brand_code: isComplaint ? (sess ? (sess.brand || '') : '') : '',
      customer_name: isComplaint ? (sess ? sess.name : '') : '',
      reporter: isComplaint ? (sess ? (sess.user_name || sess.name) : '客户') : (sess ? sess.name : ''),
      reporter_account: sess ? (sess.account || '') : '',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), comments: [],
    };
    base.project = $('fl-project').value.trim();
    if (IS_FACTORY) base.problem_factory = $('fl-factory') ? $('fl-factory').value.trim() : (sess ? sess.name : '');
    base.problem_category = $('fl-cat').value;
    base.description = $('fl-desc').value.trim();
    base.status = $('fl-status').value;
    base.reporter_email = $('fl-rep-email').value.trim();
    base.reporter = $('fl-rep').value.trim();
    base.responsible_email = $('fl-resp-email').value.trim();
    base.photos = (S._flPhotos || []).slice();
    base.gps = S._flGps || '';
    base.gps_country = S._flGpsCountry || ''; base.gps_city = S._flGpsCity || ''; base.gps_region = S._flGpsRegion || '';
    base.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (!base.description && !base.project) { btn.disabled = false; btn.textContent = isEdit ? TE('btnSave') : T('submit'); return toast(TE('flFillProjOrDesc'), true); }
    try {
      await saveFieldLogRecord(base);
      closeModal(); toast(isEdit ? TE('flSaved') : TE('flIssued'));
      await refreshData(); switchTab('onsite');
    } catch (e) { btn.disabled = false; btn.textContent = isEdit ? TE('btnSave') : T('submit'); toast(T('errNet'), true); }
  };
}

/* ─────────── 通用删除（软删：置 is_deleted=true）─────────── */
// 同时过滤 S.records（工厂上报）与 S.problems（含客诉），按 supabase_id 定位
async function deleteExtRecord(rec, kind) {
  if (!rec || !rec._sb) return;
  if (!confirm(TE('confirmDelete'))) return;
  try {
    await sbPatch('sync_data', `supabase_id=eq.${rec._sb}`, { is_deleted: true, updated_at: new Date().toISOString() });
    S.records = (S.records || []).filter(x => String(x._sb) !== String(rec._sb));
    S.problems = (S.problems || []).filter(x => String(x._sb) !== String(rec._sb));
    closeModal();
    toast(TE('deleted'));
    switchTab(S.tab || 'records');
  } catch (e) { toast(T('errNet'), true); }
}
function findRecord(sb) { return (S.records || []).find(x => String(x._sb) === String(sb)); }
function recordActions(r) {
  return `<div class="rec-actions">
    <button class="rec-edit" data-sb="${esc(r._sb)}">✎ ${TE('editRecord')}</button>
    <button class="rec-del" data-sb="${esc(r._sb)}">🗑 ${TE('btnDelete')}</button>
  </div>`;
}

/* ─────────── 现场 / 汇总 / 新闻（三端统一区块）─────────── */
function weekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now); mon.setDate(now.getDate() - (day - 1)); mon.setHours(0, 0, 0, 0);
  const nd = new Date(mon); nd.setDate(mon.getDate() + 7);
  const f = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return [f(mon), f(nd)];
}
const CATS = ['生产', '工程', '制程', '品质'];
// 现场大标题多语言映射（内部键 → EXT 词典 key）
const CAT_TR = { '生产': 'catProd', '工程': 'catEng', '制程': 'catProc', '品质': 'catQual' };
const STATUS_TR = { '待处理': 'stPend', '处理中': 'stDoing', '已处理': 'stDone', '已解决': 'stDone' };
function dispTr(v) { if (v == null) return v; const k = STATUS_TR[v] || CAT_TR[v]; return k ? (TE(k) || v) : v; }
// 归一化：主 PWA 的 issue_type / 问题表名 可能是英文(production/engineering/quality)或中文，
// 统一映射到 FPWA/CPWA 现场的 4 类，确保两端「串在一起」
const CATMAP = {
  production: '生产', '生产': '生产',
  engineering: '工程', '工程': '工程', eng: '工程',
  factory_process: '制程', '制程': '制程', process: '制程',
  quality: '品质', '品质': '品质', '质量': '品质',
};
function normCat(r, table) {
  if (table === 'engineering') return '工程';
  if (table === 'factory_process') return '制程';
  if (table === 'production') return '生产';
  if (table === 'quality') return '品质';
  const t = r.issue_type || r.problem_category || '';
  return CATMAP[t] || '';
}
function catItems(cat) {
  return (S.problems || [])
    .filter(r => r._cat === cat)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}
function kpiPending() {
  const P = S.problems || [];
  return P.filter(r => r._table === 'issues' && r.status === 'open').length
    + P.filter(r => r._table === 'field_log' && r.is_customer_complaint && r.status !== '已处理').length;
}
function kpiWeeklyDoa() {
  const [ms, ne] = weekRange();
  return (S.doa || []).filter(r => { const d = (r.date || '').slice(0, 10); return d && d >= ms && d < ne; }).length;
}
function kpiWeeklyComp() {
  const [ms, ne] = weekRange();
  return (S.problems || []).filter(r => r._table === 'field_log' && r.is_customer_complaint && (r.created_at || '').slice(0, 10) >= ms && (r.created_at || '').slice(0, 10) < ne).length;
}
function kpiCard(num, label, color) {
  return `<div class="kpi-card"><div class="kpi-dot" style="background:${color}"></div>
    <div class="kpi-num" style="color:${color}">${num}</div><div class="kpi-label">${esc(label)}</div></div>`;
}
function renderOnsite() {
  const m = $('main');
  const kpis = [kpiCard(kpiPending(), TL('pending'), '#EF9F27')];
  if (IS_FACTORY) kpis.push(kpiCard(kpiWeeklyDoa(), TL('weeklyDoa'), '#D85A30'));
  else kpis.push(kpiCard(kpiWeeklyComp(), TL('weeklyComp'), '#378ADD'));
  const secs = CATS.map(cat => {
    const items = catItems(cat);
    return `<section class="cat-sec">
      <div class="cat-head"><span>${esc(TE(CAT_TR[cat] || cat))}${esc(TE('probSuffix'))}</span><span class="cat-count">${items.length}</span></div>
      <div class="list">${items.length ? items.slice(0, 10).map(r => r._kind === 'issues' ? issueCard(r) : problemCard(r)).join('') : '<div class="empty-sm">—</div>'}</div>
    </section>`;
  }).join('');
  m.innerHTML = `<div class="onsite">
    <div class="kpi-strip">${kpis.join('')}</div>
    <div class="onsite-actions"><button class="btn-main" id="btn-onsite-new">＋ ${IS_FACTORY ? TE('flRaiseIssue') : T('submitComplaint')}</button></div>
    <div class="cat-grid">${secs}</div>
  </div>`;
  const ob = $('btn-onsite-new');
  if (ob) ob.onclick = () => openFieldLogEditor(null);
  document.querySelectorAll('.onsite .card').forEach(c => {
    c.onclick = () => { const r = findProblem(c.dataset.id); if (r) openProblem(r); };
  });
}
function renderNews() {
  const m = $('main');
  const news = (S.news || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 40);
  const items = news.length ? news.map(n => `
    <a class="news-item" href="${esc(n.url)}" target="_blank" rel="noopener">
      <div class="ni-title">${esc(n.title)}</div>
      <div class="ni-meta"><span>📅 ${esc(n.date || '')}</span>${n.source ? `<span>· ${esc(n.source)}</span>` : ''}</div>
      <div class="ni-sum">${esc(n.summary || '')}</div>
    </a>`).join('') : `<div class="empty"><div class="empty-ico">📰</div><div>No industry news yet</div></div>`;
  m.innerHTML = `<div class="news-full">
    <div class="news-head"><div class="news-title">🎧 Headphone Industry News</div></div>
    ${news.length && news[0].date ? `<div class="news-upd">Updated ${esc(news[0].date)} · ${TE('newsUpdNote')}</div>` : ''}
    <div class="news-list">${items}</div>
  </div>`;
}

/* ─────────── 数据刷新 ─────────── */
async function refreshData() {
  try {
    S.projects = await loadProjects();
    if (IS_FACTORY || IS_CUSTOMER) { try { S.news = await loadNews(); } catch (e) { S.news = []; } }
    // 统一拉取 PWA 全部问题表（issues/engineering/factory_process/production/quality/field_log），
    // 归一化到 4 类（生产/工程/制程/品质），使 FPWA/CPWA 现场与 PWA「串在一起」
    S.problems = await loadProblems();
    S.factories = await loadTable('factory_info', 500);
    if (IS_FACTORY) {
      S.doa = await loadTable('doa', 2000);
      S.records = await loadRecords();
    } else {
      S.doa = [];
    }
    if (S.tab === 'onsite') renderOnsite();
    else if (S.tab === 'records') renderSummary();
    else if (S.tab === 'news') renderNews();
    else if (S.tab === 'settings') renderSettings();
  } catch (e) { toast(T('errNet'), true); }
}

/* ─────────── 启动 ─────────── */
async function boot() {
  const sess = getSession();
  if (!sess) {
    if (!S.idents.length) {
      $('app').innerHTML = `<div class="empty"><div class="empty-ico">⏳</div><div>${T('loading')}</div></div>`;
      try { S.idents = await loadIdents(); }
      catch { S.idents = []; toast(T('errNet'), true); }
    }
    return renderLogin();
  }
  renderShell();
  $('main').innerHTML = `<div class="empty"><div class="empty-ico">⏳</div><div>${T('loading')}</div></div>`;
  await refreshData();
}

boot();
