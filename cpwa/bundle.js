/* CPWA — PMApp Customer Portal v0.1.0 (build 1) */
(()=>{var S="https://nsnmtkukxquhinlmbejg.supabase.co",x="sb_publishable_YB5z3cQK-vCg67--oKpSrg_63STgMJW";var f="customer",p=f==="factory",o={factory:{code:"FPWA",appName:"PMApp Factory",appNameEn:"PMApp Factory",theme:"#1e6b3a",themeDark:"#155230",accentBg:"#eaf5ec",tagline:"\u5408\u4F5C\u5DE5\u5382\u534F\u540C\u5E73\u53F0",taglineEn:"Partner Factory Portal",roleLabel:"\u9009\u62E9\u5DE5\u5382",roleLabelEn:"Select Factory",idKey:"factory_id",idLabel:"\u5DE5\u5382",accessCode:"fpwa2026",sessionKey:"pmapp_fpwa_session",reportTable:"fpwa_report",idSource:"factory_info",idValueKey:"id",idTextKey:"factory_name",hideFields:[]},customer:{code:"CPWA",appName:"PMApp \u5BA2\u6237\u4E2D\u5FC3",appNameEn:"PMApp Customer Portal",theme:"#0e5a8a",themeDark:"#0a4370",accentBg:"#e8f2f9",tagline:"\u5BA2\u6237\u9879\u76EE\u534F\u540C\u5E73\u53F0",taglineEn:"Customer Project Portal",roleLabel:"\u9009\u62E9\u5BA2\u6237\u9879\u76EE",roleLabelEn:"Select Your Program",idKey:"customer_project_no",idLabel:"\u5BA2\u6237",accessCode:"cpwa2026",sessionKey:"pmapp_cpwa_session",reportTable:"cpwa_feedback",idSource:"project_info",idValueKey:"customer_project_no",idTextKey:"customer_project_no",hideFields:["factory_id","production_factory"]}}[f],k={NPI:10,EVT:25,DVT:50,PVT:75,MP:100,completed:100},w=["NPI","EVT","DVT","PVT","MP"],P={zh:{login:"\u767B\u5F55",selectRole:o.roleLabel,accessCode:"\u8BBF\u95EE\u7801",enter:"\u8FDB\u5165",myProjects:"\u6211\u7684\u9879\u76EE",noProject:"\u6682\u65E0\u9879\u76EE",loading:"\u52A0\u8F7D\u4E2D\u2026",stage:"\u9636\u6BB5",progress:"\u9879\u76EE\u8FDB\u5EA6",custNo:"\u5BA2\u6237\u9879\u76EE\u53F7",factoryNo:"\u5DE5\u5382\u9879\u76EE\u53F7",submit:"\u63D0\u4EA4",cancel:"\u53D6\u6D88",remark:"\u5907\u6CE8",qty:"\u6570\u91CF",date:"\u65E5\u671F",reportTitle:p?"\u4E0A\u62A5\u751F\u4EA7\u8FDB\u5EA6":"\u63D0\u4EA4\u53CD\u9988",myRecords:p?"\u6211\u7684\u4E0A\u62A5\u8BB0\u5F55":"\u6211\u7684\u53CD\u9988\u8BB0\u5F55",noRecord:"\u6682\u65E0\u8BB0\u5F55",logout:"\u9000\u51FA\u767B\u5F55",settings:"\u8BBE\u5B9A",language:"\u8BED\u8A00",detail:"\u9879\u76EE\u8BE6\u60C5",submitted:"\u63D0\u4EA4\u6210\u529F",errCode:"\u8BBF\u95EE\u7801\u9519\u8BEF",errNet:"\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5",errSelect:"\u8BF7\u5148\u9009\u62E9"+o.idLabel,allFields:"\u5168\u90E8\u4FE1\u606F",refresh:"\u5237\u65B0",ok:"\u6210\u529F"},en:{login:"Sign In",selectRole:o.roleLabelEn,accessCode:"Access Code",enter:"Enter",myProjects:"My Projects",noProject:"No projects yet",loading:"Loading\u2026",stage:"Stage",progress:"Progress",custNo:"Customer Program",factoryNo:"Factory P/N",submit:"Submit",cancel:"Cancel",remark:"Remarks",qty:"Quantity",date:"Date",reportTitle:p?"Report Production":"Submit Feedback",myRecords:p?"My Reports":"My Feedback",noRecord:"No records",logout:"Sign Out",settings:"Settings",language:"Language",detail:"Project Detail",submitted:"Submitted",errCode:"Invalid access code",errNet:"Network error, please retry",errSelect:"Please select "+o.idLabel,allFields:"Full Information",refresh:"Refresh",ok:"OK"}},d=localStorage.getItem(o.sessionKey+"_lang")||"zh",s=e=>P[d]&&P[d][e]||e,L=()=>({apikey:x,Authorization:"Bearer "+x,"Content-Type":"application/json"}),I=()=>crypto?.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)});async function M(e,t){let a=await fetch(`${S}/rest/v1/${e}?${t||""}`,{headers:L()});if(!a.ok)throw new Error("GET "+a.status);return a.json()}async function K(e,t){let a=await fetch(`${S}/rest/v1/${e}`,{method:"POST",headers:{...L(),Prefer:"return=representation"},body:JSON.stringify(t)});if(!a.ok)throw new Error("POST "+a.status+" "+(await a.text()).slice(0,160));return a.json()}async function h(e,t=1e3){return(await M("sync_data",`select=supabase_id,table_name,payload,updated_at&table_name=eq.${encodeURIComponent(e)}&limit=${t}`)||[]).map(i=>{let l=i.payload;if(typeof l=="string")try{l=JSON.parse(l)}catch{l={}}return{_sb:i.supabase_id,...l||{}}}).filter(i=>!i.is_deleted)}async function F(e){let t=new Date().toISOString();return K("sync_data",{table_name:o.reportTable,payload:JSON.stringify({...e,variant:f,created_at:t}),local_id:Date.now(),supabase_id:I(),is_deleted:!1,updated_at:t,device_id:"ext-"+f})}function b(){try{return JSON.parse(localStorage.getItem(o.sessionKey)||"null")}catch{return null}}function q(e){localStorage.setItem(o.sessionKey,JSON.stringify(e))}function E(){localStorage.removeItem(o.sessionKey)}var c={idents:[],projects:[],records:[],current:null},n=e=>document.getElementById(e),r=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");function v(e,t){let a=n("toast");a.textContent=e,a.style.background=t?"#b8461f":"#1e6b3a",a.classList.add("show"),setTimeout(()=>a.classList.remove("show"),2400)}async function O(){if(o.idSource==="factory_info")return h("factory_info");let e=await h("project_info"),t=new Set,a=[];return e.forEach(i=>{let l=(i[o.idValueKey]||"").toString().trim();l&&!t.has(l)&&(t.add(l),a.push({id:l,name:l}))}),a.sort((i,l)=>i.name.localeCompare(l.name))}async function z(){let e=b();return e?(await h("project_info")).filter(a=>{let i=a[o.idKey];return i!=null&&String(i).trim()===String(e.value).trim()}):[]}async function D(){let e=b();return e?(await h(o.reportTable,500)).filter(a=>String(a.ident)===String(e.value)).sort((a,i)=>String(i.created_at||"").localeCompare(String(a.created_at||""))):[]}function N(){n("app").innerHTML=`
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <div class="brand-badge">${o.code}</div>
        <div>
          <div class="brand-name">${d==="zh"?o.appName:o.appNameEn}</div>
          <div class="brand-sub">${d==="zh"?o.tagline:o.taglineEn}</div>
        </div>
      </div>
      <label class="lbl">${s("selectRole")}</label>
      <select id="sel-ident" class="inp">
        <option value="">-- ${s("selectRole")} --</option>
        ${c.idents.map(e=>`<option value="${r(e.id)}">${r(e.name||e.id)}</option>`).join("")}
      </select>
      <label class="lbl">${s("accessCode")}</label>
      <input id="inp-code" class="inp" type="password" placeholder="${s("accessCode")}" autocomplete="off">
      <button class="btn-main" id="btn-login">${s("enter")}</button>
      <button class="btn-lang" id="btn-lang">\u{1F310} ${d==="zh"?"English":"\u4E2D\u6587"}</button>
      <div class="hint">${o.code} \xB7 \u5916\u90E8\u534F\u4F5C\u7AEF \xB7 v0.1.0</div>
    </div>
  </div>`,n("btn-lang").onclick=()=>{d=d==="zh"?"en":"zh",localStorage.setItem(o.sessionKey+"_lang",d),N()},n("btn-login").onclick=T,n("inp-code").onkeydown=e=>{e.key==="Enter"&&T()}}function T(){let e=n("sel-ident"),t=n("inp-code").value.trim();if(!e.value)return v(s("errSelect"),!0);if(t!==o.accessCode)return v(s("errCode"),!0);q({value:e.value,name:e.options[e.selectedIndex].text,at:Date.now()}),$()}function j(){let e=b();n("app").innerHTML=`
  <header class="topbar">
    <div class="tb-left">
      <div class="tb-badge">${o.code}</div>
      <div>
        <div class="tb-title">${r(e.name)}</div>
        <div class="tb-sub">${d==="zh"?o.tagline:o.taglineEn}</div>
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
  <div id="modal" class="modal"></div>`,n("btn-out").onclick=()=>{E(),c.current=null,$()},n("btn-refresh").onclick=()=>_(),n("btn-lang2").onclick=()=>{d=d==="zh"?"en":"zh",localStorage.setItem(o.sessionKey+"_lang",d),j(),m(c.tab||"projects")},document.querySelectorAll(".tab").forEach(t=>{t.onclick=()=>m(t.dataset.tab)}),m("projects")}function m(e){c.tab=e,document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===e)),e==="projects"?C():e==="records"?A():R()}function H(e){let t=(e.project_stage||"").toUpperCase(),a=k[t]??5,i=w.indexOf(t);return`
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
  </div>`}function C(){let e=n("main");if(!c.projects.length){e.innerHTML=`<div class="empty"><div class="empty-ico">\u{1F4E6}</div><div>${s("noProject")}</div>
      <button class="btn-ghost" id="btn-reload">${s("refresh")}</button></div>`;let t=n("btn-reload");t&&(t.onclick=_);return}e.innerHTML=`<div class="list">${c.projects.map(H).join("")}</div>`,document.querySelectorAll(".card").forEach(t=>{t.onclick=()=>{let a=c.projects.find(i=>String(i.id)===String(t.dataset.id));a&&U(a)}})}function U(e){let t=new Set(["id","is_deleted","_sb","supabase_id","synced_at","created_at","updated_at"]),a=Object.entries(e).filter(([u,y])=>!t.has(u)&&!o.hideFields.includes(u)&&y!==""&&y!=null).map(([u,y])=>`<div class="kv"><span>${r(u)}</span><b>${r(y)}</b></div>`).join(""),i=(e.project_stage||"").toUpperCase(),l=k[i]??5;n("modal").innerHTML=`
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
  </div>`,n("modal").classList.add("open"),n("m-x").onclick=g,n("modal").onclick=u=>{u.target.id==="modal"&&g()},n("m-report").onclick=()=>V(e)}function g(){n("modal").classList.remove("open"),n("modal").innerHTML=""}function V(e){let t=new Date().toISOString().slice(0,10);n("modal").innerHTML=`
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
  </div>`,n("m-x2").onclick=g,n("f-cancel").onclick=g,n("f-send").onclick=async()=>{let a=n("f-send");a.disabled=!0,a.textContent="\u2026";try{await F({ident:String(b().value),project:String(e.factory_project_no||e.customer_project_no||""),customer_no:String(e.customer_project_no||""),date:n("f-date").value,qty:p?Number(n("f-qty")?.value||0):null,note:n("f-note").value}),g(),v(s("submitted")),await _(),m("records")}catch{a.disabled=!1,a.textContent=s("submit"),v(s("errNet"),!0)}}}function A(){let e=n("main");if(!c.records.length){e.innerHTML=`<div class="empty"><div class="empty-ico">\u{1F4DD}</div><div>${s("noRecord")}</div></div>`;return}e.innerHTML=`<div class="list">${c.records.map(t=>`
    <div class="card flat">
      <div class="card-head">
        <div class="card-title">${r(t.project||"\u2014")}</div>
        <span class="date-badge">${r(t.date||(t.created_at||"").slice(0,10)||"")}</span>
      </div>
      ${t.qty?`<div class="card-meta"><div><span>${s("qty")}</span>${r(t.qty)}</div></div>`:""}
      ${t.note?`<div class="note">${r(t.note)}</div>`:""}
    </div>`).join("")}</div>`}function R(){n("main").innerHTML=`
  <div class="list">
    <div class="card flat">
      <div class="card-head"><div class="card-title">${o.code} v0.1.0</div></div>
      <div class="card-meta">
        <div><span>Variant</span>${f}</div>
        <div><span>${o.idLabel}</span>${r(b().name)}</div>
        <div><span>${s("myProjects")}</span>${c.projects.length}</div>
        <div><span>${s("myRecords")}</span>${c.records.length}</div>
      </div>
    </div>
    <div class="card flat">
      <div class="card-head"><div class="card-title">${s("language")}</div></div>
      <div class="lang-row">
        <button class="btn-ghost ${d==="zh"?"on":""}" data-l="zh">\u4E2D\u6587</button>
        <button class="btn-ghost ${d==="en"?"on":""}" data-l="en">English</button>
      </div>
    </div>
    <button class="btn-main danger" id="btn-out2">${s("logout")}</button>
  </div>`,document.querySelectorAll("[data-l]").forEach(e=>{e.onclick=()=>{d=e.dataset.l,localStorage.setItem(o.sessionKey+"_lang",d),j(),m("settings")}}),n("btn-out2").onclick=()=>{E(),$()}}async function _(){try{c.projects=await z(),c.records=await D(),c.tab==="projects"?C():c.tab==="records"?A():c.tab==="settings"&&R()}catch{v(s("errNet"),!0)}}async function $(){if(!b()){if(!c.idents.length){n("app").innerHTML=`<div class="empty"><div class="empty-ico">\u23F3</div><div>${s("loading")}</div></div>`;try{c.idents=await O()}catch{c.idents=[],v(s("errNet"),!0)}}return N()}j(),n("main").innerHTML=`<div class="empty"><div class="empty-ico">\u23F3</div><div>${s("loading")}</div></div>`,await _()}$();})();
