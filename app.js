/* ============================================================
   船堀会サイト 共通スクリプト
   ・ホーム(#feature-mount)に「今月の勉強会」
   ・ホーム(#schedule-mount)に「今後の予定」
   ・ホーム(#reports-mount)に「活動報告・お知らせ」
   ・アーカイブ(#archive-mount)に過去の勉強会
   ※ index.html?sample=1 で見本（サンプル）を表示します。
   ============================================================ */

const CONFIG = {
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQL32ULS5VWLJJf1sOh4UBgIcm-bBOU4VNOjazDaWaNn8Sv94qtUbFoJQ6gDUgztn4IJtxuI22g0i_j/pub?gid=143586583&single=true&output=csv",
  REPORTS_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHKnrRh3nnT5vx_FE99R1EMgZZ84j1FtdaFUcDUGrVI-Qb8xPvkB7my7YLCW92jQBf7h1bVz8iaAwI/pub?gid=1823708050&single=true&output=csv",
  SCHEDULE_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQL32ULS5VWLJJf1sOh4UBgIcm-bBOU4VNOjazDaWaNn8Sv94qtUbFoJQ6gDUgztn4IJtxuI22g0i_j/pub?gid=1407874179&single=true&output=csv",
  CONTACT_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSePLU1BvrMc3LwfKMR21jm-T5EjtvwsXnSaixPYV8ZQ2AJezw/viewform"
};

const SAMPLE_EVENTS = [
  {
    published:true, no:126,
    title:"在宅で『最期まで食べる』を支える 〜多職種で挑む摂食嚥下ケア〜",
    summary:"「口から食べる」を諦めない——。在宅の現場では、医療と介護がチームになって、一人ひとりの『食べたい』に向き合っています。\n今回は言語聴覚士と訪問看護師のお二人をお招きし、嚥下評価のポイントや、ご家族・多職種との連携づくりについて、事例を交えてお話しいただきます。これから在宅の食支援に関わる方にもおすすめの内容です。",
    speakers:[
      {name:"海原 みなと", company:"一般社団法人 あおぞら在宅ケアネット", profile:"言語聴覚士／摂食嚥下リハビリ担当。在宅での食支援に長く携わる。", logo:"images/sample-logo1.svg", photo:"images/sample-avatar1.svg"},
      {name:"七海 さくら", company:"ひだまり訪問看護ステーション", profile:"管理者・看護師。多職種連携とご家族支援を専門とする。", logo:"images/sample-logo2.svg", photo:"images/sample-avatar2.svg"}
    ],
    datetime:"2026-08-20T18:45",
    dateLabel:"2026年8月20日（木）18:45〜20:10　※18:30〜受付開始",
    place:"船堀コミュニティ会館 第4集会室（江戸川区船堀一丁目3番1号）",
    fee:"200円　※受付にて徴収させていただきます",
    party:"",
    notes:"※こちらは表示見本（サンプル）です。登場する人物・団体はすべて架空です。実際の勉強会データを入力すると自動で差し替わります。",
    social:{ place:"居酒屋 さんぽ道 船堀店（サンプル）", time:"20:30〜", fee:"3,500円", cancel:"懇親会をキャンセルする場合は、開催の2日前18時までにお問い合わせフォームよりご連絡ください。それ以降または当日の無断キャンセルの場合は、キャンセル料を徴収いたします。" },
    formUrl:"https://docs.google.com/forms/d/e/1FAIpQLSe-upse0rPJLEx2xo_NvYNhK3_PYIuaF1aK6EU4nb576aTIoQ/viewform"
  }
];

const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function nameHonor(n){ n=String(n==null?"":n).trim(); if(!n) return ""; return /(氏|先生|様|さん|博士|教授|ちゃん|君|医師|院長|理事長)$/.test(n)?n:n+" 氏"; }
function tidySummary(s){
  return String(s==null?"":s).replace(/\r/g,"")
    .split(/\n{2,}/)
    .map(function(p){ return p.split("\n").join(""); })
    .filter(function(p){ return p.length>0; })
    .join("\n\n");
}

function parseCSV(text){
  const rows=[]; let row=[], field="", q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else q=false; }
      else field+=c;
    }else{
      if(c==='"') q=true;
      else if(c===','){ row.push(field); field=""; }
      else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=""; }
      else if(c==='\r'){ }
      else field+=c;
    }
  }
  if(field.length||row.length){ row.push(field); rows.push(row); }
  return rows;
}

const isPublished = v => /^(true|1|✓|○|〇|◯|公開|はい|yes)$/i.test(String(v||"").trim());

function rowToEvent(h, cells){
  const get = name => { const i=h.indexOf(name); return i>=0 ? (cells[i]||"").trim() : ""; };
  const nums = h.map(x=>{ const m=/^講師(\d+)氏名$/.exec(x.trim()); return m?+m[1]:null; })
                .filter(n=>n!==null).sort((a,b)=>a-b);
  const speakers=[];
  nums.forEach(n=>{
    const name=get("講師"+n+"氏名");
    if(!name) return;
    speakers.push({ name, company:get("講師"+n+"所属"), profile:get("講師"+n+"プロフィール"), logo:get("講師"+n+"ロゴURL"), photo:get("講師"+n+"写真URL") });
  });
  const dtRaw=get("日時");
  return {
    published: h.indexOf("公開")>=0 ? isPublished(get("公開")) : true,
    no:get("回"), title:get("タイトル"), summary:get("要約"), speakers,
    datetime:dtRaw.replace(/\//g,"-").replace(" ","T"),
    dateLabel:get("日時表示")||dtRaw,
    place:get("会場"), fee:get("参加費"), party:get("懇親会"), notes:get("注意事項"), social:{place:get("懇親会場所"),time:get("懇親会時間"),fee:get("懇親会参加費"),cancel:get("懇親会キャンセル"),email:get("懇親会メール")}, formUrl:get("申込フォームURL")
  };
}

async function loadEvents(){
  try{ if(new URLSearchParams(location.search).get("sample")==="1") return SAMPLE_EVENTS; }catch(e){}
  if(!CONFIG.SHEET_CSV_URL) return SAMPLE_EVENTS;
  try{
    const res = await fetch(CONFIG.SHEET_CSV_URL);
    if(!res.ok) throw new Error("HTTP "+res.status);
    const rows = parseCSV(await res.text()).filter(r=>r.some(c=>c.trim()!==""));
    if(rows.length<2) return SAMPLE_EVENTS;
    const header = rows[0].map(s=>s.trim());
    return rows.slice(1).map(r=>rowToEvent(header,r));
  }catch(err){
    console.warn("スプレッドシート読み込みに失敗。サンプルを表示します:",err);
    return SAMPLE_EVENTS;
  }
}

function dedupByNo(list){
  const map={}; const out=[];
  list.forEach(function(e){
    const key=String(e.no==null?"":e.no).trim();
    if(!key){ out.push(e); return; }
    if(!map[key]){ map[key]=e; out.push(e); return; }
    const a=map[key];
    Object.keys(e).forEach(function(k){
      if(k==="speakers"||k==="social") return;
      if((a[k]===""||a[k]==null) && e[k]) a[k]=e[k];
    });
    if(String(a.formUrl||"").indexOf("http")!==0 && String(e.formUrl||"").indexOf("http")===0) a.formUrl=e.formUrl;
    if((!a.speakers||!a.speakers.length) && e.speakers && e.speakers.length) a.speakers=e.speakers;
    if(a.social && e.social){ ["place","time","fee","cancel","email"].forEach(function(f){ if(!a.social[f] && e.social[f]) a.social[f]=e.social[f]; }); }
  });
  return out;
}
function splitEvents(events){
  const now=new Date();
  const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const visible=events.filter(e=>e.published && e.datetime && !isNaN(new Date(e.datetime)));
  const upcoming=visible.filter(e=>new Date(e.datetime)>=startOfToday).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
  const past=visible.filter(e=>new Date(e.datetime)<startOfToday).sort((a,b)=>new Date(b.datetime)-new Date(a.datetime));
  return {upcoming:dedupByNo(upcoming), past:dedupByNo(past)};
}

function speakerHTML(s){
  const hasPhoto = !!(s.photo && String(s.photo).trim());
  const avatar = hasPhoto ? '<img class="avatar" src="'+esc(s.photo)+'" alt="'+esc(s.name)+'" onerror="this.remove()">' : '';
  const logo = s.logo ? '<img class="org-logo" src="'+esc(s.logo)+'" alt="'+esc(s.company)+'" onerror="this.remove()">' : "";
  const orgText = s.company ? '<span>'+esc(s.company)+'</span>' : '';
  const org = (logo||orgText) ? '<div class="org">'+logo+orgText+'</div>' : '';
  const profile = s.profile ? '<p class="profile">'+esc(s.profile)+'</p>' : '';
  return '<div class="speaker'+(hasPhoto?'':' no-avatar')+'">'+avatar+
    '<div class="sp-body"><div class="name">'+esc(nameHonor(s.name))+'</div>'+
    org+profile+'</div></div>';
}

function fmtDeadline(datetime){
  const d=new Date(datetime);
  if(isNaN(d)) return "";
  d.setDate(d.getDate()-2);
  const w=["日","月","火","水","木","金","土"][d.getDay()];
  return (d.getMonth()+1)+"月"+d.getDate()+"日（"+w+"）18時";
}
function socialHTML(e){
  const s=e.social;
  if(!s || !(s.place||s.time||s.fee||s.cancel)) return "";
  let cancel=s.cancel||"";
  if(cancel.indexOf("{期限}")>=0) cancel=cancel.replace("{期限}", fmtDeadline(e.datetime)||"開催の前々日18時");
  const row=(k,v,wide)=> v?'<div class="meta'+(wide?' meta-wide':'')+'"><span class="k">'+k+'</span><span class="v">'+esc(v)+'</span></div>':"";
  let cancelRow="";
  if(cancel){
    const link='<a href="'+esc(CONFIG.CONTACT_FORM_URL)+'" target="_blank" rel="noopener">お問い合わせフォーム</a>';
    cancelRow='<div class="meta meta-wide"><span class="k">キャンセル</span><span class="v">'+esc(cancel).split("お問い合わせフォーム").join(link)+'</span></div>';
  }
  return '<div class="social"><h4>懇親会</h4><div class="grid">'+row("場所",s.place)+row("時間",s.time)+row("参加費",s.fee)+cancelRow+'</div></div>';
}
function fmtTitle(t){ return esc(t).replace(/[ 　]+([〜～])/g,"<br>$1"); }
function featureHTML(e){
  const partyRow = e.party ? '<div class="meta"><span class="k">懇親会</span><span class="v">'+esc(e.party)+'</span></div>' : "";
  const notesRow = e.notes ? '<div class="meta meta-wide"><span class="k">注意事項</span><span class="v">'+esc(e.notes)+'</span></div>' : "";
  const joinBtn = (String(e.formUrl||"").indexOf("http")===0) ? '<a class="btn accent btn-join" href="'+esc(e.formUrl)+'" target="_blank" rel="noopener">参加を申し込む ▶</a>' : "";
  const topCta = joinBtn ? '<div class="cta cta-top">'+joinBtn+'</div>' : "";
  const cta = joinBtn ? '<div class="cta">'+joinBtn+'<span class="note">ボタンを押すとお申し込みフォームが開きます。</span></div>' : "";
  return '<div class="feature"><div class="top"><span class="badge">今月の勉強会</span><h2>第'+esc(e.no)+'回 船堀会</h2></div>'+
    '<div class="body"><h3>'+fmtTitle(e.title)+'</h3><p class="summary">'+esc(tidySummary(e.summary))+'</p>'+
    '<div class="grid">'+
      '<div class="meta"><span class="k">日時</span><span class="v">'+esc(e.dateLabel)+'</span></div>'+
      '<div class="meta"><span class="k">会場</span><span class="v">'+esc(e.place)+'</span></div>'+
      '<div class="meta"><span class="k">参加費</span><span class="v">'+esc(e.fee)+'</span></div>'+
      partyRow+notesRow+
    '</div>'+
    topCta+
    '<div class="speakers"><h4>講師</h4>'+e.speakers.map(speakerHTML).join("")+'</div>'+
    socialHTML(e)+cta+'</div></div>';
}

function archDateLabel(e){
  const d=new Date(e.datetime);
  let s = isNaN(d) ? (e.dateLabel||"") : (d.getFullYear()+"年"+(d.getMonth()+1)+"月"+d.getDate()+"日");
  if(e.place) s += " ・ " + String(e.place).split("（")[0].split("(")[0].trim();
  return s;
}
function archItemHTML(e){
  const who = e.speakers.map(function(s){ return s.company ? s.company+" ／ "+nameHonor(s.name) : nameHonor(s.name); }).join(" ／ ");
  return '<div class="arch-item"><span class="no">第'+esc(e.no)+'回</span>'+
    '<div class="main"><p class="date">'+esc(archDateLabel(e))+'</p><h3>'+esc(e.title)+'</h3>'+
    '<p class="who">'+esc(who)+'</p></div></div>';
}
function placeIntoArchive(am, past){
  if(!am) return;
  am.innerHTML="";
  const existing=new Set();
  document.querySelectorAll(".year-acc .arch-item .no").forEach(function(el){ const n=el.textContent.replace(/[^0-9]/g,""); if(n) existing.add(n); });
  function foldFor(year){ let f=null; document.querySelectorAll(".year-acc").forEach(function(d){ const sm=d.querySelector("summary"); if(sm && sm.textContent.indexOf(year+"年")>=0) f=d; }); return f; }
  const touched=new Set();
  past.slice().reverse().forEach(function(e){
    const noNum=String(e.no).replace(/[^0-9]/g,"");
    if(noNum && existing.has(noNum)) return;
    const d=new Date(e.datetime); if(isNaN(d)) return;
    const year=d.getFullYear();
    let fold=foldFor(year);
    if(!fold){
      fold=document.createElement("details"); fold.className="year-acc";
      fold.innerHTML="<summary>"+year+"年 <span class='cnt'></span></summary><div class='year-body'></div>";
      let placed=false; const folds=document.querySelectorAll(".year-acc");
      for(let i=0;i<folds.length;i++){ const sm=folds[i].querySelector("summary"); const m=sm&&sm.textContent.match(/([0-9]{4})年/); if(m && year>+m[1]){ folds[i].parentNode.insertBefore(fold,folds[i]); placed=true; break; } }
      if(!placed) am.insertAdjacentElement("afterend",fold);
    }
    fold.querySelector(".year-body").insertAdjacentHTML("afterbegin", archItemHTML(e));
    if(noNum) existing.add(noNum); touched.add(fold);
  });
  touched.forEach(function(fold){ const cnt=fold.querySelector(".cnt"); const n=fold.querySelectorAll(".arch-item").length; if(cnt) cnt.textContent=n+"回"; });
}

/* ===== 今後の予定（活動スケジュール）：専用シートから ===== */
const SAMPLE_SCHEDULE = [
  { date:"2026/9/17（木）", no:"127", title:"訪問リハビリの実際（サンプル）", place:"船堀コミュニティ会館 第4集会室" },
  { date:"2026/10/15（木）", no:"128", title:"内容調整中（サンプル）", place:"船堀コミュニティ会館 第4集会室" }
];
async function loadSchedule(){
  if(!CONFIG.SCHEDULE_CSV_URL) return SAMPLE_SCHEDULE;
  try{
    const res = await fetch(CONFIG.SCHEDULE_CSV_URL);
    if(!res.ok) throw new Error("HTTP "+res.status);
    const rows = parseCSV(await res.text()).filter(r=>r.some(c=>c.trim()!==""));
    if(rows.length<2) return SAMPLE_SCHEDULE;
    const h = rows[0].map(s=>s.trim());
    const get=(cells,name)=>{ const i=h.indexOf(name); return i>=0?(cells[i]||"").trim():""; };
    return rows.slice(1).map(function(cells){
      return { date:get(cells,"日程"), no:get(cells,"回"), title:get(cells,"内容"), place:get(cells,"会場"),
        published: h.indexOf("公開")>=0 ? isPublished(get(cells,"公開")) : true };
    }).filter(r=>r.published && (r.date||r.title));
  }catch(err){ console.warn("予定読み込みに失敗。サンプルを表示します:",err); return SAMPLE_SCHEDULE; }
}
function scheduleHTML(list){
  if(!list || !list.length) return '<p class="empty">次回以降の予定が決まり次第、こちらに掲載します。</p>';
  const cards = list.map(function(r){
    const no = /^\d+$/.test((r.no||"").trim()) ? "第"+r.no.trim()+"回" : (r.no||"");
    const noBadge = no ? '<span class="s-no">'+esc(no)+'</span>' : "";
    const place = r.place ? '<p class="s-place">'+esc(r.place)+'</p>' : "";
    return '<div class="sched-card">'+noBadge+'<div class="s-main"><p class="s-date">'+esc(r.date)+'</p><h3 class="s-title">'+esc(r.title||"内容未定")+'</h3>'+place+'</div></div>';
  }).join("");
  return '<div class="sched-list">'+cards+'</div>';
}

/* ===== 活動報告・お知らせ ===== */
const SAMPLE_REPORTS = [
  { date:"2026年5月17日", title:"船堀会BBQを開催しました！", body:"新左近川バーベキュー場で恒例のBBQを開催しました。たくさんのご家族・事業所の皆さまにご参加いただき、職種を越えて交流を深めました。ご参加ありがとうございました！（※これは表示見本です）", photo:"images/sample-report1.svg" },
  { date:"2026年4月16日", title:"第123回 勉強会を開催しました", body:"「こども食堂」をテーマに、地域包括ケアについて学びました。活発な意見交換ができ、参加者同士のつながりも広がりました。（※これは表示見本です）", photo:"images/sample-report2.svg" }
];
function driveImg(u){
  u=String(u||"").trim(); if(!u) return "";
  if(!/drive\.google|googleusercontent/.test(u)) return u;
  const m=u.match(/[-\w]{25,}/);
  return m ? "https://drive.google.com/thumbnail?id="+m[0]+"&sz=w1000" : u;
}
async function loadReports(){
  if(!CONFIG.REPORTS_CSV_URL) return SAMPLE_REPORTS;
  try{
    const res = await fetch(CONFIG.REPORTS_CSV_URL);
    if(!res.ok) throw new Error("HTTP "+res.status);
    const rows = parseCSV(await res.text()).filter(r=>r.some(c=>c.trim()!==""));
    if(rows.length<2) return SAMPLE_REPORTS;
    const h = rows[0].map(s=>s.trim());
    const get=(cells,name)=>{ const i=h.indexOf(name); return i>=0?(cells[i]||"").trim():""; };
    const data = rows.slice(1).map(function(cells){
      return { date:get(cells,"日付"), title:get(cells,"タイトル"), body:get(cells,"本文"),
        photo:driveImg(get(cells,"写真")||get(cells,"写真URL")),
        published: h.indexOf("公開")>=0 ? isPublished(get(cells,"公開")) : true };
    }).filter(r=>r.published && (r.title||r.body));
    data.reverse();
    return data;
  }catch(err){ console.warn("お知らせ読み込みに失敗。サンプルを表示します:",err); return SAMPLE_REPORTS; }
}

function reportHTML(r){
  const img = r.photo ? '<img class="rep-thumb" src="'+esc(r.photo)+'" alt="'+esc(r.title)+'" loading="lazy" onerror="this.outerHTML=\'<span class=&quot;rep-thumb rep-noimg&quot;></span>\'">' : '<span class="rep-thumb rep-noimg"></span>';
  return '<button type="button" class="rep-card" data-date="'+esc(r.date)+'" data-title="'+esc(r.title)+'" data-body="'+esc(tidySummary(r.body))+'" data-photo="'+esc(r.photo||"")+'">'+
    img+'<span class="rep-cap"><span class="rep-date">'+esc(r.date)+'</span><span class="rep-title">'+esc(r.title)+'</span></span></button>';
}
function setupReports(rm, reports){
  rm.innerHTML = reports.length ? reports.slice(0,9).map(reportHTML).join("") : '<p class="empty">活動報告は準備中です。</p>';
  let modal=document.getElementById("rep-modal");
  if(!modal){
    modal=document.createElement("div"); modal.id="rep-modal"; modal.className="rep-modal";
    modal.innerHTML='<div class="rep-box"><button type="button" class="rep-close" aria-label="閉じる">×</button><img class="rep-big" alt=""><div class="rep-mbody"><p class="rep-mdate"></p><h3 class="rep-mtitle"></h3><p class="rep-mtext"></p></div></div>';
    document.body.appendChild(modal);
    const close=function(){ modal.classList.remove("open"); };
    modal.addEventListener("click",function(e){ if(e.target===modal || e.target.classList.contains("rep-close")) close(); });
    document.addEventListener("keydown",function(e){ if(e.key==="Escape") close(); });
  }
  rm.querySelectorAll(".rep-card").forEach(function(card){
    card.addEventListener("click",function(){
      const big=modal.querySelector(".rep-big"); const ph=card.getAttribute("data-photo");
      if(ph){ big.src=ph; big.style.display=""; } else { big.style.display="none"; }
      modal.querySelector(".rep-mdate").textContent=card.getAttribute("data-date")||"";
      modal.querySelector(".rep-mtitle").textContent=card.getAttribute("data-title")||"";
      modal.querySelector(".rep-mtext").textContent=card.getAttribute("data-body")||"";
      modal.classList.add("open");
    });
  });
}

function initEvents(){
  const fm=document.getElementById("feature-mount");
  const am=document.getElementById("archive-mount");
  const rm=document.getElementById("reports-mount");
  const scm=document.getElementById("schedule-mount");
  if(!fm && !am && !rm && !scm) return;
  loadEvents().then(function(events){
    const sp=splitEvents(events);
    if(fm){
      fm.innerHTML = sp.upcoming.length
        ? featureHTML(sp.upcoming[0])
        : '<div class="feature"><div class="body"><p class="empty">次回の勉強会は準備中です。決まり次第こちらに掲載します。</p></div></div>';
    }
    if(am){ placeIntoArchive(am, sp.past); }
  });
  if(scm){ loadSchedule().then(function(list){ scm.innerHTML = scheduleHTML(list); }); }
  if(rm){ loadReports().then(function(reports){ setupReports(rm, reports); }); }
}
document.addEventListener("DOMContentLoaded", initEvents);
