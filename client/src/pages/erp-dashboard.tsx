import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageCollaborationStamp } from "@/components/collaboration-stamp";
import { SiStripe } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  Archive,
  CheckCircle,
  Shield,
  Activity,
  ArrowUpRight,
  Database,
  RefreshCw,
  AlertCircle,
  Loader2
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

const paymentMetrics = [
  { id: "monthly-volume", title: "Monthly Volume", value: "$284,500", change: 18.3 },
  { id: "transactions", title: "Transactions", value: "1,847", change: 12.5 },
  { id: "success-rate", title: "Success Rate", value: "98.7%", change: 0.5 },
  { id: "avg-transaction", title: "Avg Transaction", value: "$154", change: -2.1 },
];

const recentPayments = [
  { id: "PAY-001", customer: "Acme Corporation", amount: "$15,250", status: "completed", date: "Jan 15, 2026" },
  { id: "PAY-002", customer: "TechStart Inc", amount: "$8,900", status: "completed", date: "Jan 15, 2026" },
  { id: "PAY-003", customer: "Global Solutions", amount: "$22,000", status: "pending", date: "Jan 14, 2026" },
  { id: "PAY-004", customer: "DataFlow Ltd", amount: "$3,500", status: "completed", date: "Jan 14, 2026" },
  { id: "PAY-005", customer: "CloudNine Corp", amount: "$45,000", status: "failed", date: "Jan 13, 2026" },
];

export default function ERPDashboard() {
  const [activeTab, setActiveTab] = useState("finance");
  const [selectedTable, setSelectedTable] = useState<string>("");

  const { data: azureStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{ connected: boolean; message: string }>({
    queryKey: ["/api/azure/status"],
  });

  const { data: tables, isLoading: tablesLoading, refetch: refetchTables } = useQuery<string[]>({
    queryKey: ["/api/azure/tables"],
    enabled: azureStatus?.connected === true,
  });

  const { data: tableData, isLoading: dataLoading, refetch: refetchData } = useQuery<any[]>({
    queryKey: ["/api/azure/tables", selectedTable],
    enabled: !!selectedTable && azureStatus?.connected === true,
  });

  const handleRefresh = () => {
    refetchStatus();
    if (azureStatus?.connected) {
      refetchTables();
      if (selectedTable) {
        refetchData();
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageCollaborationStamp sectionName="erp" />
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
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
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
          <TabsTrigger value="payments" className="flex items-center gap-2" data-testid="tab-payments">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="azure" className="flex items-center gap-2" data-testid="tab-azure">
            <Database className="h-4 w-4" />
            Azure Data
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

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-6">
          {/* Stripe Integration Header */}
          <Card className="mb-6 border-0 bg-gradient-to-r from-violet-600 to-indigo-600" data-testid="stripe-integration-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <SiStripe className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-outfit">Stripe Payment Gateway</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-green-400/20 text-green-100 border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                      <span className="text-white/70 text-sm">Sandbox Mode</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                    data-testid="button-stripe-dashboard"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Stripe Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {paymentMetrics.map((metric) => (
              <Card key={metric.id} data-testid={`metric-${metric.id}`}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold font-outfit">{metric.value}</span>
                    <Badge 
                      variant="secondary" 
                      className={metric.change >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"}
                    >
                      {metric.change >= 0 ? "+" : ""}{metric.change}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Features & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Features */}
            <Card data-testid="payment-features-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Payment Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Card Payments</p>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">PCI DSS Compliant</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Real-time Webhooks</p>
                    <p className="text-xs text-muted-foreground">Instant notifications</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Receipt className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Invoicing</p>
                    <p className="text-xs text-muted-foreground">Automated billing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-2" data-testid="recent-transactions-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4">
                <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all-transactions">
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      data-testid={`payment-row-${payment.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payment.customer}</p>
                          <p className="text-xs text-muted-foreground">{payment.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{payment.amount}</span>
                        <Badge 
                          variant="secondary"
                          className={
                            payment.status === "completed" 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" 
                              : payment.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Azure Data Tab */}
        <TabsContent value="azure" className="mt-6">
          {/* Azure Connection Status Header */}
          <Card className="mb-6 border-0 bg-gradient-to-r from-blue-600 to-cyan-600" data-testid="azure-connection-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-outfit">Azure SQL Database</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {statusLoading ? (
                        <Badge className="bg-gray-400/20 text-gray-100 border-0">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Checking...
                        </Badge>
                      ) : azureStatus?.connected ? (
                        <Badge className="bg-green-400/20 text-green-100 border-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-red-400/20 text-red-100 border-0">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                      <span className="text-white/70 text-sm">{azureStatus?.message}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={handleRefresh}
                  data-testid="button-refresh-azure"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {azureStatus?.connected ? (
            <div className="space-y-6">
              {/* Table Selector */}
              <Card data-testid="table-selector-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Select Table</CardTitle>
                </CardHeader>
                <CardContent>
                  {tablesLoading ? (
                    <Skeleton className="h-10 w-full max-w-sm" />
                  ) : (
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger className="w-full max-w-sm" data-testid="select-table">
                        <SelectValue placeholder="Select a table to view data" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables?.map((table) => (
                          <SelectItem key={table} value={table} data-testid={`table-option-${table}`}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {tables && tables.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {tables.length} tables available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Table Data Display */}
              {selectedTable && (
                <Card data-testid="table-data-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4">
                    <CardTitle className="text-base font-semibold">{selectedTable}</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchData()}
                      data-testid="button-refresh-table"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {dataLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : tableData && tableData.length > 0 ? (
                      <ScrollArea className="w-full">
                        <div className="min-w-max">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(tableData[0]).map((column) => (
                                  <TableHead key={column} className="whitespace-nowrap font-medium">
                                    {column}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.map((row, rowIndex) => (
                                <TableRow key={rowIndex} data-testid={`table-row-${rowIndex}`}>
                                  {Object.values(row).map((value, colIndex) => (
                                    <TableCell key={colIndex} className="whitespace-nowrap">
                                      {value === null ? (
                                        <span className="text-muted-foreground italic">null</span>
                                      ) : typeof value === 'object' ? (
                                        JSON.stringify(value)
                                      ) : (
                                        String(value)
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No data found in this table</p>
                      </div>
                    )}
                    {tableData && tableData.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Showing {tableData.length} rows (max 100)
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : !statusLoading && (
            <Card className="border-dashed" data-testid="azure-not-connected-card">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Azure SQL Database Not Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Please check your Azure SQL connection settings and credentials.
                </p>
                <Button onClick={handleRefresh} data-testid="button-retry-connection">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
