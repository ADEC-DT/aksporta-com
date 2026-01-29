import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// User roles enum
export const userRoles = ["admin", "editor", "viewer"] as const;
export type UserRole = typeof userRoles[number];

// Extended user with roles (managed users for admin panel)
export const managedUsers = pgTable("managed_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  username: varchar("username").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"),
  jobTitle: varchar("job_title"),
  phoneNumber: varchar("phone_number"),
  profilePicture: varchar("profile_picture"),
  role: varchar("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecret: varchar("mfa_secret"),
  mfaBackupCodes: text("mfa_backup_codes").array(),
  theme: varchar("theme").notNull().default("system"),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertManagedUserSchema = createInsertSchema(managedUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertManagedUser = z.infer<typeof insertManagedUserSchema>;
export type ManagedUser = typeof managedUsers.$inferSelect;

// Admin dashboard statistics type
export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  roleDistribution: { role: string; count: number }[];
};

// Types for dashboard data
export type MetricCard = {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
};

export type NetSuiteData = {
  metrics: MetricCard[];
  transactions: {
    id: string;
    date: string;
    type: string;
    customer: string;
    amount: number;
    status: "completed" | "pending" | "failed";
  }[];
  revenueByMonth: { month: string; revenue: number }[];
  lastSync: string;
  connectionStatus: "connected" | "disconnected" | "syncing";
};

export type HRData = {
  metrics: MetricCard[];
  employees: {
    id: string;
    name: string;
    department: string;
    position: string;
    status: "active" | "on-leave" | "terminated";
    startDate: string;
  }[];
  departmentStats: { department: string; count: number }[];
  lastSync: string;
  connectionStatus: "connected" | "disconnected" | "syncing";
};

export type LiveryData = {
  metrics: MetricCard[];
  deliveries: {
    id: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    status: "in-transit" | "delivered" | "pending" | "delayed";
    estimatedDelivery: string;
  }[];
  deliveryStats: { status: string; count: number }[];
  lastSync: string;
  connectionStatus: "connected" | "disconnected" | "syncing";
};

export type DashboardTab = "netsuite" | "hr" | "livery";

// External services table (Production services management)
export const externalServices = pgTable("external_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  url: varchar("url"),
  icon: varchar("icon"),
  category: varchar("category").notNull().default("general"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  isExternal: boolean("is_external").notNull().default(true),
  sortOrder: varchar("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExternalServiceSchema = createInsertSchema(externalServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalService = z.infer<typeof insertExternalServiceSchema>;
export type ExternalService = typeof externalServices.$inferSelect;

// User-Service access junction table
export const userServices = pgTable("user_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => managedUsers.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => externalServices.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserServiceSchema = createInsertSchema(userServices).omit({
  id: true,
  createdAt: true,
});

export type InsertUserService = z.infer<typeof insertUserServiceSchema>;
export type UserService = typeof userServices.$inferSelect;

// System settings table (Admin configuration)
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  description: varchar("description"),
  category: varchar("category").notNull().default("general"),
  isEncrypted: boolean("is_encrypted").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: varchar("action").notNull(),
  category: varchar("category").notNull(),
  userId: varchar("user_id"),
  userEmail: varchar("user_email"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  status: varchar("status").notNull().default("success"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  actionIdx: index("audit_logs_action_idx").on(table.action),
  categoryIdx: index("audit_logs_category_idx").on(table.category),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Integration health status type
export type IntegrationHealth = {
  name: string;
  status: "healthy" | "degraded" | "offline";
  lastChecked: string;
  responseTime?: number;
  error?: string;
};

// Ticket categories and severity enums
export const ticketCategories = ["it_support", "other"] as const;
export type TicketCategory = typeof ticketCategories[number];

export const ticketSeverities = ["low", "medium", "high", "critical"] as const;
export type TicketSeverity = typeof ticketSeverities[number];

export const ticketStatuses = ["new", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = typeof ticketStatuses[number];

// Support tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: varchar("tracking_id").notNull().unique(),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  severity: varchar("severity").notNull(),
  status: varchar("status").notNull().default("new"),
  userId: varchar("user_id").notNull(),
  userEmail: varchar("user_email").notNull(),
  assignedTo: varchar("assigned_to"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("tickets_status_idx").on(table.status),
  userIdx: index("tickets_user_idx").on(table.userId),
  createdAtIdx: index("tickets_created_at_idx").on(table.createdAt),
}));

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  trackingId: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Ticket comments table
export const ticketComments = pgTable("ticket_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  userId: varchar("user_id").notNull(),
  userEmail: varchar("user_email").notNull(),
  userName: varchar("user_name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ticketIdx: index("ticket_comments_ticket_idx").on(table.ticketId),
}));

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
});

export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;
export type TicketComment = typeof ticketComments.$inferSelect;

// FAQ entries table
export const faqEntries = pgTable("faq_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: varchar("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").notNull(),
  order: varchar("display_order").notNull().default("0"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFaqEntrySchema = createInsertSchema(faqEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFaqEntry = z.infer<typeof insertFaqEntrySchema>;
export type FaqEntry = typeof faqEntries.$inferSelect;

// User manuals table
export const userManuals = pgTable("user_manuals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"),
  fileUrl: varchar("file_url"),
  category: varchar("category").notNull(),
  order: varchar("display_order").notNull().default("0"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserManualSchema = createInsertSchema(userManuals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserManual = z.infer<typeof insertUserManualSchema>;
export type UserManual = typeof userManuals.$inferSelect;

// Customer type and gender enums
export const customerTypes = ["Individual", "Corporate"] as const;
export type CustomerType = typeof customerTypes[number];

export const customerGenders = ["Male", "Female", "Other"] as const;
export type CustomerGender = typeof customerGenders[number];

// Customers table (main customer records)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalCode: varchar("external_code").notNull().unique(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull().default("Individual"),
  primaryUnit: varchar("primary_unit").notNull(),
  email: varchar("email").notNull().unique(),
  contact: varchar("contact").notNull(),
  status: varchar("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("customers_email_idx").on(table.email),
  typeIdx: index("customers_type_idx").on(table.type),
  externalCodeIdx: index("customers_external_code_idx").on(table.externalCode),
}));

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Customer profiles table (extended profile data)
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().unique(),
  dateOfBirth: varchar("date_of_birth"),
  gender: varchar("gender"),
  nationality: varchar("nationality"),
  occupation: varchar("occupation"),
  address: jsonb("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  customerIdIdx: index("customer_profiles_customer_id_idx").on(table.customerId),
}));

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type CustomerProfile = typeof customerProfiles.$inferSelect;

// Combined customer with profile for API responses
export type CustomerWithProfile = Customer & {
  profile?: CustomerProfile;
};

// Blueprint status enum
export const blueprintStatuses = ["in_development", "review", "live", "enhancement_needed"] as const;
export type BlueprintStatus = typeof blueprintStatuses[number];

// Collaboration Blueprints table for tracking project collaboration status
export const collaborationBlueprints = pgTable("collaboration_blueprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionName: varchar("section_name").notNull(),
  sectionTitle: varchar("section_title").notNull(),
  status: varchar("status").notNull().default("in_development"),
  etaDate: varchar("eta_date"),
  notes: text("notes"),
  missingItems: text("missing_items").array(),
  ideas: text("ideas").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlueprintSchema = createInsertSchema(collaborationBlueprints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlueprint = z.infer<typeof insertBlueprintSchema>;
export type CollaborationBlueprint = typeof collaborationBlueprints.$inferSelect;

// Project status and priority enums
export const projectStatuses = ["not_started", "in_progress", "on_hold", "completed", "cancelled"] as const;
export type ProjectStatus = typeof projectStatuses[number];

export const projectPriorities = ["low", "medium", "high", "critical"] as const;
export type ProjectPriority = typeof projectPriorities[number];

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("not_started"),
  priority: varchar("priority").notNull().default("medium"),
  startDate: varchar("start_date"),
  deadline: varchar("deadline"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("projects_status_idx").on(table.status),
  createdByIdx: index("projects_created_by_idx").on(table.createdBy),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project assignments table (who is assigned to a project)
export const projectAssignments = pgTable("project_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull().default("member"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").notNull(),
}, (table) => ({
  projectIdx: index("project_assignments_project_idx").on(table.projectId),
  userIdx: index("project_assignments_user_idx").on(table.userId),
}));

export const insertProjectAssignmentSchema = createInsertSchema(projectAssignments).omit({
  id: true,
  assignedAt: true,
});

export type InsertProjectAssignment = z.infer<typeof insertProjectAssignmentSchema>;
export type ProjectAssignment = typeof projectAssignments.$inferSelect;

// Project comments table (for deadline changes, updates, discussions)
export const projectComments = pgTable("project_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  userName: varchar("user_name"),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("comment"),
  oldDeadline: varchar("old_deadline"),
  newDeadline: varchar("new_deadline"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  projectIdx: index("project_comments_project_idx").on(table.projectId),
  createdAtIdx: index("project_comments_created_at_idx").on(table.createdAt),
}));

export const insertProjectCommentSchema = createInsertSchema(projectComments).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectComment = z.infer<typeof insertProjectCommentSchema>;
export type ProjectComment = typeof projectComments.$inferSelect;

// Combined project with assignments for API responses
export type ProjectWithAssignments = Project & {
  assignments: (ProjectAssignment & { user?: ManagedUser })[];
  comments?: ProjectComment[];
};
