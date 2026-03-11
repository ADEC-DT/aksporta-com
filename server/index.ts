import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth, registerAuthRoutes, seedAdminUser } from "./auth";
import { seedExternalServices, seedSpacesAndProjects, seedStableMasterData, seedDataSources } from "./seedServices";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import path from "path";

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    limit: "50mb",
  }),
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

let appReady = false;

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

app.use((req, res, next) => {
  if (!appReady && !req.path.startsWith('/api') && req.path !== '/health') {
    res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading...</title></head><body><p>Application is starting...</p><script>setTimeout(()=>location.reload(),2000)</script></body></html>');
    return;
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);

  const migrationsFolder = process.env.NODE_ENV === "production"
    ? path.resolve(process.cwd(), "dist", "migrations")
    : path.resolve(process.cwd(), "migrations");

  try {
    log("Running database migrations...");
    await migrate(db, { migrationsFolder });
    log("Database migrations completed successfully");
  } catch (err: any) {
    console.error("Migration error:", err);
    throw err;
  }

  setupAuth(app);
  registerAuthRoutes(app);
  
  await seedAdminUser();
  await seedExternalServices();
  await seedSpacesAndProjects();
  await seedStableMasterData();
  await seedDataSources();
  
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  appReady = true;
  log("All routes and middleware initialized");
})();
