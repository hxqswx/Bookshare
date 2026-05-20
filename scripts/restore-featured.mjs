import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

await p.book.upsert({
  where: { id: "cmpcqmehe0000qwwg1hyu8xiq" },
  update: {
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1406692748i/22841325.jpg",
    isFeatured: true,
    fileUrl: "https://9jo5k1avbay4nzzx.private.blob.vercel-storage.com/%E5%87%A1%E4%BA%BA%E4%BF%AE%E4%BB%99%E4%BC%A0-%E4%B8%8A-zhnngWeESmNqfm8yRMWsGdGEO4ZkUw.txt",
    fileType: "txt",
    readLink: "https://www.qidian.com/book/107580/",
  },
  create: {
    id: "cmpcqmehe0000qwwg1hyu8xiq",
    title: "A Mortal's Journey to Immortality",
    titleZh: "凡人修仙传",
    author: "Wang Yu",
    authorZh: "忘语",
    cover: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1406692748i/22841325.jpg",
    description: "An ordinary village boy with no special talent rises to become an immortal through persistence and wit.",
    descriptionZh: "普通山村穷小子韩立偶入修真门派，资质平常却意志坚定，凭借神秘小瓶和自身努力在修真界崛起。忘语代表作。",
    genre: "Fantasy",
    publishYear: 2008,
    isFeatured: true,
    fileUrl: "https://9jo5k1avbay4nzzx.private.blob.vercel-storage.com/%E5%87%A1%E4%BA%BA%E4%BF%AE%E4%BB%99%E4%BC%A0-%E4%B8%8A-zhnngWeESmNqfm8yRMWsGdGEO4ZkUw.txt",
    fileType: "txt",
    readLink: "https://www.qidian.com/book/107580/",
  },
});
console.log("Restored 凡人修仙传");

// Mark a few seed books as featured for the editor picks section
const featuredIds = ["book1", "book7", "book2", "book8", "book9"];
for (const id of featuredIds) {
  await p.book.updateMany({ where: { id }, data: { isFeatured: true } });
}
console.log("Marked featured books");

const total = await p.book.count();
console.log("Total books: " + total);
await p.$disconnect();
