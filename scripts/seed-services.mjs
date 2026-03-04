import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const services = [
  { name: "Business Units", url: "/business-units", icon: "Building2", category: "general", isEnabled: true, isExternal: false, sortOrder: "1" },
  { name: "Customer DB", url: "/applications/customer-db", icon: "Contact", category: "general", isEnabled: true, isExternal: false, sortOrder: "2" },
  { name: "Projects", url: "/projects", icon: "FolderKanban", category: "general", isEnabled: true, isExternal: false, sortOrder: "3" },
  { name: "HRMS", url: "/hr", icon: "Users", category: "hr", isEnabled: true, isExternal: false, sortOrder: "4" },
  { name: "ERP", url: "/erp", icon: "DollarSign", category: "finance", isEnabled: true, isExternal: false, sortOrder: "5" },
  { name: "Asset and Lease Management", url: "/asset-lease", icon: "Store", category: "operations", isEnabled: true, isExternal: false, sortOrder: "6" },
  { name: "Equestrian", url: "/equestrian", icon: "CircleDot", category: "operations", isEnabled: true, isExternal: false, sortOrder: "7" },
  { name: "Events & Entertainment", url: "/events", icon: "PartyPopper", category: "marketing", isEnabled: true, isExternal: false, sortOrder: "8" },
  { name: "Media & Marketing", url: "/media-marketing", icon: "Megaphone", category: "marketing", isEnabled: true, isExternal: false, sortOrder: "9" },
  { name: "AKS Request Center", url: "/intranet", icon: "Headphones", category: "general", isEnabled: true, isExternal: false, sortOrder: "10" },
  { name: "Legal", url: "/legal", icon: "Scale", category: "general", isEnabled: true, isExternal: false, sortOrder: "11" },
  { name: "Performance & KPIs", url: "/performance-kpi", icon: "Target", category: "operations", isEnabled: true, isExternal: false, sortOrder: "12" },
  { name: "OPS & FM", url: "/ops-fm", icon: "Wrench", category: "operations", isEnabled: true, isExternal: false, sortOrder: "13" },
  { name: "IT Service Desk", url: "/it-dt", icon: "Cpu", category: "it", isEnabled: true, isExternal: false, sortOrder: "14" },
];

async function seed() {
  for (const s of services) {
    const existing = await pool.query('SELECT id FROM external_services WHERE url = $1', [s.url]);
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO external_services (name, url, icon, category, is_enabled, is_external, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [s.name, s.url, s.icon, s.category, s.isEnabled, s.isExternal, s.sortOrder]
      );
      console.log('Inserted:', s.name);
    } else {
      console.log('Already exists:', s.name);
    }
  }
  await pool.end();
  console.log('Done!');
}

seed().catch(console.error);
