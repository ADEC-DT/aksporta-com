import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  
  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}. Static file serving disabled.`);
    // Fallback: respond with a simple message for the root path
    app.get("/", (_req, res) => {
      res.status(200).send("Server is running. Build the client to see the application.");
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send("Application loading...");
    }
  });
}
