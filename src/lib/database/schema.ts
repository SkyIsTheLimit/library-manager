import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// Library specific tables with sync support
export const books = sqliteTable("books", {
  id: text("id").primaryKey(), // Using UUID or generated string for better sync
  userId: text("userId").notNull().references(() => user.id),
  externalId: text("externalId").notNull(),
  source: text("source").notNull(),
  slug: text("slug"),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverUrl: text("coverUrl").notNull(),
  readerUrl: text("readerUrl").notNull(),
  dateAdded: integer("dateAdded", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
});

export const progress = sqliteTable("progress", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  bookId: text("bookId").notNull(), // externalId
  currentChapterUrl: text("currentChapterUrl").notNull(),
  currentChapterTitle: text("currentChapterTitle").notNull(),
  percentComplete: integer("percentComplete").notNull(),
  lastAccessed: integer("lastAccessed", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  name: text("name").notNull(),
  description: text("description"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
});

export const playlistBooks = sqliteTable("playlist_books", {
  playlistId: text("playlistId").notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  bookId: text("bookId").notNull(), // externalId
}, (table) => ({
  pk: primaryKey({ columns: [table.playlistId, table.bookId] }),
}));

export const adapters = sqliteTable("adapters", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  name: text("name").notNull(),
  urlMatchPattern: text("urlMatchPattern").notNull(),
  titleSelector: text("titleSelector"),
  authorSelector: text("authorSelector"),
  coverSelector: text("coverSelector"),
  readerUrlTemplate: text("readerUrlTemplate").notNull(),
  idRegex: text("idRegex"),
  slugRegex: text("slugRegex"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  deleted: integer("deleted", { mode: "boolean" }).default(false),
});
