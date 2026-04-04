import type { Express } from "express";
import type { Server } from "http";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { isAdmin } from "./helpers";
import { z } from "zod";

const approvalMatrixBodySchema = z.object({
  fromAmount: z.string().or(z.number()).transform(v => String(v)),
  toAmount: z.string().or(z.number()).transform(v => String(v)),
  approverEmployeeCode: z.string().nullable().optional(),
  isAutoApprove: z.boolean().default(false),
});

async function validateZeroRuleExists(excludeId?: string, newFromAmount?: number): Promise<boolean> {
  const allRules = await storage.getAllApprovalMatrixRules();
  for (const rule of allRules) {
    if (excludeId && rule.id === excludeId) continue;
    if (Number(rule.fromAmount) === 0) return true;
  }
  if (newFromAmount === 0) return true;
  return false;
}

export async function registerApprovalMatrixRoutes(app: Express, _httpServer: Server): Promise<void> {
  app.get("/api/admin/approval-matrix", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const rules = await storage.getAllApprovalMatrixRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching approval matrix rules:", error);
      res.status(500).json({ message: "Failed to fetch approval matrix rules" });
    }
  });

  app.get("/api/admin/approval-matrix/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const rule = await storage.getApprovalMatrixRule(req.params.id);
      if (!rule) return res.status(404).json({ message: "Rule not found" });
      res.json(rule);
    } catch (error) {
      console.error("Error fetching approval matrix rule:", error);
      res.status(500).json({ message: "Failed to fetch rule" });
    }
  });

  app.post("/api/admin/approval-matrix", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = approvalMatrixBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const { fromAmount, toAmount, approverEmployeeCode, isAutoApprove } = parsed.data;
      const from = Number(fromAmount);
      const to = Number(toAmount);

      if (isNaN(from) || isNaN(to) || from < 0 || to < 0) {
        return res.status(400).json({ message: "Amounts must be valid non-negative numbers" });
      }
      if (from > to) {
        return res.status(400).json({ message: "From Amount must be less than or equal to To Amount" });
      }
      if (!isAutoApprove && !approverEmployeeCode) {
        return res.status(400).json({ message: "Either Auto Approve must be enabled or an Approver must be selected" });
      }

      const overlaps = await storage.checkApprovalMatrixOverlap(from, to);
      if (overlaps) {
        return res.status(400).json({ message: "This range overlaps with an existing rule" });
      }

      const existingRules = await storage.getAllApprovalMatrixRules();
      if (existingRules.length === 0 && from !== 0) {
        return res.status(400).json({ message: "The first rule must start from 0" });
      }
      if (existingRules.length > 0 && from !== 0) {
        const hasZeroRule = existingRules.some(r => Number(r.fromAmount) === 0);
        if (!hasZeroRule) {
          return res.status(400).json({ message: "At least one rule must start from 0" });
        }
      }

      const rule = await storage.createApprovalMatrixRule({
        fromAmount,
        toAmount,
        approverEmployeeCode: isAutoApprove ? null : (approverEmployeeCode || null),
        isAutoApprove,
      });

      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating approval matrix rule:", error);
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  app.patch("/api/admin/approval-matrix/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const existing = await storage.getApprovalMatrixRule(req.params.id);
      if (!existing) return res.status(404).json({ message: "Rule not found" });

      const parsed = approvalMatrixBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }

      const { fromAmount, toAmount, approverEmployeeCode, isAutoApprove } = parsed.data;
      const from = Number(fromAmount);
      const to = Number(toAmount);

      if (isNaN(from) || isNaN(to) || from < 0 || to < 0) {
        return res.status(400).json({ message: "Amounts must be valid non-negative numbers" });
      }
      if (from > to) {
        return res.status(400).json({ message: "From Amount must be less than or equal to To Amount" });
      }
      if (!isAutoApprove && !approverEmployeeCode) {
        return res.status(400).json({ message: "Either Auto Approve must be enabled or an Approver must be selected" });
      }

      const overlaps = await storage.checkApprovalMatrixOverlap(from, to, req.params.id);
      if (overlaps) {
        return res.status(400).json({ message: "This range overlaps with an existing rule" });
      }

      const zeroWillExist = await validateZeroRuleExists(req.params.id, from);
      if (!zeroWillExist) {
        return res.status(400).json({ message: "At least one rule must start from 0" });
      }

      const updated = await storage.updateApprovalMatrixRule(req.params.id, {
        fromAmount,
        toAmount,
        approverEmployeeCode: isAutoApprove ? null : (approverEmployeeCode || null),
        isAutoApprove,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating approval matrix rule:", error);
      res.status(500).json({ message: "Failed to update rule" });
    }
  });

  app.delete("/api/admin/approval-matrix/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const existing = await storage.getApprovalMatrixRule(req.params.id);
      if (!existing) return res.status(404).json({ message: "Rule not found" });

      if (Number(existing.fromAmount) === 0) {
        const hasOtherZero = await validateZeroRuleExists(req.params.id);
        if (!hasOtherZero) {
          return res.status(400).json({ message: "Cannot delete the only rule that starts from 0. At least one rule must start from 0." });
        }
      }

      const deleted = await storage.deleteApprovalMatrixRule(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Rule not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting approval matrix rule:", error);
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });
}
