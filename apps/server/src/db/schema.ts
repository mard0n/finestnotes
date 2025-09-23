import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  content: text().notNull()
});

export const annotations = sqliteTable("annotations", {
  id: int().primaryKey({ autoIncrement: true }),
  type: text({enum: ["highlight", "page", "image"]}).notNull(),
  sourceTitle: text().notNull(),
  sourceLink: text().notNull(),
  content: text(),
  link: text(),
  comment: text()
});
/* 
// {
//   "type": "highlight",
//   "sourceTitle": "Page Title",
//   "sourceLink": "https://example.com/page",
//   "content": "Highlighted text",
//   "comment": "User's comment on the highlight",
//   "link": "https://example.com/page#highlight-id"
// }
// {  
//   "type": "page",
//   "sourceTitle": "Page Title",
//   "sourceLink": "https://example.com/page",
//   "content": "",
//   "comment": "User's comment on the page",
//   "link": ""
// }
// {
//   "type": "image",
//   "sourceTitle": "Image Title",
//   "sourceLink": "https://example.com/page",
//   "content": "Image description or note",
//   "comment": "User's comment on the image",
//   "link": "https://example.com/asset/image-id.png"
// }
*/