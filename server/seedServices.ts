import { db } from "./db";
import { externalServices, iconLibrary, spaces, projectGroups, projects, projectAssignments, managedUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultServices = [
  {
    name: "Business Units",
    description: null,
    url: "/business-units",
    icon: "Building2",
    category: "general",
    isEnabled: true,
    isExternal: false,
    sortOrder: "1",
  },
  {
    name: "Customer DB",
    description: null,
    url: "/applications/customer-db",
    icon: "Contact",
    category: "general",
    isEnabled: true,
    isExternal: false,
    sortOrder: "2",
  },
  {
    name: "Projects",
    description: null,
    url: "/projects",
    icon: "FolderKanban",
    category: "general",
    isEnabled: true,
    isExternal: false,
    sortOrder: "3",
  },
  {
    name: "HRMS",
    description: null,
    url: "/hr",
    icon: "Users",
    category: "hr",
    isEnabled: true,
    isExternal: false,
    sortOrder: "4",
  },
  {
    name: "ERP",
    description: null,
    url: "/erp",
    icon: "DollarSign",
    category: "finance",
    isEnabled: true,
    isExternal: false,
    sortOrder: "5",
  },
  {
    name: "Asset and Lease Management",
    description: null,
    url: "/asset-lease",
    icon: "Store",
    category: "operations",
    isEnabled: true,
    isExternal: false,
    sortOrder: "6",
  },
  {
    name: "Equestrian",
    description: null,
    url: "/equestrian",
    icon: "CircleDot",
    category: "operations",
    isEnabled: true,
    isExternal: false,
    sortOrder: "7",
  },
  {
    name: "Events & Entertainment",
    description: null,
    url: "/events",
    icon: "PartyPopper",
    category: "marketing",
    isEnabled: true,
    isExternal: false,
    sortOrder: "8",
  },
  {
    name: "Media & Marketing",
    description: null,
    url: "/media-marketing",
    icon: "Megaphone",
    category: "marketing",
    isEnabled: true,
    isExternal: false,
    sortOrder: "9",
  },
  {
    name: "DT Support",
    description: null,
    url: "/intranet",
    icon: "Headphones",
    category: "general",
    isEnabled: true,
    isExternal: false,
    sortOrder: "10",
  },
  {
    name: "Legal",
    description: null,
    url: "/legal",
    icon: "Scale",
    category: "general",
    isEnabled: true,
    isExternal: false,
    sortOrder: "11",
  },
  {
    name: "Performance & KPIs",
    description: null,
    url: "/performance-kpi",
    icon: "Target",
    category: "operations",
    isEnabled: true,
    isExternal: false,
    sortOrder: "12",
  },
  {
    name: "OPS & FM",
    description: null,
    url: "/ops-fm",
    icon: "Wrench",
    category: "operations",
    isEnabled: true,
    isExternal: false,
    sortOrder: "13",
  },
];

const defaultIcons = [
  { name: "Store", label: "Store", category: "business", description: "Retail store / shop front" },
  { name: "Building2", label: "Building", category: "business", description: "Office building / organization" },
  { name: "Contact", label: "Contact", category: "communication", description: "Contact card / person details" },
  { name: "Headphones", label: "Headphones", category: "communication", description: "Audio headset / support" },
  { name: "DollarSign", label: "Dollar Sign", category: "finance", description: "Currency / financial" },
  { name: "CircleDot", label: "Circle Dot", category: "general", description: "Target point / marker" },
  { name: "PartyPopper", label: "Party Popper", category: "events", description: "Celebration / events" },
  { name: "Users", label: "Users", category: "people", description: "Group of people / team" },
  { name: "Scale", label: "Scale", category: "legal", description: "Legal scales / justice" },
  { name: "Megaphone", label: "Megaphone", category: "communication", description: "Announcements / marketing" },
  { name: "Wrench", label: "Wrench", category: "operations", description: "Tool / maintenance" },
  { name: "Target", label: "Target", category: "general", description: "Goal / KPI target" },
  { name: "FolderKanban", label: "Folder Kanban", category: "general", description: "Project boards / kanban view" },
  { name: "Globe", label: "Globe", category: "general", description: "World / internet / global" },
  { name: "Shield", label: "Shield", category: "security", description: "Security / protection" },
  { name: "BarChart3", label: "Bar Chart", category: "analytics", description: "Charts / analytics / data" },
  { name: "Truck", label: "Truck", category: "logistics", description: "Delivery / logistics / shipping" },
  { name: "Heart", label: "Heart", category: "general", description: "Health / wellness / favorite" },
  { name: "Briefcase", label: "Briefcase", category: "business", description: "Business / portfolio / work" },
  { name: "Cpu", label: "CPU", category: "technology", description: "Technology / computing / hardware" },
  { name: "Database", label: "Database", category: "technology", description: "Data storage / database" },
  { name: "Landmark", label: "Landmark", category: "business", description: "Banking / government / institution" },
  { name: "Palette", label: "Palette", category: "creative", description: "Design / art / creative" },
  { name: "Rocket", label: "Rocket", category: "general", description: "Launch / startup / speed" },
  { name: "Zap", label: "Zap", category: "general", description: "Energy / electric / fast" },
  { name: "Calendar", label: "Calendar", category: "general", description: "Scheduling / dates / calendar" },
  { name: "MapPin", label: "Map Pin", category: "general", description: "Location / map / places" },
  { name: "Award", label: "Award", category: "general", description: "Achievement / award / recognition" },
  { name: "BookOpen", label: "Book Open", category: "education", description: "Education / documentation / reading" },
];

export async function seedSpacesAndProjects() {
  try {
    const existingSpaces = await db.select().from(spaces);
    if (existingSpaces.length > 0) {
      console.log(`Spaces already exist (${existingSpaces.length} spaces)`);
      return;
    }

    console.log("Seeding spaces, projects, and sample tasks...");

    const adminUsers = await db.select().from(managedUsers);
    const adminId = adminUsers[0]?.id;
    if (!adminId) {
      console.log("No admin user found, skipping spaces seed");
      return;
    }

    const [itSpace] = await db.insert(spaces).values({
      name: "IT & Digital",
      description: "Information Technology and Digital Transformation department",
      color: "#3b82f6",
      ownerId: adminId,
    }).returning();

    const [opsSpace] = await db.insert(spaces).values({
      name: "Operations",
      description: "Operations and Facility Management department",
      color: "#10b981",
      ownerId: adminId,
    }).returning();

    const [hrSpace] = await db.insert(spaces).values({
      name: "HR & Admin",
      description: "Human Resources and Administration",
      color: "#f59e0b",
      ownerId: adminId,
    }).returning();

    const [portalProject] = await db.insert(projectGroups).values({
      name: "Unified Portal",
      description: "Enterprise portal development and rollout",
      spaceId: itSpace.id,
      color: "#6366f1",
      status: "active",
      startDate: "2026-01-15",
      endDate: "2026-06-30",
      createdBy: adminId,
    }).returning();

    const [infraProject] = await db.insert(projectGroups).values({
      name: "Infrastructure Upgrade",
      description: "Network and server infrastructure modernization",
      spaceId: itSpace.id,
      color: "#0ea5e9",
      status: "active",
      startDate: "2026-02-01",
      endDate: "2026-05-31",
      createdBy: adminId,
    }).returning();

    const [facilityProject] = await db.insert(projectGroups).values({
      name: "Facility Renovation Q1",
      description: "Building and facility renovation plan",
      spaceId: opsSpace.id,
      color: "#22c55e",
      status: "active",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      createdBy: adminId,
    }).returning();

    const [onboardingProject] = await db.insert(projectGroups).values({
      name: "Employee Onboarding 2026",
      description: "Streamline onboarding processes for new hires",
      spaceId: hrSpace.id,
      color: "#eab308",
      status: "active",
      startDate: "2026-01-10",
      endDate: "2026-04-30",
      createdBy: adminId,
    }).returning();

    const sampleTasks = [
      { name: "Design dashboard layout", projectGroupId: portalProject.id, status: "completed", priority: "high", deadline: "2026-02-10", description: "Create wireframes and mockups for the main dashboard" },
      { name: "Implement authentication system", projectGroupId: portalProject.id, status: "completed", priority: "critical", deadline: "2026-02-15", description: "Set up user login, roles, and session management" },
      { name: "Build section management UI", projectGroupId: portalProject.id, status: "in_progress", priority: "high", deadline: "2026-03-01", description: "Admin interface for managing service page sections" },
      { name: "Integrate Power BI reports", projectGroupId: portalProject.id, status: "not_started", priority: "medium", deadline: "2026-03-15", description: "Embed Power BI dashboards into the portal" },
      { name: "User acceptance testing", projectGroupId: portalProject.id, status: "not_started", priority: "high", deadline: "2026-04-01", description: "Conduct UAT with key stakeholders" },
      { name: "Migrate to new firewall", projectGroupId: infraProject.id, status: "in_progress", priority: "critical", deadline: "2026-03-01", description: "Replace legacy firewall with next-gen solution" },
      { name: "Set up monitoring system", projectGroupId: infraProject.id, status: "not_started", priority: "high", deadline: "2026-03-15", description: "Deploy Grafana/Prometheus monitoring stack" },
      { name: "Server room cooling upgrade", projectGroupId: infraProject.id, status: "on_hold", priority: "medium", deadline: "2026-04-01", description: "Install new HVAC for server room" },
      { name: "Lobby renovation", projectGroupId: facilityProject.id, status: "in_progress", priority: "medium", deadline: "2026-02-28", description: "Redesign and renovate main lobby area" },
      { name: "HVAC maintenance schedule", projectGroupId: facilityProject.id, status: "completed", priority: "low", deadline: "2026-02-01", description: "Create quarterly HVAC maintenance plan" },
      { name: "Security camera upgrade", projectGroupId: facilityProject.id, status: "not_started", priority: "high", deadline: "2026-03-15", description: "Replace outdated CCTV system" },
      { name: "Create onboarding checklist", projectGroupId: onboardingProject.id, status: "completed", priority: "high", deadline: "2026-01-31", description: "Define standard onboarding checklist for all departments" },
      { name: "Setup digital signatures", projectGroupId: onboardingProject.id, status: "in_progress", priority: "medium", deadline: "2026-02-28", description: "Implement DocuSign for HR documents" },
      { name: "Training materials update", projectGroupId: onboardingProject.id, status: "not_started", priority: "low", deadline: "2026-03-31", description: "Update employee training materials for 2026" },
    ];

    for (const task of sampleTasks) {
      const [created] = await db.insert(projects).values({
        ...task,
        createdBy: adminId,
        startDate: "2026-01-15",
      }).returning();

      await db.insert(projectAssignments).values({
        projectId: created.id,
        userId: adminId,
        role: "owner",
        assignedBy: adminId,
      });
    }

    console.log(`Seeded 3 spaces, 4 project groups, and ${sampleTasks.length} sample tasks`);
  } catch (error) {
    console.error("Failed to seed spaces and projects:", error);
  }
}

export async function seedExternalServices() {
  try {
    const existingServices = await db.select().from(externalServices);
    
    if (existingServices.length > 0) {
      console.log(`External services already exist (${existingServices.length} services)`);
    } else {
      console.log("Seeding external services...");
      for (const service of defaultServices) {
        await db.insert(externalServices).values(service);
      }
      console.log(`Seeded ${defaultServices.length} external services`);
    }

    const existingIcons = await db.select().from(iconLibrary);
    if (existingIcons.length === 0) {
      console.log("Seeding icon library...");
      for (const icon of defaultIcons) {
        await db.insert(iconLibrary).values({ ...icon, isCustom: false });
      }
      console.log(`Seeded ${defaultIcons.length} icons`);
    } else {
      console.log(`Icon library already exists (${existingIcons.length} icons)`);
    }
  } catch (error) {
    console.error("Failed to seed external services:", error);
  }
}
