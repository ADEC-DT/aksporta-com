import type { Express } from "express";
import type { Server } from "http";
import { storage } from "../storage";

export async function registerDepartmentRoutes(app: Express, _httpServer: Server) {
  app.get("/api/departments", async (_req, res) => {
    try {
      const depts = await storage.getAllDepartments();
      res.json(depts);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid department ID" });
      }
      const dept = await storage.getDepartment(id);
      if (!dept) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(dept);
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });
}
