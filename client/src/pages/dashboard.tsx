import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageCollaborationStamp } from "@/components/collaboration-stamp";
import { 
  DollarSign, 
  Users, 
  Building2, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  User,
  FileText,
  Calendar,
  Wrench,
  ArrowRight,
  BarChart3,
  Building,
  Laptop
} from "lucide-react";

const metrics = [
  {
    title: "Total Revenue",
    value: "$4.2M",
    change: "+12.5%",
    trend: "up",
    subtitle: "from last month",
    icon: DollarSign,
    iconColor: "text-green-500",
  },
  {
    title: "Active Employees",
    value: "1,240",
    change: "+4.1%",
    trend: "up",
    subtitle: "from last month",
    icon: Users,
    iconColor: "text-blue-500",
  },
  {
    title: "Retail Occupancy",
    value: "92%",
    change: "-1.2%",
    trend: "down",
    subtitle: "from last month",
    icon: Building2,
    iconColor: "text-orange-500",
  },
  {
    title: "System Uptime",
    value: "99.9%",
    change: "Stable",
    trend: "stable",
    subtitle: "from last month",
    icon: Activity,
    iconColor: "text-purple-500",
  },
];

const businessApplications = [
  {
    id: "netsuite",
    name: "NetSuite",
    description: "Financial management, procurement, and inventory control.",
    category: "Finance & ERP",
    status: "Operational",
    statusColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    iconBg: "bg-blue-600",
    iconText: "N",
    url: "/erp",
  },
  {
    id: "kayan",
    name: "Kayan HRMS",
    description: "Employee directory, payroll, leaves, and performance.",
    category: "Human Resources",
    status: "New",
    statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    iconBg: "bg-teal-500",
    iconText: "K",
    url: "/hr",
  },
  {
    id: "powerbi",
    name: "Power BI",
    description: "Centralized business intelligence and reporting dashboards.",
    category: "Analytics",
    status: "Operational",
    statusColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    iconBg: "bg-yellow-500",
    iconText: "P",
    url: "/analytics",
  },
  {
    id: "lease",
    name: "Asset & Lease Management",
    description: "Asset tracking and lease agreement management.",
    category: "Real Estate",
    status: "Beta",
    statusColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    iconBg: "bg-indigo-500",
    iconText: "A",
    url: "/asset-lease",
  },
  {
    id: "equestrian",
    name: "Equestrian Center",
    description: "Stable management, booking, and veterinary records.",
    category: "Operations",
    status: "Coming Soon",
    statusColor: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    iconBg: "bg-emerald-500",
    iconText: "E",
    url: "/equestrian",
  },
];

const intranetUpdates = [
  {
    id: 1,
    title: "New HR Policy Update",
    date: "Today",
    category: "Policy",
    categoryColor: "text-blue-500",
  },
  {
    id: 2,
    title: "Q4 Financial Results Townhall",
    date: "Tomorrow, 2:00 PM",
    category: "Events",
    categoryColor: "text-orange-500",
  },
  {
    id: 3,
    title: "Maintenance Scheduled for NetSuite",
    date: "Jan 15",
    category: "System",
    categoryColor: "text-purple-500",
  },
];

const quickLinks = [
  { title: "IT Support Request", icon: Laptop },
  { title: "Expense Claims", icon: FileText },
  { title: "Meeting Room Booking", icon: Calendar },
];

export default function Dashboard() {
  const { user } = useAuth();
  
  const firstName = user?.firstName || user?.username || "User";

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-6">
        <PageCollaborationStamp sectionName="dashboard" />
      </div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-10 md:px-10 md:py-14">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 text-[200px] font-bold text-white/5 tracking-tighter leading-none select-none">
            ABSTRACT<br/>BACKGROUND
          </div>
        </div>
        
        <div className="relative z-10">
          <Badge className="bg-primary/20 text-primary border-0 mb-4">
            Welcome back, {firstName}
          </Badge>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-outfit">
            Enterprise Operations
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 font-outfit">
            Unified Portal
          </h2>
          
          <p className="text-slate-300 max-w-xl mb-6">
            Access all business operational units, BI tools, and support systems
            from a single centralized hub.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Link href="/settings">
              <Button 
                variant="outline" 
                className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
                data-testid="button-view-profile"
              >
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards - temporarily hidden
      <div className="px-6 md:px-10 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.title} className="bg-card/95 backdrop-blur-sm shadow-lg border-card-border" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{metric.title}</span>
                  <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                </div>
                <div className="text-2xl font-bold font-outfit">{metric.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend === "up" && (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  )}
                  {metric.trend === "down" && (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${metric.trend === "up" ? "text-green-500" : metric.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                    {metric.change}
                  </span>
                  <span className="text-xs text-muted-foreground">{metric.subtitle}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      */}

      {/* Main Content Grid */}
      <div className="flex-1 px-6 md:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Applications - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-outfit">Business Applications</h3>
              <Link href="/business-units">
                <Button variant="ghost" size="sm" className="text-primary" data-testid="button-view-all-apps">
                  View All Apps
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business applications cards temporarily removed */}
            </div>

            {/* Power BI Dashboard */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold font-outfit">Power BI Dashboard</h3>
              </div>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <iframe
                    title="Power BI Report"
                    src="https://app.powerbi.com/reportEmbed?reportId=e33349d0-6d3e-490f-b375-85e1525cfc64&autoAuth=true&ctid=0f3ed57e-4b52-4eda-87b3-26744d95f8e3"
                    className="w-full border-0"
                    style={{ height: "600px" }}
                    allowFullScreen
                    data-testid="powerbi-embed"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Intranet Updates - Takes 1 column */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold font-outfit mb-1">Intranet Updates</h3>
                <p className="text-sm text-muted-foreground mb-4">Latest news and announcements</p>
                
                <div className="space-y-4">
                  {/* News items temporarily removed */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Quick Links</h3>
                </div>
                
                <div className="space-y-2">
                  {/* Quick links temporarily removed */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
