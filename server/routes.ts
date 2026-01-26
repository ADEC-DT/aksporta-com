import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { type NetSuiteData, type HRData, type LiveryData, type ManagedUser, insertCustomerSchema, insertCustomerProfileSchema, insertBlueprintSchema, insertProjectSchema, insertProjectAssignmentSchema, insertProjectCommentSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateSecret, verify, generateURI } from "otplib";
import * as QRCode from "qrcode";

// Middleware to check if user is admin
const isAdmin: RequestHandler = async (req, res, next) => {
  const managedUser = (req as any).managedUser as ManagedUser;
  
  if (!managedUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (managedUser.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

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
  app.get("/api/me", isAuthenticated, async (req, res) => {
    const managedUser = (req as any).managedUser as ManagedUser;
    const { password: _, ...userWithoutPassword } = managedUser;
    res.json(userWithoutPassword);
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
    password: z.string().min(4),
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

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  const updateUserSchema = z.object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(4).optional(),
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
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
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
    displayName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    firstName: z.string().max(50).optional().nullable(),
    lastName: z.string().max(50).optional().nullable(),
    profilePicture: z.string().url().optional().nullable(),
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

  // Password change
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(4),
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

  const validateConnectionString = (connStr: string): boolean => {
    // Basic validation for Azure SQL connection string format
    const requiredParts = ["Server=", "Database="];
    return requiredParts.every(part => connStr.includes(part));
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

      if (parsed.data.key.includes("azure") && parsed.data.key.includes("connection") && parsed.data.value) {
        if (!validateConnectionString(parsed.data.value)) {
          return res.status(400).json({ message: "Invalid Azure SQL connection string format. Must include Server= and Database=." });
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
          name: "Azure SQL",
          status: "healthy" as const,
          lastChecked: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 100) + 20,
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
        { category: "general", question: "What is the Data Integration Portal?", answer: "The Data Integration Portal is a centralized dashboard that brings together data from multiple business systems including NetSuite (financial data), HR (employee management), and Livery (delivery tracking) into one unified interface.", order: 1, isPublished: true },
        { category: "general", question: "How often is data synchronized?", answer: "Data is synchronized in near real-time. Each dashboard displays the last sync time in the header. Typically, data is refreshed every 5-15 minutes depending on the source system.", order: 2, isPublished: true },
        { category: "netsuite", question: "Why can't I see certain transactions?", answer: "Transaction visibility depends on your role permissions. Viewers can see summary data, Editors can see detailed transactions, and Admins have full access. Contact your administrator if you need expanded access.", order: 1, isPublished: true },
        { category: "netsuite", question: "How do I export financial data?", answer: "To export data, navigate to the NetSuite dashboard, use the filters to select your date range, then click the Export button in the top right corner. Data can be exported as CSV or Excel format.", order: 2, isPublished: true },
        { category: "hr", question: "Can I update employee information?", answer: "Employee information is read-only in this portal. To update employee records, please use the primary HR system directly or contact your HR administrator.", order: 1, isPublished: true },
        { category: "livery", question: "Why is a delivery showing as delayed?", answer: "Deliveries are marked as delayed when they exceed their estimated delivery time. The status is updated automatically based on driver GPS data and route calculations.", order: 1, isPublished: true },
        { category: "account", question: "How do I reset my password?", answer: "Go to Settings > Profile, then click 'Change Password'. You'll need to enter your current password and then your new password twice for confirmation.", order: 1, isPublished: true },
        { category: "account", question: "How do I enable Multi-Factor Authentication (MFA)?", answer: "Navigate to Settings > Security tab, then click 'Enable MFA'. You'll need an authenticator app like Google Authenticator or Authy to scan the QR code and complete setup.", order: 2, isPublished: true },
        { category: "troubleshooting", question: "The dashboard is loading slowly. What can I do?", answer: "Try refreshing the page, clearing your browser cache, or using a different browser. If issues persist, check your internet connection or submit a support ticket.", order: 1, isPublished: true },
        { category: "troubleshooting", question: "I'm seeing outdated data. How do I refresh?", answer: "Each dashboard has a refresh button near the sync status indicator. Click it to force a data refresh. If the issue persists, there may be a sync issue - please submit a support ticket.", order: 2, isPublished: true },
      ];
      for (const entry of faqEntries) {
        await storage.createFaqEntry(entry);
      }
      console.log("Seeded FAQ entries");
    }

    const existingManuals = await storage.getAllUserManuals();
    if (existingManuals.length === 0) {
      const manuals = [
        { category: "general", title: "Getting Started Guide", description: "Learn the basics of navigating the Data Integration Portal and accessing your dashboards.", content: "# Getting Started\n\nWelcome to the Data Integration Portal. This guide will help you get started with the system.\n\n## Logging In\n\n1. Navigate to the portal URL\n2. Enter your username and password\n3. Click 'Sign In'\n\n## Navigation\n\nUse the sidebar to navigate between different dashboards:\n- NetSuite: Financial data and transactions\n- HR: Employee information\n- Livery: Delivery tracking", order: 1, isPublished: true },
        { category: "netsuite", title: "NetSuite Dashboard Manual", description: "Complete guide to using the NetSuite financial dashboard including metrics, transactions, and reporting.", content: "# NetSuite Dashboard\n\n## Overview\n\nThe NetSuite dashboard provides real-time financial data including:\n- Revenue metrics\n- Transaction history\n- Customer information\n\n## Features\n\n### Metrics Cards\nTop-level KPIs showing current performance vs. previous periods.\n\n### Transaction Table\nSearchable, filterable list of all transactions.\n\n### Charts\nVisual representations of financial trends over time.", order: 1, isPublished: true },
        { category: "hr", title: "HR Dashboard Manual", description: "Guide to viewing employee data, department statistics, and organizational metrics.", content: "# HR Dashboard\n\n## Overview\n\nThe HR dashboard displays employee-related information:\n- Total employee count\n- Department breakdown\n- Leave status\n- Hiring metrics", order: 1, isPublished: true },
        { category: "livery", title: "Livery Tracking Manual", description: "How to track deliveries, monitor fleet performance, and understand delivery statuses.", content: "# Livery Tracking\n\n## Overview\n\nMonitor your delivery fleet in real-time:\n- Active deliveries\n- Driver locations\n- Delivery status updates\n\n## Status Codes\n\n- **In Transit**: Package is on the way\n- **Delivered**: Successfully delivered\n- **Delayed**: Behind schedule", order: 1, isPublished: true },
        { category: "account", title: "Account Security Guide", description: "Best practices for keeping your account secure including MFA setup and password management.", content: "# Account Security\n\n## Password Requirements\n\n- Minimum 8 characters\n- Mix of uppercase and lowercase\n- At least one number\n\n## Multi-Factor Authentication\n\nWe strongly recommend enabling MFA for added security. Go to Settings > Security to enable.", order: 1, isPublished: true },
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
  app.get("/api/help/faq", async (_req, res) => {
    try {
      const entries = await storage.getAllFaqEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching FAQ entries:", error);
      res.status(500).json({ message: "Failed to fetch FAQ entries" });
    }
  });

  // Get user manuals
  app.get("/api/help/manuals", async (_req, res) => {
    try {
      const manuals = await storage.getAllUserManuals();
      res.json(manuals);
    } catch (error) {
      console.error("Error fetching user manuals:", error);
      res.status(500).json({ message: "Failed to fetch user manuals" });
    }
  });

  // Get user manual by ID
  app.get("/api/help/manuals/:id", async (req, res) => {
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
    category: z.enum(["netsuite_sync", "ui_bug", "access_issue", "data_error", "performance", "other"]),
    severity: z.enum(["low", "medium", "high", "critical"]),
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

  // Get ticket by ID (user can only view their own, admin can view all)
  app.get("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Users can only view their own tickets, admins can view all
      if (ticket.userId !== user.id && user.role !== "admin") {
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
      if (ticket.userId !== user.id && user.role !== "admin") {
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
      if (ticket.userId !== user.id && user.role !== "admin") {
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
        userName: user.displayName || user.username,
        isAdmin: user.role === "admin",
        message: parsed.data.message,
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // ===== ADMIN TICKET MANAGEMENT =====

  // Get all tickets (admin only)
  app.get("/api/admin/tickets", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string | undefined;

      const result = await storage.getAllTickets({ limit, offset, status });
      res.json(result);
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Update ticket status (admin only)
  const updateTicketSchema = z.object({
    status: z.enum(["new", "in_progress", "resolved", "closed"]).optional(),
    assignedTo: z.string().optional(),
  });

  app.patch("/api/admin/tickets/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = (req as any).managedUser as ManagedUser;
      const ticket = await storage.getTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const parsed = updateTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      // Validate status transitions
      const statusOrder: Record<string, number> = {
        new: 0,
        in_progress: 1,
        resolved: 2,
        closed: 3,
      };
      
      if (parsed.data.status) {
        const currentOrder = statusOrder[ticket.status];
        const newOrder = statusOrder[parsed.data.status];
        
        // Allow reopening from resolved to in_progress, but not from closed
        if (ticket.status === "closed" && parsed.data.status !== "closed") {
          return res.status(400).json({ message: "Cannot reopen a closed ticket" });
        }
      }

      const updateData: any = { ...parsed.data };
      
      // Set resolved/closed timestamps
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

  // Customer DB API Routes
  
  // Get all customers with optional search and type filter
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const { search, type, limit, offset } = req.query;
      const result = await storage.getAllCustomers({
        search: search as string,
        type: type as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
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
        details: { customerId: customer.id, customerName: customer.name },
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
        details: { customerId: req.params.id, customerName: existing.name },
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
  app.post("/api/blueprints", isAuthenticated, async (req, res) => {
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
  app.patch("/api/blueprints/:id", isAuthenticated, async (req, res) => {
    try {
      const existing = await storage.getBlueprint(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Blueprint not found" });
      }
      const blueprint = await storage.updateBlueprint(req.params.id, req.body);
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
      
      // Fetch assignments for each project
      const projectsWithAssignments = await Promise.all(
        projectList.map(async (project) => {
          const assignments = await storage.getProjectAssignments(project.id);
          return { ...project, assignments };
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
      
      const data = insertProjectSchema.parse({
        ...bodyData,
        createdBy: managedUser.id
      });
      const project = await storage.createProject(data);
      
      // Auto-assign creator to the project
      await storage.createProjectAssignment({
        projectId: project.id,
        userId: managedUser.id,
        role: "owner",
        assignedBy: managedUser.id
      });
      
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
      
      // Viewers cannot edit projects
      if (managedUser.role === "viewer") {
        return res.status(403).json({ message: "Viewers cannot edit projects" });
      }
      
      const existing = await storage.getProject(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is owner, admin, or editor assigned to project
      const assignments = await storage.getProjectAssignments(req.params.id);
      const isOwner = assignments.some(a => a.userId === managedUser.id && a.role === "owner");
      const isAdmin = managedUser.role === "admin";
      const isEditor = managedUser.role === "editor";
      const isAssigned = assignments.some(a => a.userId === managedUser.id);
      
      if (!isOwner && !isAdmin && !(isEditor && isAssigned)) {
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
      
      // Viewers cannot comment
      if (managedUser.role === "viewer") {
        return res.status(403).json({ message: "Viewers cannot add comments" });
      }
      
      // Check if user is assigned to the project
      const assignments = await storage.getProjectAssignments(req.params.id);
      const isAssigned = assignments.some(a => a.userId === managedUser.id);
      const isAdmin = managedUser.role === "admin";
      
      if (!isAssigned && !isAdmin) {
        return res.status(403).json({ message: "Only assigned team members can comment" });
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

  return httpServer;
}
