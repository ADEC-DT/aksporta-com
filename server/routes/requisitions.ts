import type { Express } from "express";
import type { Server } from "http";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { checkSubmoduleAccess } from "./helpers";
import { type ManagedUser, insertRequisitionSchema, insertRequisitionCommentSchema, type ApprovalStep, type Requisition } from "@shared/schema";
import { z } from "zod";
import { initializeWorkflow, approveStep, rejectStep, markPOCreated } from "../workflow";

export async function registerRequisitionRoutes(app: Express, _httpServer: Server) {
  // ========== Employee Profile Lookup ==========

  app.get("/api/employee-profile", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const email = managedUser.email;
      console.log(`[employee-profile] Looking up profile for email: ${email}`);

      const employeeDs = await storage.getDataSourceBySlug("employee-directory");
      if (!employeeDs) {
        console.log(`[employee-profile] Employee directory data source not found`);
        return res.status(404).json({ message: "Employee directory not found" });
      }

      const { records } = await storage.getDsRecords(employeeDs.id, { search: email, limit: 100 });
      console.log(`[employee-profile] Search returned ${records.length} records for email: ${email}`);
      const match = records.find((r: any) => {
        const data = r.data as Record<string, any>;
        return data.email && String(data.email).toLowerCase() === email.toLowerCase();
      });

      if (!match) {
        console.log(`[employee-profile] No exact match found for email: ${email}`);
        return res.status(404).json({ message: "Your employee profile was not found in the directory. Please contact your administrator." });
      }

      const data = match.data as Record<string, any>;
      console.log(`[employee-profile] Found profile for ${data.full_name} (${email})`);
      res.json({
        full_name: data.full_name || null,
        position: data.position || null,
        department_english: data.department_english || null,
        cost_center: data.cost_center || null,
        cost_center_account_number: data.cost_center_account_number || null,
      });
    } catch (e: any) {
      console.error(`[employee-profile] Error during lookup: ${e.message}`);
      res.status(500).json({ message: e.message });
    }
  });

  // ========== Requisitions API Routes ==========

  app.get("/api/requisitions", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      res.json(await storage.getAllRequisitions({
        search,
        status,
        userId: isAdmin ? undefined : String(managedUser.id),
      }));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisitions/:id", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      const r = await storage.getRequisition(req.params.id);
      if (!r) return res.status(404).json({ message: "Not found" });
      const isApprover = await storage.hasPendingStepForUser(req.params.id, String(managedUser.id));
      if (!isAdmin && r.userId !== String(managedUser.id) && !isApprover) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(r);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/requisitions", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
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

      const requisition = await storage.createRequisition({ ...parsed.data, userId: String(managedUser.id) });
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

      await initializeWorkflow(requisition);

      const updated = await storage.getRequisition(requisition.id);
      res.json(updated || requisition);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  const adminUpdateSchema = z.object({
    vendorName: z.string().nullable().optional(),
    estimatedCostAed: z.number().optional(),
    budgetLineAccountCode: z.string().nullable().optional(),
    isBudgeted: z.boolean().optional(),
    requiredByDate: z.string().optional(),
    projectStartDate: z.string().nullable().optional(),
  });

  const approverUpdateSchema = z.object({
    vendorName: z.string().nullable().optional(),
    budgetLineAccountCode: z.string().nullable().optional(),
    requiredByDate: z.string().optional(),
    projectStartDate: z.string().nullable().optional(),
  });

  app.patch("/api/requisitions/:id", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";

      if (isAdmin) {
        const parsed = adminUpdateSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
        const r = await storage.updateRequisition(req.params.id, parsed.data);
        if (!r) return res.status(404).json({ message: "Not found" });
        return res.json(r);
      }

      const isCurrentApprover = await storage.hasPendingStepForUser(req.params.id, String(managedUser.id));
      if (!isCurrentApprover) {
        return res.status(403).json({ message: "Only administrators or assigned approvers can update requisitions" });
      }
      const parsed = approverUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid update data", errors: parsed.error.flatten() });
      const r = await storage.updateRequisition(req.params.id, parsed.data);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/requisitions/:id", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      if (!isAdmin) {
        const r = await storage.getRequisition(req.params.id);
        if (!r) return res.status(404).json({ message: "Not found" });
        if (r.userId !== String(managedUser.id)) return res.status(403).json({ message: "Access denied" });
      }
      const ok = await storage.deleteRequisition(req.params.id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisitions/:id/attachments", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      if (!isAdmin) {
        const r = await storage.getRequisition(req.params.id);
        const isApprover = await storage.hasPendingStepForUser(req.params.id, String(managedUser.id));
        if (!r || (r.userId !== String(managedUser.id) && !isApprover)) return res.status(403).json({ message: "Access denied" });
      }
      res.json(await storage.getRequisitionAttachments(req.params.id));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisition-attachments/:id/download", isAuthenticated, async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      const att = await storage.getRequisitionAttachmentById(req.params.id);
      if (!att) return res.status(404).json({ message: "Not found" });
      if (!isAdmin) {
        const r = await storage.getRequisition(att.requisitionId);
        const isApprover = await storage.hasPendingStepForUser(att.requisitionId, String(managedUser.id));
        if (!r || (r.userId !== String(managedUser.id) && !isApprover)) return res.status(403).json({ message: "Access denied" });
      }
      const base64Data = att.fileData.includes(",") ? att.fileData.split(",")[1] : att.fileData;
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", att.fileType);
      res.setHeader("Content-Disposition", `attachment; filename="${att.filename}"`);
      res.setHeader("Content-Length", buffer.length.toString());
      res.send(buffer);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisitions/:id/comments", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      if (!isAdmin) {
        const r = await storage.getRequisition(req.params.id);
        const isApprover = await storage.hasPendingStepForUser(req.params.id, String(managedUser.id));
        if (!r || (r.userId !== String(managedUser.id) && !isApprover)) return res.status(403).json({ message: "Access denied" });
      }
      res.json(await storage.getRequisitionComments(req.params.id));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/requisitions/:id/comments", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      const isCurrentApprover = await storage.hasPendingStepForUser(req.params.id, String(managedUser.id));

      if (!isAdmin && !isCurrentApprover) {
        return res.status(403).json({ message: "Only administrators or assigned approvers can post comments" });
      }
      const parsed = insertRequisitionCommentSchema.pick({ body: true }).extend({ body: z.string().trim().min(1) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Comment body is required" });
      const requisition = await storage.getRequisition(req.params.id);
      if (!requisition) return res.status(404).json({ message: "Requisition not found" });
      const authorName = managedUser.displayName || [managedUser.firstName, managedUser.lastName].filter(Boolean).join(" ") || managedUser.username;
      const comment = await storage.createRequisitionComment({
        requisitionId: req.params.id,
        authorId: String(managedUser.id),
        authorName,
        body: parsed.data.body,
      });
      res.json(comment);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/requisitions/:id/attachments", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      const isCurrentApprover = await storage.hasPendingStepForUser(req.params.id, String(managedUser.id));
      if (!isAdmin && !isCurrentApprover) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { filename, fileType, fileSize, fileData } = req.body;
      if (!filename || !fileType || !fileSize || !fileData) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxFileSize = 10 * 1024 * 1024;
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ message: `Invalid file type: ${fileType}. Allowed: JPG, PNG, PDF` });
      }
      if (fileSize > maxFileSize) {
        return res.status(400).json({ message: `File too large: ${filename}. Maximum 10MB per file.` });
      }
      const att = await storage.createRequisitionAttachment({
        requisitionId: req.params.id,
        filename,
        fileType,
        fileSize,
        fileData,
      });
      res.json(att);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ========== Approval Workflow Routes ==========

  app.get("/api/my-approvals", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const steps = await storage.getPendingApprovalSteps(String(managedUser.id));
      const results: (ApprovalStep & { requisition?: Requisition })[] = [];
      for (const step of steps) {
        const requisition = await storage.getRequisition(step.requisitionId);
        results.push({ ...step, requisition: requisition || undefined });
      }
      res.json(results);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/requisitions/:id/approval-steps", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      if (!isAdmin) {
        const r = await storage.getRequisition(req.params.id);
        const isApprover = await storage.hasPendingStepForUser(req.params.id, String(managedUser.id));
        if (!r || (r.userId !== String(managedUser.id) && !isApprover)) return res.status(403).json({ message: "Access denied" });
      }
      res.json(await storage.getApprovalSteps(req.params.id));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/approval-steps/:id/approve", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      const step = await storage.getApprovalStep(req.params.id);
      if (!step) return res.status(404).json({ message: "Approval step not found" });
      if (step.decision !== "pending") return res.status(400).json({ message: "This step has already been decided" });
      if (!isAdmin && step.assignedTo !== String(managedUser.id)) {
        return res.status(403).json({ message: "You are not the assigned approver for this step" });
      }
      const { comments } = req.body;
      const result = await approveStep(req.params.id, comments || null);
      res.json({ success: true, newStatus: result.newStatus, nextSteps: result.nextSteps });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/approval-steps/:id/reject", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      const step = await storage.getApprovalStep(req.params.id);
      if (!step) return res.status(404).json({ message: "Approval step not found" });
      if (step.decision !== "pending") return res.status(400).json({ message: "This step has already been decided" });
      if (!isAdmin && step.assignedTo !== String(managedUser.id)) {
        return res.status(403).json({ message: "You are not the assigned approver for this step" });
      }
      const { comments } = req.body;
      const result = await rejectStep(req.params.id, comments || null);
      res.json({ success: true, newStatus: result.newStatus });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/requisitions/:id/mark-po-created", isAuthenticated, checkSubmoduleAccess("erp", "procurement"), async (req, res) => {
    try {
      const managedUser = (req as any).managedUser as ManagedUser;
      const isAdmin = managedUser.role === "admin" || managedUser.role === "superadmin";
      if (!isAdmin) return res.status(403).json({ message: "Only administrators can mark PO as created" });
      await markPOCreated(req.params.id);
      const updated = await storage.getRequisition(req.params.id);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
}
