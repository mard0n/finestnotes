import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";


export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull()
});

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  comment: text("comment"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});


export const highlights = sqliteTable("highlights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["highlight"] }).notNull().default("highlight"),
  pageId: integer("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  position: text("position").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});


export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["image"] }).notNull().default("image"),
  pageId: integer("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const pagesRelations = relations(pages, ({ one, many }) => ({
  // user: one(users, {
  //   fields: [pages.userId],
  //   references: [users.id],
  // }),
  highlights: many(highlights),
  images: many(images)
}));

export const highlightsRelations = relations(highlights, ({ one }) => ({
  page: one(pages, {
    fields: [highlights.pageId],
    references: [pages.id],
  }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  page: one(pages, {
    fields: [images.pageId],
    references: [pages.id],
  }),
}));

// export const usersRelations = relations(users, ({ many }) => ({
//   pages: many(pages),
//   highlights: many(highlights),
//   images: many(images),
//   notes: many(notes),
// }));


export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

