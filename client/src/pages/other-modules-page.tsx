import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Construction, CreditCard, Tag, ExternalLink } from "lucide-react";

interface OtherModulesPageProps {
  section: string;
}

const erpModules = [
  {
    id: "qashio",
    name: "Qashio",
    description: "Petty cash and digital card management system",
    icon: CreditCard,
    iconBg: "bg-violet-500",
    status: "Active",
    url: "https://www.qashio.com/",
  },
  {
    id: "tagway",
    name: "Tagway",
    description: "Asset tagging and tracking system",
    icon: Tag,
    iconBg: "bg-amber-500",
    status: "Active",
    url: "https://www.tagwayrfid.com/",
  },
];

export default function OtherModulesPage({ section }: OtherModulesPageProps) {
  const sectionLabels: Record<string, string> = {
    erp: "ERP",
    equestrian: "Equestrian",
    hr: "HR",
    livery: "Livery",
    intranet: "AKS Request Center",
    veterinary: "Veterinary",
    "business-units": "Business Units",
    "asset-lease": "Asset & Lease",
    events: "Events",
    "media-marketing": "Media & Marketing",
    legal: "Legal",
    "performance-kpi": "Performance & KPIs",
    "ops-fm": "OPS & FM",
    "other-systems": "Other Systems",
    "it-dt": "IT & DT",
  };
  const title = `${sectionLabels[section] || section} — Other Modules`;
  const modules = section === "erp" ? erpModules : [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="other-modules-page">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-outfit" data-testid="text-page-title">{title}</h1>
          <p className="text-muted-foreground text-sm">Additional modules and integrations</p>
        </div>
      </div>

      {modules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <a
                key={mod.id}
                href={mod.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
                data-testid={`card-module-${mod.id}`}
              >
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${mod.iconBg} text-white shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{mod.name}</h3>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{mod.description}</p>
                        <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0 border-green-300 text-green-600 dark:border-green-700 dark:text-green-400">
                          {mod.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}

      {modules.length === 0 && (
        <Card className="border-dashed" data-testid="card-coming-soon">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Construction className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Additional modules for this section are currently being configured. They will appear here once available.
            </p>
            <Badge variant="secondary" className="mt-4">Under Development</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
