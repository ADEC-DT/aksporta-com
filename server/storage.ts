import { 
  managedUsers, type ManagedUser, type InsertManagedUser,
  systemSettings, type SystemSetting, type InsertSystemSetting,
  auditLogs, type AuditLog, type InsertAuditLog,
  tickets, type Ticket, type InsertTicket,
  ticketComments, type TicketComment, type InsertTicketComment,
  faqEntries, type FaqEntry, type InsertFaqEntry,
  userManuals, type UserManual, type InsertUserManual
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, ilike, or, asc } from "drizzle-orm";

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
  
  // Tickets CRUD
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketByTrackingId(trackingId: string): Promise<Ticket | undefined>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getAllTickets(options?: { status?: string; limit?: number; offset?: number }): Promise<{ tickets: Ticket[]; total: number }>;
  updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket | undefined>;
  
  // Ticket comments
  createTicketComment(comment: InsertTicketComment): Promise<TicketComment>;
  getTicketComments(ticketId: string): Promise<TicketComment[]>;
  
  // FAQ entries
  getAllFaqEntries(): Promise<FaqEntry[]>;
  getFaqEntriesByCategory(category: string): Promise<FaqEntry[]>;
  createFaqEntry(entry: InsertFaqEntry): Promise<FaqEntry>;
  updateFaqEntry(id: string, data: Partial<InsertFaqEntry>): Promise<FaqEntry | undefined>;
  deleteFaqEntry(id: string): Promise<boolean>;
  
  // User manuals
  getAllUserManuals(): Promise<UserManual[]>;
  getUserManualsByCategory(category: string): Promise<UserManual[]>;
  getUserManual(id: string): Promise<UserManual | undefined>;
  createUserManual(manual: InsertUserManual): Promise<UserManual>;
  updateUserManual(id: string, data: Partial<InsertUserManual>): Promise<UserManual | undefined>;
  deleteUserManual(id: string): Promise<boolean>;
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

  // Ticket methods
  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    // Generate tracking ID (INC-YYYY-NNN format)
    const year = new Date().getFullYear();
    const existingTickets = await db.select().from(tickets);
    const ticketNumber = (existingTickets.length + 1).toString().padStart(3, '0');
    const trackingId = `INC-${year}-${ticketNumber}`;
    
    const [ticket] = await db.insert(tickets).values({
      ...ticketData,
      trackingId,
    }).returning();
    return ticket;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByTrackingId(trackingId: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.trackingId, trackingId));
    return ticket;
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async getAllTickets(options?: { status?: string; limit?: number; offset?: number }): Promise<{ tickets: Ticket[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    let query = db.select().from(tickets);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(tickets);
    
    if (options?.status) {
      query = query.where(eq(tickets.status, options.status)) as typeof query;
      countQuery = countQuery.where(eq(tickets.status, options.status)) as typeof countQuery;
    }
    
    const ticketList = await query.orderBy(desc(tickets.createdAt)).limit(limit).offset(offset);
    const [{ count: total }] = await countQuery;
    
    return { tickets: ticketList, total: Number(total) };
  }

  async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  // Ticket comment methods
  async createTicketComment(comment: InsertTicketComment): Promise<TicketComment> {
    const [created] = await db.insert(ticketComments).values(comment).returning();
    return created;
  }

  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    return await db.select().from(ticketComments)
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(asc(ticketComments.createdAt));
  }

  // FAQ methods
  async getAllFaqEntries(): Promise<FaqEntry[]> {
    return await db.select().from(faqEntries)
      .where(eq(faqEntries.isPublished, true))
      .orderBy(faqEntries.category, faqEntries.order);
  }

  async getFaqEntriesByCategory(category: string): Promise<FaqEntry[]> {
    return await db.select().from(faqEntries)
      .where(and(eq(faqEntries.category, category), eq(faqEntries.isPublished, true)))
      .orderBy(faqEntries.order);
  }

  async createFaqEntry(entry: InsertFaqEntry): Promise<FaqEntry> {
    const [created] = await db.insert(faqEntries).values(entry).returning();
    return created;
  }

  async updateFaqEntry(id: string, data: Partial<InsertFaqEntry>): Promise<FaqEntry | undefined> {
    const [updated] = await db
      .update(faqEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(faqEntries.id, id))
      .returning();
    return updated;
  }

  async deleteFaqEntry(id: string): Promise<boolean> {
    const result = await db.delete(faqEntries).where(eq(faqEntries.id, id)).returning();
    return result.length > 0;
  }

  // User manual methods
  async getAllUserManuals(): Promise<UserManual[]> {
    return await db.select().from(userManuals)
      .where(eq(userManuals.isPublished, true))
      .orderBy(userManuals.category, userManuals.order);
  }

  async getUserManualsByCategory(category: string): Promise<UserManual[]> {
    return await db.select().from(userManuals)
      .where(and(eq(userManuals.category, category), eq(userManuals.isPublished, true)))
      .orderBy(userManuals.order);
  }

  async getUserManual(id: string): Promise<UserManual | undefined> {
    const [manual] = await db.select().from(userManuals).where(eq(userManuals.id, id));
    return manual;
  }

  async createUserManual(manual: InsertUserManual): Promise<UserManual> {
    const [created] = await db.insert(userManuals).values(manual).returning();
    return created;
  }

  async updateUserManual(id: string, data: Partial<InsertUserManual>): Promise<UserManual | undefined> {
    const [updated] = await db
      .update(userManuals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userManuals.id, id))
      .returning();
    return updated;
  }

  async deleteUserManual(id: string): Promise<boolean> {
    const result = await db.delete(userManuals).where(eq(userManuals.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
