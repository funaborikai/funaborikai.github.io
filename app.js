/* ============================================================
   船堀会サイト 共通スクリプト
   スプレッドシートの「公開」タブ(CSV)を読み込み、
   ・ホーム(#feature-mount)に「今月の勉強会」
   ・アーカイブ(#archive-mount)に過去の勉強会
   を自動表示します。開催日が過ぎた回は自動でアーカイブへ。
   ============================================================ */

/* スプレッドシート「公開」タブのCSV URL。空ならサンプル表示。 */
const CONFIG = {
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQL32ULS5VWLJJf1sOh4UBgIcm-bBOU4VNOjazDaWaNn8Sv94qtUbFoJQ6gDUgztn4IJtxuI22g0i_j/pub?gid=143586583&single=true&output=csv"
};

/* CSV未設定・読み込み失敗時に表示されるサンプル */
const SAMPLE_EVENTS = [
  {
    published:true, no:125,
    title:"障害福祉制度から考える障害者入所支援の今後",
    summary:"今年で無認可時代を含めると創立58年を迎えた「もぐらの家」と、同じ江戸川区にある今年で23年を迎えた「あゆみの園」。\n2026年から利用者の地域移行への意向確認が義務化され、施設から地域への移行がすすめられています。養護学校卒業後の働く場所として設立した「もぐらの家」、知的障害者の親なきあとを想い設立した「あゆみの園」。両施設の歴史と今後の在り方を、障害福祉制度の歴史と共に、両施設の職員が発信し、障害福祉について共有できればと思います。",
    speakers:[
      {name:"土田 一平", company:"社会福祉法人つばき土の会　障害者支援施設 もぐらの家", profile:"三事業サービス管理責任者", logo:"images/sample/logo1.png", photo:""},
      {name:"成田 充里", company:"社会福祉法人つばき土の会　障害者支援施設 もぐらの家", profile:"就労継続支援B型責任者", logo:"images/sample/logo1.png", photo:""},
      {name:"鈴木 優一", company:"社会福祉法人つばき土の会　障害者支援施設 もぐらの家", profile:"生活支援員", logo:"images/sample/logo1.png", photo:""},
      {name:"長谷部 淳", company:"もぐらの家／第二オハナ", profile:"指導員", logo:"", photo:""},
      {name:"大藤 さゆり", company:"もぐらの家／第二オハナ", profile:"指導員", logo:"", photo:""},
      {name:"星野 由紀子", company:"社会福祉法人いすず会　一之江あゆみの園", profile:"施設長", logo:"images/sample/logo2.png", photo:""}
    ],
    datetime:"2026-07-18T18:45",
    dateLabel:"2026年7月18日（土）18:45〜20:10　※18:30〜受付開始",
    place:"船堀コミュニティ会館 第4集会室（江戸川区船堀一丁目3番1号）", fee:"200円　※受付にて徴収させていただきます",
    party:"",
    notes:"20:15完全退室となります。本会終了後は速やかに退室をお願いいたします。",
    social:{ place:"酒蔵季TOKI 船堀駅前店", time:"20:30〜", fee:"3,500円", cancel:"懇親会をキャンセルする場合は、{期限}までに船堀会の下記メールアドレスまでご連絡をお願いいたします。それ以降または当日の無断キャンセルの場合は、キャンセル料を徴収いたします。ご了承ください。", email:"funaborikai@gmail.com" },
    formUrl:"https://docs.google.com/forms/d/e/1FAIpQLSe-upse0rPJLEx2xo_NvYNhK3_PYIuaF1aK6EU4nb576aTIoQ/viewform"
  }
];

const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

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
  const avatar = s.photo
    ? '<img class="avatar" src="'+esc(s.photo)+'" alt="'+esc(s.name)+'">'
    : '<span class="avatar">'+esc((s.name||"・").trim().charAt(0))+'</span>';
  const logo = s.logo ? '<img class="org-logo" src="'+esc(s.logo)+'" alt="'+esc(s.company)+'">' : "";
  return '<div class="speaker">'+avatar+
    '<div class="sp-body"><div class="name">'+esc(s.name)+'</div>'+
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
    '<div class="body"><h3>'+esc(e.title)+'</h3><p class="summary">'+esc(e.summary)+'</p>'+
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
        ? sp.upcoming.map(featureHTML).join("")
        : '<div class="feature"><div class="body"><p class="empty">次回の勉強会は準備中です。決まり次第こちらに掲載します。</p></div></div>';
    }
    if(am){
      am.innerHTML = sp.past.length ? sp.past.map(archItemHTML).join("") : "";
    }
  });
}
document.addEventListener("DOMContentLoaded", initEvents);
