import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { 
  Monitor,
  Server,
  Shield,
  Cloud,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  RefreshCw,
  Ticket,
  Users
} from "lucide-react";

const itCategories = [
  { id: "infrastructure", name: "Infrastructure", count: 45, icon: Server, iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  { id: "security", name: "Cybersecurity", count: 18, icon: Shield, iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30" },
  { id: "cloud", name: "Cloud Services", count: 12, icon: Cloud, iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
  { id: "support", name: "IT Support", count: 34, icon: Ticket, iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30" },
];

const systemStatus = [
  { name: "ERP System", status: "operational", uptime: "99.9%", icon: Monitor },
  { name: "Email Server", status: "operational", uptime: "99.8%", icon: Server },
  { name: "Network", status: "operational", uptime: "99.7%", icon: Wifi },
  { name: "VPN Gateway", status: "degraded", uptime: "98.5%", icon: Lock },
];

const activeProjects = [
  { id: 1, name: "Cloud Migration Phase 2", progress: 65, status: "on_track", lead: "IT Team A" },
  { id: 2, name: "Security Audit Implementation", progress: 40, status: "on_track", lead: "Security Team" },
  { id: 3, name: "Network Upgrade", progress: 85, status: "on_track", lead: "Infrastructure" },
  { id: 4, name: "ERP Integration Module", progress: 20, status: "delayed", lead: "Development" },
];

const itStats = [
  { name: "Open Tickets", value: "34", trend: "-5 from yesterday" },
  { name: "Active Users", value: "256", trend: "Online now" },
  { name: "System Uptime", value: "99.9%", trend: "Last 30 days" },
  { name: "Security Score", value: "A+", trend: "No threats detected" },
];

const recentAlerts = [
  { id: 1, title: "VPN Gateway Performance", description: "Latency increased by 15%", priority: "medium", time: "2 hours ago" },
  { id: 2, title: "Storage Capacity", description: "Primary storage at 78% capacity", priority: "low", time: "5 hours ago" },
  { id: 3, title: "Failed Login Attempts", description: "3 failed attempts from unknown IP", priority: "high", time: "1 hour ago" },
];

export default function ITDTPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive" data-testid="text-access-denied">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground" data-testid="text-access-denied-message">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLaunchPowerBI = () => {
    window.open("https://app.powerbi.com", "_blank");
  };

  const getStatusIndicator = (status: string) => {
    if (status === "operational") {
      return <div className="w-2.5 h-2.5 rounded-full bg-green-500" />;
    }
    if (status === "degraded") {
      return <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />;
    }
    return <div className="w-2.5 h-2.5 rounded-full bg-red-500" />;
  };

  const getProjectStatus = (status: string) => {
    if (status === "on_track") {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">On Track</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">Delayed</Badge>;
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

  return (
    <div className="flex flex-col gap-6 p-6">
      
      <Card className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-outfit">IT & Digital Transformation</h1>
          </div>
          <p className="text-cyan-100 mb-4">
            Manage IT infrastructure, digital initiatives, cybersecurity, and technology transformation projects.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {itStats.map((stat) => (
          <Card key={stat.name} data-testid={`stat-${stat.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg font-outfit">System Status</CardTitle>
              <Button variant="ghost" size="sm" data-testid="button-refresh-status">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {systemStatus.map((system) => (
                  <div 
                    key={system.name}
                    className="flex items-center gap-3 p-4 rounded-lg border"
                    data-testid={`system-${system.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <system.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{system.name}</p>
                      <p className="text-xs text-muted-foreground">Uptime: {system.uptime}</p>
                    </div>
                    {getStatusIndicator(system.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg font-outfit">Digital Transformation Projects</CardTitle>
              <Button variant="ghost" size="sm" data-testid="button-view-all-projects">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="p-3 rounded-lg border"
                    data-testid={`project-${project.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-medium text-sm">{project.name}</p>
                      {getProjectStatus(project.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Lead: {project.lead}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg font-outfit">IT Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {itCategories.map((category) => (
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
              <CardTitle className="text-lg font-outfit flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-3 rounded-lg border space-y-2"
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{alert.title}</p>
                      {getPriorityBadge(alert.priority)}
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {alert.time}
                    </div>
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
                <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-new-ticket">
                  <Ticket className="h-4 w-4" />
                  New IT Ticket
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-service-status">
                  <Server className="h-4 w-4" />
                  Service Status
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-security-dashboard">
                  <Shield className="h-4 w-4" />
                  Security Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
