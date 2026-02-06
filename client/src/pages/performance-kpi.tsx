import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageCollaborationStamp } from "@/components/collaboration-stamp";
import { ExpandableSection } from "@/components/expandable-section";
import { 
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

const kpiCategories = [
  { id: "financial", name: "Financial KPIs", count: 12, icon: DollarSign, iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { id: "operational", name: "Operational KPIs", count: 18, icon: Activity, iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  { id: "customer", name: "Customer KPIs", count: 8, icon: Users, iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
  { id: "employee", name: "Employee KPIs", count: 10, icon: Target, iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
];

const keyMetrics = [
  { name: "Revenue Growth", value: "+12.5%", target: "10%", status: "above", trend: "up" },
  { name: "Customer Satisfaction", value: "87%", target: "90%", status: "below", trend: "up" },
  { name: "Employee Productivity", value: "94%", target: "85%", status: "above", trend: "up" },
  { name: "Cost Efficiency", value: "-8%", target: "-5%", status: "above", trend: "down" },
  { name: "On-Time Delivery", value: "96%", target: "95%", status: "above", trend: "up" },
  { name: "Quality Score", value: "4.6/5", target: "4.5/5", status: "above", trend: "up" },
];

const performanceAlerts = [
  { id: 1, title: "Q1 Revenue Target Review", description: "Monthly revenue below 5% of target", priority: "high" },
  { id: 2, title: "Customer Churn Rate", description: "Churn rate increased by 2% this month", priority: "medium" },
  { id: 3, title: "Inventory Turnover", description: "Turnover ratio exceeding expectations", priority: "low" },
];

const quickReports = [
  { name: "Monthly Dashboard", icon: BarChart3 },
  { name: "Quarterly Review", icon: PieChart },
  { name: "YTD Performance", icon: TrendingUp },
  { name: "Team Metrics", icon: Users },
];

export default function PerformanceKPIPage() {
  const handleLaunchPowerBI = () => {
    window.open("https://app.powerbi.com", "_blank");
  };

  const getStatusBadge = (status: string) => {
    if (status === "above") {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">On Target</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">Below Target</Badge>;
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
      <PageCollaborationStamp sectionName="performance_kpi" />
      
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <Button variant="outline" onClick={handleLaunchPowerBI} data-testid="button-launch-powerbi">
          <BarChart3 className="mr-2 h-4 w-4" />
          Launch Power BI
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-outfit">Performance & KPIs</h1>
          </div>
          <p className="text-emerald-100 mb-4">
            Monitor key performance indicators, track targets, and analyze business metrics across all departments.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keyMetrics.map((metric) => (
          <Card key={metric.name} data-testid={`metric-${metric.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Target: {metric.target}</p>
                </div>
                {getStatusBadge(metric.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ExpandableSection title="KPI Dashboard" icon={Target} defaultExpanded>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg font-outfit">KPI Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {kpiCategories.map((category) => (
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
                        <p className="text-xs text-muted-foreground">{category.count} metrics</p>
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
                  Performance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceAlerts.map((alert) => (
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-outfit">Quick Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quickReports.map((report) => (
                    <Button 
                      key={report.name}
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      data-testid={`report-${report.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <report.icon className="h-4 w-4" />
                      {report.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ExpandableSection>
    </div>
  );
}
