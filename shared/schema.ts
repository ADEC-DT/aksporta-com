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
