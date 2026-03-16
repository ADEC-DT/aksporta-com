import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { setupAuth, registerAuthRoutes, seedAdminUser } from "./auth";
import { seedExternalServices, seedSpacesAndProjects, seedStableMasterData, seedDataSources } from "./seedServices";
import { storage } from "./storage";

const isDev = process.env.NODE_ENV !== "production";

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https:", "wss:", ...(isDev ? ["ws:"] : [])],
      frameSrc: ["'self'", "https://view.monday.com"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { message: "Too many password reset requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many reset attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth/reset-password", resetPasswordLimiter);

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
      const sensitiveRoutes = ["/api/sso/generate-token", "/api/sso/verify-token", "/api/auth/login"];
      if (capturedJsonResponse && !sensitiveRoutes.includes(path)) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);

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

  if (!isDev && !process.env.APP_URL) {
    console.warn("[WARN] APP_URL environment variable is not set. Password reset links will use the Host header, which may be unreliable. Set APP_URL to your production domain (e.g. https://aksportal.com).");
  }

  setupAuth(app);
  registerAuthRoutes(app);
  
  await seedAdminUser();
  await seedExternalServices();
  await seedSpacesAndProjects();
  await seedStableMasterData();
  await seedDataSources();
  await storage.initTicketSequence();
  
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

  appReady = true;
  log("All routes and middleware initialized");

  setInterval(async () => {
    try {
      const deleted = await storage.cleanupExpiredTokens();
      if (deleted > 0) {
        log(`Cleaned up ${deleted} expired/used tokens`, "cleanup");
      }
    } catch (e) {
      console.error("Token cleanup error:", e);
    }
  }, 60 * 60 * 1000);
})();
