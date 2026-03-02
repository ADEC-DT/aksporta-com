import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServicePageLayout } from "@/components/service-page-layout";
import { OtherModulesSection } from "@/components/other-modules-section";
import { Store, CircleDot, Building2, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import type { PageSectionWithTemplate } from "@shared/schema";

const SERVICE_URL = "/business-units";

const businessUnits = [
  {
    id: "mall",
    name: "Boutique Mall",
    description: "Manage leasing, tenant relations, and facility maintenance for the luxury boutique mall.",
    icon: Store,
    iconBg: "bg-pink-500",
    accentColor: "from-pink-500 to-rose-500",
    status: "Active",
    metrics: [
      { label: "OCCUPANCY", value: "92%" },
      { label: "REVENUE", value: "$1.2M" },
      { label: "FOOTFALL", value: "15k/day" },
    ],
    url: "/asset-lease",
  },
  {
    id: "equestrian",
    name: "Equestrian Center",
    description: "Complete management of riding school, livery services, veterinary records, and stable logistics.",
    icon: CircleDot,
    iconBg: "bg-emerald-500",
    accentColor: "from-emerald-500 to-teal-500",
    status: "Active",
    metrics: [
      { label: "STABLES", value: "45/50" },
      { label: "HORSES", value: "42" },
      { label: "REVENUE", value: "$450k" },
    ],
    url: "/equestrian",
  },
  {
    id: "corporate",
    name: "Corporate HQ",
    description: "Central operations, HR, finance, and procurement for the headquarters.",
    icon: Building2,
    iconBg: "bg-blue-500",
    accentColor: "from-blue-500 to-indigo-500",
    status: "Active",
    metrics: [
      { label: "EMPLOYEES", value: "250" },
      { label: "DEPARTMENTS", value: "8" },
      { label: "PROJECTS", value: "12" },
    ],
    url: "/erp",
  },
];

function renderSection(section: PageSectionWithTemplate) {
  switch (section.title) {
    case "Business Units Overview":
      return (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {businessUnits.map((unit) => (
              <Link key={unit.id} href={unit.url}>
                <Card className="hover-elevate cursor-pointer h-full overflow-hidden" data-testid={`card-unit-${unit.id}`}>
                  <div className={`h-1 bg-gradient-to-r ${unit.accentColor}`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${unit.iconBg} text-white`}>
                        <unit.icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        {unit.status}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 font-outfit">{unit.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{unit.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      {unit.metrics.map((metric) => (
                        <div key={metric.label}>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{metric.label}</p>
                          <p className="text-lg font-bold">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 font-outfit">Cross-Unit Analytics</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">$1.65M</p>
                  <p className="text-sm text-muted-foreground">Combined Revenue</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">297</p>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">94%</p>
                  <p className="text-sm text-muted-foreground">Avg. Occupancy</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">12</p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      );

    default:
      return null;
  }
}

export default function BusinessUnitsPage() {
  return (
    <ServicePageLayout
      serviceUrl={SERVICE_URL}
      title="Business Units"
      subtitle="Overview of all operational divisions and their performance."
      collaborationSection="business_units"
      externalLinks={[
        { label: "Launch Power BI", url: "https://app.powerbi.com", icon: BarChart3 },
      ]}
      renderSection={renderSection}
    >
      <OtherModulesSection />
    </ServicePageLayout>
  );
}
