import { db } from "./db";
import { externalServices, iconLibrary } from "@shared/schema";
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
