import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, index, jsonb, integer } from "drizzle-orm/pg-core";
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
  notificationPreferences: jsonb("notification_preferences"),
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
export const ticketCategories = ["it_support", "digital_transformation", "other"] as const;
export type TicketCategory = typeof ticketCategories[number];

export const itSupportSubcategories = [
  "pc_setup", "software_install", "software_remove", "access_permissions",
  "equipment_request", "network_issue", "email_issue", "printer_issue",
  "hardware_repair", "vpn_access", "general_it"
] as const;
export type ITSupportSubcategory = typeof itSupportSubcategories[number];

export const digitalTransformationSubcategories = [
  "process_automation", "new_system", "system_integration", "reporting_analytics",
  "ux_improvement", "workflow_optimization", "data_migration", "api_development",
  "general_dt"
] as const;
export type DTSubcategory = typeof digitalTransformationSubcategories[number];

export const ticketSeverities = ["low", "medium", "high", "critical"] as const;
export type TicketSeverity = typeof ticketSeverities[number];

export const ticketStatuses = ["new", "in_progress", "under_review", "resolved", "closed"] as const;
export type TicketStatus = typeof ticketStatuses[number];

// Support tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: varchar("tracking_id").notNull().unique(),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  subcategory: varchar("subcategory"),
  severity: varchar("severity").notNull(),
  status: varchar("status").notNull().default("new"),
  userId: varchar("user_id").notNull(),
  userEmail: varchar("user_email").notNull(),
  userName: varchar("user_name"),
  assignedTo: varchar("assigned_to"),
  assignedToName: varchar("assigned_to_name"),
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
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull().default(""),
  type: varchar("type").notNull().default("Individual"),
  primaryUnit: varchar("primary_unit").notNull(),
  email: varchar("email").notNull().unique(),
  contact: varchar("contact").notNull(),
  source: varchar("source"),
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

// Import logs table (tracking Customer DB import history)
export const importLogs = pgTable("import_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  totalRows: integer("total_rows").notNull().default(0),
  imported: integer("imported").notNull().default(0),
  skipped: integer("skipped").notNull().default(0),
  skipReasons: jsonb("skip_reasons"),
  importedBy: varchar("imported_by").notNull(),
  importedByName: varchar("imported_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertImportLogSchema = createInsertSchema(importLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertImportLog = z.infer<typeof insertImportLogSchema>;
export type ImportLog = typeof importLogs.$inferSelect;

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
// Project tags table
export const projectTagsTable = pgTable("project_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  color: varchar("color").default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectTagSchema = createInsertSchema(projectTagsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectTag = z.infer<typeof insertProjectTagSchema>;
export type ProjectTagRecord = typeof projectTagsTable.$inferSelect;

export const projectTags = ["Dashboard", "NetSuite", "Equestrian"] as const;
export type ProjectTag = typeof projectTags[number];

// Sprints table
export const sprints = pgTable("sprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  startDate: varchar("start_date").notNull(),
  endDate: varchar("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  isClosed: boolean("is_closed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSprintSchema = createInsertSchema(sprints).omit({
  id: true,
  createdAt: true,
});

export type InsertSprint = z.infer<typeof insertSprintSchema>;
export type Sprint = typeof sprints.$inferSelect;

// Spaces table (department-level grouping)
export const spaces = pgTable("spaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").notNull().default("#6366f1"),
  ownerId: varchar("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpaceSchema = createInsertSchema(spaces).omit({
  id: true,
  createdAt: true,
});

export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type Space = typeof spaces.$inferSelect;

// Project groups table (projects within a space)
export const projectGroups = pgTable("project_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  spaceId: varchar("space_id").notNull(),
  color: varchar("color"),
  status: varchar("status").notNull().default("active"),
  startDate: varchar("start_date"),
  endDate: varchar("end_date"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  spaceIdx: index("project_groups_space_idx").on(table.spaceId),
}));

export const insertProjectGroupSchema = createInsertSchema(projectGroups).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectGroup = z.infer<typeof insertProjectGroupSchema>;
export type ProjectGroup = typeof projectGroups.$inferSelect;

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  projectGroupId: varchar("project_group_id"),
  status: varchar("status").notNull().default("not_started"),
  priority: varchar("priority").notNull().default("medium"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  sprintId: varchar("sprint_id"),
  startDate: varchar("start_date"),
  deadline: varchar("deadline"),
  blocked: boolean("blocked").default(false),
  blockedBy: varchar("blocked_by"),
  blockedReason: text("blocked_reason"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("projects_status_idx").on(table.status),
  createdByIdx: index("projects_created_by_idx").on(table.createdBy),
  sprintIdx: index("projects_sprint_idx").on(table.sprintId),
  projectGroupIdx: index("projects_project_group_idx").on(table.projectGroupId),
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

// Space with nested project groups and tasks
export type SpaceWithHierarchy = Space & {
  projectGroups: (ProjectGroup & {
    tasks: ProjectWithAssignments[];
  })[];
};

// Section templates table (reusable section template types)
export const sectionTemplates = pgTable("section_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  sectionType: varchar("section_type").notNull().default("cards_grid"),
  icon: varchar("icon"),
  defaultConfig: jsonb("default_config"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSectionTemplateSchema = createInsertSchema(sectionTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertSectionTemplate = z.infer<typeof insertSectionTemplateSchema>;
export type SectionTemplate = typeof sectionTemplates.$inferSelect;

// Page sections table (links section templates to service pages)
export const pageSections = pgTable("page_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => externalServices.id, { onDelete: "cascade" }),
  sectionTemplateId: varchar("section_template_id").references(() => sectionTemplates.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  subtitle: text("subtitle"),
  icon: varchar("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  isEnabled: boolean("is_enabled").notNull().default(true),
  isExpandable: boolean("is_expandable").notNull().default(true),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  serviceIdx: index("page_sections_service_id_idx").on(table.serviceId),
}));

export const insertPageSectionSchema = createInsertSchema(pageSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPageSection = z.infer<typeof insertPageSectionSchema>;
export type PageSection = typeof pageSections.$inferSelect;

export type PageSectionWithTemplate = PageSection & {
  template?: SectionTemplate | null;
};

export const iconLibrary = pgTable("icon_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  label: varchar("label").notNull(),
  category: varchar("category").notNull().default("general"),
  description: text("description"),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIconLibrarySchema = createInsertSchema(iconLibrary).omit({
  id: true,
  createdAt: true,
});

export type InsertIconLibrary = z.infer<typeof insertIconLibrarySchema>;
export type IconLibraryEntry = typeof iconLibrary.$inferSelect;

// ========== Requisitions Tables ==========

export const requisitions = pgTable("requisitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date").notNull(),
  requestTitle: varchar("request_title").notNull(),
  department: varchar("department").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  position: varchar("position"),
  dateOfRequest: varchar("date_of_request").notNull(),
  description: text("description").notNull(),
  justification: text("justification").notNull(),
  estimatedCostAed: integer("estimated_cost_aed").notNull(),
  budgetLineAccountCode: varchar("budget_line_account_code"),
  isBudgeted: boolean("is_budgeted").notNull().default(false),
  vendorName: varchar("vendor_name"),
  requiredByDate: varchar("required_by_date").notNull(),
  projectStartDate: varchar("project_start_date"),
  status: varchar("status").notNull().default("Submitted"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRequisitionSchema = createInsertSchema(requisitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRequisition = z.infer<typeof insertRequisitionSchema>;
export type Requisition = typeof requisitions.$inferSelect;

export const requisitionAttachments = pgTable("requisition_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requisitionId: varchar("requisition_id").notNull().references(() => requisitions.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileData: text("file_data").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertRequisitionAttachmentSchema = createInsertSchema(requisitionAttachments).omit({
  id: true,
  uploadedAt: true,
});
export type InsertRequisitionAttachment = z.infer<typeof insertRequisitionAttachmentSchema>;
export type RequisitionAttachment = typeof requisitionAttachments.$inferSelect;

// ========== StableMaster Tables ==========

export const smFacilities = pgTable("sm_facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull().default("STABLE"),
  parentFacilityId: varchar("parent_facility_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmFacilitySchema = createInsertSchema(smFacilities).omit({ id: true, createdAt: true });
export type InsertSmFacility = z.infer<typeof insertSmFacilitySchema>;
export type SmFacility = typeof smFacilities.$inferSelect;

export const smStableBlocks = pgTable("sm_stable_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull().references(() => smFacilities.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmStableBlockSchema = createInsertSchema(smStableBlocks).omit({ id: true, createdAt: true });
export type InsertSmStableBlock = z.infer<typeof insertSmStableBlockSchema>;
export type SmStableBlock = typeof smStableBlocks.$inferSelect;

export const smStableUnits = pgTable("sm_stable_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stableBlockId: varchar("stable_block_id").notNull().references(() => smStableBlocks.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  unitType: varchar("unit_type").notNull().default("STALL"),
  status: varchar("status").notNull().default("AVAILABLE"),
  currentHorseId: varchar("current_horse_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmStableUnitSchema = createInsertSchema(smStableUnits).omit({ id: true, createdAt: true });
export type InsertSmStableUnit = z.infer<typeof insertSmStableUnitSchema>;
export type SmStableUnit = typeof smStableUnits.$inferSelect;

export const smHorses = pgTable("sm_horses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  dob: varchar("dob"),
  remarks: text("remarks"),
  color: varchar("color"),
  sex: varchar("sex"),
  group: varchar("group"),
  status: varchar("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmHorseSchema = createInsertSchema(smHorses).omit({ id: true, createdAt: true });
export type InsertSmHorse = z.infer<typeof insertSmHorseSchema>;
export type SmHorse = typeof smHorses.$inferSelect;

export const smCustomers = pgTable("sm_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  remarks: text("remarks"),
  status: varchar("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmCustomerSchema = createInsertSchema(smCustomers).omit({ id: true, createdAt: true });
export type InsertSmCustomer = z.infer<typeof insertSmCustomerSchema>;
export type SmCustomer = typeof smCustomers.$inferSelect;

export const smItemServices = pgTable("sm_item_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  category: varchar("category").notNull().default("SERVICE"),
  unitOptions: text("unit_options").array().notNull(),
  defaultUnit: varchar("default_unit").notNull(),
  unitPrice: integer("unit_price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmItemServiceSchema = createInsertSchema(smItemServices).omit({ id: true, createdAt: true });
export type InsertSmItemService = z.infer<typeof insertSmItemServiceSchema>;
export type SmItemService = typeof smItemServices.$inferSelect;

export const smBillingElements = pgTable("sm_billing_elements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stableBlockId: varchar("stable_block_id"),
  stableUnitId: varchar("stable_unit_id"),
  transactionDate: varchar("transaction_date").notNull(),
  refNumber: varchar("ref_number"),
  remarks: text("remarks"),
  horseId: varchar("horse_id"),
  customerId: varchar("customer_id"),
  itemServiceId: varchar("item_service_id"),
  unit: varchar("unit"),
  unitPrice: integer("unit_price").notNull().default(0),
  quantity: varchar("quantity").notNull().default("1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmBillingElementSchema = createInsertSchema(smBillingElements).omit({ id: true, createdAt: true });
export type InsertSmBillingElement = z.infer<typeof insertSmBillingElementSchema>;
export type SmBillingElement = typeof smBillingElements.$inferSelect;

export const smLiveryPackages = pgTable("sm_livery_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  monthlyPrice: integer("monthly_price").notNull().default(0),
  coveredItemServiceIds: text("covered_item_service_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmLiveryPackageSchema = createInsertSchema(smLiveryPackages).omit({ id: true, createdAt: true });
export type InsertSmLiveryPackage = z.infer<typeof insertSmLiveryPackageSchema>;
export type SmLiveryPackage = typeof smLiveryPackages.$inferSelect;

export const smLiveryAgreements = pgTable("sm_livery_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agreementType: varchar("agreement_type").notNull().default("PERMANENT_AUTO_RENEW"),
  startDate: varchar("start_date").notNull(),
  endDate: varchar("end_date"),
  facilityId: varchar("facility_id"),
  stableBlockId: varchar("stable_block_id"),
  stableUnitId: varchar("stable_unit_id"),
  horseId: varchar("horse_id"),
  customerId: varchar("customer_id"),
  customerContact: varchar("customer_contact"),
  refNumber: varchar("ref_number"),
  liveryPackageId: varchar("livery_package_id"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmLiveryAgreementSchema = createInsertSchema(smLiveryAgreements).omit({ id: true, createdAt: true });
export type InsertSmLiveryAgreement = z.infer<typeof insertSmLiveryAgreementSchema>;
export type SmLiveryAgreement = typeof smLiveryAgreements.$inferSelect;
