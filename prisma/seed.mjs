import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create seed community users (for demo content only — not test login accounts)
  const password = await bcrypt.hash("seed_user_84hJk2!", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@bookshare.com" },
    update: {},
    create: {
      name: "Alice Chen",
      email: "alice@bookshare.com",
      password,
      bio: "热爱阅读，分享好书 | Book lover & sharer",
      readingGoal: 24,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@bookshare.com" },
    update: {},
    create: {
      name: "Bob Wang",
      email: "bob@bookshare.com",
      password,
      bio: "科幻迷，技术控 | Sci-fi fan & tech enthusiast",
      readingGoal: 12,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    },
  });

  // ── Books ─────────────────────────────────────────────────────────────────
  // 20 most popular Chinese & English books across genres

  await Promise.all([
    // ── Chinese Literature & Fiction ─────────────────────────────────────
    prisma.book.upsert({
      where: { id: "book1" },
      update: {},
      create: {
        id: "book1",
        title: "The Three-Body Problem",
        titleZh: "三体",
        author: "Liu Cixin",
        authorZh: "刘慈欣",
        cover: "https://covers.openlibrary.org/b/isbn/9780765382030-L.jpg",
        description:
          "A groundbreaking sci-fi trilogy about humanity's first contact with an alien civilization during China's Cultural Revolution.",
        descriptionZh:
          "文化大革命期间，人类与三体文明的第一次接触。里程碑式的硬科幻巨著，刘慈欣代表作。",
        genre: "Science Fiction",
        publishYear: 2006,
      },
    }),

    prisma.book.upsert({
      where: { id: "book2" },
      update: {},
      create: {
        id: "book2",
        title: "To Live",
        titleZh: "活着",
        author: "Yu Hua",
        authorZh: "余华",
        cover: "https://covers.openlibrary.org/b/isbn/9787506365437-L.jpg",
        description:
          "A poignant story of survival and resilience — one man's life through China's most turbulent decades.",
        descriptionZh:
          "苦难中求生的感人故事。余华以平静的笔触讲述了主人公福贵一生的坎坷与坚韧。",
        genre: "Literary Fiction",
        publishYear: 1993,
      },
    }),

    prisma.book.upsert({
      where: { id: "book6" },
      update: {},
      create: {
        id: "book6",
        title: "Dream of the Red Chamber",
        titleZh: "红楼梦",
        author: "Cao Xueqin",
        authorZh: "曹雪芹",
        cover: "https://covers.openlibrary.org/b/isbn/9787020002207-L.jpg",
        description:
          "One of China's Four Great Classical Novels — an epic portrait of aristocratic family life in the Qing dynasty.",
        descriptionZh:
          "中国古典四大名著之一。以贾、史、王、薛四大家族的兴衰为背景，描绘了封建贵族社会的全貌。",
        genre: "Classic Fiction",
        publishYear: 1791,
      },
    }),

    prisma.book.upsert({
      where: { id: "book7" },
      update: { cover: "/covers/pingfan-de-shijie.jpg" },
      create: {
        id: "book7",
        title: "Ordinary World",
        titleZh: "平凡的世界",
        author: "Lu Yao",
        authorZh: "路遥",
        cover: "/covers/pingfan-de-shijie.jpg",
        description:
          "A sweeping portrait of rural China from 1975–1985, following two brothers' struggle to rise above poverty.",
        descriptionZh:
          "路遥茅盾文学奖获奖作品。以1975—1985年陕北农村为背景，讲述孙氏兄弟在艰苦岁月中奋斗的故事。",
        genre: "Literary Fiction",
        publishYear: 1986,
      },
    }),

    prisma.book.upsert({
      where: { id: "book8" },
      update: {},
      create: {
        id: "book8",
        title: "Fortress Besieged",
        titleZh: "围城",
        author: "Qian Zhongshu",
        authorZh: "钱锺书",
        cover: "https://covers.openlibrary.org/b/isbn/9787020024759-L.jpg",
        description:
          "A witty satirical novel about love and academia in 1930s China — marriage is the besieged city everyone wants to enter and escape.",
        descriptionZh:
          "以婚姻与学术为主题的讽刺小说。围城比喻婚姻：城外的人想进去，城里的人想出来。",
        genre: "Literary Fiction",
        publishYear: 1947,
      },
    }),

    prisma.book.upsert({
      where: { id: "book9" },
      update: {},
      create: {
        id: "book9",
        title: "White Deer Plain",
        titleZh: "白鹿原",
        author: "Chen Zhongshi",
        authorZh: "陈忠实",
        cover: "https://covers.openlibrary.org/b/isbn/9787020043095-L.jpg",
        description:
          "A Mao Dun Literature Prize epic depicting fifty years of feudal clan rivalry on the Guanzhong Plain.",
        descriptionZh:
          "茅盾文学奖获奖作品。以白鹿原上白、鹿两家的恩怨纠葛为主轴，展现关中平原半个世纪的历史沧桑。",
        genre: "Historical Fiction",
        publishYear: 1993,
      },
    }),

    prisma.book.upsert({
      where: { id: "book10" },
      update: { cover: "/covers/mingchao-naxie-shier.jpg" },
      create: {
        id: "book10",
        title: "Ming Dynasty: The Untold Story",
        titleZh: "明朝那些事儿",
        author: "Dangninanmei",
        authorZh: "当年明月",
        cover: "/covers/mingchao-naxie-shier.jpg",
        description:
          "A massively popular narrative history of the Ming Dynasty told with humor and vivid storytelling.",
        descriptionZh:
          "以现代语言重讲明朝历史，幽默风趣，深入浅出，是中国最畅销的历史普及读物之一。",
        genre: "History",
        publishYear: 2006,
      },
    }),

    // ── International Books Popular in China ────────────────────────────
    prisma.book.upsert({
      where: { id: "book3" },
      update: {},
      create: {
        id: "book3",
        title: "Sapiens: A Brief History of Humankind",
        titleZh: "人类简史",
        author: "Yuval Noah Harari",
        authorZh: "尤瓦尔·赫拉利",
        cover: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        description:
          "A sweeping narrative of human history from the Stone Age to the twenty-first century.",
        descriptionZh: "从石器时代到21世纪，重新审视人类历史的宏观叙事。全球畅销书。",
        genre: "History / Popular Science",
        publishYear: 2011,
      },
    }),

    prisma.book.upsert({
      where: { id: "book11" },
      update: {},
      create: {
        id: "book11",
        title: "One Hundred Years of Solitude",
        titleZh: "百年孤独",
        author: "Gabriel García Márquez",
        authorZh: "加西亚·马尔克斯",
        cover: "https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg",
        description:
          "The Nobel Prize-winning masterpiece of magical realism — the multigenerational saga of the Buendía family.",
        descriptionZh:
          "诺贝尔文学奖得主马尔克斯的魔幻现实主义巅峰之作。布恩迪亚家族七代人的传奇故事。",
        genre: "Literary Fiction",
        publishYear: 1967,
      },
    }),

    prisma.book.upsert({
      where: { id: "book12" },
      update: {},
      create: {
        id: "book12",
        title: "The Little Prince",
        titleZh: "小王子",
        author: "Antoine de Saint-Exupéry",
        authorZh: "安托万·德·圣埃克苏佩里",
        cover: "https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg",
        description:
          "A beloved classic — a young prince travels the universe and teaches a pilot the importance of imagination and love.",
        descriptionZh:
          "全球最畅销的法语小说之一。小王子游历各星球，教会飞行员关于爱与想象力的真谛。",
        genre: "Fiction",
        publishYear: 1943,
      },
    }),

    // ── English Bestsellers ──────────────────────────────────────────────
    prisma.book.upsert({
      where: { id: "book4" },
      update: {},
      create: {
        id: "book4",
        title: "Atomic Habits",
        titleZh: "原子习惯",
        author: "James Clear",
        authorZh: "詹姆斯·克利尔",
        cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
        description:
          "An easy and proven way to build good habits and break bad ones — tiny changes, remarkable results.",
        descriptionZh: "建立良好习惯的实用指南。每天进步1%，一年后提升37倍。全球销量超2000万册。",
        genre: "Self-Help",
        publishYear: 2018,
      },
    }),

    prisma.book.upsert({
      where: { id: "book5" },
      update: {},
      create: {
        id: "book5",
        title: "The Alchemist",
        titleZh: "牧羊少年奇幻之旅",
        author: "Paulo Coelho",
        authorZh: "保罗·柯艾略",
        cover: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
        description:
          "A magical fable about a young shepherd's journey to find treasure — and discover his Personal Legend.",
        descriptionZh: "跟随梦想的魔幻故事。全球销量逾6500万册，被译成80种语言。",
        genre: "Fiction",
        publishYear: 1988,
      },
    }),

    prisma.book.upsert({
      where: { id: "book13" },
      update: {},
      create: {
        id: "book13",
        title: "Harry Potter and the Philosopher's Stone",
        titleZh: "哈利·波特与魔法石",
        author: "J.K. Rowling",
        authorZh: "J.K.罗琳",
        cover: "https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg",
        description:
          "The start of an enchanting series — an orphaned boy discovers he is a wizard and enters the magical world of Hogwarts.",
        descriptionZh:
          "孤儿哈利波特发现自己是巫师，踏入霍格沃茨魔法学校的奇幻旅程。全球最畅销小说系列。",
        genre: "Fantasy",
        publishYear: 1997,
      },
    }),

    prisma.book.upsert({
      where: { id: "book14" },
      update: {},
      create: {
        id: "book14",
        title: "1984",
        titleZh: "一九八四",
        author: "George Orwell",
        authorZh: "乔治·奥威尔",
        cover: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
        description:
          "Orwell's chilling dystopia of surveillance, propaganda, and totalitarianism — Big Brother is watching you.",
        descriptionZh:
          "奥威尔的反乌托邦经典。极权社会、全面监控与思想控制的深刻预警。'老大哥在看着你'。",
        genre: "Dystopian Fiction",
        publishYear: 1949,
      },
    }),

    prisma.book.upsert({
      where: { id: "book15" },
      update: {},
      create: {
        id: "book15",
        title: "Thinking, Fast and Slow",
        titleZh: "思考，快与慢",
        author: "Daniel Kahneman",
        authorZh: "丹尼尔·卡尼曼",
        cover: "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
        description:
          "Nobel laureate Kahneman reveals the two systems that drive the way we think — and how to make better decisions.",
        descriptionZh:
          "诺贝尔经济学奖得主卡尼曼揭示大脑的两套思维系统，帮助你认识偏见、做出更好的决策。",
        genre: "Psychology",
        publishYear: 2011,
      },
    }),

    prisma.book.upsert({
      where: { id: "book16" },
      update: {},
      create: {
        id: "book16",
        title: "The Psychology of Money",
        titleZh: "金钱心理学",
        author: "Morgan Housel",
        authorZh: "摩根·豪塞尔",
        cover: "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
        description:
          "Timeless lessons on wealth, greed, and happiness — how ordinary people can build wealth through good behavior.",
        descriptionZh:
          "19个关于财富与人性的故事，揭示金钱决策背后的心理学。普通人如何通过行为积累财富。",
        genre: "Finance / Psychology",
        publishYear: 2020,
      },
    }),

    prisma.book.upsert({
      where: { id: "book17" },
      update: {},
      create: {
        id: "book17",
        title: "Man's Search for Meaning",
        titleZh: "活出生命的意义",
        author: "Viktor E. Frankl",
        authorZh: "维克多·弗兰克尔",
        cover: "https://covers.openlibrary.org/b/isbn/9780807014271-L.jpg",
        description:
          "A Holocaust survivor's account of finding purpose in suffering — the foundation of logotherapy.",
        descriptionZh:
          "奥斯威辛集中营幸存者、心理学家弗兰克尔讲述在极端苦难中寻找生命意义的故事。",
        genre: "Psychology / Memoir",
        publishYear: 1946,
      },
    }),

    prisma.book.upsert({
      where: { id: "book18" },
      update: {},
      create: {
        id: "book18",
        title: "Pride and Prejudice",
        titleZh: "傲慢与偏见",
        author: "Jane Austen",
        authorZh: "简·奥斯丁",
        cover: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
        description:
          "Austen's beloved comedy of manners — the witty romance between Elizabeth Bennet and the proud Mr. Darcy.",
        descriptionZh:
          "简·奥斯丁最受欢迎的作品。伊丽莎白与达西先生之间的机智爱情故事，对人性与婚姻的深刻描绘。",
        genre: "Classic Fiction",
        publishYear: 1813,
      },
    }),

    prisma.book.upsert({
      where: { id: "book19" },
      update: {},
      create: {
        id: "book19",
        title: "Rich Dad Poor Dad",
        titleZh: "富爸爸穷爸爸",
        author: "Robert T. Kiyosaki",
        authorZh: "罗伯特·清崎",
        cover: "https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg",
        description:
          "The #1 personal finance book of all time — what the rich teach their kids about money that the poor and middle class don't.",
        descriptionZh:
          "全球最畅销个人理财书。富人教给孩子的金钱理念，颠覆你对工作、财富和投资的认知。",
        genre: "Finance / Self-Help",
        publishYear: 1997,
      },
    }),

    prisma.book.upsert({
      where: { id: "book20" },
      update: {},
      create: {
        id: "book20",
        title: "Educated",
        titleZh: "你当像鸟飞往你的山",
        author: "Tara Westover",
        authorZh: "塔拉·韦斯特弗",
        cover: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
        description:
          "A memoir about a woman who grows up in a survivalist family, never attends school, and educates herself to earn a PhD from Cambridge.",
        descriptionZh:
          "一个从未上过学的女孩靠自学考入剑桥大学并获得博士学位的真实故事。关于教育与自我救赎。",
        genre: "Memoir",
        publishYear: 2018,
      },
    }),

    // ── Featured / Editor's Pick ─────────────────────────────────────────
    prisma.book.upsert({
      where: { id: "book21" },
      update: { isFeatured: true },   // ensure it stays featured on re-seed
      create: {
        id: "book21",
        title: "What Every Chinese Founder Should Know About The UK Business System",
        titleZh: "每位中国创始人都应了解的英国商业体系",
        author: "Various Contributors",
        authorZh: "多位作者",
        cover: null,
        description:
          "A practical guide for Chinese entrepreneurs navigating the UK business system — from company formation and banking to legal compliance, tax, and fundraising. Covers the key differences between UK and Chinese corporate culture that every founder needs to understand before launching or expanding in Britain.",
        descriptionZh:
          "专为中国创业者撰写的英国商业实战指南。涵盖公司注册、银行开户、法律合规、税务、融资等核心议题，深入剖析中英两国商业文化差异，帮助创始人避开常见陷阱、快速融入英国商业生态。",
        genre: "Business",
        publishYear: 2024,
        isFeatured: true,
      },
    }),
  ]);

  console.log("✅ 20 books seeded successfully!");

  // ── Posts ─────────────────────────────────────────────────────────────────
  await prisma.post.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "post1",
        userId: alice.id,
        bookId: "book1",
        type: "review",
        content:
          "三体真的太震撼了！刘慈欣用宏大的宇宙观重新定义了科幻小说的边界。强烈推荐给每一个热爱思考的读者！\n\nThe Three-Body Problem is mind-blowing! Liu Cixin redefined the boundaries of science fiction with his grand cosmic vision. Highly recommended!",
      },
      {
        id: "post2",
        userId: bob.id,
        bookId: "book3",
        type: "share",
        content:
          "《人类简史》让我重新审视了我们作为人类的位置。赫拉利的笔触既宏观又细腻，读完之后久久不能平静。\n\nSapiens made me reconsider our place as humans. Harari's writing is both grand and nuanced. I couldn't stop thinking after finishing it.",
      },
      {
        id: "post3",
        userId: alice.id,
        bookId: "book4",
        type: "progress",
        content:
          "正在读《原子习惯》，已经开始尝试书中的方法了！每天进步1%，一年后提升37倍！\n\nCurrently reading Atomic Habits and already trying the methods! 1% better every day = 37x improvement in a year!",
      },
      {
        id: "post4",
        userId: bob.id,
        bookId: "book14",
        type: "review",
        content:
          "《1984》读完后久久无法忘怀。奥威尔在1949年就预见了极权主义的恐怖，今天读来依然振聋发聩。\n\nFinished 1984 and I'm speechless. Orwell's 1949 vision of totalitarianism feels eerily relevant even today.",
      },
      {
        id: "post5",
        userId: alice.id,
        bookId: "book15",
        type: "share",
        content:
          "《思考，快与慢》彻底改变了我对决策的理解。系统一和系统二的框架让我开始反思自己的很多直觉判断。\n\nThinking, Fast and Slow changed how I understand decision-making entirely. The System 1 vs System 2 framework is a game-changer.",
      },
    ],
  });

  // ── Likes ─────────────────────────────────────────────────────────────────
  await prisma.like.createMany({
    skipDuplicates: true,
    data: [
      { postId: "post1", userId: bob.id },
      { postId: "post2", userId: alice.id },
      { postId: "post3", userId: bob.id },
      { postId: "post4", userId: alice.id },
      { postId: "post5", userId: bob.id },
    ],
  });

  // ── Comments ──────────────────────────────────────────────────────────────
  await prisma.comment.createMany({
    skipDuplicates: true,
    data: [
      {
        postId: "post1",
        userId: bob.id,
        content: "完全同意！三体是近年来最好的科幻小说之一！",
      },
      {
        postId: "post2",
        userId: alice.id,
        content: "已经加入书单了，谢谢推荐！",
      },
      {
        postId: "post4",
        userId: alice.id,
        content: "大学时读的，现在重读感触更深了。",
      },
    ],
  });

  // ── Reading lists ─────────────────────────────────────────────────────────
  await prisma.userBook.createMany({
    skipDuplicates: true,
    data: [
      { userId: alice.id, bookId: "book1",  status: "finished",     progress: 100, rating: 5 },
      { userId: alice.id, bookId: "book4",  status: "reading",      progress: 60 },
      { userId: alice.id, bookId: "book5",  status: "want_to_read", progress: 0 },
      { userId: alice.id, bookId: "book6",  status: "want_to_read", progress: 0 },
      { userId: alice.id, bookId: "book15", status: "finished",     progress: 100, rating: 5 },
      { userId: bob.id,   bookId: "book3",  status: "finished",     progress: 100, rating: 5 },
      { userId: bob.id,   bookId: "book2",  status: "reading",      progress: 45 },
      { userId: bob.id,   bookId: "book1",  status: "finished",     progress: 100, rating: 5 },
      { userId: bob.id,   bookId: "book14", status: "finished",     progress: 100, rating: 5 },
      { userId: bob.id,   bookId: "book13", status: "want_to_read", progress: 0 },
    ],
  });

  console.log("✅ Seed data created successfully! 20 books, 2 users, 5 posts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
