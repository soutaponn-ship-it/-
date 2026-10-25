import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, parentLinks, studyData, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _pool: InstanceType<typeof Pool> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _pool = new Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 5 });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  try {
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] upsertUser failed:", error instanceof Error ? error.message : "unknown database error");
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserName(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId));
  return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function hasActiveParentLink(parentId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: parentLinks.id }).from(parentLinks).where(and(eq(parentLinks.parentId, parentId), eq(parentLinks.status, "active"))).limit(1);
  return Boolean(result[0]);
}
export async function getStudyData(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studyData).where(eq(studyData.userId, userId)).limit(1);
  return result[0]?.payload;
}

export async function saveStudyData(userId: number, payload: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(studyData).values({ userId, payload }).onConflictDoUpdate({ target: studyData.userId, set: { payload, updatedAt: new Date() } });
  return { saved: true, updatedAt: new Date() };
}

function createInviteCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function createParentInvite(studentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const inviteCode = createInviteCode();
  await db.insert(parentLinks).values({ studentId, inviteCode });
  return (await db.select().from(parentLinks).where(eq(parentLinks.inviteCode, inviteCode)).limit(1))[0];
}

export async function listParentLinks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parentLinks).where(or(eq(parentLinks.studentId, userId), eq(parentLinks.parentId, userId)));
}

export async function getSharedStudyData(parentId: number) {
  const db = await getDb();
  if (!db) return null;
  const link = (await db.select().from(parentLinks).where(and(eq(parentLinks.parentId, parentId), eq(parentLinks.status, "active"))).limit(1))[0];
  if (!link) return null;
  const studentData = (await db.select().from(studyData).where(eq(studyData.userId, link.studentId)).limit(1))[0];
  let payload: string | null = studentData?.payload ?? null;
  if (payload) {
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const filtered = {
        ...parsed,
        plans: link.sharePlan ? parsed.plans ?? [] : [],
        tasks: link.sharePlan ? parsed.tasks ?? [] : [],
        studies: link.shareStudy ? parsed.studies ?? [] : [],
        exams: link.shareScores ? parsed.exams ?? [] : [],
        weaknesses: link.shareWeaknesses ? parsed.weaknesses ?? [] : [],
        goal: link.shareScores ? parsed.goal ?? { hours: 0, score: 0 } : { hours: 0, score: 0 },
      };
      payload = JSON.stringify(filtered);
    } catch {
      payload = null;
    }
  }
  return {
    payload,
    sharePlan: Boolean(link.sharePlan),
    shareStudy: Boolean(link.shareStudy),
    shareScores: Boolean(link.shareScores),
    shareWeaknesses: Boolean(link.shareWeaknesses),
    studentId: link.studentId,
  };
}

export async function redeemParentInvite(parentId: number, inviteCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const link = (await db.select().from(parentLinks).where(and(eq(parentLinks.inviteCode, inviteCode), eq(parentLinks.status, "pending"))).limit(1))[0];
  if (!link) throw new Error("招待コードが無効または期限切れです");
  if (link.studentId === parentId) throw new Error("自分自身とは連携できません");
  await db.update(parentLinks).set({ parentId, status: "active", updatedAt: new Date() }).where(eq(parentLinks.id, link.id));
  return { ...link, parentId, status: "active" as const };
}

export async function updateParentSharing(userId: number, linkId: number, values: { sharePlan?: number; shareStudy?: number; shareScores?: number; shareWeaknesses?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const link = (await db.select().from(parentLinks).where(and(eq(parentLinks.id, linkId), eq(parentLinks.studentId, userId))).limit(1))[0];
  if (!link) throw new Error("共有設定を変更する権限がありません");
  await db.update(parentLinks).set({ ...values, updatedAt: new Date() }).where(eq(parentLinks.id, linkId));
  return { ok: true };
}
