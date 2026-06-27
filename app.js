/* ============================================================
   船堀会サイト 共通スクリプト
   スプレッドシートの「公開」タブ(CSV)を読み込み、
   ・ホーム(#feature-mount)に「今月の勉強会」
   ・アーカイブ(#archive-mount)に過去の勉強会
   を自動表示します。開催日が過ぎた回は自動でアーカイブへ。
   ※ index.html?sample=1 を開くと、データが入っていても見本（サンプル）を表示します。
   ============================================================ */

/* スプレッドシート「公開」タブのCSV URL。空ならサンプル表示。 */
const CONFIG = {
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQL32ULS5VWLJJf1sOh4UBgIcm-bBOU4VNOjazDaWaNn8Sv94qtUbFoJQ6gDUgztn4IJtxuI22g0i_j/pub?gid=143586583&single=true&output=csv"
};

/* CSV未設定・読み込み失敗時に表示されるサンプル（登場する人物・団体はすべて架空です） */
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
    social:{ place:"居酒屋 さんぽ道 船堀店（サンプル）", time:"20:30〜", fee:"3,500円", cancel:"懇親会をキャンセルする場合は、開催の2日前18時までに船堀会の下記メールアドレスまでご連絡をお願いいたします。", email:"funaborikai@gmail.com" },
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
      else if(c==='\r'){ /* skip */ }
      else field+=c;
    }
  }
  if(field.length||row.length){ row.push(field); rows.push(row); }
  return rows;
}

const isPublished = v => /^(true|1|✓|○|公開|はい|yes)$/i.test(String(v||"").trim());

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

function splitEvents(events){
  const now=new Date();
  const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const visible=events.filter(e=>e.published && e.datetime && !isNaN(new Date(e.datetime)));
  const upcoming=visible.filter(e=>new Date(e.datetime)>=startOfToday).sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
  const past=visible.filter(e=>new Date(e.datetime)<startOfToday).sort((a,b)=>new Date(b.datetime)-new Date(a.datetime));
  return {upcoming,past};
}

function speakerHTML(s){
  const initial = esc((s.name||"・").trim().charAt(0));
  const avatar = s.photo
    ? '<img class="avatar" src="'+esc(s.photo)+'" alt="'+esc(s.name)+'" onerror="this.outerHTML=\'<span class=&quot;avatar&quot;>'+initial+'</span>\'">'
    : '<span class="avatar">'+initial+'</span>';
  const logo = s.logo ? '<img class="org-logo" src="'+esc(s.logo)+'" alt="'+esc(s.company)+'" onerror="this.remove()">' : "";
  return '<div class="speaker">'+avatar+
    '<div class="sp-body"><div class="name">'+esc(nameHonor(s.name))+'</div>'+
    '<div class="org">'+logo+'<span>'+esc(s.company)+'</span></div>'+
    '<p class="profile">'+esc(s.profile)+'</p></div></div>';
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
  if(!s || !(s.place||s.time||s.fee||s.cancel||s.email)) return "";
  let cancel=s.cancel||"";
  if(cancel.indexOf("{期限}")>=0) cancel=cancel.replace("{期限}", fmtDeadline(e.datetime)||"開催の前々日18時");
  const row=(k,v,wide)=> v?'<div class="meta'+(wide?' meta-wide':'')+'"><span class="k">'+k+'</span><span class="v">'+esc(v)+'</span></div>':"";
  const mail = s.email?'<div class="meta meta-wide"><span class="k">メール</span><span class="v"><a href="mailto:'+esc(s.email)+'">'+esc(s.email)+'</a></span></div>':"";
  return '<div class="social"><h4>懇親会</h4><div class="grid">'+row("場所",s.place)+row("時間",s.time)+row("参加費",s.fee)+row("キャンセル",cancel,true)+mail+'</div></div>';
}
function featureHTML(e){
  const partyRow = e.party ? '<div class="meta"><span class="k">懇親会</span><span class="v">'+esc(e.party)+'</span></div>' : "";
  const notesRow = e.notes ? '<div class="meta meta-wide"><span class="k">注意事項</span><span class="v">'+esc(e.notes)+'</span></div>' : "";
  const joinBtn = e.formUrl ? '<a class="btn accent btn-join" href="'+esc(e.formUrl)+'" target="_blank" rel="noopener">参加を申し込む ▶</a>' : "";
  const topCta = joinBtn ? '<div class="cta cta-top">'+joinBtn+'</div>' : "";
  const cta = joinBtn ? '<div class="cta">'+joinBtn+'<span class="note">ボタンを押すとお申し込みフォームが開きます。</span></div>' : "";
  return '<div class="feature"><div class="top"><span class="badge">今月の勉強会</span><h2>第'+esc(e.no)+'回 船堀会</h2></div>'+
    '<div class="body"><h3>'+esc(e.title)+'</h3><p class="summary">'+esc(tidySummary(e.summary))+'</p>'+
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

function archItemHTML(e){
  const who = e.speakers.map(s=>s.name+"（"+s.company+"）").join(" / ");
  return '<div class="arch-item"><span class="no">第'+esc(e.no)+'回</span>'+
    '<div class="main"><p class="date">'+esc(e.dateLabel)+'</p><h3>'+esc(e.title)+'</h3>'+
    '<p class="who">'+esc(who)+'</p></div></div>';
}

function initEvents(){
  const fm=document.getElementById("feature-mount");
  const am=document.getElementById("archive-mount");
  if(!fm && !am) return;
  loadEvents().then(function(events){
    const sp=splitEvents(events);
    if(fm){
      fm.innerHTML = sp.upcoming.length
        ? featureHTML(sp.upcoming[0])
        : '<div class="feature"><div class="body"><p class="empty">次回の勉強会は準備中です。決まり次第こちらに掲載します。</p></div></div>';
    }
    if(am){
      am.innerHTML = sp.past.length ? sp.past.map(archItemHTML).join("") : "";
    }
  });
}
document.addEventListener("DOMContentLoaded", initEvents);
