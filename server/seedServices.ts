import { db } from "./db";
import { externalServices } from "@shared/schema";
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

export async function seedExternalServices() {
  try {
    const existingServices = await db.select().from(externalServices);
    
    if (existingServices.length > 0) {
      console.log(`External services already exist (${existingServices.length} services)`);
      return;
    }

    console.log("Seeding external services...");
    
    for (const service of defaultServices) {
      await db.insert(externalServices).values(service);
    }
    
    console.log(`Seeded ${defaultServices.length} external services`);
  } catch (error) {
    console.error("Failed to seed external services:", error);
  }
}
