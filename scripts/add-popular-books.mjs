/**
 * Script: fix broken covers + add 20 popular books
 * Run: node scripts/add-popular-books.mjs
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

// ── 1. Fix broken local-path covers ──────────────────────────────────────────
const COVER_FIXES = [
  {
    id: "book7",  // 平凡的世界
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1442646734i/26702613.jpg",
  },
  {
    id: "book8",  // 围城
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1453028316i/12638371.jpg",
  },
  {
    id: "book9",  // 白鹿原
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1389071290i/20458148.jpg",
  },
  {
    id: "book10", // 明朝那些事儿
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1428282385i/18721741.jpg",
  },
  {
    id: "book5",  // 牧羊少年奇幻之旅 (fix old eslite.com URL that may not load)
    cover: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
  },
  {
    id: "book19", // 富爸爸穷爸爸 (fix ebay URL)
    cover: "https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg",
  },
];

// ── 2. New popular books ──────────────────────────────────────────────────────
const NEW_BOOKS = [
  // ── Chinese Web Novels ──
  {
    id: "book21",
    title: "Battle Through the Heavens",
    titleZh: "斗破苍穹",
    author: "Tian Can Tu Dou",
    authorZh: "天蚕土豆",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1600913263i/55439477.jpg",
    description: "A young genius who lost his powers works his way back to the top of the cultivation world through determination and an ancient ring.",
    descriptionZh: "天才少年萧炎斗气消失后，凭借戒指中的神秘老者相助，在斗气大陆重新崛起的热血故事。起点中文网超级爆款。",
    genre: "Fantasy",
    publishYear: 2009,
  },
  {
    id: "book22",
    title: "Grave Robbers' Chronicles",
    titleZh: "盗墓笔记",
    author: "Xu Lei",
    authorZh: "南派三叔",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1341700653i/10316722.jpg",
    description: "A thrilling adventure following Wu Xie as he uncovers ancient tombs and supernatural mysteries across China.",
    descriptionZh: "吴邪因一本笔记卷入盗墓世界，揭开家族秘密与古墓谜团。南派三叔代表作，中国盗墓文学扛鼎之作。",
    genre: "Mystery",
    publishYear: 2006,
  },
  {
    id: "book23",
    title: "Ghost Blows Out the Light",
    titleZh: "鬼吹灯",
    author: "Tianxia Bachang",
    authorZh: "天下霸唱",
    cover: "https://covers.openlibrary.org/b/isbn/9787535434050-L.jpg",
    description: "Three friends follow an ancient treasure map into deadly tombs filled with supernatural traps and forgotten history.",
    descriptionZh: "退伍老兵胡八一与搭档在神秘墓穴中探险寻宝，历经无数险境。中国盗墓小说的开山之作。",
    genre: "Mystery",
    publishYear: 2006,
  },
  {
    id: "book24",
    title: "Soul Land",
    titleZh: "斗罗大陆",
    author: "Tang Jia San Shao",
    authorZh: "唐家三少",
    cover: "https://covers.openlibrary.org/b/isbn/9787551403290-L.jpg",
    description: "Tang San reincarnates into a world where martial souls grant special powers, rising from a humble background to legendary status.",
    descriptionZh: "唐三携带唐门绝学转世重生，在斗罗大陆凭借双生武魂成就绝世强者。唐家三少最经典之作。",
    genre: "Fantasy",
    publishYear: 2008,
  },

  // ── Japanese Mysteries (hugely popular in China) ──
  {
    id: "book25",
    title: "The Miracles of the Namiya General Store",
    titleZh: "解忧杂货店",
    author: "Keigo Higashino",
    authorZh: "东野圭吾",
    cover: "https://covers.openlibrary.org/b/isbn/9787544270878-L.jpg",
    description: "A mysterious general store receives letters from people seeking advice — letters that transcend time itself.",
    descriptionZh: "三个少年闯入神奇杂货店，发现可以跨越时空的信箱，温暖而神秘的治愈系故事。",
    genre: "Fiction",
    publishYear: 2012,
  },
  {
    id: "book26",
    title: "The Devotion of Suspect X",
    titleZh: "嫌疑人X的献身",
    author: "Keigo Higashino",
    authorZh: "东野圭吾",
    cover: "https://covers.openlibrary.org/b/isbn/9787544245746-L.jpg",
    description: "A math genius devises the perfect alibi for his neighbor who has committed an unplanned murder — a chess match between two brilliant minds.",
    descriptionZh: "天才数学家石神为了保护邻居花冈靖子，精心设计了完美不在场证明。东野圭吾最高杰作之一。",
    genre: "Mystery",
    publishYear: 2005,
  },
  {
    id: "book27",
    title: "Journey Under the Midnight Sun",
    titleZh: "白夜行",
    author: "Keigo Higashino",
    authorZh: "东野圭吾",
    cover: "https://covers.openlibrary.org/b/isbn/9787544267984-L.jpg",
    description: "Two children connected by a dark secret grow up in the shadows — a haunting story of love and crime spanning 19 years.",
    descriptionZh: "两个孩子在黑暗中相依为命，以罪恶换取光明。东野圭吾最受欢迎的长篇小说，读来令人心碎。",
    genre: "Mystery",
    publishYear: 1999,
  },
  {
    id: "book28",
    title: "Norwegian Wood",
    titleZh: "挪威的森林",
    author: "Haruki Murakami",
    authorZh: "村上春树",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1564718045l/50051081.jpg",
    description: "A nostalgic story of loss, love, and coming-of-age in 1960s Tokyo — Murakami's most beloved novel.",
    descriptionZh: "1960年代东京，渡边彻在直子与绿子之间徘徊。村上春树最畅销的青春成长小说。",
    genre: "Literary Fiction",
    publishYear: 1987,
  },

  // ── Western Fiction Popular in China ──
  {
    id: "book29",
    title: "The Kite Runner",
    titleZh: "追风筝的人",
    author: "Khaled Hosseini",
    authorZh: "卡勒德·胡赛尼",
    cover: "https://covers.openlibrary.org/b/isbn/9781594480003-L.jpg",
    description: "A story of friendship, guilt, and redemption set against the backdrop of a changing Afghanistan.",
    descriptionZh: "阿富汗富家少年阿米尔与仆人哈桑之间的深厚情谊，背叛与救赎的感人故事。",
    genre: "Fiction",
    publishYear: 2003,
  },
  {
    id: "book30",
    title: "The Stranger",
    titleZh: "局外人",
    author: "Albert Camus",
    authorZh: "阿尔贝·加缪",
    cover: "https://covers.openlibrary.org/b/isbn/9780679720201-L.jpg",
    description: "Meursault's indifference to the world around him leads to an absurd crime and a confrontation with society's moral judgment.",
    descriptionZh: "默尔索在炎热的阳光下扣动扳机，随后面对审判。加缪荒诞主义经典，存在主义必读之作。",
    genre: "Classic Fiction",
    publishYear: 1942,
  },
  {
    id: "book31",
    title: "The Great Gatsby",
    titleZh: "了不起的盖茨比",
    author: "F. Scott Fitzgerald",
    authorZh: "菲茨杰拉德",
    cover: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
    description: "The mysterious millionaire Jay Gatsby's obsession with the beautiful Daisy Buchanan in the roaring 1920s.",
    descriptionZh: "在纸醉金迷的1920年代，神秘富豪盖茨比为了心中的黛西，举办奢华派对、苦苦等待。美国梦的幻灭之作。",
    genre: "Classic Fiction",
    publishYear: 1925,
  },
  {
    id: "book32",
    title: "The Old Man and the Sea",
    titleZh: "老人与海",
    author: "Ernest Hemingway",
    authorZh: "欧内斯特·海明威",
    cover: "https://covers.openlibrary.org/b/isbn/9780684801223-L.jpg",
    description: "An aging Cuban fisherman battles a giant marlin far out in the Gulf Stream — a timeless meditation on perseverance.",
    descriptionZh: "古巴老渔夫桑提亚哥独自出海与大马林鱼搏斗。海明威诺贝尔奖获奖作品，硬汉精神的象征。",
    genre: "Classic Fiction",
    publishYear: 1952,
  },
  {
    id: "book33",
    title: "The Catcher in the Rye",
    titleZh: "麦田里的守望者",
    author: "J.D. Salinger",
    authorZh: "J.D.塞林格",
    cover: "https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg",
    description: "Holden Caulfield's disenchanted journey through New York City after being expelled from prep school.",
    descriptionZh: "霍尔顿被学校开除后在纽约游荡，用尖刻的眼光审视所谓虚伪的成人世界。青春迷茫的代名词。",
    genre: "Classic Fiction",
    publishYear: 1951,
  },

  // ── Non-fiction ──
  {
    id: "book34",
    title: "The Courage to Be Disliked",
    titleZh: "被讨厌的勇气",
    author: "Ichiro Kishimi & Fumitake Koga",
    authorZh: "岸见一郎 & 古贺史健",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1567926941l/52860952.jpg",
    description: "A dialogue between a philosopher and a youth exploring Adlerian psychology — the freedom to live without seeking others' approval.",
    descriptionZh: "哲人与青年的五夜对话，以阿德勒心理学揭示：过去不能决定现在，你完全可以改变，就从现在这一刻起。",
    genre: "Self-Help",
    publishYear: 2013,
  },
  {
    id: "book35",
    title: "Nonviolent Communication",
    titleZh: "非暴力沟通",
    author: "Marshall B. Rosenberg",
    authorZh: "马歇尔·卢森堡",
    cover: "https://covers.openlibrary.org/b/isbn/9781892005038-L.jpg",
    description: "A transformative approach to communicating compassionately — focusing on observations, feelings, needs, and requests.",
    descriptionZh: "以四个要素（观察、感受、需要、请求）转化沟通方式，让爱流动。改善关系的必读之书。",
    genre: "Self-Help",
    publishYear: 1999,
  },
  {
    id: "book36",
    title: "Deep Work",
    titleZh: "深度工作",
    author: "Cal Newport",
    authorZh: "卡尔·纽波特",
    cover: "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
    description: "Rules for focused success in a distracted world — the ability to focus without distraction is the superpower of the 21st century.",
    descriptionZh: "在注意力分散的时代，深度工作是稀缺能力。如何在高度专注的状态下产出极高价值的成果。",
    genre: "Self-Help",
    publishYear: 2016,
  },
  {
    id: "book37",
    title: "Mr. Toad Goes for Therapy",
    titleZh: "蛤蟆先生去看心理医生",
    author: "Robert de Board",
    authorZh: "罗伯特·戴博德",
    cover: "https://covers.openlibrary.org/b/isbn/9787559641618-L.jpg",
    description: "A gentle retelling using Wind in the Willows characters to illuminate the journey of therapy and self-discovery.",
    descriptionZh: "借用《柳林风声》人物，带领读者走进心理咨询的世界。温暖治愈，让你温柔地理解自己和他人。",
    genre: "Psychology",
    publishYear: 1991,
  },

  // ── More Chinese Literature ──
  {
    id: "book38",
    title: "The Longest Day in Chang'an",
    titleZh: "长安十二时辰",
    author: "Ma Boyong",
    authorZh: "马伯庸",
    cover: "https://covers.openlibrary.org/b/isbn/9787536092006-L.jpg",
    description: "An ex-prisoner must save the Tang Dynasty capital from a terrorist plot in just 12 hours — a Chinese 24.",
    descriptionZh: "死囚张小敬在十二时辰内拯救长安城的悬疑推理故事。马伯庸历史小说巅峰之作，改编为热门剧集。",
    genre: "Historical Fiction",
    publishYear: 2017,
  },
  {
    id: "book39",
    title: "Chronicle of a Blood Merchant",
    titleZh: "许三观卖血记",
    author: "Yu Hua",
    authorZh: "余华",
    cover: "https://covers.openlibrary.org/b/isbn/9787506365451-L.jpg",
    description: "Xu Sanguan sells his blood twelve times over decades to survive life's hardships — a moving portrait of Chinese resilience.",
    descriptionZh: "许三观以卖血应对生活的一次次危机，余华以朴素的文字道尽底层人民的坚韧与尊严。",
    genre: "Literary Fiction",
    publishYear: 1995,
  },
  {
    id: "book40",
    title: "The Crowd: A Study of the Popular Mind",
    titleZh: "乌合之众",
    author: "Gustave Le Bon",
    authorZh: "古斯塔夫·勒庞",
    cover: "https://covers.openlibrary.org/b/isbn/9780140137861-L.jpg",
    description: "A pioneering study of crowd psychology — how individuals in a group lose reason and become susceptible to manipulation.",
    descriptionZh: "勒庞深刻揭示群体心理的运作规律：个人融入群体后理性消失，易受情绪与暗示支配。社会心理学奠基之作。",
    genre: "Psychology",
    publishYear: 1895,
  },
];

async function main() {
  console.log("🔧 Fixing broken cover URLs...");
  for (const { id, cover } of COVER_FIXES) {
    const n = await p.book.updateMany({ where: { id }, data: { cover } });
    console.log(`  ${n.count ? "✅" : "⚠️  (not found)"} ${id}`);
  }

  console.log("\n📚 Adding new popular books...");
  let added = 0;
  for (const book of NEW_BOOKS) {
    await p.book.upsert({
      where: { id: book.id },
      update: {}, // don't overwrite if already exists
      create: book,
    });
    console.log(`  ✅ ${book.titleZh} (${book.id})`);
    added++;
  }

  const total = await p.book.count();
  console.log(`\n🎉 Done! Fixed ${COVER_FIXES.length} covers, added ${added} books. Total: ${total} books.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
