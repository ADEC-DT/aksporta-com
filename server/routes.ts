import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { insertManagedUserSchema, type NetSuiteData, type HRData, type LiveryData, type ManagedUser } from "@shared/schema";
import { z } from "zod";

// Extend Express Request to include user claims
declare global {
  namespace Express {
    interface User {
      claims?: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
      };
    }
  }
}

// Middleware to check if user is admin
const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const email = user.claims.email;
  if (!email) {
    return res.status(403).json({ message: "No email associated with account" });
  }

  // Check if user exists in managed users and has admin role
  let managedUser = await storage.getManagedUserByEmail(email);
  
  // If no managed user exists, create one (first user becomes admin)
  if (!managedUser) {
    const stats = await storage.getUserStats();
    const role = stats.totalUsers === 0 ? "admin" : "viewer";
    
    managedUser = await storage.createManagedUser({
      email,
      username: email.split("@")[0],
      firstName: user.claims.first_name || null,
      lastName: user.claims.last_name || null,
      role,
      isActive: true,
      lastActiveAt: new Date(),
    });
  } else {
    // Update last active
    await storage.updateManagedUser(managedUser.id, { lastActiveAt: new Date() });
  }

  // Store managed user in request for later use
  (req as any).managedUser = managedUser;

  if (managedUser.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};

// Middleware to ensure user is managed (and update last active)
const ensureManagedUser: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const email = user.claims.email;
  if (!email) {
    return res.status(403).json({ message: "No email associated with account" });
  }

  let managedUser = await storage.getManagedUserByEmail(email);
  
  if (!managedUser) {
    const stats = await storage.getUserStats();
    const role = stats.totalUsers === 0 ? "admin" : "viewer";
    
    managedUser = await storage.createManagedUser({
      email,
      username: email.split("@")[0],
      firstName: user.claims.first_name || null,
      lastName: user.claims.last_name || null,
      role,
      isActive: true,
      lastActiveAt: new Date(),
    });
  } else {
    await storage.updateManagedUser(managedUser.id, { lastActiveAt: new Date() });
  }

  (req as any).managedUser = managedUser;
  next();
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
  app.get("/api/netsuite", (_req, res) => {
    const data = generateNetSuiteData();
    res.json(data);
  });

  app.get("/api/hr", (_req, res) => {
    const data = generateHRData();
    res.json(data);
  });

  app.get("/api/livery", (_req, res) => {
    const data = generateLiveryData();
    res.json(data);
  });

  // Get current user's managed profile
  app.get("/api/me", isAuthenticated, ensureManagedUser, async (req, res) => {
    const managedUser = (req as any).managedUser as ManagedUser;
    res.json(managedUser);
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
      res.json(users);
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
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const createUserSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
  });

  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.errors });
      }

      // Check if email or username already exists
      const existingUser = await storage.getManagedUserByEmail(parsed.data.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const user = await storage.createManagedUser({
        ...parsed.data,
        isActive: true,
        lastActiveAt: null,
      });

      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  const updateUserSchema = z.object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(50).optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    role: z.enum(["admin", "editor", "viewer"]).optional(),
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

      // Prevent demoting yourself if you're the only admin
      if (currentUser.id === targetUser.id && parsed.data.role && parsed.data.role !== "admin") {
        const stats = await storage.getUserStats();
        const adminCount = stats.roleDistribution.find(r => r.role === "admin")?.count || 0;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the only admin" });
        }
      }

      const user = await storage.updateManagedUser(req.params.id, parsed.data);
      res.json(user);
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

      // Prevent deleting the only admin
      if (targetUser.role === "admin") {
        const stats = await storage.getUserStats();
        const adminCount = stats.roleDistribution.find(r => r.role === "admin")?.count || 0;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot delete the only admin" });
        }
      }

      await storage.deleteManagedUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  return httpServer;
}
