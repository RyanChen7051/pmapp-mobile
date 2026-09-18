(()=>{var j="https://nsnmtkukxquhinlmbejg.supabase.co",x="sb_publishable_YB5z3cQK-vCg67--oKpSrg_63STgMJW";var y="customer",g=y==="factory",C=y==="customer",l={factory:void 0,customer:{code:"CPWA",appName:"PMApp \u5BA2\u6237\u4E2D\u5FC3",appNameEn:"PMApp Customer Portal",theme:"#0e5a8a",themeDark:"#0a4370",accentBg:"#e8f2f9",tagline:"\u5BA2\u6237\u9879\u76EE\u534F\u540C\u5E73\u53F0",taglineEn:"Customer Project Portal",roleLabel:"\u9009\u62E9\u5BA2\u6237",roleLabelEn:"Select Customer",idKey:"customer_id",idLabel:"\u5BA2\u6237",accessCode:"cpwa2026",sessionKey:"pmapp_cpwa_session",reportTable:"cpwa_feedback",idSource:"customer_info",idValueKey:"code",idTextKey:"customer_name",hideFields:["factory_id","production_factory"]}}[y],A={NPI:10,EVT:25,DVT:50,PVT:75,MP:100,completed:100},k=["NPI","EVT","DVT","PVT","MP"],U={zh:{name:"\u4E2D\u6587",flag:"\u{1F1E8}\u{1F1F3}",rtl:!1},en:{name:"English",flag:"\u{1F1EC}\u{1F1E7}",rtl:!1},es:{name:"Espa\xF1ol",flag:"\u{1F1EA}\u{1F1F8}",rtl:!1},ja:{name:"\u65E5\u672C\u8A9E",flag:"\u{1F1EF}\u{1F1F5}",rtl:!1},fr:{name:"Fran\xE7ais",flag:"\u{1F1EB}\u{1F1F7}",rtl:!1},de:{name:"Deutsch",flag:"\u{1F1E9}\u{1F1EA}",rtl:!1},ar:{name:"\u0627\u0644\u0639\u0631\u0628\u064A\u0629",flag:"\u{1F1F8}\u{1F1E6}",rtl:!0},vi:{name:"Ti\u1EBFng Vi\u1EC7t",flag:"\u{1F1FB}\u{1F1F3}",rtl:!1},hi:{name:"\u0939\u093F\u0928\u094D\u0926\u0940",flag:"\u{1F1EE}\u{1F1F3}",rtl:!1}},$={zh:{login:"\u767B\u5F55",selectRole:l.roleLabel,accessCode:"\u8BBF\u95EE\u7801",enter:"\u8FDB\u5165",myProjects:"\u6211\u7684\u9879\u76EE",noProject:"\u6682\u65E0\u9879\u76EE",loading:"\u52A0\u8F7D\u4E2D\u2026",stage:"\u9636\u6BB5",progress:"\u9879\u76EE\u8FDB\u5EA6",custNo:"\u5BA2\u6237\u9879\u76EE\u53F7",factoryNo:"\u5DE5\u5382\u9879\u76EE\u53F7",submit:"\u63D0\u4EA4",cancel:"\u53D6\u6D88",remark:"\u5907\u6CE8",qty:"\u6570\u91CF",date:"\u65E5\u671F",reportTitle:g?"\u4E0A\u62A5\u751F\u4EA7\u8FDB\u5EA6":"\u63D0\u4EA4\u53CD\u9988",myRecords:g?"\u6211\u7684\u4E0A\u62A5\u8BB0\u5F55":"\u6211\u7684\u53CD\u9988\u8BB0\u5F55",noRecord:"\u6682\u65E0\u8BB0\u5F55",logout:"\u9000\u51FA\u767B\u5F55",settings:"\u8BBE\u5B9A",language:"\u8BED\u8A00",detail:"\u9879\u76EE\u8BE6\u60C5",submitted:"\u63D0\u4EA4\u6210\u529F",errCode:"\u8BBF\u95EE\u7801\u9519\u8BEF",errNet:"\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5",errSelect:"\u8BF7\u5148\u9009\u62E9"+l.idLabel,allFields:"\u5168\u90E8\u4FE1\u606F",refresh:"\u5237\u65B0",ok:"\u6210\u529F",problems:"\u95EE\u9898\u8BB0\u5F55",noProblem:"\u6682\u65E0\u76F8\u5173\u95EE\u9898\u8BB0\u5F55",submitComplaint:"\u63D0\u4EA4\u5BA2\u8BC9",complaintCat:"\u95EE\u9898\u7C7B\u522B",complaintProject:"\u5173\u8054\u9879\u76EE",complaintDesc:"\u95EE\u9898\u63CF\u8FF0",commentPlaceholder:"\u5199\u7559\u8A00\u2026",cmtTitle:"\u7559\u8A00\u677F",custComplaint:"\u5BA2\u6237\u6295\u8BC9"},en:{login:"Sign In",selectRole:l.roleLabelEn,accessCode:"Access Code",enter:"Enter",myProjects:"My Projects",noProject:"No projects yet",loading:"Loading\u2026",stage:"Stage",progress:"Progress",custNo:"Customer Program",factoryNo:"Factory P/N",submit:"Submit",cancel:"Cancel",remark:"Remarks",qty:"Quantity",date:"Date",reportTitle:g?"Report Production":"Submit Feedback",myRecords:g?"My Reports":"My Feedback",noRecord:"No records",logout:"Sign Out",settings:"Settings",language:"Language",detail:"Project Detail",submitted:"Submitted",errCode:"Invalid access code",errNet:"Network error, please retry",errSelect:"Please select "+l.idLabel,allFields:"Full Information",refresh:"Refresh",ok:"OK",problems:"Issues",noProblem:"No related issues",submitComplaint:"Submit Complaint",complaintCat:"Category",complaintProject:"Project",complaintDesc:"Description",commentPlaceholder:"Write a comment\u2026",cmtTitle:"Comments",custComplaint:"Customer Complaint"}},z=$.en;["es","ja","fr","de","ar","vi","hi"].forEach(t=>{$[t]||($[t]=z)});var m=localStorage.getItem(l.sessionKey+"_lang")||"zh",n=t=>$[m]&&$[m][t]||t,T=()=>({apikey:x,Authorization:"Bearer "+x,"Content-Type":"application/json"}),E=()=>crypto?.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,t=>{let e=Math.random()*16|0;return(t==="x"?e:e&3|8).toString(16)});async function B(t,e){let a=await fetch(`${j}/rest/v1/${t}?${e||""}`,{headers:T()});if(!a.ok)throw new Error("GET "+a.status);return a.json()}async function I(t,e){let a=await fetch(`${j}/rest/v1/${t}`,{method:"POST",headers:{...T(),Prefer:"return=representation"},body:JSON.stringify(e)});if(!a.ok)throw new Error("POST "+a.status+" "+(await a.text()).slice(0,160));return a.json()}async function G(t,e,a){let s=await fetch(`${j}/rest/v1/${t}?${e||""}`,{method:"PATCH",headers:{...T(),Prefer:"return=representation"},body:JSON.stringify(a)});if(!s.ok)throw new Error("PATCH "+s.status+" "+(await s.text()).slice(0,160));return s.json()}async function S(t,e=1e3){return(await B("sync_data",`select=supabase_id,table_name,payload,updated_at&table_name=eq.${encodeURIComponent(t)}&limit=${e}`)||[]).map(s=>{let i=s.payload;if(typeof i=="string")try{i=JSON.parse(i)}catch{i={}}return{_sb:s.supabase_id,...i||{}}}).filter(s=>!s.is_deleted)}async function J(t){let e=new Date().toISOString();return I("sync_data",{table_name:l.reportTable,payload:JSON.stringify({...t,variant:y,created_at:e}),local_id:Date.now(),supabase_id:E(),is_deleted:!1,updated_at:e,device_id:"ext-"+y})}function b(){try{return JSON.parse(localStorage.getItem(l.sessionKey)||"null")}catch{return null}}function W(t){localStorage.setItem(l.sessionKey,JSON.stringify(t))}function R(){localStorage.removeItem(l.sessionKey)}var r={idents:[],projects:[],records:[],fieldlog:[],current:null},o=t=>document.getElementById(t),c=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");function u(t,e){let a=o("toast");a.textContent=t,a.style.background=e?"#b8461f":"#1e6b3a",a.classList.add("show"),setTimeout(()=>a.classList.remove("show"),2400)}async function Y(){if(l.idSource==="customer_info"){let s=await S("customer_info"),i=new Set,d=[];return s.forEach(p=>{let f=(p[l.idValueKey]||"").toString().trim();f&&!i.has(f)&&(i.add(f),d.push({id:f,name:(p[l.idTextKey]||p.customer_name||f).toString().trim()}))}),d.sort((p,f)=>p.name.localeCompare(f.name))}let t=await S("project_info"),e=new Set,a=[];return t.forEach(s=>{let i=(s[l.idValueKey]||"").toString().trim();i&&!e.has(i)&&(e.add(i),a.push({id:i,name:i}))}),a.sort((s,i)=>s.name.localeCompare(i.name))}async function Q(){let t=b();if(!t)return[];let e=await S("project_info"),a=String(t.value).trim().toLowerCase();return e.filter(s=>{let i=String(s[l.idKey]??"").trim().toLowerCase(),d=String(s.customer_project_no??"").trim().toLowerCase(),p=String(s.customer_name_display??s.customer_name??"").trim().toLowerCase();return i===a||d===a||p.includes(a)})}async function X(){let t=b();return t?(await S(l.reportTable,500)).filter(a=>String(a.ident)===String(t.value)).sort((a,s)=>String(s.created_at||"").localeCompare(String(a.created_at||""))):[]}function D(){o("app").innerHTML=`
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <div class="brand-badge">${l.code}</div>
        <div>
          <div class="brand-name">${m==="zh"?l.appName:l.appNameEn}</div>
          <div class="brand-sub">${m==="zh"?l.tagline:l.taglineEn}</div>
        </div>
      </div>
      <label class="lbl">${n("selectRole")}</label>
      <select id="sel-ident" class="inp">
        <option value="">-- ${n("selectRole")} --</option>
        ${r.idents.map(t=>`<option value="${c(t.id)}">${c(t.name||t.id)}</option>`).join("")}
      </select>
      <label class="lbl">${n("accessCode")}</label>
      <input id="inp-code" class="inp" type="password" placeholder="${n("accessCode")}" autocomplete="off">
      <button class="btn-main" id="btn-login">${n("enter")}</button>
      <button class="btn-lang" id="btn-lang">\u{1F310} ${m==="zh"?"English":"\u4E2D\u6587"}</button>
      <div class="hint">${l.code} \xB7 \u5916\u90E8\u534F\u4F5C\u7AEF \xB7 v0.1.0</div>
    </div>
  </div>`,o("btn-lang").onclick=()=>{m=m==="zh"?"en":"zh",localStorage.setItem(l.sessionKey+"_lang",m),D()},o("btn-login").onclick=L,o("inp-code").onkeydown=t=>{t.key==="Enter"&&L()}}function L(){let t=o("sel-ident"),e=o("inp-code").value.trim();if(!t.value)return u(n("errSelect"),!0);if(e!==l.accessCode)return u(n("errCode"),!0);W({value:t.value,name:t.options[t.selectedIndex].text,at:Date.now()}),w()}function P(){let t=b();o("app").innerHTML=`
  <header class="topbar">
    <div class="tb-left">
      <div class="tb-badge">${l.code}</div>
      <div>
        <div class="tb-title">${c(t.name)}</div>
        <div class="tb-sub">${m==="zh"?l.tagline:l.taglineEn}</div>
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
    <button class="tab active" data-tab="projects">\u{1F4E6}<span>${n("myProjects")}</span></button>
    ${C?`<button class="tab" data-tab="problems">\u{1F41E}<span>${n("problems")}</span></button>`:`<button class="tab" data-tab="records">\u{1F4DD}<span>${n("myRecords")}</span></button>`}
    <button class="tab" data-tab="settings">\u2699\uFE0F<span>${n("settings")}</span></button>
  </nav>
  <div id="modal" class="modal"></div>`,o("btn-out").onclick=()=>{R(),r.current=null,w()},o("btn-refresh").onclick=()=>h(),o("btn-lang2").onclick=()=>{m=m==="zh"?"en":"zh",localStorage.setItem(l.sessionKey+"_lang",m),P(),_(r.tab||"projects")},document.querySelectorAll(".tab").forEach(e=>{e.onclick=()=>_(e.dataset.tab)}),_("projects")}function _(t){if(r.tab=t,document.querySelectorAll(".tab").forEach(e=>e.classList.toggle("active",e.dataset.tab===t)),t!=="problems"){let e=o("complaint-fab");e&&e.remove()}t==="projects"?M():t==="problems"?H():t==="records"?O():F()}function Z(t){let e=(t.project_stage||"").toUpperCase(),a=A[e]??5,s=k.indexOf(e);return`
  <div class="card" data-id="${c(t.id)}">
    <div class="card-head">
      <div class="card-title">${c(t.factory_project_no||t.customer_project_no||"\u2014")}</div>
      <span class="stage-badge">${c(e||"\u2014")}</span>
    </div>
    <div class="card-meta">
      ${t.customer_project_no&&!l.hideFields.includes("customer_project_no")?`<div><span>${n("custNo")}</span>${c(t.customer_project_no)}</div>`:""}
      ${l.hideFields.includes("production_factory")?"":`<div><span>${n("factoryNo")}</span>${c(t.production_factory||"\u2014")}</div>`}
    </div>
    <div class="pbar"><div class="pbar-in" style="width:${a}%"></div></div>
    <div class="pbar-txt">${n("progress")} ${a}% \xB7 ${s>=0?s+1+"/"+k.length:"\u2014"}</div>
  </div>`}function M(){let t=o("main");if(!r.projects.length){t.innerHTML=`<div class="empty"><div class="empty-ico">\u{1F4E6}</div><div>${n("noProject")}</div>
      <button class="btn-ghost" id="btn-reload">${n("refresh")}</button></div>`;let e=o("btn-reload");e&&(e.onclick=h);return}t.innerHTML=`<div class="list">${r.projects.map(Z).join("")}</div>`,document.querySelectorAll(".card").forEach(e=>{e.onclick=()=>{let a=r.projects.find(s=>String(s.id)===String(e.dataset.id));a&&tt(a)}})}function tt(t){let e=new Set(["id","is_deleted","_sb","supabase_id","synced_at","created_at","updated_at"]),a=Object.entries(t).filter(([d,p])=>!e.has(d)&&!l.hideFields.includes(d)&&p!==""&&p!=null).map(([d,p])=>`<div class="kv"><span>${c(d)}</span><b>${c(p)}</b></div>`).join(""),s=(t.project_stage||"").toUpperCase(),i=A[s]??5;o("modal").innerHTML=`
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div>
        <div class="sheet-title">${c(t.factory_project_no||t.customer_project_no||"\u2014")}</div>
        <div class="sheet-sub">${n("detail")} \xB7 ${c(s||"\u2014")}</div>
      </div>
      <button class="sheet-x" id="m-x">\u2715</button>
    </div>
    <div class="pbar big"><div class="pbar-in" style="width:${i}%"></div></div>
    <div class="kv-list">${a||'<div class="empty-sm">\u2014</div>'}</div>
    <button class="btn-main" id="m-report">${n("reportTitle")}</button>
    <div class="spacer"></div>
  </div>`,o("modal").classList.add("open"),o("m-x").onclick=v,o("modal").onclick=d=>{d.target.id==="modal"&&v()},o("m-report").onclick=()=>{C?V(t):et(t)}}function v(){o("modal").classList.remove("open"),o("modal").innerHTML=""}function et(t){let e=new Date().toISOString().slice(0,10);o("modal").innerHTML=`
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head">
      <div><div class="sheet-title">${n("reportTitle")}</div>
      <div class="sheet-sub">${c(t.factory_project_no||t.customer_project_no||"")}</div></div>
      <button class="sheet-x" id="m-x2">\u2715</button>
    </div>
    <label class="lbl">${n("date")}</label>
    <input id="f-date" class="inp" type="date" value="${e}">
    ${g?`<label class="lbl">${n("qty")}</label>
    <input id="f-qty" class="inp" type="number" placeholder="0">`:""}
    <label class="lbl">${n("remark")}</label>
    <textarea id="f-note" class="inp" rows="4" placeholder="${n("remark")}"></textarea>
    <button class="btn-main" id="f-send">${n("submit")}</button>
    <button class="btn-ghost" id="f-cancel">${n("cancel")}</button>
    <div class="spacer"></div>
  </div>`,o("m-x2").onclick=v,o("f-cancel").onclick=v,o("f-send").onclick=async()=>{let a=o("f-send");a.disabled=!0,a.textContent="\u2026";try{await J({ident:String(b().value),project:String(t.factory_project_no||t.customer_project_no||""),customer_no:String(t.customer_project_no||""),date:o("f-date").value,qty:g?Number(o("f-qty")?.value||0):null,note:o("f-note").value}),v(),u(n("submitted")),await h(),_("records")}catch{a.disabled=!1,a.textContent=n("submit"),u(n("errNet"),!0)}}}function O(){let t=o("main");if(!r.records.length){t.innerHTML=`<div class="empty"><div class="empty-ico">\u{1F4DD}</div><div>${n("noRecord")}</div></div>`;return}t.innerHTML=`<div class="list">${r.records.map(e=>`
    <div class="card flat">
      <div class="card-head">
        <div class="card-title">${c(e.project||"\u2014")}</div>
        <span class="date-badge">${c(e.date||(e.created_at||"").slice(0,10)||"")}</span>
      </div>
      ${e.qty?`<div class="card-meta"><div><span>${n("qty")}</span>${c(e.qty)}</div></div>`:""}
      ${e.note?`<div class="note">${c(e.note)}</div>`:""}
    </div>`).join("")}</div>`}function F(){o("main").innerHTML=`
  <div class="list">
    <div class="card flat">
      <div class="card-head"><div class="card-title">${l.code} v0.1.0</div></div>
      <div class="card-meta">
        <div><span>Variant</span>${y}</div>
        <div><span>${l.idLabel}</span>${c(b().name)}</div>
        <div><span>${n("myProjects")}</span>${r.projects.length}</div>
        <div><span>${n("myRecords")}</span>${r.records.length}</div>
      </div>
    </div>
    <div class="card flat">
      <div class="lang-block">
        <div class="lang-block-title">\u{1F310} ${n("language")}</div>
        <div class="lang-grid">
          ${Object.entries(U).map(([t,e])=>`<button class="lang-chip ${m===t?"on":""}" data-l="${t}">${e.flag} ${e.name}</button>`).join("")}
        </div>
      </div>
    </div>
    <button class="btn-main danger" id="btn-out2">${n("logout")}</button>
  </div>`,document.querySelectorAll("[data-l]").forEach(t=>{t.onclick=()=>{m=t.dataset.l,localStorage.setItem(l.sessionKey+"_lang",m),P(),_("settings")}}),o("btn-out2").onclick=()=>{R(),w()}}function at(t){if(!t)return"";try{let e=new Date(t);if(isNaN(e.getTime()))return String(t).slice(5,16);let a=s=>String(s).padStart(2,"0");return a(e.getMonth()+1)+"-"+a(e.getDate())+" "+a(e.getHours())+":"+a(e.getMinutes())}catch{return String(t).slice(5,16)}}async function st(){let t=b();if(!t)return[];let e=await S("field_log",2e3),a=String(t.value).trim().toLowerCase(),s=new Set((r.projects||[]).map(i=>[i.name,i.factory_project_no,i.customer_project_no,i.id].map(d=>String(d||"").trim()).filter(Boolean)).flat());return e.filter(i=>String(i.customer_code||"").trim().toLowerCase()===a?!0:s.has(String(i.project||"").trim())).sort((i,d)=>String(d.created_at||"").localeCompare(String(i.created_at||"")))}async function K(t){let e=new Date().toISOString(),a=t._sb,s=JSON.stringify(t);a?await G("sync_data",`supabase_id=eq.${a}`,{payload:s,updated_at:e,device_id:"ext-customer"}):(a=E(),await I("sync_data",{table_name:"field_log",local_id:Date.now(),payload:s,supabase_id:a,is_deleted:!1,updated_at:e,device_id:"ext-customer"}),t._sb=a)}function nt(t){let e=t.is_customer_complaint;return`<div class="card" data-id="${c(t.id)}">
    <div class="card-head">
      <div class="card-title">\u{1F4F8} ${c(t.project||"\u2014")}</div>
      ${e?`<span class="badge" style="background:#378ADD;color:#fff">${n("custComplaint")}</span>`:""}
      ${t.status?`<span class="badge ${t.status==="\u5DF2\u5904\u7406"?"badge-green":t.status==="\u5904\u7406\u4E2D"?"badge-orange":"badge-red"}">${c(t.status)}</span>`:""}
    </div>
    <div class="card-meta">
      ${t.problem_category?`<span>\u7C7B:${c(t.problem_category)}</span>`:""}
      ${e&&t.customer_code?`<span>\u{1F5E3}\uFE0F ${c(t.customer_code)}</span>`:""}
      <span>\u{1F552} ${c((t.created_at||"").slice(0,16))}</span>
    </div>
    ${t.description?`<div class="card-desc">${c((t.description||"").slice(0,120))}</div>`:""}
  </div>`}function ot(t){let e=t.comments||[];return`<div class="cmt-box">
    <div class="cmt-title">\u{1F4AC} ${n("cmtTitle")}</div>
    ${e.length?e.map(a=>`<div class="cmt">
      <div class="cmt-top"><span class="cmt-u">${c(a.u||"?")}</span>${a.country?`<span class="cmt-c">\u{1F3F3}\uFE0F ${c(a.country)}</span>`:""}<span class="cmt-t">${c(at(a.t))}</span></div>
      <div class="cmt-m">${c(a.m||"")}</div></div>`).join(""):'<div class="empty-sm">\u2014</div>'}
    <div class="cmt-row"><input type="text" id="cmt-${c(t.id)}" maxlength="500" placeholder="${n("commentPlaceholder")}" onkeydown="if(event.key==='Enter')cpwaAddComment('${c(t.id)}')">
      <button type="button" class="btn btn-primary" style="width:auto;padding:8px 14px;font-size:13px" onclick="cpwaAddComment('${c(t.id)}')">${n("submit")}</button></div>
  </div>`}async function it(t){let e=(r.fieldlog||[]).find(d=>String(d.id)===String(t)),a=o("cmt-"+t);if(!e||!a)return;let s=a.value.trim();if(!s)return u(n("commentPlaceholder"));let i=b();(e.comments=e.comments||[]).push({u:i?i.name:"?",m:s,t:new Date().toISOString()});try{await K(e),u(n("submitted")),q(e)}catch{u(n("errNet"),!0)}}window.cpwaAddComment=it;function H(){let t=o("main");if(!r.fieldlog.length){t.innerHTML=`<div class="empty"><div class="empty-ico">\u{1F41E}</div><div>${n("noProblem")}</div>
      <button class="btn-ghost" id="btn-reload2">${n("refresh")}</button></div>`;let e=o("btn-reload2");e&&(e.onclick=h),N();return}t.innerHTML=`<div class="list">${r.fieldlog.map(nt).join("")}</div>`,document.querySelectorAll(".card").forEach(e=>{e.onclick=()=>{let a=r.fieldlog.find(s=>String(s.id)===String(e.dataset.id));a&&q(a)}}),N()}function q(t){let e=new Set(["id","_sb","is_deleted","created_at","updated_at","comments"]),a=Object.entries(t).filter(([s,i])=>!e.has(s)&&i!==""&&i!=null).map(([s,i])=>`<div class="kv"><span>${c(s)}</span><b>${c(i)}</b></div>`).join("");o("modal").innerHTML=`
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head"><div><div class="sheet-title">${c(t.project||"\u2014")}</div>
      <div class="sheet-sub">${t.is_customer_complaint?n("custComplaint"):n("problems")} \xB7 ${c(t.status||"")}</div></div>
      <button class="sheet-x" id="m-xo">\u2715</button></div>
    <div class="kv-list">${a||'<div class="empty-sm">\u2014</div>'}</div>
    ${ot(t)}
    <div class="spacer"></div>
  </div>`,o("m-xo").onclick=v,o("modal").onclick=s=>{s.target.id==="modal"&&v()}}function N(){let t=o("complaint-fab");t||(t=document.createElement("button"),t.id="complaint-fab",t.className="fab",t.textContent="\uFF0B",t.title=n("submitComplaint"),t.onclick=()=>V(null),o("app").appendChild(t))}function V(t){let e='<option value="">\uFF08\u672A\u9009\uFF09</option>'+(r.projects||[]).map(s=>{let i=s.factory_project_no||s.customer_project_no||s.name||s.id||"";return`<option value="${c(i)}">${c(i)}</option>`}).join(""),a=b();if(o("modal").innerHTML=`
  <div class="sheet">
    <div class="sheet-bar"></div>
    <div class="sheet-head"><div><div class="sheet-title">${n("submitComplaint")}</div>
      <div class="sheet-sub">${n("custComplaint")} \xB7 CPWA</div></div>
      <button class="sheet-x" id="m-xc">\u2715</button></div>
    <label class="lbl">${n("complaintProject")}</label>
    <select id="cf-project" class="inp">${e}</select>
    <label class="lbl">${n("complaintCat")}</label>
    <select id="cf-cat" class="inp">
      <option value="\u751F\u4EA7">\u751F\u4EA7</option><option value="\u5DE5\u7A0B">\u5DE5\u7A0B</option>
      <option value="\u5236\u7A0B">\u5236\u7A0B</option><option value="\u54C1\u8D28">\u54C1\u8D28</option>
    </select>
    <label class="lbl">${n("complaintDesc")}</label>
    <textarea id="cf-desc" class="inp" rows="5" placeholder="\u8BF7\u63CF\u8FF0\u60A8\u9047\u5230\u7684\u95EE\u9898\u2026"></textarea>
    <button class="btn-main" id="cf-send">${n("submit")}</button>
    <button class="btn-ghost" id="cf-cancel">${n("cancel")}</button>
    <div class="spacer"></div>
  </div>`,t){let s=o("cf-project");s&&(s.value=t.factory_project_no||t.customer_project_no||"")}o("m-xc").onclick=v,o("cf-cancel").onclick=v,o("cf-send").onclick=async()=>{let s=o("cf-send");s.disabled=!0,s.textContent="\u2026";let i={id:"cf_"+Date.now(),project:o("cf-project").value.trim(),problem_category:o("cf-cat").value,description:o("cf-desc").value.trim(),status:"\u5F85\u5904\u7406",is_customer_complaint:!0,customer_code:a?a.value:"",customer_name:a?a.name:"",reporter:a?a.name:"\u5BA2\u6237",created_at:new Date().toISOString().slice(0,19).replace("T"," "),updated_at:new Date().toISOString().slice(0,19).replace("T"," "),comments:[]};if(!i.description)return s.disabled=!1,s.textContent=n("submit"),u(n("complaintDesc"),!0);if(!i.project)return s.disabled=!1,s.textContent=n("submit"),u(n("complaintProject"),!0);try{await K(i),v(),u(n("submitted")),await h(),_("problems")}catch{s.disabled=!1,s.textContent=n("submit"),u(n("errNet"),!0)}}}async function h(){try{r.projects=await Q(),r.records=await X(),C&&(r.fieldlog=await st()),r.tab==="projects"?M():r.tab==="problems"?H():r.tab==="records"?O():r.tab==="settings"&&F()}catch{u(n("errNet"),!0)}}async function w(){if(!b()){if(!r.idents.length){o("app").innerHTML=`<div class="empty"><div class="empty-ico">\u23F3</div><div>${n("loading")}</div></div>`;try{r.idents=await Y()}catch{r.idents=[],u(n("errNet"),!0)}}return D()}P(),o("main").innerHTML=`<div class="empty"><div class="empty-ico">\u23F3</div><div>${n("loading")}</div></div>`,await h()}w();})();
