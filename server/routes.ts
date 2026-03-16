import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, desc, asc } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import { type NetSuiteData, type HRData, type LiveryData, type ManagedUser, type InsertCustomer, type Ticket, insertCustomerSchema, insertCustomerProfileSchema, insertBlueprintSchema, insertSpaceSchema, insertProjectGroupSchema, insertProjectSchema, insertProjectAssignmentSchema, insertProjectCommentSchema, insertSectionTemplateSchema, insertPageSectionSchema, insertRequisitionSchema, importLogs, managedUsers, customers, tickets, dataSources, dsRecords, pageRegistry, insertSmStableSchema, insertSmBoxSchema, insertSmHorseSchema, insertSmCustomerSchema, insertSmItemServiceSchema, insertSmBillingElementSchema, insertSmLiveryPackageSchema, insertSmLiveryAgreementSchema, insertSmInvoiceSchema, itSupportSubcategories, digitalTransformationSubcategories } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateSecret, verify, generateURI } from "otplib";
import * as QRCode from "qrcode";
import multer from "multer";
import ExcelJS from "exceljs";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character (!@#$%^&*-_)");

// Middleware to check if user is admin or superadmin
const isAdmin: RequestHandler = async (req, res, next) => {
  const managedUser = (req as any).managedUser as ManagedUser;
  
  if (!managedUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (managedUser.role !== "admin" && managedUser.role !== "superadmin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};

// Middleware to check if user is superadmin
const isSuperAdmin: RequestHandler = async (req, res, next) => {
  const managedUser = (req as any).managedUser as ManagedUser;
  
  if (!managedUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (managedUser.role !== "superadmin") {
    return res.status(403).json({ message: "Forbidden: Superadmin access required" });
  }

  next();
};

const checkSubmoduleAccess = (serviceKey: string, submoduleKey: string): RequestHandler => {
  return (req, res, next) => {
    const managedUser = (req as any).managedUser as ManagedUser;
    if (!managedUser) return res.status(401).json({ message: "Unauthorized" });
    if (managedUser.role === "superadmin") return next();
    const allowed = managedUser.allowedSubmodules as Record<string, string[]> | null;
    if (!allowed || !allowed[serviceKey]) return next();
    if (allowed[serviceKey].includes(submoduleKey)) return next();
    return res.status(403).json({ message: "Access denied: submodule restricted" });
  };
};

function generateNetSuiteData(): NetSuiteData {
  const now = new Date();
  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const formatTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return {
    metrics: [
      { id: "revenue", title: "Total Revenue", value: "$1,284,500", change: 12.5, changeLabel: "vs last month" },
      { id: "transactions", title: "Transactions", value: "2,847", change: 8.2, changeLabel: "vs last month" },
      { id: "avg-order", title: "Avg. Order Value", value: "$451", change: 3.1, changeLabel: "vs last month" },
      { id: "customers", title: "Active Customers", value: "1,234", change: -2.4, changeLabel: "vs last month" },
    ],
    transactions: [
      { id: "TXN-001", date: formatDate(now), type: "Invoice", customer: "Acme Corporation", amount: 15250, status: "completed" },
      { id: "TXN-002", date: formatDate(now), type: "Payment", customer: "TechStart Inc", amount: 8900, status: "completed" },
      { id: "TXN-003", date: formatDate(new Date(now.getTime() - 86400000)), type: "Invoice", customer: "Global Solutions", amount: 22000, status: "pending" },
      { id: "TXN-004", date: formatDate(new Date(now.getTime() - 86400000)), type: "Credit Memo", customer: "DataFlow Ltd", amount: 3500, status: "completed" },
      { id: "TXN-005", date: formatDate(new Date(now.getTime() - 172800000)), type: "Invoice", customer: "CloudNine Corp", amount: 45000, status: "pending" },
      { id: "TXN-006", date: formatDate(new Date(now.getTime() - 172800000)), type: "Payment", customer: "Innovate LLC", amount: 12750, status: "completed" },
      { id: "TXN-007", date: formatDate(new Date(now.getTime() - 259200000)), type: "Invoice", customer: "StartupX", amount: 5800, status: "failed" },
      { id: "TXN-008", date: formatDate(new Date(now.getTime() - 259200000)), type: "Payment", customer: "Enterprise Co", amount: 67500, status: "completed" },
    ],
    revenueByMonth: [
      { month: "Jan", revenue: 85000 },
      { month: "Feb", revenue: 92000 },
      { month: "Mar", revenue: 88000 },
      { month: "Apr", revenue: 105000 },
      { month: "May", revenue: 112000 },
      { month: "Jun", revenue: 98000 },
      { month: "Jul", revenue: 125000 },
      { month: "Aug", revenue: 118000 },
      { month: "Sep", revenue: 132000 },
      { month: "Oct", revenue: 145000 },
      { month: "Nov", revenue: 138000 },
      { month: "Dec", revenue: 146500 },
    ],
    lastSync: formatTime(now),
    connectionStatus: "connected",
  };
}

function generateHRData(): HRData {
  const now = new Date();
  const formatTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return {
    metrics: [
      { id: "total-employees", title: "Total Employees", value: "342", change: 5.2, changeLabel: "vs last quarter" },
      { id: "active", title: "Active", value: "328", change: 3.8, changeLabel: "vs last quarter" },
      { id: "on-leave", title: "On Leave", value: "14", change: 0, changeLabel: "vs last month" },
      { id: "departments", title: "Departments", value: "12", change: 0, changeLabel: "stable" },
    ],
    employees: [
      { id: "EMP-001", name: "Sarah Johnson", department: "Engineering", position: "Senior Developer", status: "active", startDate: "2021-03-15" },
      { id: "EMP-002", name: "Michael Chen", department: "Marketing", position: "Marketing Manager", status: "active", startDate: "2020-07-22" },
      { id: "EMP-003", name: "Emily Rodriguez", department: "Sales", position: "Sales Lead", status: "active", startDate: "2022-01-10" },
      { id: "EMP-004", name: "David Kim", department: "Engineering", position: "DevOps Engineer", status: "on-leave", startDate: "2019-11-05" },
      { id: "EMP-005", name: "Jessica Brown", department: "HR", position: "HR Specialist", status: "active", startDate: "2021-09-18" },
      { id: "EMP-006", name: "Robert Taylor", department: "Finance", position: "Financial Analyst", status: "active", startDate: "2020-04-01" },
      { id: "EMP-007", name: "Amanda White", department: "Engineering", position: "Frontend Developer", status: "active", startDate: "2022-06-12" },
      { id: "EMP-008", name: "James Wilson", department: "Operations", position: "Operations Manager", status: "terminated", startDate: "2018-02-28" },
    ],
    departmentStats: [
      { department: "Engineering", count: 85 },
      { department: "Marketing", count: 42 },
      { department: "Sales", count: 58 },
      { department: "HR", count: 28 },
      { department: "Finance", count: 35 },
      { department: "Operations", count: 45 },
      { department: "Legal", count: 15 },
      { department: "Support", count: 34 },
    ],
    lastSync: formatTime(now),
    connectionStatus: "connected",
  };
}

function generateLiveryData(): LiveryData {
  const now = new Date();
  const formatTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return {
    metrics: [
      { id: "total-shipments", title: "Total Shipments", value: "1,847", change: 15.3, changeLabel: "vs last week" },
      { id: "in-transit", title: "In Transit", value: "423", change: 8.7, changeLabel: "vs yesterday" },
      { id: "delivered", title: "Delivered Today", value: "156", change: 12.1, changeLabel: "vs yesterday" },
      { id: "on-time", title: "On-Time Rate", value: "94.2%", change: 2.5, changeLabel: "vs last week" },
    ],
    deliveries: [
      { id: "DEL-001", trackingNumber: "TRK-78542-A", origin: "Los Angeles, CA", destination: "New York, NY", status: "in-transit", estimatedDelivery: formatDate(new Date(now.getTime() + 172800000)) },
      { id: "DEL-002", trackingNumber: "TRK-78543-B", origin: "Chicago, IL", destination: "Miami, FL", status: "delivered", estimatedDelivery: formatDate(now) },
      { id: "DEL-003", trackingNumber: "TRK-78544-C", origin: "Seattle, WA", destination: "Denver, CO", status: "in-transit", estimatedDelivery: formatDate(new Date(now.getTime() + 86400000)) },
      { id: "DEL-004", trackingNumber: "TRK-78545-D", origin: "Houston, TX", destination: "Phoenix, AZ", status: "pending", estimatedDelivery: formatDate(new Date(now.getTime() + 259200000)) },
      { id: "DEL-005", trackingNumber: "TRK-78546-E", origin: "Boston, MA", destination: "Atlanta, GA", status: "delayed", estimatedDelivery: formatDate(new Date(now.getTime() + 345600000)) },
      { id: "DEL-006", trackingNumber: "TRK-78547-F", origin: "San Francisco, CA", destination: "Portland, OR", status: "delivered", estimatedDelivery: formatDate(now) },
      { id: "DEL-007", trackingNumber: "TRK-78548-G", origin: "Dallas, TX", destination: "Nashville, TN", status: "in-transit", estimatedDelivery: formatDate(new Date(now.getTime() + 86400000)) },
      { id: "DEL-008", trackingNumber: "TRK-78549-H", origin: "Philadelphia, PA", destination: "Detroit, MI", status: "pending", estimatedDelivery: formatDate(new Date(now.getTime() + 172800000)) },
    ],
    deliveryStats: [
      { status: "In Transit", count: 423 },
      { status: "Delivered", count: 1156 },
      { status: "Pending", count: 189 },
      { status: "Delayed", count: 79 },
    ],
    lastSync: formatTime(now),
    connectionStatus: "connected",
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Dashboard data endpoints (public for now, can be protected)
  app.get("/api/netsuite", isAuthenticated, (_req, res) => {
    const data = generateNetSuiteData();
    res.json(data);
  });

  app.get("/api/hr", isAuthenticated, (_req, res) => {
    const data = generateHRData();
    res.json(data);
  });

  app.get("/api/livery", isAuthenticated, (_req, res) => {
    const data = generateLiveryData();
    res.json(data);
  });

  app.get("/api/admin/health-check", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const services = await storage.getExternalServices();
      const enabledServices = services.filter(s => s.isEnabled);
      const allTickets = await storage.getAllTickets({ limit: 1000, offset: 0 });
      const allUsers = await storage.getAllManagedUsers();

      const now = Date.now();
      const serviceHealthData = enabledServices.map((service) => {
        const uptime = 95 + Math.random() * 5;
        const responseTime = 50 + Math.random() * 200;
        const statuses: Array<"operational" | "degraded" | "down"> = ["operational", "operational", "operational", "operational", "operational", "operational", "operational", "operational", "operational", "degraded"];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        return {
          id: service.id,
          name: service.name,
          url: service.url,
          icon: service.icon,
          category: service.category,
          status,
          uptime: Math.round(uptime * 100) / 100,
          responseTime: Math.round(responseTime),
          lastChecked: new Date(now - Math.floor(Math.random() * 300000)).toISOString(),
        };
      });

      const totalServices = enabledServices.length;
      const operationalCount = serviceHealthData.filter(s => s.status === "operational").length;
      const degradedCount = serviceHealthData.filter(s => s.status === "degraded").length;
      const downCount = serviceHealthData.filter(s => s.status === "down").length;
      const avgUptime = serviceHealthData.length > 0
        ? Math.round(serviceHealthData.reduce((sum, s) => sum + s.uptime, 0) / serviceHealthData.length * 100) / 100
        : 0;
      const avgResponseTime = serviceHealthData.length > 0
        ? Math.round(serviceHealthData.reduce((sum, s) => sum + s.responseTime, 0) / serviceHealthData.length)
        : 0;

      const openTickets = allTickets.tickets.filter((t: { status: string }) => t.status !== "resolved" && t.status !== "closed").length;
      const activeUsers = allUsers.filter((u: { isActive: boolean }) => u.isActive).length;

      res.json({
        services: serviceHealthData,
        summary: {
          totalServices,
          operationalCount,
          degradedCount,
          downCount,
          avgUptime,
          avgResponseTime,
          openTickets,
          activeUsers,
          totalUsers: allUsers.length,
        },
      });
    } catch (error) {
      console.error("Error fetching health check:", error);
      res.status(500).json({ message: "Failed to fetch health check data" });
    }
  });

  // Get current user's managed profile
  app.get("/api/me", isAuthenticated, async (req, res) => {
    const managedUser = (req as any).managedUser as ManagedUser;
    const { password: _, mfaSecret, mfaBackupCodes, ...userWithoutSensitive } = managedUser;
    res.json(userWithoutSensitive);
  });

  app.get("/api/my-services", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const serviceIds = await storage.getUserServices(managedUser.id);
      res.json(serviceIds);
    } catch (error) {
      console.error("Error fetching user services:", error);
      res.status(500).json({ message: "Failed to fetch user services" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllManagedUsers();
      const sanitized = users.map(({ password, mfaSecret, mfaBackupCodes, ...rest }) => rest);
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.getManagedUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, mfaSecret, mfaBackupCodes, ...sanitized } = user;
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const createUserSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: passwordSchema,
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    role: z.enum(["superadmin", "admin", "finance", "procurement", "others"]).default("others"),
  });

  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      const currentUser = (req as any).managedUser as ManagedUser;
      if (currentUser.role !== "superadmin" && parsed.data.role === "superadmin") {
        return res.status(403).json({ message: "Only superadmins can create superadmin accounts" });
      }

      // Check if email or username already exists
      const existingUser = await storage.getManagedUserByEmail(parsed.data.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const existingUsername = await storage.getManagedUserByUsername(parsed.data.username);
      if (existingUsername) {
        return res.status(409).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

      const user = await storage.createManagedUser({
        ...parsed.data,
        password: hashedPassword,
        isActive: true,
        lastActiveAt: null,
      });

      // Return user without sensitive fields
      const { password: _, mfaSecret, mfaBackupCodes, ...sanitized } = user;
      res.status(201).json(sanitized);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  const updateUserSchema = z.object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(50).optional(),
    password: passwordSchema.optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    role: z.enum(["superadmin", "admin", "finance", "procurement", "others"]).optional(),
    isActive: z.boolean().optional(),
  });

  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      const currentUser = (req as any).managedUser as ManagedUser;
      const targetUser = await storage.getManagedUser(req.params.id);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (currentUser.role !== "superadmin") {
        if (targetUser.role === "superadmin") {
          return res.status(403).json({ message: "Only superadmins can modify superadmin accounts" });
        }
        if (parsed.data.role === "superadmin") {
          return res.status(403).json({ message: "Only superadmins can assign the superadmin role" });
        }
      }

      // Prevent demoting an admin if they're the only admin
      if (targetUser.role === "admin" && parsed.data.role && parsed.data.role !== "admin") {
        const stats = await storage.getUserStats();
        const adminCount = stats.roleDistribution.find(r => r.role === "admin")?.count || 0;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the only admin" });
        }
      }

      // Hash password if provided
      const updateData = { ...parsed.data };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      } else {
        delete updateData.password;
      }

      const user = await storage.updateManagedUser(req.params.id, updateData);
      if (user) {
        const { password: _, mfaSecret, mfaBackupCodes, ...sanitized } = user;
        res.json(sanitized);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser as ManagedUser;
      
      // Prevent self-deletion
      if (currentUser.id === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const targetUser = await storage.getManagedUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (currentUser.role !== "superadmin" && targetUser.role === "superadmin") {
        return res.status(403).json({ message: "Only superadmins can delete superadmin accounts" });
      }

      // Prevent deleting the only admin
      if (targetUser.role === "admin") {
        const stats = await storage.getUserStats();
        const adminCount = stats.roleDistribution.find(r => r.role === "admin")?.count || 0;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot delete the only admin" });
        }
      }

      await storage.deleteManagedUser(req.params.id);
      
      // Log the action
      await storage.createAuditLog({
        action: "user_deleted",
        category: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email,
        details: { deletedUserId: req.params.id, deletedUserEmail: targetUser.email },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
        status: "success",
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get user services
  app.get("/api/admin/users/:id/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const serviceIds = await storage.getUserServices(req.params.id);
      res.json(serviceIds);
    } catch (error) {
      console.error("Error getting user services:", error);
      res.status(500).json({ message: "Failed to get user services" });
    }
  });

  // Set user services
  app.put("/api/admin/users/:id/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const schema = z.object({ serviceIds: z.array(z.string()) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }
      await storage.setUserServices(req.params.id, parsed.data.serviceIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting user services:", error);
      res.status(500).json({ message: "Failed to set user services" });
    }
  });

  // Get user submodule permissions
  app.get("/api/admin/users/:id/submodules", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.getManagedUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user.allowedSubmodules || {});
    } catch (error) {
      console.error("Error getting user submodules:", error);
      res.status(500).json({ message: "Failed to get user submodules" });
    }
  });

  // Update user submodule permissions
  app.put("/api/admin/users/:id/submodules", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const schema = z.object({ allowedSubmodules: z.record(z.array(z.string())) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
      await storage.updateManagedUser(req.params.id, { allowedSubmodules: parsed.data.allowedSubmodules } as any);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting user submodules:", error);
      res.status(500).json({ message: "Failed to set user submodules" });
    }
  });

  app.get("/api/admin/users/:id/pages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.getManagedUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user.allowedPages || []);
    } catch (error) {
      console.error("Error getting user pages:", error);
      res.status(500).json({ message: "Failed to get user pages" });
    }
  });

  app.put("/api/admin/users/:id/pages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validPaths = pageRegistry.map(p => p.path);
      const schema = z.object({ allowedPages: z.array(z.string().refine(p => validPaths.includes(p), { message: "Invalid page path" })) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
      const unique = Array.from(new Set(parsed.data.allowedPages));
      const pages = unique.length > 0 ? unique : null;
      await storage.updateManagedUser(req.params.id, { allowedPages: pages } as any);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting user pages:", error);
      res.status(500).json({ message: "Failed to set user pages" });
    }
  });

  // ===== USER PROFILE SETTINGS =====
  
  // Get current user's profile
  app.get("/api/settings/profile", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const { password, mfaSecret, mfaBackupCodes, ...profile } = user;
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  const updateProfileSchema = z.object({
    displayName: z.string().max(100).optional().nullable(),
    email: z.string().email().optional(),
    firstName: z.string().max(50).optional().nullable(),
    lastName: z.string().max(50).optional().nullable(),
    jobTitle: z.string().max(100).optional().nullable(),
    phoneNumber: z.string().max(30).optional().nullable(),
    profilePicture: z.string().max(3000000).optional().nullable(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    emailNotifications: z.boolean().optional(),
  });

  app.patch("/api/settings/profile", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const parsed = updateProfileSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      // Check if email is being changed and already exists
      if (parsed.data.email && parsed.data.email !== user.email) {
        const existing = await storage.getManagedUserByEmail(parsed.data.email);
        if (existing) {
          return res.status(409).json({ message: "Email already in use" });
        }
      }

      const updated = await storage.updateManagedUser(user.id, parsed.data);
      if (updated) {
        const { password, mfaSecret, mfaBackupCodes, ...profile } = updated;
        
        await storage.createAuditLog({
          action: "profile_updated",
          category: "user",
          userId: user.id,
          userEmail: user.email,
          details: { updatedFields: Object.keys(parsed.data) },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          status: "success",
        });
        
        res.json(profile);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Avatar upload
  const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPEG, PNG, and WebP images are accepted"));
      }
    },
  });

  app.post("/api/settings/avatar", isAuthenticated, avatarUpload.single("avatar"), async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      const base64 = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

      const updated = await storage.updateManagedUser(user.id, { profilePicture: dataUrl } as any);
      if (updated) {
        const { password, mfaSecret, mfaBackupCodes, ...profile } = updated;
        res.json(profile);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      if (error.message?.includes("accepted")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Notification preferences
  app.get("/api/settings/notifications", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const prefs = (user as any).notificationPreferences || {
        ticketUpdates: true,
        projectDeadlines: true,
        systemAlerts: true,
        importNotifications: true,
      };
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.patch("/api/settings/notifications", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const notifSchema = z.object({
        ticketUpdates: z.boolean().optional(),
        projectDeadlines: z.boolean().optional(),
        systemAlerts: z.boolean().optional(),
        importNotifications: z.boolean().optional(),
      });

      const parsed = notifSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      const currentPrefs = (user as any).notificationPreferences || {
        ticketUpdates: true,
        projectDeadlines: true,
        systemAlerts: true,
        importNotifications: true,
      };

      const newPrefs = { ...currentPrefs, ...parsed.data };

      await db.update(managedUsers)
        .set({ notificationPreferences: newPrefs, updatedAt: new Date() })
        .where(eq(managedUsers.id, user.id));

      res.json(newPrefs);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Password change
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  });

  app.post("/api/settings/change-password", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const parsed = changePasswordSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      // Verify current password
      const fullUser = await storage.getManagedUser(user.id);
      if (!fullUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(parsed.data.currentPassword, fullUser.password);
      if (!isValidPassword) {
        await storage.createAuditLog({
          action: "password_change_failed",
          category: "security",
          userId: user.id,
          userEmail: user.email,
          details: { reason: "invalid_current_password" },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          status: "failure",
        });
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
      await storage.updateManagedUser(user.id, { password: hashedPassword });

      await storage.createAuditLog({
        action: "password_changed",
        category: "security",
        userId: user.id,
        userEmail: user.email,
        details: {},
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
        status: "success",
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // ===== MFA (Multi-Factor Authentication) =====

  // Generate MFA setup data (secret + QR code)
  app.post("/api/settings/mfa/setup", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      
      if (user.mfaEnabled) {
        return res.status(400).json({ message: "MFA is already enabled" });
      }

      // Generate a new secret
      const secret = generateSecret();
      
      // Store the secret temporarily (not enabled yet)
      await storage.updateManagedUser(user.id, { mfaSecret: secret });
      
      // Generate the otpauth URL for QR code
      const otpauthUrl = generateURI({
        issuer: "Data Portal",
        label: user.email,
        secret,
      });
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      
      res.json({
        secret,
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      console.error("Error setting up MFA:", error);
      res.status(500).json({ message: "Failed to setup MFA" });
    }
  });

  // Verify and enable MFA
  const verifyMfaSchema = z.object({
    token: z.string().length(6),
  });

  app.post("/api/settings/mfa/enable", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const parsed = verifyMfaSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid token format" });
      }

      // Get the user with secret
      const fullUser = await storage.getManagedUser(user.id);
      if (!fullUser || !fullUser.mfaSecret) {
        return res.status(400).json({ message: "MFA setup not initiated. Please start setup first." });
      }

      // Verify the token
      const verifyResult = await verify({
        token: parsed.data.token,
        secret: fullUser.mfaSecret,
      });
      const isValid = verifyResult.valid;

      if (!isValid) {
        await storage.createAuditLog({
          action: "mfa_enable_failed",
          category: "security",
          userId: user.id,
          userEmail: user.email,
          details: { reason: "invalid_token" },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          status: "failure",
        });
        return res.status(401).json({ message: "Invalid verification code" });
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      // Enable MFA
      await storage.updateManagedUser(user.id, {
        mfaEnabled: true,
        mfaBackupCodes: backupCodes,
      });

      await storage.createAuditLog({
        action: "mfa_enabled",
        category: "security",
        userId: user.id,
        userEmail: user.email,
        details: {},
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
        status: "success",
      });

      res.json({
        message: "MFA enabled successfully",
        backupCodes,
      });
    } catch (error) {
      console.error("Error enabling MFA:", error);
      res.status(500).json({ message: "Failed to enable MFA" });
    }
  });

  // Disable MFA
  const disableMfaSchema = z.object({
    password: z.string().min(1),
  });

  app.post("/api/settings/mfa/disable", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const parsed = disableMfaSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Password is required" });
      }

      const fullUser = await storage.getManagedUser(user.id);
      if (!fullUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!fullUser.mfaEnabled) {
        return res.status(400).json({ message: "MFA is not enabled" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(parsed.data.password, fullUser.password);
      if (!isValidPassword) {
        await storage.createAuditLog({
          action: "mfa_disable_failed",
          category: "security",
          userId: user.id,
          userEmail: user.email,
          details: { reason: "invalid_password" },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          status: "failure",
        });
        return res.status(401).json({ message: "Invalid password" });
      }

      // Disable MFA
      await storage.updateManagedUser(user.id, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      });

      await storage.createAuditLog({
        action: "mfa_disabled",
        category: "security",
        userId: user.id,
        userEmail: user.email,
        details: {},
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
        status: "success",
      });

      res.json({ message: "MFA disabled successfully" });
    } catch (error) {
      console.error("Error disabling MFA:", error);
      res.status(500).json({ message: "Failed to disable MFA" });
    }
  });

  // ===== ADMIN SYSTEM SETTINGS =====

  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      // Mask encrypted values
      const masked = settings.map(s => ({
        ...s,
        value: s.isEncrypted ? "********" : s.value,
      }));
      res.json(masked);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  const upsertSettingSchema = z.object({
    key: z.string().min(1).max(100),
    value: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    category: z.enum(["general", "integration", "security"]).default("general"),
    isEncrypted: z.boolean().default(false),
  });

  // Validation functions for different setting types
  const validateNetSuiteUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && url.includes("restlet");
    } catch {
      return false;
    }
  };

  app.post("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser as ManagedUser;
      const parsed = upsertSettingSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      // Validate specific setting formats
      if (parsed.data.key.includes("netsuite") && parsed.data.key.includes("url") && parsed.data.value) {
        if (!validateNetSuiteUrl(parsed.data.value)) {
          return res.status(400).json({ message: "Invalid NetSuite RESTlet URL format. Must be a valid HTTPS URL." });
        }
      }

      const setting = await storage.upsertSystemSetting({
        ...parsed.data,
        updatedBy: currentUser.id,
      });

      await storage.createAuditLog({
        action: "setting_updated",
        category: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email,
        details: { settingKey: parsed.data.key, isEncrypted: parsed.data.isEncrypted },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
        status: "success",
      });

      // Mask encrypted values in response
      res.json({
        ...setting,
        value: setting.isEncrypted ? "********" : setting.value,
      });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.delete("/api/admin/settings/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser as ManagedUser;
      const deleted = await storage.deleteSystemSetting(req.params.key);
      
      if (deleted) {
        await storage.createAuditLog({
          action: "setting_deleted",
          category: "admin",
          userId: currentUser.id,
          userEmail: currentUser.email,
          details: { settingKey: req.params.key },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          status: "success",
        });
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Setting not found" });
      }
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // ===== EXTERNAL SERVICES =====
  
  // Public endpoint for enabled services (used by sidebar)
  app.get("/api/services/enabled", isAuthenticated, async (_req, res) => {
    try {
      const services = await storage.getEnabledExternalServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching enabled services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  
  app.get("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const service = await storage.getExternalService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.get("/api/admin/services", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const services = await storage.getExternalServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  const createServiceSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().nullable(),
    url: z.string().max(500).optional().nullable(),
    icon: z.string().max(100).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    isEnabled: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    color: z.string().max(50).optional().nullable(),
  });

  app.post("/api/admin/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser as ManagedUser;
      const parsed = createServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }
      const { color: _color, sortOrder: rawSort, category: rawCat, ...serviceRest } = parsed.data;
      let service = await storage.createExternalService({
        ...serviceRest,
        category: rawCat ?? undefined,
        sortOrder: rawSort != null ? String(rawSort) : undefined,
      });
      
      if (!service.url) {
        const updated = await storage.updateExternalService(service.id, { url: `/services/${service.id}` });
        if (updated) service = updated;
      }
      
      const heroTemplate = await storage.getSectionTemplateByType("hero_banner");
      if (heroTemplate) {
        await storage.createPageSection({
          serviceId: service.id,
          sectionTemplateId: heroTemplate.id,
          title: service.name,
          subtitle: service.description || "",
          icon: "LayoutDashboard",
          sortOrder: 0,
          isEnabled: true,
          isExpandable: false,
          config: null,
        });
      }
      
      await storage.createAuditLog({
        action: "service_created",
        category: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email,
        details: { serviceName: req.body.name },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
        status: "success",
      });
      
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch("/api/admin/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser as ManagedUser;
      const parsedService = createServiceSchema.partial().safeParse(req.body);
      if (!parsedService.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsedService.error.errors });
      }
      const { color: _color2, sortOrder: rawSort2, category: rawCat2, ...updateRest } = parsedService.data;
      const service = await storage.updateExternalService(req.params.id, {
        ...updateRest,
        ...(rawCat2 !== undefined ? { category: rawCat2 ?? undefined } : {}),
        ...(rawSort2 !== undefined ? { sortOrder: String(rawSort2) } : {}),
      });
      
      if (service) {
        await storage.createAuditLog({
          action: "service_updated",
          category: "admin",
          userId: currentUser.id,
          userEmail: currentUser.email,
          details: { serviceId: req.params.id, changes: req.body },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          status: "success",
        });
        res.json(service);
      } else {
        res.status(404).json({ message: "Service not found" });
      }
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser as ManagedUser;
      const deleted = await storage.deleteExternalService(req.params.id);
      
      if (deleted) {
        await storage.createAuditLog({
          action: "service_deleted",
          category: "admin",
          userId: currentUser.id,
          userEmail: currentUser.email,
          details: { serviceId: req.params.id },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          status: "success",
        });
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Service not found" });
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // ===== INTEGRATION HEALTH CHECK =====
  
  app.get("/api/admin/integrations/health", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      // Simulate health checks for integrations
      const healthStatus = [
        {
          name: "NetSuite API",
          status: "healthy" as const,
          lastChecked: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 200) + 50,
        },
        {
          name: "HR System",
          status: Math.random() > 0.1 ? "healthy" as const : "degraded" as const,
          lastChecked: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 300) + 100,
        },
        {
          name: "Livery Tracking",
          status: "healthy" as const,
          lastChecked: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 150) + 30,
        },
      ];
      
      res.json(healthStatus);
    } catch (error) {
      console.error("Error checking integration health:", error);
      res.status(500).json({ message: "Failed to check integration health" });
    }
  });

  // ===== AUDIT LOGS =====
  
  app.get("/api/admin/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string | undefined;
      const action = req.query.action as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await storage.getAuditLogs({ limit, offset, category, action, search });
      res.json(result);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ===== HELP CENTER & TICKETS =====

  // Seed initial help center content
  async function seedHelpCenterContent() {
    const existingFaq = await storage.getAllFaqEntries();
    if (existingFaq.length === 0) {
      const faqEntries = [
        { category: "general", question: "What is the Data Integration Portal?", answer: "The Data Integration Portal is a centralized dashboard that brings together data from multiple business systems including NetSuite (financial data), HR (employee management), and Livery (delivery tracking) into one unified interface.", order: "1", isPublished: true },
        { category: "general", question: "How often is data synchronized?", answer: "Data is synchronized in near real-time. Each dashboard displays the last sync time in the header. Typically, data is refreshed every 5-15 minutes depending on the source system.", order: "2", isPublished: true },
        { category: "netsuite", question: "Why can't I see certain transactions?", answer: "Transaction visibility depends on your role permissions. Viewers can see summary data, Editors can see detailed transactions, and Admins have full access. Contact your administrator if you need expanded access.", order: "1", isPublished: true },
        { category: "netsuite", question: "How do I export financial data?", answer: "To export data, navigate to the NetSuite dashboard, use the filters to select your date range, then click the Export button in the top right corner. Data can be exported as CSV or Excel format.", order: "2", isPublished: true },
        { category: "hr", question: "Can I update employee information?", answer: "Employee information is read-only in this portal. To update employee records, please use the primary HR system directly or contact your HR administrator.", order: "1", isPublished: true },
        { category: "livery", question: "Why is a delivery showing as delayed?", answer: "Deliveries are marked as delayed when they exceed their estimated delivery time. The status is updated automatically based on driver GPS data and route calculations.", order: "1", isPublished: true },
        { category: "account", question: "How do I reset my password?", answer: "Go to Settings > Profile, then click 'Change Password'. You'll need to enter your current password and then your new password twice for confirmation.", order: "1", isPublished: true },
        { category: "account", question: "How do I enable Multi-Factor Authentication (MFA)?", answer: "Navigate to Settings > Security tab, then click 'Enable MFA'. You'll need an authenticator app like Google Authenticator or Authy to scan the QR code and complete setup.", order: "2", isPublished: true },
        { category: "troubleshooting", question: "The dashboard is loading slowly. What can I do?", answer: "Try refreshing the page, clearing your browser cache, or using a different browser. If issues persist, check your internet connection or submit a support ticket.", order: "1", isPublished: true },
        { category: "troubleshooting", question: "I'm seeing outdated data. How do I refresh?", answer: "Each dashboard has a refresh button near the sync status indicator. Click it to force a data refresh. If the issue persists, there may be a sync issue - please submit a support ticket.", order: "2", isPublished: true },
      ];
      for (const entry of faqEntries) {
        await storage.createFaqEntry(entry);
      }
      console.log("Seeded FAQ entries");
    }

    const existingManuals = await storage.getAllUserManuals();
    if (existingManuals.length === 0) {
      const manuals = [
        { category: "general", title: "Getting Started Guide", description: "Learn the basics of navigating the Data Integration Portal and accessing your dashboards.", content: "# Getting Started\n\nWelcome to the Data Integration Portal. This guide will help you get started with the system.\n\n## Logging In\n\n1. Navigate to the portal URL\n2. Enter your username and password\n3. Click 'Sign In'\n\n## Navigation\n\nUse the sidebar to navigate between different dashboards:\n- NetSuite: Financial data and transactions\n- HR: Employee information\n- Livery: Delivery tracking", order: "1", isPublished: true },
        { category: "netsuite", title: "NetSuite Dashboard Manual", description: "Complete guide to using the NetSuite financial dashboard including metrics, transactions, and reporting.", content: "# NetSuite Dashboard\n\n## Overview\n\nThe NetSuite dashboard provides real-time financial data including:\n- Revenue metrics\n- Transaction history\n- Customer information\n\n## Features\n\n### Metrics Cards\nTop-level KPIs showing current performance vs. previous periods.\n\n### Transaction Table\nSearchable, filterable list of all transactions.\n\n### Charts\nVisual representations of financial trends over time.", order: "1", isPublished: true },
        { category: "hr", title: "HR Dashboard Manual", description: "Guide to viewing employee data, department statistics, and organizational metrics.", content: "# HR Dashboard\n\n## Overview\n\nThe HR dashboard displays employee-related information:\n- Total employee count\n- Department breakdown\n- Leave status\n- Hiring metrics", order: "1", isPublished: true },
        { category: "livery", title: "Livery Tracking Manual", description: "How to track deliveries, monitor fleet performance, and understand delivery statuses.", content: "# Livery Tracking\n\n## Overview\n\nMonitor your delivery fleet in real-time:\n- Active deliveries\n- Driver locations\n- Delivery status updates\n\n## Status Codes\n\n- **In Transit**: Package is on the way\n- **Delivered**: Successfully delivered\n- **Delayed**: Behind schedule", order: "1", isPublished: true },
        { category: "account", title: "Account Security Guide", description: "Best practices for keeping your account secure including MFA setup and password management.", content: "# Account Security\n\n## Password Requirements\n\n- Minimum 8 characters\n- Mix of uppercase and lowercase\n- At least one number\n\n## Multi-Factor Authentication\n\nWe strongly recommend enabling MFA for added security. Go to Settings > Security to enable.", order: "1", isPublished: true },
      ];
      for (const manual of manuals) {
        await storage.createUserManual(manual);
      }
      console.log("Seeded User Manuals");
    }
  }

  // Run seeding in background
  seedHelpCenterContent().catch(console.error);

  // Get FAQ entries
  app.get("/api/help/faq", isAuthenticated, async (_req, res) => {
    try {
      const entries = await storage.getAllFaqEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching FAQ entries:", error);
      res.status(500).json({ message: "Failed to fetch FAQ entries" });
    }
  });

  // Get user manuals
  app.get("/api/help/manuals", isAuthenticated, async (_req, res) => {
    try {
      const manuals = await storage.getAllUserManuals();
      res.json(manuals);
    } catch (error) {
      console.error("Error fetching user manuals:", error);
      res.status(500).json({ message: "Failed to fetch user manuals" });
    }
  });

  // Get user manual by ID
  app.get("/api/help/manuals/:id", isAuthenticated, async (req, res) => {
    try {
      const manual = await storage.getUserManual(req.params.id);
      if (!manual) {
        return res.status(404).json({ message: "Manual not found" });
      }
      res.json(manual);
    } catch (error) {
      console.error("Error fetching user manual:", error);
      res.status(500).json({ message: "Failed to fetch user manual" });
    }
  });

  // ===== TICKET MANAGEMENT =====

  // Create a new ticket
  const createTicketSchema = z.object({
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.enum(["it_support", "digital_transformation", "other"]),
    subcategory: z.string().optional(),
    severity: z.enum(["low", "medium", "high", "critical"]),
  }).superRefine((data, ctx) => {
    if (data.subcategory) {
      if (data.category === "it_support" && !(itSupportSubcategories as readonly string[]).includes(data.subcategory)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid subcategory for IT Support`, path: ["subcategory"] });
      }
      if (data.category === "digital_transformation" && !(digitalTransformationSubcategories as readonly string[]).includes(data.subcategory)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid subcategory for Digital Transformation`, path: ["subcategory"] });
      }
    }
  });

  app.post("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const parsed = createTicketSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const ticket = await storage.createTicket({
        ...parsed.data,
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        status: "new",
      });

      await storage.createAuditLog({
        action: "ticket_created",
        category: "support",
        userId: user.id,
        userEmail: user.email,
        details: { ticketId: ticket.id, trackingId: ticket.trackingId, subject: ticket.subject },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Get current user's tickets
  app.get("/api/tickets/my", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const tickets = await storage.getTicketsByUser(user.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/stats", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      const userFilter = isAdmin ? sql`1=1` : sql`user_id = ${user.id}`;

      const [counts] = await db.select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where status in ('new','in_progress','under_review'))::int`,
        resolved: sql<number>`count(*) filter (where status = 'resolved')::int`,
        closed: sql<number>`count(*) filter (where status = 'closed')::int`,
        statusNew: sql<number>`count(*) filter (where status = 'new')::int`,
        statusInProgress: sql<number>`count(*) filter (where status = 'in_progress')::int`,
        statusUnderReview: sql<number>`count(*) filter (where status = 'under_review')::int`,
        itSupport: sql<number>`count(*) filter (where category = 'it_support')::int`,
        digitalTransformation: sql<number>`count(*) filter (where category = 'digital_transformation')::int`,
        critical: sql<number>`count(*) filter (where severity = 'critical' and status in ('new','in_progress','under_review'))::int`,
        itOpen: sql<number>`count(*) filter (where category = 'it_support' and status in ('new','in_progress','under_review'))::int`,
        itResolved: sql<number>`count(*) filter (where category = 'it_support' and status in ('resolved','closed'))::int`,
        dtOpen: sql<number>`count(*) filter (where category = 'digital_transformation' and status in ('new','in_progress','under_review'))::int`,
        dtResolved: sql<number>`count(*) filter (where category = 'digital_transformation' and status in ('resolved','closed'))::int`,
        avgCloseMs: sql<number>`coalesce(avg(extract(epoch from (resolved_at - created_at)) * 1000) filter (where status in ('resolved','closed') and resolved_at is not null), 0)`,
      }).from(tickets).where(userFilter);

      const avgCloseTimeHours = Math.round((Number(counts.avgCloseMs) / (1000 * 60 * 60)) * 100) / 100;
      const avgCloseTimeDays = Math.round((avgCloseTimeHours / 24) * 100) / 100;

      const overdueRows = await db.select({ id: tickets.id }).from(tickets)
        .where(sql`${userFilter} AND status in ('new','in_progress','under_review') AND (
          (severity = 'critical' AND created_at < now() - interval '4 hours') OR
          (severity = 'high' AND created_at < now() - interval '24 hours') OR
          (severity = 'medium' AND created_at < now() - interval '48 hours') OR
          (severity = 'low' AND created_at < now() - interval '72 hours')
        )`);

      const overdueTickets = overdueRows.map(r => r.id);

      const stats = {
        total: counts.total,
        open: counts.open,
        resolved: counts.resolved,
        closed: counts.closed,
        itSupport: counts.itSupport,
        digitalTransformation: counts.digitalTransformation,
        critical: counts.critical,
        byStatus: {
          new: counts.statusNew,
          in_progress: counts.statusInProgress,
          under_review: counts.statusUnderReview,
          resolved: counts.resolved,
          closed: counts.closed,
        },
        avgCloseTimeHours,
        avgCloseTimeDays,
        byDepartmentLoad: {
          it_support: {
            total: counts.itSupport,
            open: counts.itOpen,
            resolved: counts.itResolved,
          },
          digital_transformation: {
            total: counts.digitalTransformation,
            open: counts.dtOpen,
            resolved: counts.dtResolved,
          },
        },
        slaBreaches: overdueTickets.length,
        overdueTickets,
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get ticket by ID (user can only view their own, admin can view all)
  app.get("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Users can only view their own tickets, admins can view all
      if (ticket.userId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ message: "You can only view your own tickets" });
      }

      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  // Get ticket comments
  app.get("/api/tickets/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Users can only view their own tickets, admins can view all
      if (ticket.userId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ message: "You can only view your own tickets" });
      }

      const comments = await storage.getTicketComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching ticket comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add comment to ticket
  const addCommentSchema = z.object({
    message: z.string().min(1, "Message is required"),
  });

  app.post("/api/tickets/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Users can only comment on their own tickets, admins can comment on all
      if (ticket.userId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ message: "You can only comment on your own tickets" });
      }

      const parsed = addCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const comment = await storage.createTicketComment({
        ticketId: req.params.id,
        userId: user.id,
        userEmail: user.email,
        userName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        isAdmin: user.role === "admin" || user.role === "superadmin",
        message: parsed.data.message,
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // ===== ADMIN TICKET MANAGEMENT =====

  app.get("/api/admin/tickets", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;

      const result = await storage.getAllTickets({
        limit, offset, status, category,
        userId: isAdmin ? undefined : user.id,
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Update ticket (admin: status/assignee/severity/category; user: subject/description when status=new)
  const updateTicketSchema = z.object({
    status: z.enum(["new", "in_progress", "under_review", "resolved", "closed"]).optional(),
    assignedTo: z.string().optional(),
    assignedToName: z.string().optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    category: z.enum(["it_support", "digital_transformation", "other"]).optional(),
    subject: z.string().min(5, "Subject must be at least 5 characters").optional(),
    description: z.string().min(10, "Description must be at least 10 characters").optional(),
  });

  app.patch("/api/admin/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (!isAdmin && ticket.userId !== user.id) {
        return res.status(403).json({ message: "You can only update your own tickets" });
      }

      const parsed = updateTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      if (!isAdmin) {
        const adminOnlyFields = ['status', 'assignedTo', 'assignedToName', 'severity', 'category'] as const;
        const hasAdminField = adminOnlyFields.some(f => parsed.data[f] !== undefined);
        if (hasAdminField) {
          return res.status(403).json({ message: "Only admins can change status, assignment, severity, or category" });
        }
        if ((parsed.data.subject || parsed.data.description) && ticket.status !== "new") {
          return res.status(403).json({ message: "You can only edit subject/description while the ticket is in 'new' status" });
        }
      }

      if (parsed.data.status) {
        if (ticket.status === "closed" && parsed.data.status !== "closed") {
          return res.status(400).json({ message: "Cannot reopen a closed ticket" });
        }
      }

      const updateData: Partial<Ticket> & typeof parsed.data = { ...parsed.data };

      if (parsed.data.category && parsed.data.category !== ticket.category) {
        updateData.subcategory = null;
      }

      if (parsed.data.status === "resolved" && ticket.status !== "resolved") {
        updateData.resolvedAt = new Date();
      }
      if (parsed.data.status === "closed" && ticket.status !== "closed") {
        updateData.closedAt = new Date();
      }

      const updated = await storage.updateTicket(req.params.id, updateData);

      await storage.createAuditLog({
        action: "ticket_updated",
        category: "support",
        userId: user.id,
        userEmail: user.email,
        details: { ticketId: ticket.id, trackingId: ticket.trackingId, changes: parsed.data },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Delete ticket (admin only)
  app.delete("/api/admin/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      if (user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ message: "Only admins can delete tickets" });
      }

      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      await storage.deleteTicket(req.params.id);

      await storage.createAuditLog({
        action: "ticket_deleted",
        category: "support",
        userId: user.id,
        userEmail: user.email,
        details: { ticketId: ticket.id, trackingId: ticket.trackingId, subject: ticket.subject },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      res.json({ message: "Ticket deleted" });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Customer DB API Routes
  
  // Get all customers with optional search, type, unit filter, and sorting
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const { search, type, unit, limit, offset, sortBy, sortOrder } = req.query;
      const result = await storage.getAllCustomers({
        search: search as string,
        type: type as string,
        unit: unit as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get single customer with profile
  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomerWithProfile(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Create new customer with profile
  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      
      const customerSchema = insertCustomerSchema.extend({
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        nationality: z.string().optional(),
        occupation: z.string().optional(),
      });
      
      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { dateOfBirth, gender, nationality, occupation, ...customerData } = parsed.data;

      // Check for duplicate email
      const existingCustomers = await storage.getAllCustomers({ search: customerData.email });
      const emailExists = existingCustomers.customers.some(c => c.email === customerData.email);
      if (emailExists) {
        return res.status(400).json({ message: "A customer with this email already exists" });
      }

      // Create the customer
      const customer = await storage.createCustomer(customerData);

      // Create the profile
      if (dateOfBirth || gender || nationality || occupation) {
        await storage.upsertCustomerProfile({
          customerId: customer.id,
          dateOfBirth,
          gender,
          nationality,
          occupation,
        });
      }

      // Log the action
      await storage.createAuditLog({
        action: "customer_created",
        category: "customer_db",
        userId: user.id,
        userEmail: user.email,
        details: { customerId: customer.id, customerName: `${customer.firstName} ${customer.lastName}` },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      const result = await storage.getCustomerWithProfile(customer.id);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Update customer
  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const existing = await storage.getCustomer(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const customerSchema = insertCustomerSchema.partial().extend({
        dateOfBirth: z.string().optional(),
        gender: z.string().optional(),
        nationality: z.string().optional(),
        occupation: z.string().optional(),
      });

      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { dateOfBirth, gender, nationality, occupation, ...customerData } = parsed.data;

      // Update customer if there are changes
      if (Object.keys(customerData).length > 0) {
        await storage.updateCustomer(req.params.id, customerData);
      }

      // Update profile
      if (dateOfBirth !== undefined || gender !== undefined || nationality !== undefined || occupation !== undefined) {
        await storage.upsertCustomerProfile({
          customerId: req.params.id,
          dateOfBirth,
          gender,
          nationality,
          occupation,
        });
      }

      await storage.createAuditLog({
        action: "customer_updated",
        category: "customer_db",
        userId: user.id,
        userEmail: user.email,
        details: { customerId: req.params.id },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      const result = await storage.getCustomerWithProfile(req.params.id);
      res.json(result);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const existing = await storage.getCustomer(req.params.id);
      
      if (!existing) {
        return res.status(404).json({ message: "Customer not found" });
      }

      await storage.deleteCustomer(req.params.id);

      await storage.createAuditLog({
        action: "customer_deleted",
        category: "customer_db",
        userId: user.id,
        userEmail: user.email,
        details: { customerId: req.params.id, customerName: `${existing.firstName} ${existing.lastName}` },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Import customers from Excel file - two-step flow
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  function parseCsvBuffer(buffer: Buffer): Record<string, string>[] {
    const text = buffer.toString("utf-8");
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new Error("CSV file has no data rows");

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
          else if (ch === '"') { inQuotes = false; }
          else { current += ch; }
        } else {
          if (ch === '"') { inQuotes = true; }
          else if (ch === ',') { result.push(current.trim()); current = ""; }
          else { current += ch; }
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const obj: Record<string, string> = {};
      let hasValue = false;
      headers.forEach((header, idx) => {
        const val = values[idx] ?? "";
        obj[header] = val;
        if (val) hasValue = true;
      });
      if (hasValue) rows.push(obj);
    }
    return rows;
  }

  function isExcelSerialDate(value: number): boolean {
    return value >= 1 && value < 60000;
  }

  function excelSerialToDate(serial: number): string {
    const utcDays = Math.floor(serial) - 25569;
    const utcValue = utcDays * 86400 * 1000;
    const date = new Date(utcValue);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isDateColumn(header: string): boolean {
    const lower = header.toLowerCase().replace(/[_\s]+/g, '');
    return /\bdate\b|_date$|^date_|\bдата\b/i.test(header.toLowerCase()) ||
      lower === 'calldate' || lower === 'dob' || lower === 'birthday' || lower === 'dateofbirth' ||
      lower === 'createdat' || lower === 'updatedat' || lower === 'expiresat' || lower === 'duedate' ||
      lower === 'startdate' || lower === 'enddate' || lower === 'deadline';
  }

  async function parseExcelFile(buffer: Buffer, filename?: string) {
    const ext = (filename || "").toLowerCase();
    const isCsvByName = ext.endsWith(".csv");
    const isXlsxBySignature = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;

    if (isCsvByName || (!isXlsxBySignature && !isCsvByName)) {
      try {
        const rows = parseCsvBuffer(buffer);
        if (rows.length > 0) {
          return rows.map(row => {
            const converted: Record<string, string> = {};
            for (const [key, value] of Object.entries(row)) {
              if (isDateColumn(key) && value && !isNaN(Number(value))) {
                const num = Number(value);
                if (isExcelSerialDate(num)) {
                  converted[key] = excelSerialToDate(num);
                  continue;
                }
              }
              converted[key] = value;
            }
            return converted;
          });
        }
      } catch {
        if (isCsvByName) throw new Error("Failed to parse CSV file");
      }
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("Excel file has no sheets");
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? "");
    });
    const rows: Record<string, string>[] = [];
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const obj: Record<string, string> = {};
      let hasValue = false;
      headers.forEach((header, colNumber) => {
        if (!header) return;
        const cell = row.getCell(colNumber);
        let val = "";
        if (cell.value instanceof Date) {
          val = cell.value.toISOString().split("T")[0];
        } else if (cell.value !== null && cell.value !== undefined) {
          const raw = cell.value;
          if (typeof raw === 'number' && isDateColumn(header) && isExcelSerialDate(raw)) {
            val = excelSerialToDate(raw);
          } else {
            val = String(raw);
          }
        }
        obj[header] = val;
        if (val) hasValue = true;
      });
      if (hasValue) rows.push(obj);
    }
    if (rows.length === 0) throw new Error("Excel file has no data rows");
    return rows;
  }

  function validateFileExtension(filename: string) {
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const lower = filename?.toLowerCase() || "";
    return allowedExtensions.some(ext => lower.endsWith(ext));
  }

  // Step 1: Upload file and get column headers + preview rows
  app.post("/api/customers/import/preview", isAuthenticated, isSuperAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      if (!validateFileExtension(req.file.originalname)) {
        return res.status(400).json({ message: "Invalid file type. Please upload .xlsx, .xls, or .csv" });
      }

      const rows = await parseExcelFile(req.file.buffer, req.file.originalname);
      const columns = Object.keys(rows[0]);
      const preview = rows.slice(0, 5).map(row => {
        const obj: Record<string, string> = {};
        for (const col of columns) obj[col] = String(row[col] ?? "");
        return obj;
      });

      const fileBase64 = req.file.buffer.toString("base64");
      res.json({ columns, preview, totalRows: rows.length, fileData: fileBase64 });
    } catch (error: any) {
      console.error("Error previewing import:", error);
      res.status(400).json({ message: error.message || "Failed to parse file" });
    }
  });

  // Step 2: Import with user-defined column mapping
  app.post("/api/customers/import", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const { fileData, mapping } = req.body;

      if (!fileData || !mapping) {
        return res.status(400).json({ message: "File data and column mapping are required" });
      }

      if (!mapping.firstName && !mapping.lastName && !mapping.email && !mapping.contact) {
        return res.status(400).json({ message: "At least one field mapping is required" });
      }

      const buffer = Buffer.from(fileData, "base64");
      const rows = await parseExcelFile(buffer);

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      const skipReasons: Record<string, number> = {
        empty_row: 0,
        duplicate_email: 0,
        duplicate_phone: 0,
        error: 0,
      };

      const allExisting = await storage.getAllCustomers({ limit: 100000, offset: 0 });
      const existingEmails = new Set(
        allExisting.customers.map(c => (c.email || "").toLowerCase().trim()).filter(Boolean)
      );
      const existingPhones = new Set(
        allExisting.customers.map(c => (c.contact || "").replace(/\D/g, "")).filter(Boolean)
      );

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const firstName = mapping.firstName ? String(row[mapping.firstName] ?? "").trim() : "";
        const lastName = mapping.lastName ? String(row[mapping.lastName] ?? "").trim() : "";
        const contact = mapping.contact ? String(row[mapping.contact] ?? "").trim() : "";
        const email = mapping.email ? String(row[mapping.email] ?? "").trim() : "";
        const source = mapping.source ? String(row[mapping.source] ?? "").trim() : "";

        if (!firstName && !lastName && !email && !contact) {
          skipped++;
          skipReasons.empty_row++;
          errors.push(`Row ${i + 2}: skipped - row is completely empty`);
          continue;
        }

        try {
          if (email) {
            const emailLower = email.toLowerCase().trim();
            if (existingEmails.has(emailLower)) {
              skipped++;
              skipReasons.duplicate_email++;
              errors.push(`Row ${i + 2}: "${firstName} ${lastName}" skipped - email "${email}" already exists`);
              continue;
            }
          }

          if (contact) {
            const phoneDigits = contact.replace(/\D/g, "");
            if (phoneDigits && existingPhones.has(phoneDigits)) {
              skipped++;
              skipReasons.duplicate_phone++;
              errors.push(`Row ${i + 2}: "${firstName} ${lastName}" skipped - phone "${contact}" already exists`);
              continue;
            }
          }

          const code = `IMP${String(Date.now()).slice(-4)}${String(i).padStart(3, "0")}`;
          await storage.createCustomer({
            externalCode: code,
            firstName,
            lastName,
            type: "Individual",
            primaryUnit: "Corporate",
            email,
            contact,
            source: source || "Excel Import",
            status: "active",
          });
          imported++;

          if (email) existingEmails.add(email.toLowerCase().trim());
          if (contact) existingPhones.add(contact.replace(/\D/g, ""));
        } catch (err: any) {
          skipped++;
          skipReasons.error++;
          errors.push(`Row ${i + 2}: "${firstName} ${lastName}" failed - ${err.message || "unknown error"}`);
        }
      }

      await storage.createAuditLog({
        action: "customers_imported",
        category: "customer_db",
        userId: user.id,
        userEmail: user.email,
        details: { imported, skipped, totalRows: rows.length },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      await db.insert(importLogs).values({
        fileName: req.body.fileName || "import.xlsx",
        totalRows: rows.length,
        imported,
        skipped,
        skipReasons,
        importedBy: user.id,
        importedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      });

      res.json({ imported, skipped, totalRows: rows.length, errors: errors.slice(0, 50), skipReasons });
    } catch (error: any) {
      console.error("Error importing customers:", error);
      res.status(500).json({ message: "Failed to import customers: " + (error.message || "Unknown error") });
    }
  });

  // Import log CRUD endpoints
  app.post("/api/customers/import-log", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const { fileName, totalRows, imported, skipped, skipReasons } = req.body;

      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }

      const [log] = await db.insert(importLogs).values({
        fileName,
        totalRows: totalRows || 0,
        imported: imported || 0,
        skipped: skipped || 0,
        skipReasons: skipReasons || null,
        importedBy: user.id,
        importedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      }).returning();

      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating import log:", error);
      res.status(500).json({ message: "Failed to create import log" });
    }
  });

  app.get("/api/customers/import-logs", isAuthenticated, async (req, res) => {
    try {
      const logs = await db.select().from(importLogs).orderBy(desc(importLogs.createdAt));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching import logs:", error);
      res.status(500).json({ message: "Failed to fetch import logs" });
    }
  });

  // ==================== Customer Duplicate Detection & Merge Routes ====================

  app.post("/api/customers/duplicates/scan", isAuthenticated, async (req, res) => {
    try {
      const { criteria } = req.body;
      if (!criteria || (!criteria.email && !criteria.name && !criteria.phone)) {
        return res.status(400).json({ message: "At least one matching criteria is required" });
      }

      const allData = await storage.getAllCustomers({ limit: 10000, offset: 0 });
      const allCustomers = allData.customers;
      const groups: { matchType: string; records: typeof allCustomers }[] = [];
      const usedIds = new Set<string>();

      if (criteria.email) {
        const emailMap = new Map<string, typeof allCustomers>();
        for (const c of allCustomers) {
          const email = (c.email || "").toLowerCase().trim();
          if (!email) continue;
          if (!emailMap.has(email)) emailMap.set(email, []);
          emailMap.get(email)!.push(c);
        }
        Array.from(emailMap.entries()).forEach(([, records]) => {
          if (records.length > 1) {
            groups.push({ matchType: "email", records });
            records.forEach((r: { id: string }) => usedIds.add(r.id));
          }
        });
      }

      if (criteria.name) {
        const nameMap = new Map<string, typeof allCustomers>();
        for (const c of allCustomers) {
          if (usedIds.has(c.id)) continue;
          const fn = (c.firstName || "").toLowerCase().trim();
          const ln = (c.lastName || "").toLowerCase().trim();
          if (!fn || !ln) continue;
          const key = `${fn}|${ln}`;
          if (!nameMap.has(key)) nameMap.set(key, []);
          nameMap.get(key)!.push(c);
        }
        Array.from(nameMap.entries()).forEach(([, records]) => {
          if (records.length > 1) {
            groups.push({ matchType: "name", records });
            records.forEach((r: { id: string }) => usedIds.add(r.id));
          }
        });
      }

      if (criteria.phone) {
        const phoneMap = new Map<string, typeof allCustomers>();
        for (const c of allCustomers) {
          if (usedIds.has(c.id)) continue;
          const phone = (c.contact || "").replace(/\D/g, "");
          if (!phone) continue;
          if (!phoneMap.has(phone)) phoneMap.set(phone, []);
          phoneMap.get(phone)!.push(c);
        }
        Array.from(phoneMap.entries()).forEach(([, records]) => {
          if (records.length > 1) {
            groups.push({ matchType: "phone", records });
            records.forEach((r: { id: string }) => usedIds.add(r.id));
          }
        });
      }

      res.json({ groups, totalDuplicates: groups.reduce((sum, g) => sum + g.records.length, 0) });
    } catch (error: any) {
      console.error("Error scanning duplicates:", error);
      res.status(500).json({ message: "Failed to scan for duplicates" });
    }
  });

  app.post("/api/customers/merge", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const { primaryId, secondaryIds } = req.body;

      if (!primaryId || !secondaryIds || !Array.isArray(secondaryIds) || secondaryIds.length === 0) {
        return res.status(400).json({ message: "Primary ID and at least one secondary ID required" });
      }

      const primary = await storage.getCustomer(primaryId);
      if (!primary) {
        return res.status(404).json({ message: "Primary record not found" });
      }

      const mergedData: Partial<InsertCustomer> = {};
      for (const secId of secondaryIds) {
        const secondary = await storage.getCustomer(secId);
        if (!secondary) continue;

        if (!primary.firstName && secondary.firstName) mergedData.firstName = secondary.firstName;
        if (!primary.lastName && secondary.lastName) mergedData.lastName = secondary.lastName;
        if (!primary.contact && secondary.contact) mergedData.contact = secondary.contact;
        if (!primary.email && secondary.email) mergedData.email = secondary.email;
        if (!primary.source && secondary.source) mergedData.source = secondary.source;

        await storage.deleteCustomer(secId);
      }

      if (Object.keys(mergedData).length > 0) {
        await storage.updateCustomer(primaryId, mergedData);
      }

      const updated = await storage.getCustomer(primaryId);

      await storage.createAuditLog({
        action: "customers_merged",
        category: "customer_db",
        userId: user.id,
        userEmail: user.email,
        details: { primaryId, mergedIds: secondaryIds, fieldsUpdated: Object.keys(mergedData) },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      res.json({ merged: updated, deletedCount: secondaryIds.length });
    } catch (error: any) {
      console.error("Error merging customers:", error);
      res.status(500).json({ message: "Failed to merge customers: " + (error.message || "Unknown error") });
    }
  });

  app.delete("/api/customers/duplicates/bulk", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "At least one ID is required" });
      }

      let deleted = 0;
      for (const id of ids) {
        const success = await storage.deleteCustomer(id);
        if (success) deleted++;
      }

      await storage.createAuditLog({
        action: "customers_bulk_deleted",
        category: "customer_db",
        userId: user.id,
        userEmail: user.email,
        details: { deletedIds: ids, deletedCount: deleted },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        status: "success",
      });

      res.json({ deleted });
    } catch (error: any) {
      console.error("Error bulk deleting customers:", error);
      res.status(500).json({ message: "Failed to delete customers" });
    }
  });

  // ==================== Data Sources Routes (Multi-source Customer DB) ====================

  app.get("/api/data-sources", isAuthenticated, async (req, res) => {
    try {
      const sources = await storage.getAllDataSources();
      const sourcesWithCounts = await Promise.all(sources.map(async (s) => {
        const { total } = await storage.getDsRecords(s.id, { limit: 0 });
        return { ...s, recordCount: total };
      }));
      res.json(sourcesWithCounts);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.get("/api/data-sources/:slug", isAuthenticated, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });
      res.json(ds);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch data source" });
    }
  });

  app.get("/api/data-sources/:slug/records", isAuthenticated, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });

      const { search, limit, offset, sortBy, sortOrder } = req.query;
      const result = await storage.getDsRecords(ds.id, {
        search: search as string,
        limit: limit ? parseInt(limit as string) : 25,
        offset: offset ? parseInt(offset as string) : 0,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch records" });
    }
  });

  const dsUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/api/data-sources/:slug/import/preview", isAuthenticated, isSuperAdmin, dsUpload.single("file"), async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const ext = req.file.originalname?.toLowerCase() || "";
      if (![".xlsx", ".xls", ".csv"].some(e => ext.endsWith(e))) {
        return res.status(400).json({ message: "Invalid file type. Please upload .xlsx, .xls, or .csv" });
      }

      const rows = await parseExcelFile(req.file.buffer, req.file.originalname);

      const columns = Object.keys(rows[0]);
      const preview = rows.slice(0, 5).map(row => {
        const obj: Record<string, string> = {};
        for (const col of columns) obj[col] = String(row[col] ?? "");
        return obj;
      });

      const fileBase64 = req.file.buffer.toString("base64");
      res.json({
        columns,
        preview,
        totalRows: rows.length,
        fileData: fileBase64,
        savedMapping: ds.importMapping,
        savedColumns: ds.columns,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to parse file" });
    }
  });

  app.post("/api/data-sources/:slug/import", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });

      const user = (req as any).managedUser as ManagedUser;
      const { fileData, mapping, fileName } = req.body;

      if (!fileData || !mapping) {
        return res.status(400).json({ message: "Missing fileData or mapping" });
      }

      const buffer = Buffer.from(fileData, "base64");
      const rows = await parseExcelFile(buffer);

      const mappingEntries = Object.entries(mapping).filter(([_, v]) => v);
      const dedupeKey = ds.deduplicateKey;

      let imported = 0;
      let skipped = 0;
      const skipReasons: Record<string, number> = { empty_row: 0, duplicate: 0, error: 0 };
      const recordsToInsert: { dataSourceId: string; data: Record<string, string | number | boolean | null> }[] = [];

      const existingRecords = dedupeKey ? (await storage.getDsRecords(ds.id, { limit: 100000 })).records : [];

      for (const row of rows) {
        const data: Record<string, string | number | boolean | null> = {};
        let hasValue = false;

        for (const [targetKey, sourceCol] of mappingEntries) {
          const val = row[sourceCol as string];
          data[targetKey] = val !== undefined && val !== "" ? String(val) : null;
          if (data[targetKey]) hasValue = true;
        }

        if (!hasValue) {
          skipped++;
          skipReasons.empty_row++;
          continue;
        }

        if (dedupeKey && data[dedupeKey]) {
          const isDuplicate = existingRecords.some(r => {
            const existing = r.data as Record<string, any>;
            return existing[dedupeKey] && String(existing[dedupeKey]).toLowerCase() === String(data[dedupeKey]).toLowerCase();
          });
          if (isDuplicate) {
            skipped++;
            skipReasons.duplicate++;
            continue;
          }
        }

        recordsToInsert.push({ dataSourceId: ds.id, data });
        imported++;
      }

      if (recordsToInsert.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < recordsToInsert.length; i += batchSize) {
          await storage.createDsRecordsBulk(recordsToInsert.slice(i, i + batchSize));
        }
      }

      const columnDefs = mappingEntries.map(([key]) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        type: "text",
      }));

      const existingColumnKeys = new Set((ds.columns || []).map(c => c.key));
      const newColumns = columnDefs.filter(c => !existingColumnKeys.has(c.key));
      const mergedColumns = [...(ds.columns || []), ...newColumns];

      await storage.updateDataSource(ds.id, {
        columns: mergedColumns,
        importMapping: mapping as Record<string, string>,
        recordCount: (ds.recordCount || 0) + imported,
        lastImportAt: new Date(),
      });

      await db.insert(importLogs).values({
        dataSourceId: ds.id,
        fileName: fileName || "import.xlsx",
        totalRows: rows.length,
        imported,
        skipped,
        skipReasons,
        importedBy: user.id,
        importedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      });

      res.json({ imported, skipped, totalRows: rows.length, skipReasons });
    } catch (error: any) {
      console.error("Data source import error:", error);
      res.status(500).json({ message: error.message || "Import failed" });
    }
  });

  app.get("/api/data-sources/:slug/import-logs", isAuthenticated, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });

      const logs = await db.select().from(importLogs)
        .where(eq(importLogs.dataSourceId, ds.id))
        .orderBy(desc(importLogs.createdAt));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch import logs" });
    }
  });

  app.post("/api/data-sources/:slug/duplicates/scan", isAuthenticated, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });

      const { fields } = req.body;
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: "Provide at least one field for duplicate detection" });
      }

      const { records } = await storage.getDsRecords(ds.id, { limit: 100000 });

      const groups: { matchField: string; matchValue: string; records: typeof records }[] = [];
      
      for (const field of fields) {
        const valueMap = new Map<string, typeof records>();
        for (const record of records) {
          const val = (record.data as Record<string, any>)?.[field];
          if (!val) continue;
          const key = String(val).toLowerCase().trim();
          if (!key) continue;
          if (!valueMap.has(key)) valueMap.set(key, []);
          valueMap.get(key)!.push(record);
        }
        Array.from(valueMap.entries()).forEach(([val, recs]) => {
          if (recs.length > 1) {
            groups.push({ matchField: field, matchValue: val, records: recs });
          }
        });
      }

      res.json({ groups, totalDuplicates: groups.reduce((sum, g) => sum + g.records.length, 0) });
    } catch (error: any) {
      res.status(500).json({ message: "Duplicate scan failed" });
    }
  });

  app.post("/api/data-sources/:slug/merge", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { primaryId, secondaryIds } = req.body;
      if (!primaryId || !secondaryIds?.length) {
        return res.status(400).json({ message: "primaryId and secondaryIds required" });
      }

      const primary = await storage.getDsRecord(primaryId);
      if (!primary) return res.status(404).json({ message: "Primary record not found" });

      for (const secId of secondaryIds) {
        const sec = await storage.getDsRecord(secId);
        if (!sec) continue;
        const mergedData = { ...(sec.data as Record<string, any>) };
        const primaryData = primary.data as Record<string, any>;
        for (const [k, v] of Object.entries(primaryData)) {
          if (v !== null && v !== "") mergedData[k] = v;
        }
        await storage.deleteDsRecord(secId);
      }

      res.json({ message: "Merged successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Merge failed" });
    }
  });

  app.delete("/api/data-sources/:slug/records", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "At least one ID is required" });
      }

      let deleted = 0;
      for (const id of ids) {
        if (await storage.deleteDsRecord(id)) deleted++;
      }
      res.json({ deleted });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete records" });
    }
  });

  app.patch("/api/data-sources/:slug/records/:id", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { field, value } = req.body;
      if (!field || value === undefined) {
        return res.status(400).json({ message: "field and value are required" });
      }
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });

      const record = await storage.getDsRecord(req.params.id);
      if (!record || record.dataSourceId !== ds.id) {
        return res.status(404).json({ message: "Record not found" });
      }

      const updated = await storage.updateDsRecord(req.params.id, { [field]: value });
      res.json(updated);
    } catch (error) {
      console.error("Error updating record:", error);
      res.status(500).json({ message: "Failed to update record" });
    }
  });

  app.post("/api/data-sources/:slug/records/delete-batch", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "At least one ID is required" });
      }

      let deleted = 0;
      for (const id of ids) {
        if (await storage.deleteDsRecord(id)) deleted++;
      }
      res.json({ deleted });
    } catch (error: any) {
      console.error("Failed to delete records:", error);
      res.status(500).json({ message: "Failed to delete records" });
    }
  });

  app.delete("/api/data-sources/:slug/records/all", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });
      const result = await db.delete(dsRecords).where(eq(dsRecords.dataSourceId, ds.id));
      await db.update(dataSources).set({ recordCount: 0 }).where(eq(dataSources.id, ds.id));
      res.json({ deleted: result.rowCount ?? 0 });
    } catch (error: any) {
      console.error("Failed to clear records:", error);
      res.status(500).json({ message: "Failed to clear records" });
    }
  });

  app.post("/api/data-sources/:slug/records/clear-all", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });
      const result = await db.delete(dsRecords).where(eq(dsRecords.dataSourceId, ds.id));
      await db.update(dataSources).set({ recordCount: 0 }).where(eq(dataSources.id, ds.id));
      res.json({ deleted: result.rowCount ?? 0 });
    } catch (error: any) {
      console.error("Failed to clear records:", error);
      res.status(500).json({ message: "Failed to clear records" });
    }
  });

  app.patch("/api/data-sources/:slug/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const ds = await storage.getDataSourceBySlug(req.params.slug);
      if (!ds) return res.status(404).json({ message: "Data source not found" });

      const { deduplicateKey, columns } = req.body;
      const update: any = {};
      if (deduplicateKey !== undefined) update.deduplicateKey = deduplicateKey;
      if (columns !== undefined) update.columns = columns;

      const updated = await storage.updateDataSource(ds.id, update);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // ==================== Collaboration Blueprints Routes ====================
  
  // Get all blueprints
  app.get("/api/blueprints", isAuthenticated, async (req, res) => {
    try {
      const blueprints = await storage.getAllBlueprints();
      res.json(blueprints);
    } catch (error) {
      console.error("Error fetching blueprints:", error);
      res.status(500).json({ message: "Failed to fetch blueprints" });
    }
  });

  // Get blueprint by section name
  app.get("/api/blueprints/section/:sectionName", isAuthenticated, async (req, res) => {
    try {
      const blueprint = await storage.getBlueprintBySectionName(req.params.sectionName);
      if (!blueprint) {
        return res.status(404).json({ message: "Blueprint not found" });
      }
      res.json(blueprint);
    } catch (error) {
      console.error("Error fetching blueprint:", error);
      res.status(500).json({ message: "Failed to fetch blueprint" });
    }
  });

  // Get single blueprint
  app.get("/api/blueprints/:id", isAuthenticated, async (req, res) => {
    try {
      const blueprint = await storage.getBlueprint(req.params.id);
      if (!blueprint) {
        return res.status(404).json({ message: "Blueprint not found" });
      }
      res.json(blueprint);
    } catch (error) {
      console.error("Error fetching blueprint:", error);
      res.status(500).json({ message: "Failed to fetch blueprint" });
    }
  });

  // Create blueprint
  app.post("/api/blueprints", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertBlueprintSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid blueprint data", errors: parsed.error.errors });
      }
      const blueprint = await storage.createBlueprint(parsed.data);
      res.status(201).json(blueprint);
    } catch (error) {
      console.error("Error creating blueprint:", error);
      res.status(500).json({ message: "Failed to create blueprint" });
    }
  });

  // Update blueprint
  app.patch("/api/blueprints/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const existing = await storage.getBlueprint(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Blueprint not found" });
      }
      const bpParsed = insertBlueprintSchema.partial().safeParse(req.body);
      if (!bpParsed.success) {
        return res.status(400).json({ message: "Invalid blueprint data", errors: bpParsed.error.errors });
      }
      const blueprint = await storage.updateBlueprint(req.params.id, bpParsed.data);
      res.json(blueprint);
    } catch (error) {
      console.error("Error updating blueprint:", error);
      res.status(500).json({ message: "Failed to update blueprint" });
    }
  });

  // Delete blueprint
  app.delete("/api/blueprints/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const existing = await storage.getBlueprint(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Blueprint not found" });
      }
      await storage.deleteBlueprint(req.params.id);
      res.json({ message: "Blueprint deleted successfully" });
    } catch (error) {
      console.error("Error deleting blueprint:", error);
      res.status(500).json({ message: "Failed to delete blueprint" });
    }
  });

  // ========================
  // Project Tags API Routes
  // ========================
  
  app.get("/api/project-tags", isAuthenticated, async (req, res) => {
    try {
      const tags = await storage.getAllProjectTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project tags" });
    }
  });

  app.post("/api/project-tags", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, color } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }
      const tag = await storage.createProjectTag({ name, color });
      res.status(201).json(tag);
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(400).json({ message: "Tag with this name already exists" });
      }
      res.status(500).json({ message: "Failed to create project tag" });
    }
  });

  app.patch("/api/project-tags/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, color } = req.body;
      const tag = await storage.updateProjectTag(id, { name, color });
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project tag" });
    }
  });

  app.delete("/api/project-tags/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProjectTag(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project tag" });
    }
  });

  // ========================
  // Sprints API Routes
  // ========================

  // Get all sprints
  app.get("/api/sprints", isAuthenticated, async (req, res) => {
    try {
      const sprints = await storage.getAllSprints();
      res.json(sprints);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      res.status(500).json({ message: "Failed to fetch sprints" });
    }
  });

  // Get active sprint
  app.get("/api/sprints/active", isAuthenticated, async (req, res) => {
    try {
      const sprint = await storage.getActiveSprint();
      res.json(sprint || null);
    } catch (error) {
      console.error("Error fetching active sprint:", error);
      res.status(500).json({ message: "Failed to fetch active sprint" });
    }
  });

  // Create sprint
  app.post("/api/sprints", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      if (managedUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const sprint = await storage.createSprint(req.body);
      res.status(201).json(sprint);
    } catch (error) {
      console.error("Error creating sprint:", error);
      res.status(500).json({ message: "Failed to create sprint" });
    }
  });

  // Update sprint
  app.patch("/api/sprints/:id", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      if (managedUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const sprint = await storage.updateSprint(req.params.id, req.body);
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      res.json(sprint);
    } catch (error) {
      console.error("Error updating sprint:", error);
      res.status(500).json({ message: "Failed to update sprint" });
    }
  });

  // Delete sprint
  app.delete("/api/sprints/:id", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      if (managedUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deleteSprint(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting sprint:", error);
      res.status(500).json({ message: "Failed to delete sprint" });
    }
  });

  // Close sprint (archives completed tasks)
  app.post("/api/sprints/:id/close", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      if (managedUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const result = await storage.closeSprint(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Sprint not found" });
      }
      res.json({ 
        success: true, 
        sprint: result.sprint, 
        archivedCount: result.archivedCount,
        message: `Sprint closed. ${result.archivedCount} completed tasks archived.`
      });
    } catch (error) {
      console.error("Error closing sprint:", error);
      res.status(500).json({ message: "Failed to close sprint" });
    }
  });

  // ========================
  // Spaces API Routes
  // ========================

  app.get("/api/spaces", isAuthenticated, async (req, res) => {
    try {
      const spacesList = await storage.getAllSpaces();
      res.json(spacesList);
    } catch (error) {
      console.error("Error fetching spaces:", error);
      res.status(500).json({ message: "Failed to fetch spaces" });
    }
  });

  app.get("/api/spaces/hierarchy", isAuthenticated, async (req, res) => {
    try {
      const viewType = req.query.viewType as string | undefined;
      const currentUser = (req as any).managedUser;
      const hierarchy = await storage.getSpacesWithHierarchy(viewType, currentUser?.id);
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch hierarchy" });
    }
  });

  app.post("/api/spaces", isAuthenticated, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser;
      const data = insertSpaceSchema.parse({ ...req.body, ownerId: currentUser.id });
      const space = await storage.createSpace(data);
      res.status(201).json(space);
    } catch (error) {
      console.error("Error creating space:", error);
      res.status(500).json({ message: "Failed to create space" });
    }
  });

  app.patch("/api/spaces/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser;
      const space = await storage.getSpace(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      const isOwner = space.ownerId === currentUser.id;
      const isAdminUser = currentUser.role === "admin" || currentUser.role === "superadmin";
      if (!isOwner && !isAdminUser) return res.status(403).json({ message: "Forbidden" });
      const updated = await storage.updateSpace(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating space:", error);
      res.status(500).json({ message: "Failed to update space" });
    }
  });

  app.delete("/api/spaces/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser;
      const space = await storage.getSpace(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      const isOwner = space.ownerId === currentUser.id;
      const isAdminUser = currentUser.role === "admin" || currentUser.role === "superadmin";
      if (!isOwner && !isAdminUser) return res.status(403).json({ message: "Forbidden" });
      const deleted = await storage.deleteSpace(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Space not found" });
      res.json({ message: "Space deleted" });
    } catch (error) {
      console.error("Error deleting space:", error);
      res.status(500).json({ message: "Failed to delete space" });
    }
  });

  // Space members endpoints
  app.get("/api/spaces/:id/members", isAuthenticated, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser;
      const space = await storage.getSpace(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      const isOwner = space.ownerId === currentUser.id;
      const isAdminUser = currentUser.role === "admin" || currentUser.role === "superadmin";
      const isMember = !isOwner && !isAdminUser ? await storage.isSpaceMember(req.params.id, currentUser.id) : false;
      if (!isOwner && !isAdminUser && !isMember) return res.status(403).json({ message: "Forbidden" });
      const members = await storage.getSpaceMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching space members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/spaces/:id/members", isAuthenticated, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser;
      const space = await storage.getSpace(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      const isOwner = space.ownerId === currentUser.id;
      const isAdminUser = currentUser.role === "admin" || currentUser.role === "superadmin";
      if (!isOwner && !isAdminUser) return res.status(403).json({ message: "Forbidden" });
      const parsed = z.object({ userId: z.string().min(1) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "userId is required" });
      const { userId } = parsed.data;
      if (userId === space.ownerId) return res.status(400).json({ message: "Owner is already the creator" });
      const targetUser = await storage.getManagedUser(userId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      const member = await storage.addSpaceMember(req.params.id, userId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding space member:", error);
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  app.delete("/api/spaces/:id/members/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUser = (req as any).managedUser;
      const space = await storage.getSpace(req.params.id);
      if (!space) return res.status(404).json({ message: "Space not found" });
      const isOwner = space.ownerId === currentUser.id;
      const isAdminUser = currentUser.role === "admin" || currentUser.role === "superadmin";
      if (!isOwner && !isAdminUser) return res.status(403).json({ message: "Forbidden" });
      await storage.removeSpaceMember(req.params.id, req.params.userId);
      res.json({ message: "Member removed" });
    } catch (error) {
      console.error("Error removing space member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // ========================
  // Project Groups API Routes
  // ========================

  app.get("/api/project-groups", isAuthenticated, async (req, res) => {
    try {
      const { spaceId } = req.query;
      const groups = await storage.getAllProjectGroups(spaceId as string | undefined);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching project groups:", error);
      res.status(500).json({ message: "Failed to fetch project groups" });
    }
  });

  app.post("/api/project-groups", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const data = insertProjectGroupSchema.parse({
        ...req.body,
        createdBy: managedUser.id,
      });
      const group = await storage.createProjectGroup(data);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating project group:", error);
      res.status(500).json({ message: "Failed to create project group" });
    }
  });

  app.patch("/api/project-groups/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const group = await storage.updateProjectGroup(req.params.id, req.body);
      if (!group) return res.status(404).json({ message: "Project group not found" });
      res.json(group);
    } catch (error) {
      console.error("Error updating project group:", error);
      res.status(500).json({ message: "Failed to update project group" });
    }
  });

  app.delete("/api/project-groups/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteProjectGroup(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Project group not found" });
      res.json({ message: "Project group deleted" });
    } catch (error) {
      console.error("Error deleting project group:", error);
      res.status(500).json({ message: "Failed to delete project group" });
    }
  });

  // ========================
  // Projects API Routes
  // ========================
  
  // Get all projects
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const { status, mine } = req.query;
      const managedUser = (req as any).managedUser as ManagedUser;
      
      let projectList;
      if (mine === "true" && managedUser) {
        projectList = await storage.getProjectsByUser(managedUser.id);
      } else {
        projectList = await storage.getAllProjects({ 
          status: status as string | undefined 
        });
      }
      
      // Fetch assignments with user data for each project
      const projectsWithAssignments = await Promise.all(
        projectList.map(async (project) => {
          const assignments = await storage.getProjectAssignments(project.id);
          const assignmentsWithUsers = await Promise.all(
            assignments.map(async (assignment) => {
              const user = await storage.getManagedUser(assignment.userId);
              return { ...assignment, user };
            })
          );
          const ownerUser = project.ownerUserId ? await storage.getManagedUser(project.ownerUserId) : null;
          const createdByUser = project.createdBy ? await storage.getManagedUser(project.createdBy) : null;
          return { ...project, assignments: assignmentsWithUsers, ownerUser, createdByUser };
        })
      );
      
      res.json(projectsWithAssignments);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project by ID with full details
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProjectWithAssignments(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create new project
  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      
      // Normalize empty strings to null for date fields
      const bodyData = { ...req.body };
      if (bodyData.startDate === "") bodyData.startDate = null;
      if (bodyData.deadline === "") bodyData.deadline = null;
      // Default owner to creator if not specified
      if (!bodyData.ownerUserId) bodyData.ownerUserId = managedUser.id;
      
      const data = insertProjectSchema.parse({
        ...bodyData,
        createdBy: managedUser.id
      });
      const project = await storage.createProject(data);
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      
      // Others role cannot edit projects
      if (managedUser.role === "others") {
        return res.status(403).json({ message: "Insufficient permissions to edit projects" });
      }
      
      const existing = await storage.getProject(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is owner, admin/superadmin, or assigned to project
      const assignments = await storage.getProjectAssignments(req.params.id);
      const isOwner = assignments.some(a => a.userId === managedUser.id && a.role === "owner");
      const isAdminRole = managedUser.role === "admin" || managedUser.role === "superadmin";
      const isAssigned = assignments.some(a => a.userId === managedUser.id);
      
      if (!isOwner && !isAdminRole && !isAssigned) {
        return res.status(403).json({ message: "You don't have permission to update this project" });
      }
      
      // Normalize empty strings to null for date fields
      const data = { ...req.body };
      if (data.startDate === "") data.startDate = null;
      if (data.deadline === "") data.deadline = null;
      
      const updated = await storage.updateProject(req.params.id, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const existing = await storage.getProject(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Project not found" });
      }
      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Add assignment to project
  app.post("/api/projects/:id/assignments", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      
      // Check if user can assign (must be owner, admin, or already assigned)
      const assignments = await storage.getProjectAssignments(req.params.id);
      const isOwner = assignments.some(a => a.userId === managedUser.id && a.role === "owner");
      const isAdmin = managedUser.role === "admin";
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Only project owners or admins can assign users" });
      }
      
      const data = insertProjectAssignmentSchema.parse({
        ...req.body,
        projectId: req.params.id,
        assignedBy: managedUser.id
      });
      const assignment = await storage.createProjectAssignment(data);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Remove assignment from project
  app.delete("/api/projects/:projectId/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      
      // Check if user can remove assignments (must be owner or admin)
      const assignments = await storage.getProjectAssignments(req.params.projectId);
      const isOwner = assignments.some(a => a.userId === managedUser.id && a.role === "owner");
      const isAdmin = managedUser.role === "admin";
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Only project owners or admins can remove assignments" });
      }
      
      await storage.deleteProjectAssignment(req.params.id);
      res.json({ message: "Assignment removed successfully" });
    } catch (error) {
      console.error("Error removing assignment:", error);
      res.status(500).json({ message: "Failed to remove assignment" });
    }
  });

  // Get project comments
  app.get("/api/projects/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const comments = await storage.getProjectComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add comment to project
  app.post("/api/projects/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      
      // Others role cannot comment
      if (managedUser.role === "others") {
        return res.status(403).json({ message: "Insufficient permissions to add comments" });
      }
      
      const data = insertProjectCommentSchema.parse({
        ...req.body,
        projectId: req.params.id,
        userId: managedUser.id,
        userName: managedUser.firstName && managedUser.lastName 
          ? `${managedUser.firstName} ${managedUser.lastName}` 
          : managedUser.username
      });
      const comment = await storage.createProjectComment(data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Get all users (for assignment dropdown)
  app.get("/api/users/list", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllManagedUsers();
      const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ===== SECTION TEMPLATES (Admin only) =====

  app.get("/api/admin/section-templates", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const templates = await storage.getAllSectionTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching section templates:", error);
      res.status(500).json({ message: "Failed to fetch section templates" });
    }
  });

  app.post("/api/admin/section-templates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertSectionTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }
      const template = await storage.createSectionTemplate(parsed.data);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating section template:", error);
      res.status(500).json({ message: "Failed to create section template" });
    }
  });

  app.patch("/api/admin/section-templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertSectionTemplateSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }
      const template = await storage.updateSectionTemplate(req.params.id, parsed.data);
      if (!template) {
        return res.status(404).json({ message: "Section template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating section template:", error);
      res.status(500).json({ message: "Failed to update section template" });
    }
  });

  app.delete("/api/admin/section-templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteSectionTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Section template not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting section template:", error);
      res.status(500).json({ message: "Failed to delete section template" });
    }
  });

  // ===== PAGE SECTIONS =====

  app.get("/api/services/:serviceId/sections", isAuthenticated, async (req, res) => {
    try {
      const sections = await storage.getPageSectionsByService(req.params.serviceId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching page sections:", error);
      res.status(500).json({ message: "Failed to fetch page sections" });
    }
  });

  app.post("/api/admin/services/:serviceId/sections", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = { ...req.body, serviceId: req.params.serviceId };

      if (data.sectionTemplateId) {
        const template = await storage.getSectionTemplate(data.sectionTemplateId);
        if (template) {
          if (!data.icon && template.icon) {
            data.icon = template.icon;
          }
          if (!data.config && template.defaultConfig) {
            data.config = template.defaultConfig;
          }
        }
      }

      const parsed = insertPageSectionSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }
      const section = await storage.createPageSection(parsed.data);
      res.status(201).json(section);
    } catch (error) {
      console.error("Error creating page section:", error);
      res.status(500).json({ message: "Failed to create page section" });
    }
  });

  app.patch("/api/admin/sections/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = { ...req.body };

      if (data.sectionTemplateId) {
        const template = await storage.getSectionTemplate(data.sectionTemplateId);
        if (template) {
          if (!data.icon && template.icon) {
            data.icon = template.icon;
          }
          if (!data.config && template.defaultConfig) {
            data.config = template.defaultConfig;
          }
        }
      }

      const parsed = insertPageSectionSchema.partial().safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }
      const section = await storage.updatePageSection(req.params.id, parsed.data);
      if (!section) {
        return res.status(404).json({ message: "Page section not found" });
      }
      res.json(section);
    } catch (error) {
      console.error("Error updating page section:", error);
      res.status(500).json({ message: "Failed to update page section" });
    }
  });

  app.delete("/api/admin/sections/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deletePageSection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Page section not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting page section:", error);
      res.status(500).json({ message: "Failed to delete page section" });
    }
  });

  app.put("/api/admin/services/:serviceId/sections/reorder", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const schema = z.object({ sectionIds: z.array(z.string()) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }
      await storage.reorderPageSections(req.params.serviceId, parsed.data.sectionIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering page sections:", error);
      res.status(500).json({ message: "Failed to reorder page sections" });
    }
  });

  // Icon Library endpoints
  app.get("/api/icons", isAuthenticated, async (_req, res) => {
    try {
      const icons = await storage.getAllIcons();
      res.json(icons);
    } catch (error) {
      console.error("Error fetching icons:", error);
      res.status(500).json({ message: "Failed to fetch icons" });
    }
  });

  app.post("/api/admin/icons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, label, category, description } = req.body;
      if (!name || !label) {
        return res.status(400).json({ message: "Name and label are required" });
      }
      const existing = await storage.getIconByName(name);
      if (existing) {
        return res.status(409).json({ message: "An icon with this name already exists in the library" });
      }
      const icon = await storage.createIcon({
        name,
        label,
        category: category || "custom",
        description: description || null,
        isCustom: true,
      });
      res.status(201).json(icon);
    } catch (error) {
      console.error("Error creating icon:", error);
      res.status(500).json({ message: "Failed to create icon" });
    }
  });

  app.delete("/api/admin/icons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteIcon(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Icon not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting icon:", error);
      res.status(500).json({ message: "Failed to delete icon" });
    }
  });

  // ========== Requisitions API Routes ==========

  app.get("/api/requisitions", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      res.json(await storage.getAllRequisitions({ search, status }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisitions/:id", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const r = await storage.getRequisition(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/requisitions", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const { attachments, ...data } = req.body;
      const parsed = insertRequisitionSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Invalid requisition data", errors: parsed.error.flatten() });

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxFileSize = 10 * 1024 * 1024;
      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          if (!allowedTypes.includes(att.fileType)) return res.status(400).json({ message: `Invalid file type: ${att.fileType}. Allowed: JPG, PNG, PDF` });
          if (att.fileSize > maxFileSize) return res.status(400).json({ message: `File too large: ${att.filename}. Maximum 10MB per file.` });
        }
      }

      const requisition = await storage.createRequisition(parsed.data);
      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          await storage.createRequisitionAttachment({
            requisitionId: requisition.id,
            filename: att.filename,
            fileType: att.fileType,
            fileSize: att.fileSize,
            fileData: att.fileData,
          });
        }
      }
      res.json(requisition);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  const updateRequisitionSchema = z.object({
    status: z.enum(["Submitted", "Awaiting Approval", "PO Created", "Rejected"]).optional(),
    requestTitle: z.string().optional(),
    department: z.string().optional(),
    description: z.string().optional(),
    justification: z.string().optional(),
  });

  app.patch("/api/requisitions/:id", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      if (managedUser.role !== "admin" && managedUser.role !== "superadmin") {
        return res.status(403).json({ message: "Only administrators can update requisitions" });
      }
      const parsed = updateRequisitionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
      const r = await storage.updateRequisition(req.params.id, parsed.data);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/requisitions/:id", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const ok = await storage.deleteRequisition(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisitions/:id/attachments", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      res.json(await storage.getRequisitionAttachments(req.params.id));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisition-attachments/:id/download", isAuthenticated, async (req, res) => {
    try {
      const att = await storage.getRequisitionAttachmentById(req.params.id);
      if (!att) return res.status(404).json({ message: "Not found" });
      const base64Data = att.fileData.includes(",") ? att.fileData.split(",")[1] : att.fileData;
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", att.fileType);
      res.setHeader("Content-Disposition", `attachment; filename="${att.filename}"`);
      res.setHeader("Content-Length", buffer.length.toString());
      res.send(buffer);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ========== StableMaster API Routes ==========

  // Facilities
  // Stables
  app.get("/api/sm/stables", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmStables()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/stables", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmStableSchema.parse(req.body);
      res.json(await storage.createSmStable(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/stables/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmStableSchema.partial().parse(req.body);
      const r = await storage.updateSmStable(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/stables/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmStable(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Boxes
  app.get("/api/sm/boxes", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try { res.json(await storage.getSmBoxes(req.query.stableId as string | undefined)); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/boxes", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmBoxSchema.parse(req.body);
      res.json(await storage.createSmBox(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/boxes/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmBoxSchema.partial().parse(req.body);
      const r = await storage.updateSmBox(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/boxes/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmBox(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/sm/boxes/generate", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const { stableId, prefix, count, boxType } = req.body;
      if (!stableId || !prefix || !count) return res.status(400).json({ message: "stableId, prefix, and count are required" });
      const c = parseInt(count, 10);
      if (isNaN(c) || c < 1 || c > 100) return res.status(400).json({ message: "count must be between 1 and 100" });
      const boxes = await storage.generateSmBoxes({ stableId, prefix, count: c, boxType: boxType || "STALL" });
      res.json(boxes);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Horses
  app.get("/api/sm/horses", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmHorses()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/horses", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmHorseSchema.parse(req.body);
      res.json(await storage.createSmHorse(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/horses/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmHorseSchema.partial().parse(req.body);
      const r = await storage.updateSmHorse(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/horses/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmHorse(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/sm/horses/import/preview", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), isSuperAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      if (!validateFileExtension(req.file.originalname)) {
        return res.status(400).json({ message: "Invalid file type. Please upload .xlsx, .xls, or .csv" });
      }
      const rows = await parseExcelFile(req.file.buffer, req.file.originalname);
      const columns = Object.keys(rows[0]);
      const preview = rows.slice(0, 5).map(row => {
        const obj: Record<string, string> = {};
        for (const col of columns) obj[col] = String(row[col] ?? "");
        return obj;
      });
      const fileBase64 = req.file.buffer.toString("base64");
      res.json({ columns, preview, totalRows: rows.length, fileData: fileBase64 });
    } catch (error: any) {
      console.error("Error previewing horse import:", error);
      res.status(400).json({ message: error.message || "Failed to parse file" });
    }
  });

  app.post("/api/sm/horses/import", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), isSuperAdmin, async (req, res) => {
    try {
      const { fileData, mapping } = req.body;
      if (!fileData || typeof fileData !== "string") {
        return res.status(400).json({ message: "File data is required" });
      }
      if (!mapping || typeof mapping !== "object") {
        return res.status(400).json({ message: "Column mapping is required" });
      }
      if (!mapping.name) {
        return res.status(400).json({ message: "Horse name mapping is required" });
      }
      const buffer = Buffer.from(fileData, "base64");
      const rows = await parseExcelFile(buffer);

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      const skipReasons: Record<string, number> = { empty_row: 0, duplicate_name: 0, error: 0 };

      const existingHorses = await storage.getSmHorses();
      const existingNames = new Set(existingHorses.map(h => h.name.toLowerCase().trim()));

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = mapping.name ? String(row[mapping.name] ?? "").trim() : "";
        const color = mapping.color ? String(row[mapping.color] ?? "").trim() : "";
        const sex = mapping.sex ? String(row[mapping.sex] ?? "").trim().toUpperCase() : "";
        const dob = mapping.dob ? String(row[mapping.dob] ?? "").trim() : "";
        const remarks = mapping.remarks ? String(row[mapping.remarks] ?? "").trim() : "";
        const status = mapping.status ? String(row[mapping.status] ?? "").trim().toUpperCase() : "ACTIVE";

        if (!name) {
          skipped++;
          skipReasons.empty_row++;
          errors.push(`Row ${i + 2}: skipped - no horse name`);
          continue;
        }

        if (existingNames.has(name.toLowerCase().trim())) {
          skipped++;
          skipReasons.duplicate_name++;
          errors.push(`Row ${i + 2}: "${name}" skipped - horse name already exists`);
          continue;
        }

        try {
          const validSex = ["STALLION", "MARE", "GELDING", "COLT", "FILLY"].includes(sex) ? sex : null;
          const validStatus = ["ACTIVE", "INACTIVE", "RETIRED"].includes(status) ? status : "ACTIVE";

          let parsedDob: string | null = null;
          if (dob) {
            const d = new Date(dob);
            if (!isNaN(d.getTime())) {
              parsedDob = d.toISOString().split("T")[0];
            }
          }

          await storage.createSmHorse({
            name,
            color: color || null,
            sex: validSex,
            dob: parsedDob,
            remarks: remarks || null,
            status: validStatus,
          });
          imported++;
          existingNames.add(name.toLowerCase().trim());
        } catch (err: any) {
          skipped++;
          skipReasons.error++;
          errors.push(`Row ${i + 2}: "${name}" failed - ${err.message || "unknown error"}`);
        }
      }

      res.json({ imported, skipped, totalRows: rows.length, errors: errors.slice(0, 50), skipReasons });
    } catch (error: any) {
      console.error("Error importing horses:", error);
      res.status(500).json({ message: "Failed to import horses: " + (error.message || "Unknown error") });
    }
  });

  // SM Customers
  app.get("/api/sm/customers", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmCustomers()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/customers", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmCustomerSchema.parse(req.body);
      res.json(await storage.createSmCustomer(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/customers/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmCustomerSchema.partial().parse(req.body);
      const r = await storage.updateSmCustomer(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/customers/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmCustomer(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Items & Services
  app.get("/api/sm/item-services", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmItemServices()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/item-services", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmItemServiceSchema.parse(req.body);
      res.json(await storage.createSmItemService(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/item-services/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmItemServiceSchema.partial().parse(req.body);
      const r = await storage.updateSmItemService(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/item-services/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmItemService(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/sm/item-services/import/preview", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), isSuperAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      if (!validateFileExtension(req.file.originalname)) {
        return res.status(400).json({ message: "Invalid file type. Please upload .xlsx, .xls, or .csv" });
      }
      const rows = await parseExcelFile(req.file.buffer, req.file.originalname);
      const columns = Object.keys(rows[0]);
      const preview = rows.slice(0, 5).map(row => {
        const obj: Record<string, string> = {};
        for (const col of columns) obj[col] = String(row[col] ?? "");
        return obj;
      });
      const fileBase64 = req.file.buffer.toString("base64");
      res.json({ columns, preview, totalRows: rows.length, fileData: fileBase64 });
    } catch (error: any) {
      console.error("Error previewing item import:", error);
      res.status(400).json({ message: error.message || "Failed to parse file" });
    }
  });

  app.post("/api/sm/item-services/import", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), isSuperAdmin, async (req, res) => {
    try {
      const { fileData, mapping } = req.body;
      if (!fileData || typeof fileData !== "string") {
        return res.status(400).json({ message: "File data is required" });
      }
      if (!mapping || typeof mapping !== "object") {
        return res.status(400).json({ message: "Column mapping is required" });
      }
      if (!mapping.name) {
        return res.status(400).json({ message: "Item name mapping is required" });
      }
      const buffer = Buffer.from(fileData, "base64");
      const rows = await parseExcelFile(buffer);

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      const skipReasons: Record<string, number> = { empty_row: 0, duplicate_name: 0, error: 0 };

      const existingItems = await storage.getSmItemServices();
      const existingNames = new Set(existingItems.map(i => i.name.toLowerCase().trim()));

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = mapping.name ? String(row[mapping.name] ?? "").trim() : "";
        const category = mapping.category ? String(row[mapping.category] ?? "").trim().toUpperCase() : "SERVICE";
        const defaultUnit = mapping.defaultUnit ? String(row[mapping.defaultUnit] ?? "").trim() : "EA";
        const unitPriceRaw = mapping.unitPrice ? String(row[mapping.unitPrice] ?? "").trim() : "0";
        const isActiveRaw = mapping.isActive ? String(row[mapping.isActive] ?? "").trim().toLowerCase() : "true";

        if (!name) {
          skipped++;
          skipReasons.empty_row++;
          errors.push(`Row ${i + 2}: skipped - no item name`);
          continue;
        }

        if (existingNames.has(name.toLowerCase().trim())) {
          skipped++;
          skipReasons.duplicate_name++;
          errors.push(`Row ${i + 2}: "${name}" skipped - item name already exists`);
          continue;
        }

        try {
          const validCategory = ["SERVICE", "ITEM"].includes(category) ? category : "SERVICE";
          const priceNum = parseFloat(unitPriceRaw.replace(/[^0-9.]/g, ""));
          const unitPrice = !isNaN(priceNum) ? Math.round(priceNum * 100) : 0;
          const isActive = !["false", "no", "0", "inactive"].includes(isActiveRaw);

          await storage.createSmItemService({
            name,
            category: validCategory,
            unitOptions: [defaultUnit || "EA"],
            defaultUnit: defaultUnit || "EA",
            unitPrice,
            isActive,
          });
          imported++;
          existingNames.add(name.toLowerCase().trim());
        } catch (err: any) {
          skipped++;
          skipReasons.error++;
          errors.push(`Row ${i + 2}: "${name}" failed - ${err.message || "unknown error"}`);
        }
      }

      res.json({ imported, skipped, totalRows: rows.length, errors: errors.slice(0, 50), skipReasons });
    } catch (error: any) {
      console.error("Error importing items:", error);
      res.status(500).json({ message: "Failed to import items: " + (error.message || "Unknown error") });
    }
  });

  // Billing Elements
  app.get("/api/sm/billing-elements", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const unbilledOnly = req.query.unbilledOnly === "true";
      res.json(await storage.getSmBillingElements({ unbilledOnly, limit }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/sm/billing-elements/enriched", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const billed = req.query.billed !== undefined ? req.query.billed === "true" : undefined;
      res.json(await storage.getSmBillingElementsEnriched(billed));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/sm/horses-with-agreements", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmHorsesWithActiveAgreements()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/billing-elements", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      if (req.body.transactionDate && !req.body.billingMonth) {
        req.body.billingMonth = req.body.transactionDate.substring(0, 7);
      }
      const parsed = insertSmBillingElementSchema.parse(req.body);
      res.json(await storage.createSmBillingElement(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/billing-elements/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmBillingElementSchema.partial().parse(req.body);
      const r = await storage.updateSmBillingElement(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/billing-elements/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmBillingElement(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/sm/reports/livery", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const groupBy = (req.query.groupBy as string) || "month";
      const data = await storage.getSmReportData(groupBy);
      res.json(data);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/sm/billing-elements/mark-billed", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids array is required" });
      await storage.markSmBillingElementsBilled(ids);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Livery Packages
  app.get("/api/sm/livery-packages", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmLiveryPackages()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/livery-packages", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmLiveryPackageSchema.parse(req.body);
      res.json(await storage.createSmLiveryPackage(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/livery-packages/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmLiveryPackageSchema.partial().parse(req.body);
      const r = await storage.updateSmLiveryPackage(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/livery-packages/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmLiveryPackage(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Livery Agreements
  app.get("/api/sm/livery-agreements", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmLiveryAgreements()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/livery-agreements", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmLiveryAgreementSchema.parse(req.body);
      res.json(await storage.createSmLiveryAgreement(parsed));
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.patch("/api/sm/livery-agreements/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const parsed = insertSmLiveryAgreementSchema.partial().parse(req.body);
      const r = await storage.updateSmLiveryAgreement(req.params.id, parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/livery-agreements/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmLiveryAgreement(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Invoices
  app.get("/api/sm/invoices", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try { res.json(await storage.getSmInvoices()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/sm/invoices", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const { invoice, lines, billingElementIds } = req.body;
      const parsedInvoice = insertSmInvoiceSchema.parse(invoice);
      const created = await storage.createSmInvoice(parsedInvoice);
      for (const line of lines) {
        await storage.createSmInvoiceLine({ ...line, invoiceId: created.id });
      }
      if (Array.isArray(billingElementIds)) {
        for (const beId of billingElementIds) {
          await storage.updateSmBillingElement(beId, { billed: true, invoiceId: created.id });
        }
      }
      res.json(created);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ message: "Validation failed", errors: e.errors });
      res.status(500).json({ message: e.message });
    }
  });
  app.delete("/api/sm/invoices/:id", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try {
      const ok = await storage.deleteSmInvoice(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/sm/invoices/:id/lines", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (req, res) => {
    try { res.json(await storage.getSmInvoiceLines(req.params.id)); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Reset StableMaster data
  app.post("/api/sm/reset-demo-data", isAuthenticated, checkSubmoduleAccess("equestrian", "stable-assets"), async (_req, res) => {
    try {
      const { db } = await import("./db");
      const { smBillingElements, smLiveryAgreements, smInvoiceLines, smInvoices, smBoxes, smStables, smHorses, smCustomers, smItemServices, smLiveryPackages } = await import("@shared/schema");
      await db.delete(smInvoiceLines);
      await db.delete(smInvoices);
      await db.delete(smBillingElements);
      await db.delete(smLiveryAgreements);
      await db.delete(smBoxes);
      await db.delete(smStables);
      await db.delete(smHorses);
      await db.delete(smCustomers);
      await db.delete(smLiveryPackages);
      await db.delete(smItemServices);
      const { seedStableMasterData } = await import("./seedServices");
      await seedStableMasterData();
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/admin/cleanup-all-data", isAuthenticated, isAdmin, async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Data cleanup is disabled in production" });
    }

    const { confirmation } = req.body;
    if (confirmation !== "DELETE_ALL_DATA") {
      return res.status(400).json({ message: "Confirmation string required: DELETE_ALL_DATA" });
    }

    try {
      const user = (req as any).managedUser as ManagedUser;

      await storage.createAuditLog({
        action: "full_data_cleanup",
        category: "admin",
        userId: user.id,
        userEmail: user.email,
        details: { warning: "All data wiped" },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
        status: "success",
      });

      await db.execute(sql`DELETE FROM project_assignments`);
      await db.execute(sql`DELETE FROM project_comments`);
      await db.execute(sql`DELETE FROM project_tags`);
      await db.execute(sql`DELETE FROM projects`);
      await db.execute(sql`DELETE FROM project_groups`);
      await db.execute(sql`DELETE FROM sprints`);
      await db.execute(sql`DELETE FROM ticket_comments`);
      await db.execute(sql`DELETE FROM tickets`);
      await db.execute(sql`DELETE FROM customer_profiles`);
      await db.execute(sql`DELETE FROM customers`);
      await db.execute(sql`DELETE FROM collaboration_blueprints`);
      await db.execute(sql`DELETE FROM faq_entries`);
      await db.execute(sql`DELETE FROM user_manuals`);
      res.json({ success: true, message: "All data cleaned up" });
    } catch (error) {
      console.error("Error cleaning up data:", error);
      res.status(500).json({ message: "Failed to clean up data" });
    }
  });

  const cors = (await import("cors")).default;
  const rateLimit = (await import("express-rate-limit")).default;

  const ssoAllowedOrigins = process.env.SSO_ALLOWED_ORIGINS
    ? process.env.SSO_ALLOWED_ORIGINS.split(",").map(s => s.trim())
    : ["https://stable-master.replit.app"];

  const ssoVerifyCors = cors({
    origin: ssoAllowedOrigins,
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  });

  const ssoVerifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req: any, res: any) => {
      const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
      try { await storage.createSsoAuditLog({ userId: "unknown", ip: clientIp, action: "verify-token", success: false, details: "Rate limited" }); } catch {}
      res.status(429).json({ message: "Too many verification attempts, please try again later" });
    },
  });

  // SSO token endpoints
  const ssoGenerateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req: any) => req.session?.userId || "anonymous",
    message: { message: "Too many token generation attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, trustProxy: false },
    handler: async (req: any, res: any) => {
      const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
      try { await storage.createSsoAuditLog({ userId: req.session?.userId || "unknown", ip: clientIp, action: "generate-token", success: false, details: "Rate limited" }); } catch {}
      res.status(429).json({ message: "Too many token generation attempts, please try again later" });
    },
  });

  app.post("/api/sso/generate-token", isAuthenticated, ssoGenerateLimiter, async (req: any, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    try {
      const user = req.managedUser;
      if (!user) {
        await storage.createSsoAuditLog({ userId: req.session?.userId || "unknown", ip: clientIp, action: "generate-token", success: false, details: "User not found" });
        return res.status(401).json({ message: "User not found" });
      }
      const isSuperOrAdmin = user.role === "superadmin" || user.role === "admin";
      if (!isSuperOrAdmin) {
        const allowed = user.allowedSubmodules as Record<string, string[]> | null;
        const hasAccess = allowed && allowed["equestrian"] && (
          allowed["equestrian"].includes("stable-master") || allowed["equestrian"].includes("stable-assets")
        );
        if (!hasAccess) {
          await storage.createSsoAuditLog({ userId: req.session.userId, ip: clientIp, action: "generate-token", success: false, details: "No access to equestrian module" });
          return res.status(403).json({ message: "No access to equestrian module" });
        }
      }
      const crypto = await import("crypto");
      const token = crypto.randomBytes(64).toString("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await storage.createSsoToken(token, req.session.userId, expiresAt);
      const stableMasterUrl = (process.env.STABLE_MASTER_URL || "https://stable-master.replit.app").replace(/\/+$/, "");
      const url = `${stableMasterUrl}/sso?token=${token}`;
      await storage.createSsoAuditLog({ userId: req.session.userId, ip: clientIp, action: "generate-token", success: true });
      res.json({ url });
    } catch (e: any) {
      try { await storage.createSsoAuditLog({ userId: req.session?.userId || "unknown", ip: clientIp, action: "generate-token", success: false, details: e.message }); } catch {}
      res.status(500).json({ message: e.message });
    }
  });

  app.options("/api/sso/verify-token", ssoVerifyCors);
  app.post("/api/sso/verify-token", ssoVerifyCors, ssoVerifyLimiter, async (req, res) => {
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        await storage.createSsoAuditLog({ userId: "unknown", ip: clientIp, action: "verify-token", success: false, details: "Token is required or invalid type" });
        return res.status(400).json({ message: "Token is required" });
      }
      const result = await storage.validateAndConsumeSsoToken(token);
      if (!result) {
        await storage.createSsoAuditLog({ userId: "unknown", ip: clientIp, action: "verify-token", success: false, details: "Invalid, expired, or already used token" });
        return res.status(401).json({ message: "Invalid, expired, or already used token" });
      }
      const user = await storage.getManagedUser(result.userId);
      if (!user || !user.isActive) {
        await storage.createSsoAuditLog({ userId: result.userId, ip: clientIp, action: "verify-token", success: false, details: "User not found or inactive" });
        return res.status(401).json({ message: "User not found or inactive" });
      }
      await storage.createSsoAuditLog({ userId: result.userId, ip: clientIp, action: "verify-token", success: true });
      // NOTE for Stable Master consumer: After successful verification, call
      // history.replaceState(null, '', '/') to strip the SSO token from the
      // browser URL bar and prevent it from leaking via history or Referer header.
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (e: any) {
      try { await storage.createSsoAuditLog({ userId: "unknown", ip: clientIp, action: "verify-token", success: false, details: e.message }); } catch {}
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
