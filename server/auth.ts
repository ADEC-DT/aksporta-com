import { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    })
  );
}

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user by username
      const user = await storage.getManagedUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is disabled" });
      }

      // Regenerate session to prevent session fixation
      const oldSession = req.session;
      await new Promise<void>((resolve, reject) => {
        oldSession.regenerate((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      req.session.userId = user.id;

      // Update last active
      await storage.updateManagedUser(user.id, { lastActiveAt: new Date() });

      // Return user without sensitive fields
      const { password: _p, mfaSecret: _m, mfaBackupCodes: _b, ...userWithoutSensitive } = user;
      res.json(userWithoutSensitive);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getManagedUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      // Return user without sensitive fields
      const { password: _, mfaSecret, mfaBackupCodes, ...userWithoutSensitive } = user;
      res.json(userWithoutSensitive);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getManagedUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: "User not found" });
  }

  // Store user in request for later use
  (req as any).managedUser = user;
  next();
};

// Seed default admin user
export async function seedAdminUser() {
  try {
    const existingAdmin = await storage.getManagedUserByUsername("admin");
    if (existingAdmin) {
      if (existingAdmin.role !== "superadmin") {
        await storage.updateManagedUser(existingAdmin.id, { role: "superadmin" });
        console.log("Admin user upgraded to superadmin");
      } else {
        console.log("Admin user already exists");
      }
    } else {
      const hashedPassword = await bcrypt.hash("admin", 10);
      await storage.createManagedUser({
        email: "admin@example.com",
        username: "admin",
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        role: "superadmin",
        isActive: true,
        lastActiveAt: null,
      });
      console.log("Default admin user created (username: admin, password: admin)");
    }

    const existingSystemAdmin = await storage.getManagedUserByUsername("systemadmin");
    if (!existingSystemAdmin) {
      const hashedPassword = await bcrypt.hash("systemadmin", 10);
      await storage.createManagedUser({
        email: "systemadmin@example.com",
        username: "systemadmin",
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        role: "superadmin",
        isActive: true,
        lastActiveAt: null,
      });
      console.log("Systemadmin user created (username: systemadmin, password: systemadmin)");
    } else {
      console.log("Systemadmin user already exists");
    }
  } catch (error) {
    console.error("Failed to seed admin user:", error);
  }
}
