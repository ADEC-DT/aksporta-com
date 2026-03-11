import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Fence,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Receipt,
  FileText,
  FilePlus,
  Package,
  Users,
  Building,
  Box,
  BarChart3,
  Clock,
  DollarSign,
} from "lucide-react";
import HorsesPage from "./horses";
import CustomersPage from "./customers";
import ItemsServicesPage from "./items-services";
import FacilitiesPage from "./facilities";
import LiveryPackagesPage from "./livery-packages";
import AgreementsPage from "./agreements";
import NewAgreementPage from "./new-agreement";
import BillingPage from "./billing";
import LiveryReportPage from "./livery-report";
import SchedulePage from "./schedule";
import LiveryReportsPage from "./livery-reports";
import BillingElementsPage from "./billing-elements";

type NavItem = { label: string; route: string; icon: React.ReactNode };
type NavGroup = { label: string; items: NavItem[]; defaultOpen?: boolean };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Activities",
    defaultOpen: true,
    items: [
      { label: "Post Billing", route: "billing", icon: <Receipt className="h-4 w-4" /> },
      { label: "Schedule", route: "schedule", icon: <Clock className="h-4 w-4" /> },
    ],
  },
  {
    label: "Billing Elements",
    defaultOpen: true,
    items: [
      { label: "Billing Elements", route: "billing-elements", icon: <DollarSign className="h-4 w-4" /> },
    ],
  },
  {
    label: "Livery",
    defaultOpen: true,
    items: [
      { label: "Agreements", route: "agreements", icon: <FileText className="h-4 w-4" /> },
      { label: "New Agreement", route: "new-agreement", icon: <FilePlus className="h-4 w-4" /> },
      { label: "Packages", route: "packages", icon: <Package className="h-4 w-4" /> },
      { label: "Revenue Report", route: "report", icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    label: "Reports",
    defaultOpen: true,
    items: [
      { label: "Livery Reports", route: "livery-reports", icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    label: "Others",
    defaultOpen: true,
    items: [
      { label: "Horses", route: "horses", icon: <Fence className="h-4 w-4" /> },
      { label: "Customers", route: "customers", icon: <Users className="h-4 w-4" /> },
      { label: "Stables & Boxes", route: "facilities", icon: <Building className="h-4 w-4" /> },
      { label: "Items & Services", route: "items", icon: <Box className="h-4 w-4" /> },
    ],
  },
];


const ROUTE_MAP: Record<string, string> = {
  horses: "horses",
  customers: "customers",
  facilities: "facilities",
  items: "items",
  billing: "billing",
  schedule: "schedule",
  agreements: "agreements",
  "new-agreement": "new-agreement",
  packages: "packages",
  report: "report",
  "billing-elements": "billing-elements",
  "livery-reports": "livery-reports",
};

function extractRoute(pathname: string, basePath: string): string {
  const suffix = pathname.replace(basePath, "").replace(/^\//, "");
  return ROUTE_MAP[suffix] || "horses";
}

export default function StableMasterHubPage() {
  const basePath = "/equestrian/stable-master";
  const [location, setLocation] = useLocation();
  const currentRoute = useMemo(() => extractRoute(location, basePath), [location, basePath]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Activities: true,
    "Billing Elements": true,
    Livery: true,
    Reports: true,
    Others: true,
  });

  const navigate = (route: string) => {
    setLocation(`${basePath}/${route}`);
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItem = (item: NavItem) => (
    <button
      key={item.route}
      onClick={() => navigate(item.route)}
      data-testid={`nav-smh-${item.route}`}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-colors ${
        currentRoute === item.route
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
    </button>
  );

  const renderContent = () => {
    switch (currentRoute) {
      case "horses": return <HorsesPage />;
      case "customers": return <CustomersPage />;
      case "items": return <ItemsServicesPage />;
      case "facilities": return <FacilitiesPage />;
      case "packages": return <LiveryPackagesPage />;
      case "agreements": return <AgreementsPage />;
      case "new-agreement": return <NewAgreementPage />;
      case "billing": return <BillingPage />;
      case "billing-elements": return <BillingElementsPage />;
      case "report": return <LiveryReportPage />;
      case "schedule": return <SchedulePage />;
      case "livery-reports": return <LiveryReportsPage />;
      default: return <HorsesPage />;
    }
  };

  return (
    <div className="flex h-full" data-testid="page-smh">
      {sidebarOpen && (
        <div className="w-64 border-r bg-card flex flex-col shrink-0">
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <Fence className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">StableMaster</h2>
              <p className="text-xs text-muted-foreground">Equestrian Management</p>
            </div>
          </div>
          <Separator />
          <ScrollArea className="flex-1 px-2 py-2">
            <div className="space-y-1">
              <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Management</p>
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                    data-testid={`nav-smh-group-${group.label.toLowerCase()}`}
                  >
                    <span>{group.label}</span>
                    {openGroups[group.label] ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {openGroups[group.label] && (
                    <div className="ml-2 space-y-0.5">{group.items.map(renderNavItem)}</div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-2 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="button-smh-toggle-sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-[1200px] mx-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
