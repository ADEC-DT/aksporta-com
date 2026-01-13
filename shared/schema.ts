import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
