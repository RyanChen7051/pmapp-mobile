/* FPWA — PMApp Factory Portal v0.1.0 (build 2) */
(()=>{var $="https://nsnmtkukxquhinlmbejg.supabase.co",S="sb_publishable_YB5z3cQK-vCg67--oKpSrg_63STgMJW";var b="factory",p=b==="factory",o={factory:{code:"FPWA",appName:"PMApp Factory",appNameEn:"PMApp Factory",theme:"#1e6b3a",themeDark:"#155230",accentBg:"#eaf5ec",tagline:"\u5408\u4F5C\u5DE5\u5382\u534F\u540C\u5E73\u53F0",taglineEn:"Partner Factory Portal",roleLabel:"\u9009\u62E9\u5DE5\u5382",roleLabelEn:"Select Factory",idKey:"factory_id",idLabel:"\u5DE5\u5382",accessCode:"fpwa2026",sessionKey:"pmapp_fpwa_session",reportTable:"fpwa_report",idSource:"factory_info",idValueKey:"id",idTextKey:"factory_name",hideFields:[]},customer:{code:"CPWA",appName:"PMApp \u5BA2\u6237\u4E2D\u5FC3",appNameEn:"PMApp Customer Portal",theme:"#0e5a8a",themeDark:"#0a4370",accentBg:"#e8f2f9",tagline:"\u5BA2\u6237\u9879\u76EE\u534F\u540C\u5E73\u53F0",taglineEn:"Customer Project Portal",roleLabel:"\u9009\u62E9\u5BA2\u6237\u9879\u76EE",roleLabelEn:"Select Your Program",idKey:"customer_project_no",idLabel:"\u5BA2\u6237",accessCode:"cpwa2026",sessionKey:"pmapp_cpwa_session",reportTable:"cpwa_feedback",idSource:"project_info",idValueKey:"customer_project_no",idTextKey:"customer_project_no",hideFields:["factory_id","production_factory"]}}[b],T={NPI:10,EVT:25,DVT:50,PVT:75,MP:100,completed:100},w=["NPI","EVT","DVT","PVT","MP"],R={factory:[{u:"cfx",h:"3183b467799a1da1b60021beb57f96d8",id:"1",name:"Calnifonix (CFX)"},{u:"zettown",h:"87e8fb338f032288e1fa7de92a6ba298",id:"2",name:"Zet Town"},{u:"hipph",h:"41c65a946ab0e834147025b9b9f7e5b9",id:"3",name:"Hi-P (Philippines)"},{u:"hipvn",h:"eb26f948bcf44c14065d2432cc293175",id:"4",name:"Hi-P (Vietnam)"},{u:"iljin",h:"8eada784e730e793ef90baa309e0f74e",id:"5",name:"ILJIN"},{u:"pct",h:"a111e50bfa3d9bf1f5854dc87f37d13b",id:"6",name:"PCT"}],customer:[{u:"nirvana",h:"ce93e15ea8db21be18b3279306e41c0b",id:"Nirvana Ion V2",name:"Nirvana Ion V2"},{u:"nirvana2",h:"a45dc0fd1af6b0ae08c62a32d9aa3510",id:"Nirvana Ion ANC Gen 2",name:"Nirvana Ion ANC Gen 2"},{u:"anc255",h:"131316f762841854ddba65716a0e150f",id:"255 ANC",name:"255 ANC"}]}[b];async function M(e){let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return[...new Uint8Array(t)].map(a=>a.toString(16).padStart(2,"0")).join("").slice(0,32)}var j={zh:{login:"\u767B\u5F55",selectRole:o.roleLabel,accessCode:"\u8BBF\u95EE\u7801",enter:"\u8FDB\u5165",myProjects:"\u6211\u7684\u9879\u76EE",noProject:"\u6682\u65E0\u9879\u76EE",loading:"\u52A0\u8F7D\u4E2D\u2026",stage:"\u9636\u6BB5",progress:"\u9879\u76EE\u8FDB\u5EA6",custNo:"\u5BA2\u6237\u9879\u76EE\u53F7",factoryNo:"\u5DE5\u5382\u9879\u76EE\u53F7",submit:"\u63D0\u4EA4",cancel:"\u53D6\u6D88",remark:"\u5907\u6CE8",qty:"\u6570\u91CF",date:"\u65E5\u671F",reportTitle:p?"\u4E0A\u62A5\u751F\u4EA7\u8FDB\u5EA6":"\u63D0\u4EA4\u53CD\u9988",myRecords:p?"\u6211\u7684\u4E0A\u62A5\u8BB0\u5F55":"\u6211\u7684\u53CD\u9988\u8BB0\u5F55",noRecord:"\u6682\u65E0\u8BB0\u5F55",logout:"\u9000\u51FA\u767B\u5F55",settings:"\u8BBE\u5B9A",language:"\u8BED\u8A00",detail:"\u9879\u76EE\u8BE6\u60C5",submitted:"\u63D0\u4EA4\u6210\u529F",errCode:"\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF",account:"\u8D26\u53F7",password:"\u5BC6\u7801",errEmpty:"\u8BF7\u8F93\u5165\u8D26\u53F7\u4E0E\u5BC6\u7801",errNet:"\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5",errSelect:"\u8BF7\u5148\u9009\u62E9"+o.idLabel,allFields:"\u5168\u90E8\u4FE1\u606F",refresh:"\u5237\u65B0",ok:"\u6210\u529F"},en:{login:"Sign In",selectRole:o.roleLabelEn,accessCode:"Access Code",enter:"Enter",myProjects:"My Projects",noProject:"No projects yet",loading:"Loading\u2026",stage:"Stage",progress:"Progress",custNo:"Customer Program",factoryNo:"Factory P/N",submit:"Submit",cancel:"Cancel",remark:"Remarks",qty:"Quantity",date:"Date",reportTitle:p?"Report Production":"Submit Feedback",myRecords:p?"My Reports":"My Feedback",noRecord:"No records",logout:"Sign Out",settings:"Settings",language:"Language",detail:"Project Detail",submitted:"Submitted",errCode:"Invalid account or password",account:"Account",password:"Password",errEmpty:"Enter account & password",errNet:"Network error, please retry",errSelect:"Please select "+o.idLabel,allFields:"Full Information",refresh:"Refresh",ok:"OK"}},c=localStorage.getItem(o.sessionKey+"_lang")||"zh",s=e=>j[c]&&j[c][e]||e,N=()=>({apikey:S,Authorization:"Bearer "+S,"Content-Type":"application/json"}),K=()=>crypto?.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});async function F(e,t){let a=await fetch(`${$}/rest/v1/${e}?${t||""}`,{headers:N()});if(!a.ok)throw new Error("GET "+a.status);return a.json()}async function q(e,t){let a=await fetch(`${$}/rest/v1/${e}`,{method:"POST",headers:{...N(),Prefer:"return=representation"},body:JSON.stringify(t)});if(!a.ok)throw new Error("POST "+a.status+" "+(await a.text()).slice(0,160));return a.json()}async function k(e,t=1e3){return(await F("sync_data",`select=supabase_id,table_name,payload,updated_at&table_name=eq.${encodeURIComponent(e)}&limit=${t}`)||[]).map(i=>{let l=i.payload;if(typeof l=="string")try{l=JSON.parse(l)}catch{l={}}return{_sb:i.supabase_id,...l||{}}}).filter(i=>!i.is_deleted)}async function z(e){let t=new Date().toISOString();return q("sync_data",{table_name:o.reportTable,payload:JSON.stringify({...e,variant:b,created_at:t}),local_id:Date.now(),supabase_id:K(),is_deleted:!1,updated_at:t,device_id:"ext-"+b})}function v(){try{return JSON.parse(localStorage.getItem(o.sessionKey)||"null")}catch{return null}}function O(e){localStorage.setItem(o.sessionKey,JSON.stringify(e))}function E(){localStorage.removeItem(o.sessionKey)}var d={idents:[],projects:[],records:[],current:null},n=e=>document.getElementById(e),r=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");function g(e,t){let a=n("toast");a.textContent=e,a.style.background=t?"#b8461f":"#1e6b3a",a.classList.add("show"),setTimeout(()=>a.classList.remove("show"),2400)}async function H(){let e=v();return e?(await k("project_info")).filter(a=>{let i=a[o.idKey];return i!=null&&String(i).trim()===String(e.value).trim()}):[]}async function U(){let e=v();return e?(await k(o.reportTable,500)).filter(a=>String(a.ident)===String(e.value)).sort((a,i)=>String(i.created_at||"").localeCompare(String(a.created_at||""))):[]}function L(){n("app").innerHTML=`
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <div class="brand-badge">${o.code}</div>
        <div>
          <div class="brand-name">${c==="zh"?o.appName:o.appNameEn}</div>
          <div class="brand-sub">${c==="zh"?o.tagline:o.taglineEn}</div>
        </div>
      </div>
      <label class="lbl">${s("account")}</label>
      <input id="inp-user" class="inp" type="text" placeholder="${s("account")}" autocomplete="username" autocapitalize="off">
      <label class="lbl">${s("password")}</label>
      <input id="inp-code" class="inp" type="password" placeholder="${s("password")}" autocomplete="current-password">
      <button class="btn-main" id="btn-login">${s("enter")}</button>
      <button class="btn-lang" id="btn-lang">\u{1F310} ${c==="zh"?"English":"\u4E2D\u6587"}</button>
      <div class="hint">${o.code} \xB7 \u5916\u90E8\u534F\u4F5C\u7AEF \xB7 v0.1.0</div>
    </div>
  </div>`,n("btn-lang").onclick=()=>{c=c==="zh"?"en":"zh",localStorage.setItem(o.sessionKey+"_lang",c),L()},n("btn-login").onclick=P,n("inp-code").onkeydown=e=>{e.key==="Enter"&&P()}}async function P(){let e=(n("inp-user")?.value||"").trim().toLowerCase(),t=n("inp-code")?.value||"";if(!e||!t)return g(s("errEmpty"),!0);let a="";try{a=await M(t)}catch{a=t}let i=R.find(l=>l.u===e&&l.h===a);if(!i)return g(s("errCode"),!0);O({user:i.u,value:i.id,name:i.name,at:Date.now()}),_()}function x(){let e=v();n("app").innerHTML=`
  <header class="topbar">
    <div class="tb-left">
      <div class="tb-badge">${o.code}</div>
      <div>
        <div class="tb-title">${r(e.name)}</div>
        <div class="tb-sub">${c==="zh"?o.tagline:o.taglineEn}</div>
      </div>
    </div>
    <div class="tb-right">
      <button class="tb-btn" id="btn-lang2" title="Language">\u{1F310}</button>
      <button class="tb-btn" id="btn-refresh" title="Refresh">\u21BB</button>
      <button class="tb-btn" id="btn-out" title="Logout">\u23FB</button>
    </div>
  </header>
  <main id="main"></main>
  <nav class="tabbar">
    <button class="tab active" data-tab="projects">\u{1F4E6}<span>${s("myProjects")}</span></button>
    <button class="tab" data-tab="records">\u{1F4DD}<span>${s("myRecords")}</span></button>
    <button class="tab" data-tab="settings">\u2699\uFE0F<span>${s("settings")}</span></button>
  </nav>
  <div id="modal" class="modal"></div>`,n("btn-out").onclick=()=>{E(),d.current=null,_()},n("btn-refresh").onclick=()=>h(),n("btn-lang2").onclick=()=>{c=c==="zh"?"en":"zh",localStorage.setItem(o.sessionKey+"_lang",c),x(),m(d.tab||"projects")},document.querySelectorAll(".tab").forEach(t=>{t.onclick=()=>m(t.dataset.tab)}),m("projects")}function m(e){d.tab=e,document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===e)),e==="projects"?A():e==="records"?C():I()}function D(e){let t=(e.project_stage||"").toUpperCase(),a=T[t]??5,i=w.indexOf(t);return`
  <div class="card" data-id="${r(e.id)}">
    <div class="card-head">
      <div class="card-title">${r(e.factory_project_no||e.customer_project_no||"\u2014")}</div>
      <span class="stage-badge">${r(t||"\u2014")}</span>
    </div>
    <div class="card-meta">
      ${e.customer_project_no&&!o.hideFields.includes("customer_project_no")?`<div><span>${s("custNo")}</span>${r(e.customer_project_no)}</div>`:""}
      ${o.hideFields.includes("production_factory")?"":`<div><span>${s("factoryNo")}</span>${r(e.production_factory||"\u2014")}</div>`}
    </div>
    <div class="pbar"><div class="pbar-in" style="width:${a}%"></div></div>
    <div class="pbar-txt">${s("progress")} ${a}% \xB7 ${i>=0?i+1+"/"+w.length:"\u2014"}</div>
  </div>`}function A(){let e=n("main");if(!d.projects.length){e.innerHTML=`<div class="empty"><div class="empty-ico">\u{1F4E6}</div><div>${s("noProject")}</div>
      <button class="btn-ghost" id="btn-reload">${s("refresh")}</button></div>`;let t=n("btn-reload");t&&(t.onclick=h);return}e.innerHTML=`<div class="list">${d.projects.map(D).join("")}</div>`,document.querySelectorAll(".card").forEach(t=>{t.onclick=()=>{let a=d.projects.find(i=>String(i.id)===String(t.dataset.id));a&&V(a)}})}function V(e){let t=new Set(["id","is_deleted","_sb","supabase_id","synced_at","created_at","updated_at"]),a=Object.entries(e).filter(([u,y])=>!t.has(u)&&!o.hideFields.includes(u)&&y!==""&&y!=null).map(([u,y])=>`<div class="kv"><span>${r(u)}</span><b>${r(y)}</b></div>`).join(""),i=(e.project_stage||"").toUpperCase(),l=T[i]??5;n("modal").innerHTML=`
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div>
        <div class="sheet-title">${r(e.factory_project_no||e.customer_project_no||"\u2014")}</div>
        <div class="sheet-sub">${s("detail")} \xB7 ${r(i||"\u2014")}</div>
      </div>
      <button class="sheet-x" id="m-x">\u2715</button>
    </div>
    <div class="pbar big"><div class="pbar-in" style="width:${l}%"></div></div>
    <div class="kv-list">${a||'<div class="empty-sm">\u2014</div>'}</div>
    <button class="btn-main" id="m-report">${s("reportTitle")}</button>
    <div class="spacer"></div>
  </div>`,n("modal").classList.add("open"),n("m-x").onclick=f,n("modal").onclick=u=>{u.target.id==="modal"&&f()},n("m-report").onclick=()=>B(e)}function f(){n("modal").classList.remove("open"),n("modal").innerHTML=""}function B(e){let t=new Date().toISOString().slice(0,10);n("modal").innerHTML=`
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div><div class="sheet-title">${s("reportTitle")}</div>
      <div class="sheet-sub">${r(e.factory_project_no||e.customer_project_no||"")}</div></div>
      <button class="sheet-x" id="m-x2">\u2715</button>
    </div>
    <label class="lbl">${s("date")}</label>
    <input id="f-date" class="inp" type="date" value="${t}">
    ${p?`<label class="lbl">${s("qty")}</label>
    <input id="f-qty" class="inp" type="number" placeholder="0">`:""}
    <label class="lbl">${s("remark")}</label>
    <textarea id="f-note" class="inp" rows="4" placeholder="${s("remark")}"></textarea>
    <button class="btn-main" id="f-send">${s("submit")}</button>
    <button class="btn-ghost" id="f-cancel">${s("cancel")}</button>
    <div class="spacer"></div>
  </div>`,n("m-x2").onclick=f,n("f-cancel").onclick=f,n("f-send").onclick=async()=>{let a=n("f-send");a.disabled=!0,a.textContent="\u2026";try{await z({ident:String(v().value),project:String(e.factory_project_no||e.customer_project_no||""),customer_no:String(e.customer_project_no||""),date:n("f-date").value,qty:p?Number(n("f-qty")?.value||0):null,note:n("f-note").value}),f(),g(s("submitted")),await h(),m("records")}catch{a.disabled=!1,a.textContent=s("submit"),g(s("errNet"),!0)}}}function C(){let e=n("main");if(!d.records.length){e.innerHTML=`<div class="empty"><div class="empty-ico">\u{1F4DD}</div><div>${s("noRecord")}</div></div>`;return}e.innerHTML=`<div class="list">${d.records.map(t=>`
    <div class="card flat">
      <div class="card-head">
        <div class="card-title">${r(t.project||"\u2014")}</div>
        <span class="date-badge">${r(t.date||(t.created_at||"").slice(0,10)||"")}</span>
      </div>
      ${t.qty?`<div class="card-meta"><div><span>${s("qty")}</span>${r(t.qty)}</div></div>`:""}
      ${t.note?`<div class="note">${r(t.note)}</div>`:""}
    </div>`).join("")}</div>`}function I(){n("main").innerHTML=`
  <div class="list">
    <div class="card flat">
      <div class="card-head"><div class="card-title">${o.code} v0.1.0</div></div>
      <div class="card-meta">
        <div><span>Variant</span>${b}</div>
        <div><span>${o.idLabel}</span>${r(v().name)}</div>
        <div><span>${s("myProjects")}</span>${d.projects.length}</div>
        <div><span>${s("myRecords")}</span>${d.records.length}</div>
      </div>
    </div>
    <div class="card flat">
      <div class="card-head"><div class="card-title">${s("language")}</div></div>
      <div class="lang-row">
        <button class="btn-ghost ${c==="zh"?"on":""}" data-l="zh">\u4E2D\u6587</button>
        <button class="btn-ghost ${c==="en"?"on":""}" data-l="en">English</button>
      </div>
    </div>
    <button class="btn-main danger" id="btn-out2">${s("logout")}</button>
  </div>`,document.querySelectorAll("[data-l]").forEach(e=>{e.onclick=()=>{c=e.dataset.l,localStorage.setItem(o.sessionKey+"_lang",c),x(),m("settings")}}),n("btn-out2").onclick=()=>{E(),_()}}async function h(){try{d.projects=await H(),d.records=await U(),d.tab==="projects"?A():d.tab==="records"?C():d.tab==="settings"&&I()}catch{g(s("errNet"),!0)}}async function _(){if(!v())return L();x(),n("main").innerHTML=`<div class="empty"><div class="empty-ico">\u23F3</div><div>${s("loading")}</div></div>`,await h()}_();})();
