import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingCart, 
  Package,
  FileText,
  TrendingUp,
  ClipboardList,
  ExternalLink,
  CreditCard,
  Tag,
  Wallet,
  BarChart3,
  Receipt,
  Truck,
  Archive
} from "lucide-react";

const financeModules = [
  {
    id: "accounts-payable",
    title: "Accounts Payable",
    subtitle: "3 Invoices Pending Approval",
    icon: FileText,
    action: "View Invoices",
    url: "#",
  },
  {
    id: "budget-variance",
    title: "Budget Variance",
    subtitle: "Q1 2026: +2.4% vs Forecast",
    icon: TrendingUp,
    action: "View Report",
    url: "#",
  },
  {
    id: "financial-reports",
    title: "Financial Reports",
    subtitle: "Monthly Closing: In Progress",
    icon: BarChart3,
    action: "Open Reports",
    url: "#",
  },
];

const otherFinanceModules = [
  {
    id: "qashio",
    name: "Qashio",
    description: "Petty cash and digital card management system",
    icon: CreditCard,
    iconBg: "bg-violet-500",
    status: "Active",
  },
  {
    id: "tagway",
    name: "Tagway",
    description: "Asset tagging and tracking system",
    icon: Tag,
    iconBg: "bg-amber-500",
    status: "Active",
  },
];

const procurementModules = [
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    subtitle: "12 Orders Pending",
    icon: ClipboardList,
    action: "View Orders",
    url: "#",
  },
  {
    id: "vendor-management",
    title: "Vendor Management",
    subtitle: "156 Active Vendors",
    icon: Truck,
    action: "Manage Vendors",
    url: "#",
  },
  {
    id: "requisitions",
    title: "Requisitions",
    subtitle: "5 Awaiting Approval",
    icon: Receipt,
    action: "View Requisitions",
    url: "#",
  },
];

const inventoryModules = [
  {
    id: "stock-levels",
    title: "Stock Levels",
    subtitle: "Current inventory status",
    icon: Package,
    action: "View Inventory",
    url: "#",
  },
  {
    id: "warehouse",
    title: "Warehouse Management",
    subtitle: "3 Locations Active",
    icon: Archive,
    action: "Manage Warehouses",
    url: "#",
  },
  {
    id: "transfers",
    title: "Stock Transfers",
    subtitle: "2 Transfers In Progress",
    icon: Truck,
    action: "View Transfers",
    url: "#",
  },
];

export default function ERPDashboard() {
  const [activeTab, setActiveTab] = useState("finance");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit">NetSuite Enterprise</h1>
          <p className="text-muted-foreground">Finance, Procurement, and Inventory Management.</p>
        </div>
        <Button className="w-fit" data-testid="button-launch-netsuite">
          Launch NetSuite
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="finance" className="flex items-center gap-2" data-testid="tab-finance">
            <DollarSign className="h-4 w-4" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="procurement" className="flex items-center gap-2" data-testid="tab-procurement">
            <ShoppingCart className="h-4 w-4" />
            Procurement
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2" data-testid="tab-inventory">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* Finance Tab */}
        <TabsContent value="finance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {financeModules.map((module) => (
              <Card key={module.id} data-testid={`finance-module-${module.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <module.icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{module.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{module.subtitle}</p>
                  <Button variant="outline" className="w-full" data-testid={`button-${module.id}`}>
                    {module.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Other Finance Modules Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold font-outfit mb-4">Other Finance Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherFinanceModules.map((module) => (
                <Card key={module.id} className="hover-elevate cursor-pointer" data-testid={`other-module-${module.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${module.iconBg}`}>
                        <module.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{module.name}</h4>
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                            {module.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Procurement Tab */}
        <TabsContent value="procurement" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {procurementModules.map((module) => (
              <Card key={module.id} data-testid={`procurement-module-${module.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <module.icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{module.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{module.subtitle}</p>
                  <Button variant="outline" className="w-full" data-testid={`button-${module.id}`}>
                    {module.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventoryModules.map((module) => (
              <Card key={module.id} data-testid={`inventory-module-${module.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <module.icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{module.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{module.subtitle}</p>
                  <Button variant="outline" className="w-full" data-testid={`button-${module.id}`}>
                    {module.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
