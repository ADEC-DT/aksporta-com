import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageCollaborationStamp } from "@/components/collaboration-stamp";
import { ExpandableSection } from "@/components/expandable-section";
import { 
  Building,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Zap,
  Thermometer,
  Droplets,
  Shield
} from "lucide-react";

const fmCategories = [
  { id: "maintenance", name: "Maintenance Requests", count: 24, icon: Wrench, iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  { id: "inspections", name: "Inspections & Audits", count: 12, icon: ClipboardCheck, iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { id: "assets", name: "Asset Management", count: 156, icon: Building, iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
  { id: "safety", name: "Safety & Compliance", count: 8, icon: Shield, iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
];

const activeWorkOrders = [
  { id: "WO-2026-001", title: "HVAC Maintenance - Building A", priority: "high", status: "in_progress", assignee: "Ahmed K.", due: "Today" },
  { id: "WO-2026-002", title: "Electrical Inspection - Floor 3", priority: "medium", status: "pending", assignee: "Sara M.", due: "Tomorrow" },
  { id: "WO-2026-003", title: "Plumbing Repair - Restroom B2", priority: "high", status: "in_progress", assignee: "Omar H.", due: "Today" },
  { id: "WO-2026-004", title: "Fire Safety Check - All Floors", priority: "medium", status: "scheduled", assignee: "Team Alpha", due: "Jan 25" },
  { id: "WO-2026-005", title: "Generator Service", priority: "low", status: "completed", assignee: "External", due: "Completed" },
];

const facilityStats = [
  { name: "Open Work Orders", value: "24", icon: Wrench, trend: "-3 from last week" },
  { name: "Scheduled Maintenance", value: "12", icon: Calendar, trend: "Next 7 days" },
  { name: "Completed This Month", value: "87", icon: CheckCircle2, trend: "+15% vs last month" },
  { name: "Overdue Tasks", value: "3", icon: AlertTriangle, trend: "Requires attention" },
];

const utilityMonitoring = [
  { name: "Electricity", value: "2,450 kWh", status: "normal", icon: Zap },
  { name: "HVAC System", value: "22°C", status: "normal", icon: Thermometer },
  { name: "Water Usage", value: "1,200 L", status: "high", icon: Droplets },
];

export default function OpsFMPage() {
  const handleLaunchPowerBI = () => {
    window.open("https://app.powerbi.com", "_blank");
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">Medium</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">Pending</Badge>;
      case "scheduled":
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageCollaborationStamp sectionName="ops_fm" />
      
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <Button variant="outline" onClick={handleLaunchPowerBI} data-testid="button-launch-powerbi">
          <BarChart3 className="mr-2 h-4 w-4" />
          Launch Power BI
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Building className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-outfit">Operations & Facility Management</h1>
          </div>
          <p className="text-amber-100 mb-4">
            Manage work orders, maintenance schedules, facility inspections, and asset tracking.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {facilityStats.map((stat) => (
          <Card key={stat.name} data-testid={`stat-${stat.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.name}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ExpandableSection title="Operations & FM" icon={Wrench} defaultExpanded={true}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg font-outfit">Active Work Orders</CardTitle>
              <Button variant="ghost" size="sm" data-testid="button-view-all-orders">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeWorkOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{order.id}</span>
                        {getPriorityBadge(order.priority)}
                      </div>
                      <p className="font-medium text-sm truncate">{order.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{order.assignee}</span>
                        <span className="text-muted-foreground/50">|</span>
                        <Clock className="h-3 w-3" />
                        <span>{order.due}</span>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg font-outfit">FM Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {fmCategories.map((category) => (
                  <div 
                    key={category.id}
                    className="flex items-center gap-3 p-4 rounded-lg border hover-elevate cursor-pointer"
                    data-testid={`category-${category.id}`}
                  >
                    <div className={`p-2.5 rounded-lg ${category.iconBg}`}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.count} items</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-outfit">Utility Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {utilityMonitoring.map((utility) => (
                  <div 
                    key={utility.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    data-testid={`utility-${utility.name.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3">
                      <utility.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{utility.name}</p>
                        <p className="text-xs text-muted-foreground">{utility.value}</p>
                      </div>
                    </div>
                    {utility.status === "normal" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-outfit">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-new-work-order">
                  <Wrench className="h-4 w-4" />
                  New Work Order
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-schedule-inspection">
                  <ClipboardCheck className="h-4 w-4" />
                  Schedule Inspection
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-view-calendar">
                  <Calendar className="h-4 w-4" />
                  Maintenance Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </ExpandableSection>
    </div>
  );
}
