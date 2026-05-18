import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create demo users
  const password = await bcrypt.hash("demo123456", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@bookshare.com" },
    update: {},
    create: {
      name: "Alice Chen",
      email: "alice@bookshare.com",
      password,
      bio: "热爱阅读，分享好书 | Book lover & sharer",
      readingGoal: 24,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
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
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    },
  });

  // Create books
  const books = await Promise.all([
    prisma.book.upsert({
      where: { id: "book1" },
      update: {},
      create: {
        id: "book1",
        title: "The Three-Body Problem",
        titleZh: "三体",
        author: "Liu Cixin",
        authorZh: "刘慈欣",
        cover: "https://covers.openlibrary.org/b/id/12621854-L.jpg",
        description: "A groundbreaking science fiction series about humanity's first contact with an alien civilization.",
        descriptionZh: "描述人类与外星文明第一次接触的里程碑式科幻小说。",
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
        cover: "https://covers.openlibrary.org/b/id/8231519-L.jpg",
        description: "A poignant story of survival and resilience in modern China.",
        descriptionZh: "一部关于在苦难中求生的感人故事。",
        genre: "Literary Fiction",
        publishYear: 1993,
      },
    }),
    prisma.book.upsert({
      where: { id: "book3" },
      update: {},
      create: {
        id: "book3",
        title: "Sapiens",
        titleZh: "人类简史",
        author: "Yuval Noah Harari",
        authorZh: "尤瓦尔·赫拉利",
        cover: "https://covers.openlibrary.org/b/id/8406786-L.jpg",
        description: "A brief history of humankind from the Stone Age to the present day.",
        descriptionZh: "从石器时代到当今世界，人类历史的简明读本。",
        genre: "History / Popular Science",
        publishYear: 2011,
      },
    }),
    prisma.book.upsert({
      where: { id: "book4" },
      update: {},
      create: {
        id: "book4",
        title: "Atomic Habits",
        titleZh: "原子习惯",
        author: "James Clear",
        authorZh: "詹姆斯·克利尔",
        cover: "https://covers.openlibrary.org/b/id/10521270-L.jpg",
        description: "An easy and proven way to build good habits and break bad ones.",
        descriptionZh: "建立良好习惯、戒除不良习惯的实用指南。",
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
        cover: "https://covers.openlibrary.org/b/id/8269846-L.jpg",
        description: "A magical story about following your dreams.",
        descriptionZh: "一个关于追随梦想的魔幻故事。",
        genre: "Fiction",
        publishYear: 1988,
      },
    }),
  ]);

  // Create posts
  await prisma.post.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "post1",
        userId: alice.id,
        bookId: "book1",
        type: "review",
        content: "三体真的太震撼了！刘慈欣用宏大的宇宙观重新定义了科幻小说的边界。强烈推荐给每一个热爱思考的读者！\n\nThe Three-Body Problem is mind-blowing! Liu Cixin redefined the boundaries of science fiction with his grand cosmic vision. Highly recommended!",
      },
      {
        id: "post2",
        userId: bob.id,
        bookId: "book3",
        type: "share",
        content: "《人类简史》让我重新审视了我们作为人类的位置。赫拉利的笔触既宏观又细腻，读完之后久久不能平静。\n\nSapiens made me reconsider our place as humans. Harari's writing is both grand and nuanced. I couldn't stop thinking after finishing it.",
      },
      {
        id: "post3",
        userId: alice.id,
        bookId: "book4",
        type: "progress",
        content: "正在读《原子习惯》，已经开始尝试书中的方法了！每天进步1%，一年后提升37倍！\n\nCurrently reading Atomic Habits and already trying the methods! 1% better every day = 37x improvement in a year!",
      },
    ],
  });

  // Add likes
  await prisma.like.createMany({
    skipDuplicates: true,
    data: [
      { postId: "post1", userId: bob.id },
      { postId: "post2", userId: alice.id },
      { postId: "post3", userId: bob.id },
    ],
  });

  // Add comments
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
    ],
  });

  // Add reading lists
  await prisma.userBook.createMany({
    skipDuplicates: true,
    data: [
      { userId: alice.id, bookId: "book1", status: "finished", progress: 100, rating: 5 },
      { userId: alice.id, bookId: "book4", status: "reading", progress: 60 },
      { userId: alice.id, bookId: "book5", status: "want_to_read", progress: 0 },
      { userId: bob.id, bookId: "book3", status: "finished", progress: 100, rating: 5 },
      { userId: bob.id, bookId: "book2", status: "reading", progress: 45 },
      { userId: bob.id, bookId: "book1", status: "finished", progress: 100, rating: 5 },
    ],
  });

  console.log("✅ Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
