import { 
  managedUsers, type ManagedUser, type InsertManagedUser,
  systemSettings, type SystemSetting, type InsertSystemSetting,
  externalServices, type ExternalService, type InsertExternalService,
  userServices,
  auditLogs, type AuditLog, type InsertAuditLog,
  tickets, type Ticket, type InsertTicket,
  ticketComments, type TicketComment, type InsertTicketComment,
  faqEntries, type FaqEntry, type InsertFaqEntry,
  userManuals, type UserManual, type InsertUserManual,
  customers, type Customer, type InsertCustomer,
  customerProfiles, type CustomerProfile, type InsertCustomerProfile,
  type CustomerWithProfile,
  collaborationBlueprints, type CollaborationBlueprint, type InsertBlueprint,
  sprints, type Sprint, type InsertSprint,
  projects, type Project, type InsertProject, type ProjectWithAssignments,
  projectAssignments, type ProjectAssignment, type InsertProjectAssignment,
  projectComments, type ProjectComment, type InsertProjectComment,
  projectTagsTable, type ProjectTagRecord, type InsertProjectTag,
  sectionTemplates, type SectionTemplate, type InsertSectionTemplate,
  pageSections, type PageSection, type InsertPageSection, type PageSectionWithTemplate
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
  
  // External services CRUD
  getExternalServices(): Promise<ExternalService[]>;
  getEnabledExternalServices(): Promise<ExternalService[]>;
  getExternalService(id: string): Promise<ExternalService | undefined>;
  createExternalService(service: InsertExternalService): Promise<ExternalService>;
  updateExternalService(id: string, data: Partial<InsertExternalService>): Promise<ExternalService | undefined>;
  deleteExternalService(id: string): Promise<boolean>;
  
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
  
  // Customers CRUD
  getAllCustomers(options?: { search?: string; type?: string; limit?: number; offset?: number }): Promise<{ customers: Customer[]; total: number }>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByExternalCode(code: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Customer profiles CRUD
  getCustomerProfile(customerId: string): Promise<CustomerProfile | undefined>;
  upsertCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  deleteCustomerProfile(customerId: string): Promise<boolean>;
  
  // Combined customer with profile
  getCustomerWithProfile(id: string): Promise<CustomerWithProfile | undefined>;
  
  // Collaboration blueprints CRUD
  getAllBlueprints(): Promise<CollaborationBlueprint[]>;
  getBlueprint(id: string): Promise<CollaborationBlueprint | undefined>;
  getBlueprintBySectionName(sectionName: string): Promise<CollaborationBlueprint | undefined>;
  createBlueprint(blueprint: InsertBlueprint): Promise<CollaborationBlueprint>;
  updateBlueprint(id: string, data: Partial<InsertBlueprint>): Promise<CollaborationBlueprint | undefined>;
  deleteBlueprint(id: string): Promise<boolean>;

  // Projects CRUD
  getAllProjects(options?: { userId?: string; status?: string }): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectWithAssignments(id: string): Promise<ProjectWithAssignments | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Project assignments
  getProjectAssignments(projectId: string): Promise<ProjectAssignment[]>;
  createProjectAssignment(assignment: InsertProjectAssignment): Promise<ProjectAssignment>;
  deleteProjectAssignment(id: string): Promise<boolean>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  
  // Project comments
  getProjectComments(projectId: string): Promise<ProjectComment[]>;
  createProjectComment(comment: InsertProjectComment): Promise<ProjectComment>;
  
  // Project tags
  getAllProjectTags(): Promise<ProjectTagRecord[]>;
  getProjectTag(id: string): Promise<ProjectTagRecord | undefined>;
  createProjectTag(tag: InsertProjectTag): Promise<ProjectTagRecord>;
  updateProjectTag(id: string, data: Partial<InsertProjectTag>): Promise<ProjectTagRecord | undefined>;
  deleteProjectTag(id: string): Promise<boolean>;
  
  // Sprints
  getAllSprints(): Promise<Sprint[]>;
  getSprint(id: string): Promise<Sprint | undefined>;
  getActiveSprint(): Promise<Sprint | undefined>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  updateSprint(id: string, data: Partial<InsertSprint>): Promise<Sprint | undefined>;
  deleteSprint(id: string): Promise<boolean>;
  closeSprint(id: string): Promise<{ sprint: Sprint; archivedCount: number } | undefined>;
  
  // User services (access control)
  getUserServices(userId: string): Promise<string[]>;
  setUserServices(userId: string, serviceIds: string[]): Promise<void>;

  // Section templates CRUD
  getAllSectionTemplates(): Promise<SectionTemplate[]>;
  getSectionTemplate(id: string): Promise<SectionTemplate | undefined>;
  getSectionTemplateByType(sectionType: string): Promise<SectionTemplate | undefined>;
  createSectionTemplate(template: InsertSectionTemplate): Promise<SectionTemplate>;
  updateSectionTemplate(id: string, data: Partial<InsertSectionTemplate>): Promise<SectionTemplate | undefined>;
  deleteSectionTemplate(id: string): Promise<boolean>;

  // Page sections CRUD
  getPageSectionsByService(serviceId: string): Promise<PageSectionWithTemplate[]>;
  getPageSection(id: string): Promise<PageSection | undefined>;
  createPageSection(section: InsertPageSection): Promise<PageSection>;
  updatePageSection(id: string, data: Partial<InsertPageSection>): Promise<PageSection | undefined>;
  deletePageSection(id: string): Promise<boolean>;
  reorderPageSections(serviceId: string, sectionIds: string[]): Promise<boolean>;
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

  // External services methods
  async getExternalServices(): Promise<ExternalService[]> {
    return await db.select().from(externalServices).orderBy(asc(externalServices.sortOrder));
  }

  async getEnabledExternalServices(): Promise<ExternalService[]> {
    return await db.select().from(externalServices)
      .where(eq(externalServices.isEnabled, true))
      .orderBy(asc(externalServices.sortOrder));
  }

  async getExternalService(id: string): Promise<ExternalService | undefined> {
    const [service] = await db.select().from(externalServices).where(eq(externalServices.id, id));
    return service;
  }

  async createExternalService(service: InsertExternalService): Promise<ExternalService> {
    const [created] = await db.insert(externalServices).values(service).returning();
    return created;
  }

  async updateExternalService(id: string, data: Partial<InsertExternalService>): Promise<ExternalService | undefined> {
    const [updated] = await db
      .update(externalServices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(externalServices.id, id))
      .returning();
    return updated;
  }

  async deleteExternalService(id: string): Promise<boolean> {
    const result = await db.delete(externalServices).where(eq(externalServices.id, id)).returning();
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
    // Generate tracking ID (DT + number format)
    const existingTickets = await db.select().from(tickets);
    const ticketNumber = existingTickets.length + 1;
    const trackingId = `DT${ticketNumber}`;
    
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

  // Customer methods
  async getAllCustomers(options?: { search?: string; type?: string; limit?: number; offset?: number }): Promise<{ customers: Customer[]; total: number }> {
    const { search, type, limit = 50, offset = 0 } = options || {};
    
    let conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          ilike(customers.contact, `%${search}%`)
        )
      );
    }
    if (type) {
      conditions.push(eq(customers.type, type));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(whereClause);
    
    const result = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { customers: result, total: countResult?.count || 0 };
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByExternalCode(code: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.externalCode, code));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await db.delete(customerProfiles).where(eq(customerProfiles.customerId, id));
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  // Customer profile methods
  async getCustomerProfile(customerId: string): Promise<CustomerProfile | undefined> {
    const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.customerId, customerId));
    return profile;
  }

  async upsertCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    const existing = await this.getCustomerProfile(profile.customerId);
    if (existing) {
      const [updated] = await db
        .update(customerProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(customerProfiles.customerId, profile.customerId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(customerProfiles).values(profile).returning();
      return created;
    }
  }

  async deleteCustomerProfile(customerId: string): Promise<boolean> {
    const result = await db.delete(customerProfiles).where(eq(customerProfiles.customerId, customerId)).returning();
    return result.length > 0;
  }

  // Combined customer with profile
  async getCustomerWithProfile(id: string): Promise<CustomerWithProfile | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;
    
    const profile = await this.getCustomerProfile(id);
    return { ...customer, profile: profile || undefined };
  }

  // Collaboration blueprints methods
  async getAllBlueprints(): Promise<CollaborationBlueprint[]> {
    return await db.select().from(collaborationBlueprints).orderBy(collaborationBlueprints.sectionName);
  }

  async getBlueprint(id: string): Promise<CollaborationBlueprint | undefined> {
    const [blueprint] = await db.select().from(collaborationBlueprints).where(eq(collaborationBlueprints.id, id));
    return blueprint;
  }

  async getBlueprintBySectionName(sectionName: string): Promise<CollaborationBlueprint | undefined> {
    const [blueprint] = await db.select().from(collaborationBlueprints).where(eq(collaborationBlueprints.sectionName, sectionName));
    return blueprint;
  }

  async createBlueprint(blueprint: InsertBlueprint): Promise<CollaborationBlueprint> {
    const [created] = await db.insert(collaborationBlueprints).values(blueprint).returning();
    return created;
  }

  async updateBlueprint(id: string, data: Partial<InsertBlueprint>): Promise<CollaborationBlueprint | undefined> {
    const [updated] = await db
      .update(collaborationBlueprints)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(collaborationBlueprints.id, id))
      .returning();
    return updated;
  }

  async deleteBlueprint(id: string): Promise<boolean> {
    const result = await db.delete(collaborationBlueprints).where(eq(collaborationBlueprints.id, id)).returning();
    return result.length > 0;
  }

  // Projects methods
  async getAllProjects(options?: { userId?: string; status?: string }): Promise<Project[]> {
    let query = db.select().from(projects);
    const conditions = [];
    
    if (options?.status) {
      conditions.push(eq(projects.status, options.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectWithAssignments(id: string): Promise<ProjectWithAssignments | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const assignments = await this.getProjectAssignments(id);
    const comments = await this.getProjectComments(id);
    
    const assignmentsWithUsers = await Promise.all(
      assignments.map(async (assignment) => {
        const user = await this.getManagedUser(assignment.userId);
        return { ...assignment, user };
      })
    );
    
    return { ...project, assignments: assignmentsWithUsers, comments };
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    await db.delete(projectAssignments).where(eq(projectAssignments.projectId, id));
    await db.delete(projectComments).where(eq(projectComments.projectId, id));
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Project assignments methods
  async getProjectAssignments(projectId: string): Promise<ProjectAssignment[]> {
    return await db.select().from(projectAssignments).where(eq(projectAssignments.projectId, projectId));
  }

  async createProjectAssignment(assignment: InsertProjectAssignment): Promise<ProjectAssignment> {
    const [created] = await db.insert(projectAssignments).values(assignment).returning();
    return created;
  }

  async deleteProjectAssignment(id: string): Promise<boolean> {
    const result = await db.delete(projectAssignments).where(eq(projectAssignments.id, id)).returning();
    return result.length > 0;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    const assignments = await db.select().from(projectAssignments).where(eq(projectAssignments.userId, userId));
    const projectIds = assignments.map(a => a.projectId);
    
    if (projectIds.length === 0) return [];
    
    const userProjects = await db.select().from(projects).where(
      or(...projectIds.map(pid => eq(projects.id, pid)))
    );
    return userProjects;
  }

  // Project comments methods
  async getProjectComments(projectId: string): Promise<ProjectComment[]> {
    return await db.select().from(projectComments)
      .where(eq(projectComments.projectId, projectId))
      .orderBy(asc(projectComments.createdAt));
  }

  async createProjectComment(comment: InsertProjectComment): Promise<ProjectComment> {
    const [created] = await db.insert(projectComments).values(comment).returning();
    return created;
  }

  // Project tags methods
  async getAllProjectTags(): Promise<ProjectTagRecord[]> {
    return await db.select().from(projectTagsTable).orderBy(asc(projectTagsTable.name));
  }

  async getProjectTag(id: string): Promise<ProjectTagRecord | undefined> {
    const [tag] = await db.select().from(projectTagsTable).where(eq(projectTagsTable.id, id));
    return tag;
  }

  async createProjectTag(tag: InsertProjectTag): Promise<ProjectTagRecord> {
    const [created] = await db.insert(projectTagsTable).values(tag).returning();
    return created;
  }

  async updateProjectTag(id: string, data: Partial<InsertProjectTag>): Promise<ProjectTagRecord | undefined> {
    const [updated] = await db.update(projectTagsTable)
      .set(data)
      .where(eq(projectTagsTable.id, id))
      .returning();
    return updated;
  }

  async deleteProjectTag(id: string): Promise<boolean> {
    const result = await db.delete(projectTagsTable).where(eq(projectTagsTable.id, id));
    return true;
  }

  // Sprint methods
  async getAllSprints(): Promise<Sprint[]> {
    return await db.select().from(sprints).orderBy(asc(sprints.startDate));
  }

  async getSprint(id: string): Promise<Sprint | undefined> {
    const [sprint] = await db.select().from(sprints).where(eq(sprints.id, id));
    return sprint;
  }

  async getActiveSprint(): Promise<Sprint | undefined> {
    const [sprint] = await db.select().from(sprints).where(eq(sprints.isActive, true));
    return sprint;
  }

  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    const [created] = await db.insert(sprints).values(sprint).returning();
    return created;
  }

  async updateSprint(id: string, data: Partial<InsertSprint>): Promise<Sprint | undefined> {
    const [updated] = await db.update(sprints)
      .set(data)
      .where(eq(sprints.id, id))
      .returning();
    return updated;
  }

  async deleteSprint(id: string): Promise<boolean> {
    await db.delete(sprints).where(eq(sprints.id, id));
    return true;
  }

  async closeSprint(id: string): Promise<{ sprint: Sprint; archivedCount: number } | undefined> {
    const sprint = await this.getSprint(id);
    if (!sprint) return undefined;

    // Use transaction to ensure data integrity
    return await db.transaction(async (tx) => {
      // Count completed tasks from this sprint
      const completedTasks = await tx.select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.sprintId, id), eq(projects.status, "completed")));
      
      const archivedCount = completedTasks.length;
      
      // Mark sprint as closed first
      const [updated] = await tx.update(sprints)
        .set({ isClosed: true, isActive: false })
        .where(eq(sprints.id, id))
        .returning();

      // Delete the completed tasks after sprint is closed
      if (archivedCount > 0) {
        await tx.delete(projects).where(and(eq(projects.sprintId, id), eq(projects.status, "completed")));
      }

      return { sprint: updated, archivedCount };
    });
  }

  // User services (access control) methods
  async getUserServices(userId: string): Promise<string[]> {
    const services = await db.select({ serviceId: userServices.serviceId })
      .from(userServices)
      .where(eq(userServices.userId, userId));
    return services.map(s => s.serviceId);
  }

  async setUserServices(userId: string, serviceIds: string[]): Promise<void> {
    await db.delete(userServices).where(eq(userServices.userId, userId));
    if (serviceIds.length > 0) {
      await db.insert(userServices).values(
        serviceIds.map(serviceId => ({ userId, serviceId }))
      );
    }
  }

  // Section templates methods
  async getAllSectionTemplates(): Promise<SectionTemplate[]> {
    return await db.select().from(sectionTemplates).orderBy(asc(sectionTemplates.name));
  }

  async getSectionTemplate(id: string): Promise<SectionTemplate | undefined> {
    const [template] = await db.select().from(sectionTemplates).where(eq(sectionTemplates.id, id));
    return template;
  }

  async getSectionTemplateByType(sectionType: string): Promise<SectionTemplate | undefined> {
    const [template] = await db.select().from(sectionTemplates).where(eq(sectionTemplates.sectionType, sectionType));
    return template;
  }

  async createSectionTemplate(template: InsertSectionTemplate): Promise<SectionTemplate> {
    const [created] = await db.insert(sectionTemplates).values(template).returning();
    return created;
  }

  async updateSectionTemplate(id: string, data: Partial<InsertSectionTemplate>): Promise<SectionTemplate | undefined> {
    const [updated] = await db
      .update(sectionTemplates)
      .set(data)
      .where(eq(sectionTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSectionTemplate(id: string): Promise<boolean> {
    const result = await db.delete(sectionTemplates).where(eq(sectionTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Page sections methods
  async getPageSectionsByService(serviceId: string): Promise<PageSectionWithTemplate[]> {
    const rows = await db
      .select({
        section: pageSections,
        template: sectionTemplates,
      })
      .from(pageSections)
      .leftJoin(sectionTemplates, eq(pageSections.sectionTemplateId, sectionTemplates.id))
      .where(eq(pageSections.serviceId, serviceId))
      .orderBy(asc(pageSections.sortOrder));

    return rows.map(row => ({
      ...row.section,
      template: row.template || null,
    }));
  }

  async getPageSection(id: string): Promise<PageSection | undefined> {
    const [section] = await db.select().from(pageSections).where(eq(pageSections.id, id));
    return section;
  }

  async createPageSection(section: InsertPageSection): Promise<PageSection> {
    const [created] = await db.insert(pageSections).values(section).returning();
    return created;
  }

  async updatePageSection(id: string, data: Partial<InsertPageSection>): Promise<PageSection | undefined> {
    const [updated] = await db
      .update(pageSections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pageSections.id, id))
      .returning();
    return updated;
  }

  async deletePageSection(id: string): Promise<boolean> {
    const result = await db.delete(pageSections).where(eq(pageSections.id, id)).returning();
    return result.length > 0;
  }

  async reorderPageSections(serviceId: string, sectionIds: string[]): Promise<boolean> {
    for (let i = 0; i < sectionIds.length; i++) {
      await db
        .update(pageSections)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(eq(pageSections.id, sectionIds[i]), eq(pageSections.serviceId, serviceId)));
    }
    return true;
  }
}

export const storage = new DatabaseStorage();
