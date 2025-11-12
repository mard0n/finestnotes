import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type", { enum: ["note", "page"] }).notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  title: text("title").notNull(),

  content: text("content"),
  contentLexical: text("content_lexical"),
  contentHTML: text("content_html"),

  url: text("url"),
  description: text("description"),
});

export const notesRelations = relations(notes, ({ one, many }) => ({
  author: one(user, {
    fields: [notes.authorId],
    references: [user.id],
  }),
  highlights: many(highlights),
  images: many(images),
  projectsToNotes: many(projectsToNotes),
  likes: many(likes),
  comments: many(comments),
}));

export const highlights = sqliteTable("highlights", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["highlight"] })
    .notNull()
    .default("highlight"),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  text: text("text").notNull(),
  position: text("position").notNull(),
  comment: text("comment"),
});

export const highlightsRelations = relations(highlights, ({ one }) => ({
  note: one(notes, {
    fields: [highlights.noteId],
    references: [notes.id],
  }),
}));

export const images = sqliteTable("images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["image"] })
    .notNull()
    .default("image"),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  imageUrl: text("image_url").notNull(),
  comment: text("comment"),
});

export const imagesRelations = relations(images, ({ one }) => ({
  note: one(notes, {
    fields: [images.noteId],
    references: [notes.id],
  }),
}));

export const projects = sqliteTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(user, {
    fields: [projects.authorId],
    references: [user.id],
  }),
  projectsToNotes: many(projectsToNotes),
  projectsToSubscribers: many(projectsToSubscribers),
}));

export const projectsToNotes = sqliteTable(
  "projects_to_notes",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.noteId] })]
);

export const projectsToNotesRelations = relations(
  projectsToNotes,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectsToNotes.projectId],
      references: [projects.id],
    }),
    note: one(notes, {
      fields: [projectsToNotes.noteId],
      references: [notes.id],
    }),
  })
);

export const projectsToSubscribers = sqliteTable(
  "projects_to_subscribers",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.authorId] })]
);

export const projectsToSubscribersRelations = relations(
  projectsToSubscribers,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectsToSubscribers.projectId],
      references: [projects.id],
    }),
    author: one(user, {
      fields: [projectsToSubscribers.authorId],
      references: [user.id],
    }),
  })
);

export const likes = sqliteTable(
  "likes",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.userId] })]
);

export const likesRelations = relations(likes, ({ one }) => ({
  note: one(notes, {
    fields: [likes.noteId],
    references: [notes.id],
  }),
  user: one(user, {
    fields: [likes.userId],
    references: [user.id],
  }),
}));

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

export const userRelations = relations(user, ({ many }) => ({
  notes: many(notes),
  projects: many(projects), // Authored projects
  projectsToSubscribers: many(projectsToSubscribers), // Subscribed projects
  likes: many(likes),
  comments: many(comments),
  commentReactions: many(commentReactions),
}));

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

export const comments = sqliteTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  parentCommentId: text("parent_comment_id"), // Self-reference for nested comments
  content: text("content").notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(user, {
    fields: [comments.authorId],
    references: [user.id],
  }),
  note: one(notes, {
    fields: [comments.noteId],
    references: [notes.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "comment_replies",
  }),
  replies: many(comments, {
    relationName: "comment_replies",
  }),
  reactions: many(commentReactions),
}));

export const commentReactions = sqliteTable(
  "comment_reactions",
  {
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["like", "dislike"] }).notNull(),
    createdAt: text("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })]
);

export const commentReactionsRelations = relations(
  commentReactions,
  ({ one }) => ({
    comment: one(comments, {
      fields: [commentReactions.commentId],
      references: [comments.id],
    }),
    user: one(user, {
      fields: [commentReactions.userId],
      references: [user.id],
    }),
  })
);
