import type { Express } from "express";
import type { Server } from "http";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { checkSubmoduleAccess } from "./helpers";
import { type ManagedUser, insertRequisitionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRequisitionRoutes(app: Express, _httpServer: Server) {
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
}
