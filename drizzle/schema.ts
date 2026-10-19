import { integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const parentStatusEnum = pgEnum("parent_link_status", ["pending", "active", "revoked"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const studyData = pgTable("study_data", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  userIdUnique: uniqueIndex("study_data_user_id_unique").on(table.userId),
}));

export type StudyData = typeof studyData.$inferSelect;

export const parentLinks = pgTable("parent_links", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  parentId: integer("parentId"),
  inviteCode: varchar("inviteCode", { length: 16 }).notNull().unique(),
  status: parentStatusEnum("status").default("pending").notNull(),
  sharePlan: integer("sharePlan").default(1).notNull(),
  shareStudy: integer("shareStudy").default(1).notNull(),
  shareScores: integer("shareScores").default(1).notNull(),
  shareWeaknesses: integer("shareWeaknesses").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});
