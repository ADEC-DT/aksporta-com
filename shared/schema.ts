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
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
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
