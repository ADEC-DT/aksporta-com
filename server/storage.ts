import { 
  managedUsers, type ManagedUser, type InsertManagedUser,
  systemSettings, type SystemSetting, type InsertSystemSetting,
  auditLogs, type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, count, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Managed users CRUD
  getAllManagedUsers(): Promise<ManagedUser[]>;
  getManagedUser(id: string): Promise<ManagedUser | undefined>;
  getManagedUserByEmail(email: string): Promise<ManagedUser | undefined>;
  getManagedUserByUsername(username: string): Promise<ManagedUser | undefined>;
  createManagedUser(user: InsertManagedUser): Promise<ManagedUser>;
  updateManagedUser(id: string, data: Partial<InsertManagedUser>): Promise<ManagedUser | undefined>;
  deleteManagedUser(id: string): Promise<boolean>;
  
  // Stats
  getUserStats(): Promise<{ totalUsers: number; activeUsers: number; roleDistribution: { role: string; count: number }[] }>;
  
  // System settings CRUD
  getAllSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getSystemSettingsByCategory(category: string): Promise<SystemSetting[]>;
  upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<boolean>;
  
  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(options?: { 
    limit?: number; 
    offset?: number; 
    category?: string; 
    action?: string;
    search?: string;
  }): Promise<{ logs: AuditLog[]; total: number }>;
}

export class DatabaseStorage implements IStorage {
  async getAllManagedUsers(): Promise<ManagedUser[]> {
    return await db.select().from(managedUsers).orderBy(managedUsers.createdAt);
  }

  async getManagedUser(id: string): Promise<ManagedUser | undefined> {
    const [user] = await db.select().from(managedUsers).where(eq(managedUsers.id, id));
    return user;
  }

  async getManagedUserByEmail(email: string): Promise<ManagedUser | undefined> {
    const [user] = await db.select().from(managedUsers).where(eq(managedUsers.email, email));
    return user;
  }

  async getManagedUserByUsername(username: string): Promise<ManagedUser | undefined> {
    const [user] = await db.select().from(managedUsers).where(eq(managedUsers.username, username));
    return user;
  }

  async createManagedUser(userData: InsertManagedUser): Promise<ManagedUser> {
    const [user] = await db.insert(managedUsers).values(userData).returning();
    return user;
  }

  async updateManagedUser(id: string, data: Partial<InsertManagedUser>): Promise<ManagedUser | undefined> {
    const [user] = await db
      .update(managedUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(managedUsers.id, id))
      .returning();
    return user;
  }

  async deleteManagedUser(id: string): Promise<boolean> {
    const result = await db.delete(managedUsers).where(eq(managedUsers.id, id)).returning();
    return result.length > 0;
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; roleDistribution: { role: string; count: number }[] }> {
    const allUsers = await db.select().from(managedUsers);
    const totalUsers = allUsers.length;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = allUsers.filter(u => u.lastActiveAt && u.lastActiveAt > oneDayAgo).length;
    
    const roleMap = new Map<string, number>();
    allUsers.forEach(u => {
      const role = u.role || 'viewer';
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
    });
    
    const roleDistribution = Array.from(roleMap.entries()).map(([role, count]) => ({ role, count }));
    
    return { totalUsers, activeUsers, roleDistribution };
  }

  // System settings methods
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async getSystemSettingsByCategory(category: string): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).where(eq(systemSettings.category, category));
  }

  async upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(setting.key);
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(systemSettings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(systemSettings).values(setting).returning();
      return created;
    }
  }

  async deleteSystemSetting(key: string): Promise<boolean> {
    const result = await db.delete(systemSettings).where(eq(systemSettings.key, key)).returning();
    return result.length > 0;
  }

  // Audit log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(options?: { 
    limit?: number; 
    offset?: number; 
    category?: string; 
    action?: string;
    search?: string;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    let query = db.select().from(auditLogs);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(auditLogs);
    
    const conditions = [];
    if (options?.category) {
      conditions.push(eq(auditLogs.category, options.category));
    }
    if (options?.action) {
      conditions.push(eq(auditLogs.action, options.action));
    }
    if (options?.search) {
      conditions.push(
        or(
          ilike(auditLogs.action, `%${options.search}%`),
          ilike(auditLogs.userEmail || '', `%${options.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereClause!) as typeof query;
      countQuery = countQuery.where(whereClause!) as typeof countQuery;
    }
    
    const logs = await query.orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
    const [{ count: total }] = await countQuery;
    
    return { logs, total: Number(total) };
  }
}

export const storage = new DatabaseStorage();
