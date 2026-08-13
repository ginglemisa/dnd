"use strict";

const DEITY_ALIGNMENT_MAP_ZH = {
  LG: "守序善良",
  NG: "中立善良",
  CG: "混亂善良",
  LN: "守序中立",
  N: "絕對中立",
  CN: "混亂中立",
  LE: "守序邪惡",
  NE: "中立邪惡",
  CE: "混亂邪惡"
};

const DEITY_DOMAIN_MAP_ZH = {
  Life: "生命",
  Light: "光明",
  War: "戰爭",
  Nature: "自然",
  Tempest: "風暴",
  Knowledge: "知識",
  Trickery: "詭術",
  Death: "死亡"
};

const DEITY_INFO_GROUPS = [
  { title: "❄️ 自然 / 災厄 / 生死", items: [["Auril（歐瑞爾）","NE","冬之女王","冬季、寒冷","Nature, Tempest","六角雪花","凜冬本身就是她的殘酷意志。"],["Talos（塔洛斯）","CE","風暴之主","風暴、毀滅","Tempest","三道閃電放射","當他怒吼之時，雷雨交加。"],["Umberlee（安博里）","CE","大海女王","海洋、狂潮","Tempest","左右翻捲的海浪","汪洋並不仁慈，宛如潑婦。"],["Silvanus（西凡納斯）","N","自然之神","荒野、自然","Nature","橡樹葉","自然孕育一切，也帶來死亡。"],["Mielikki（梅麗凱）","NG","森林聖母、超凡遊俠","森林","Nature","獨角獸頭","吾乃森林守護者與旅人之友。"],["Malar（馬拉）","CE","萬獸之主","狩獵、野性","Nature","獸爪","狩獵並非為了生存，而是殺戮。"]] },
  { title: "⚖️ 秩序 / 正義 / 保護", items: [["Tyr（提爾）","LG","公正者、失明大君","正義","War","戰錘上的天秤","法律與正義高於一切。"],["Torm（托姆）","LG","勇氣與犧牲之神","勇敢、責任、無私","War","白色右手護手","為正義而行，哪怕付出生命。"],["Ilmater（伊爾瑪特）","LG","忍耐之神","救助、苦難","Life","綁著紅繩的雙手","他承受傷痛，只為拯救世人。"],["Helm（海姆）","LN","守望者","守護、警戒","Life, Light","護手上的凝視之眼","守衛永不眨眼。"],["Kelemvor（凱蘭沃）","LN","亡者之主、冥魂法官","死亡、審判","Death","骷髏手持天秤","死亡不是詛咒，而是秩序的一部分。"],["Azuth（阿祖斯）","LN","奧法之主、第一傳道者","法師、奧術","Knowledge","火焰描邊的上舉左手","魔法應被理解、規範，而非濫用。"]] },
  { title: "🌅 生命 / 希望 / 美善", items: [["Lathander（洛山達）","NG","晨曦之主、田徑者","新生、黎明","Life, Light","通往日出的道路","每個黎明都是新的開始。"],["Chauntea（裳禔亞）","NG","大地之母、穀物女神","農業、豐收","Life","穀束或穀上玫瑰","她使大地滋養萬物。"],["Eldath（艾達絲）","NG","水歌女神","和平、寧靜","Life, Nature","瀑布落入靜池","她的存在本身就是安寧。"],["Sune（淑妮）","CG","火紅之髮、愛情女士","愛與美","Life, Light","紅髮美女面容","美與愛是世界的救贖。"],["Lliira（黎爾拉）","CG","喜悅之神","歡樂、慶典","Life","三顆六角星三角排列","生命值得慶祝。"],["Tymora（泰摩拉）","CG","幸運女神、金髮之女","好運、冒險","Trickery","正面朝上的硬幣","幸運永遠眷顧勇者。"]] },
  { title: "🧠 知識 / 魔法 / 命運", items: [["Mystra（密斯特拉）","NG","魔網女神","魔法","Knowledge","七星環或紅霧星環","所有魔法都源自她，她是魔網本身的意志。"],["Oghma（歐格瑪）","N","知識之神","智識、靈感、思想","Knowledge","空白卷軸","知識本身就是力量，而他守護所有尚未被書寫的真理。"],["Deneir（迪奈爾）","NG","書記之神、符繪之主","書寫、紀錄","Knowledge","蠟燭與眼睛","他讓思想成形，使語言成為永恆。"],["Gond（貢德）","N","萬物造聖、鐵匠之神","工藝、建築、發明","Knowledge","四輻條齒輪","創造是神聖的行為，每個齒輪都能改變世界。"],["Milil（米利爾）","NG","詩歌之主、歐格瑪股肱","詩詞、歌曲、辯才","Light","葉製豎琴","他的歌聲能治癒心靈，也能激起勇氣。"],["Savras（薩弗拉斯）","LN","第三隻眼","預言、命運、真視","Knowledge","多眼水晶球","他看見未來，但從不干涉，只揭示真相。"],["Selûne（賽倫涅）","CG","月之女神","月亮、夜空、變化","Knowledge, Life","七星環繞雙眼","她是黑夜中的柔光，指引迷途者前行。"]] },
  { title: "🌑 黑暗 / 詭計 / 破壞", items: [["Shar（莎爾）","NE","暗夜女神","黑暗、失落、遺忘","Death, Trickery","黑色圓盤","她奪走光明，也奪走記憶。"],["Mask（馬斯克）","CN","陰影之主、盜賊之神","盜竊；暗影、秘密","Trickery","黑面具","每個影子都可能是他的面具。"],["Leira（蕾拉）","CN","迷霧女士、幻術之母","幻象、迷霧、虛實不分","Trickery","倒三角霧旋","真相只是她眾多幻象之一。"],["Cyric（希瑞克）","CE","謊言之王","欺瞞、背叛、瘋狂","Trickery","無下顎白骷髏","他以謊言為武器，也以謊言為真理。"],["Beshaba（貝莎芭）","CE","厄運女士","不幸、災禍","Trickery","黑鹿角","她不求信徒，只求讓你倒楣。"]] },
  { title: "☠️ 死亡 / 痛苦 / 毀滅", items: [["Bhaal（巴爾）","NE","謀殺之主","謀殺、暗殺、血腥","Death","血滴環繞骷髏","每一場謀殺都是對他的獻祭。"],["Myrkul（米爾寇）","NE","骸骨之主","死亡、腐朽、亡魂","Death","白色人類骷髏","他是死亡的寒息，吹墓的冷風。"],["Loviatar（洛薇塔）","LE","痛苦少女","痛苦；折磨、支配","Death","九尾鞭","痛苦是她的語言，也是她的恩賜。"],["Talona（塔羅娜）","CE","毒與病之母、瘟疫老嫗","疾病、毒素、腐敗","Death","三滴淚的三角形","她的祝福會讓你慢慢枯萎。"]] },
  { title: "⚔️ 戰爭 / 力量 / 統治", items: [["Tempus（坦帕斯）","N","戰爭之主","戰爭、鬥爭、榮耀","War","燃燒之劍","他不偏袒勝者，只尊重戰士的勇氣。"],["Bane（班恩）","LE","暴政之主","暴政、征服、恐懼","War","黑色直立右手","他以恐懼統治，以力量維持秩序。"]] },
  { title: "💰 財富 / 商業", items: [["Waukeen（沃金）","N","商業與財富女神、自由女士","貿易、財富、談判","Knowledge, Trickery","側面人像硬幣","只要有交易，她就會在場。"]] },
  { title: "🐉 非人神祇", items: [["Bahamut（巴哈姆特）","LG","白金龍王","善良、守護、正義","Life, War","龍頭側面","他是正義的化身，守護弱者、懲戒邪惡。"],["Tiamat（提亞瑪特）","LE","五首龍后","邪惡、毀滅、貪婪、支配","Trickery","五爪痕龍頭","她以貪婪與恐懼統治，渴望吞噬一切。"],["Corellon Larethian（科瑞隆）","CG","精靈之父","藝術、魔法、創造","Light","新月或星芒","他是精靈的創造者，也是藝術與魔法的靈感源泉。"],["Deep Sashelas（深海薩謝拉斯）","CG","海下之主、海豚親王、水手之友","海洋、知識","Nature, Tempest","海豚","他是海精靈的守護者，掌管深海的智慧。"],["Rillifane Rallathil（瑞里凡‧萊勒菲）","CG","木葉之主 、攸木長者","森林、自然","Nature","橡樹","他是森林的靈魂，守護自然的純粹與野性。"],["Sehanine Moonbow（莎罕妮‧月弓）","CG","精靈月神、夜空之女","月亮、夢境、幻象、引導死亡","Knowledge","新月","她引導靈魂穿越夜幕，也是夢境與幻象的守護者。"],["Moradin（摩拉丁）","LG","鍛魂者、造物主","創造、鍛造","Knowledge","鎚與砧","他以火與鐵鍛造了矮人，也鍛造了他們的精神。"],["Garl Glittergold（加爾·閃金）","LG","小丑、無價寶石、靈光一閃","詭計、智慧、幽默、創造力","Trickery","金塊","他以智慧與幽默保護地侏，惡作劇是他的祝福。"],["Gruumsh（格烏姆什）","CE","獨眼之主、不眠者","戰爭、風暴、征服、仇恨","Tempest, War","獨眼","他命令獸人征服世界，直到所有土地都染上鮮血。"],["Grolantor（格羅蘭托）","CE","愚蠢的破壞者、山丘巨人之神","戰爭、破壞","War","木棒","他只懂暴力，巨人中的野蠻破壞者。"],["Skoraeus Stonebones（斯科雷烏斯‧石骨）","N","石骨賢者、石巨人之神","石頭、藝術、雕刻","Knowledge","鐘乳石","他是石巨人的沉默智者，藝術與石工的守護者。"],["Surtur（蘇爾特）","LE","火焰之王","火焰、鍛造、征服","Knowledge, War","燃燒之劍","他以火焰淬鍊力量，火巨人的暴君之王。"],["Thrym（瑟林）","CE","寒霜之王","寒冷、力量、戰鬥","War","白色雙刃斧","他是霜巨人的戰王，寒冬與蠻力的化身。"],["Yondalla（悠達拉）","LG","半身人之母、蒙福者","生育、守護、繁榮","Life","盾牌","她是半身人的保護者，象徵家庭、和平與豐盛。"]] }
];

function deityAlignmentToZh(code) {
  return DEITY_ALIGNMENT_MAP_ZH[code] || code;
}

function deityDomainsToZh(domains) {
  return String(domains)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => DEITY_DOMAIN_MAP_ZH[item] || item)
    .join("、");
}

function setupDeityInfoModal() {
  const openBtn = document.getElementById("reference-deities-btn");
  const modal = document.getElementById("deity-info-modal");
  if (!openBtn || !modal) return;

  const content = document.getElementById("deity-info-content");
  const closeBtn = modal.querySelector(".deity-info-close");

  if (content) {
    content.innerHTML = DEITY_INFO_GROUPS.map((group) => `
      <section class="deity-group">
        <h4>${group.title}</h4>
        <div class="deity-grid">
          ${group.items.map(([name, alignment, title, role, domains, symbol, impression]) => `
            <article class="deity-item">
              <div class="deity-item-main">${name}｜${deityAlignmentToZh(alignment)}</div>
              <div class="deity-item-sub">稱號：${title}</div>
              <div class="deity-item-sub">職能：${role}</div>
              <div class="deity-item-sub">領域：${deityDomainsToZh(domains)}</div>
              <div class="deity-item-sub">象徵：${symbol}</div>
              <div class="deity-item-sub deity-impression">印象：${impression}</div>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");
  }

  const setOpen = (open) => {
    modal.classList.toggle("open", open);
    modal.setAttribute("aria-hidden", String(!open));
    if (open) closeBtn?.focus();
    else openBtn.focus();
  };

  openBtn.addEventListener("click", () => setOpen(true));
  closeBtn?.addEventListener("click", () => setOpen(false));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      event.preventDefault();
      setOpen(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", setupDeityInfoModal);
