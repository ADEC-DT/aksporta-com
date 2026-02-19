import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ExpandableSection } from "@/components/expandable-section";
import { DetailPanel } from "@/components/detail-panel";
import { 
  User,
  ArrowRight,
  BarChart3,
  Wrench,
  Laptop,
  FileText,
  Calendar,
  ExternalLink
} from "lucide-react";

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
    name: "Asset & Lease",
    description: "Asset tracking and lease agreement management.",
    category: "Real Estate",
    status: "Beta",
    statusColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    iconBg: "bg-indigo-500",
    iconText: "A",
    url: "/asset-lease",
  },
];

interface IntranetItem {
  id: number;
  title: string;
  date: string;
  preview: string;
  dotColor: string;
  body: string;
  author: string;
}

const intranetUpdates: IntranetItem[] = [
  {
    id: 1,
    title: "New HR Policy Update",
    date: "Today",
    preview: "Updated leave policy for Q1 2026 has been published across all departments.",
    dotColor: "bg-blue-500",
    body: "The updated leave policy for Q1 2026 is now effective. Key changes include: increased annual leave from 22 to 25 days, new parental leave entitlements, and revised sick leave documentation requirements. All department heads should ensure their teams are briefed on the new policy by end of this week. Contact HR for any clarifications.",
    author: "HR Department",
  },
  {
    id: 2,
    title: "Q4 Financial Results Townhall",
    date: "Tomorrow, 2:00 PM",
    preview: "All-hands meeting to discuss financial performance and 2026 outlook.",
    dotColor: "bg-green-500",
    body: "Join us for the Q4 2025 Financial Results Townhall. The CFO will present the annual financial performance, discuss key highlights, and outline the strategic budget allocation for 2026. Attendance is mandatory for all department managers. The meeting will be held in the main conference hall with remote access available via Teams.",
    author: "Finance Team",
  },
  {
    id: 3,
    title: "NetSuite Maintenance Window",
    date: "Jan 15, 11 PM",
    preview: "Scheduled system maintenance for NetSuite ERP -- expect 3 hours of downtime.",
    dotColor: "bg-amber-500",
    body: "A scheduled maintenance window for NetSuite ERP is planned for January 15th from 11:00 PM to 2:00 AM (UAE time). During this period, all NetSuite modules including financial reporting, inventory management, and procurement workflows will be temporarily unavailable. Please plan accordingly and complete any urgent transactions before the maintenance window.",
    author: "IT & DT Department",
  },
  {
    id: 4,
    title: "Employee Wellness Program Launch",
    date: "Next Week",
    preview: "New wellness initiatives including gym memberships and mental health support.",
    dotColor: "bg-purple-500",
    body: "We are excited to announce the launch of our comprehensive Employee Wellness Program starting next week. The program includes subsidized gym memberships, weekly yoga sessions, mental health counseling services, and quarterly wellness challenges. Registration opens this Friday through the HRMS self-service portal.",
    author: "People & Culture",
  },
];

const quickLinks = [
  { title: "IT Support Request", icon: Laptop, url: "/intranet" },
  { title: "Expense Claims", icon: FileText, url: "/erp" },
  { title: "Meeting Room Booking", icon: Calendar, url: "/events" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedUpdate, setSelectedUpdate] = useState<IntranetItem | null>(null);
  
  const firstName = user?.firstName || user?.username || "User";

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 md:px-10 md:py-10">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute right-0 top-0 text-[200px] font-bold text-white/5 tracking-tighter leading-none select-none">
            UNIFIED
          </div>
        </div>
        
        <div className="relative z-10">
          <Badge className="bg-primary/20 text-primary border-0 mb-3">
            Welcome back, {firstName}
          </Badge>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 font-outfit">
            Enterprise Operations
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-primary mb-3 font-outfit">
            Unified Portal
          </h2>
          
          <p className="text-slate-300 max-w-xl mb-5 text-sm">
            Access all business operational units, BI tools, and support systems
            from a single centralized hub.
          </p>
          
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

      <div className="flex-1 px-6 md:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h3 className="text-lg font-semibold font-outfit">Business Applications</h3>
                <Link href="/business-units">
                  <Button variant="ghost" size="sm" className="text-primary" data-testid="button-view-all-apps">
                    View All Apps
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {businessApplications.map((app) => (
                  <Link key={app.id} href={app.url}>
                    <Card className="hover-elevate cursor-pointer" data-testid={`app-card-${app.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${app.iconBg} text-white text-sm font-bold flex-shrink-0`}>
                            {app.iconText}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold">{app.name}</h4>
                              <Badge variant="outline" className={`text-[10px] ${app.statusColor} border-0`}>
                                {app.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{app.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            <ExpandableSection
              title="Power BI Dashboard 2"
              icon={BarChart3}
              maxHeight="600px"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <iframe
                    title="Power BI Report 2"
                    src="https://app.powerbi.com/reportEmbed?reportId=e33349d0-6d3e-490f-b375-85e1525cfc64&autoAuth=true&ctid=0f3ed57e-4b52-4eda-87b3-26744d95f8e3"
                    className="w-full border-0"
                    style={{ height: "600px" }}
                    allowFullScreen
                    data-testid="powerbi-embed-2"
                  />
                </CardContent>
              </Card>
            </ExpandableSection>

            <ExpandableSection
              title="Power BI Dashboard"
              icon={BarChart3}
              maxHeight="600px"
            >
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
            </ExpandableSection>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-base font-semibold font-outfit mb-1">Intranet Updates</h3>
                <p className="text-xs text-muted-foreground mb-4">Latest news and announcements</p>
                
                <div className="space-y-1">
                  {intranetUpdates.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2.5 -mx-1 rounded-md hover-elevate cursor-pointer"
                      onClick={() => setSelectedUpdate(item)}
                      data-testid={`intranet-item-${item.id}`}
                    >
                      <div className={`h-2 w-2 rounded-full ${item.dotColor} mt-1.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.preview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Quick Links</h3>
                </div>
                
                <div className="space-y-1">
                  {quickLinks.map((link) => (
                    <Link key={link.title} href={link.url}>
                      <div
                        className="flex items-center gap-3 p-2.5 -mx-1 rounded-md hover-elevate cursor-pointer"
                        data-testid={`quick-link-${link.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <link.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{link.title}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DetailPanel
        isOpen={!!selectedUpdate}
        onClose={() => setSelectedUpdate(null)}
        title={selectedUpdate?.title || ""}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedUpdate(null)} data-testid="button-close-update">
              Close
            </Button>
          </div>
        }
      >
        {selectedUpdate && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${selectedUpdate.dotColor}`} />
              <span className="text-xs text-muted-foreground">{selectedUpdate.date}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              By {selectedUpdate.author}
            </p>
            <div className="border-t border-border pt-4">
              <p className="text-sm leading-relaxed">{selectedUpdate.body}</p>
            </div>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
