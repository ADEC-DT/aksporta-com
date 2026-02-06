import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageCollaborationStamp } from "@/components/collaboration-stamp";
import { ExpandableSection } from "@/components/expandable-section";
import { 
  Search, 
  FileText,
  Scale,
  Shield,
  FileCheck,
  AlertTriangle,
  ChevronRight,
  Clock,
  Download,
  BarChart3,
  Building2,
  Gavel,
  ScrollText
} from "lucide-react";

const legalCategories = [
  { id: "contracts", name: "Contracts & Agreements", count: 24, icon: FileCheck, iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  { id: "compliance", name: "Compliance & Regulatory", count: 18, icon: Shield, iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { id: "corporate", name: "Corporate Governance", count: 12, icon: Building2, iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
  { id: "ip", name: "Intellectual Property", count: 8, icon: ScrollText, iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
];

const recentDocuments = [
  { id: 1, name: "Standard Vendor Agreement Template", type: "DOCX", size: "156 KB", date: "Jan 20, 2026", status: "active" },
  { id: 2, name: "NDA - Mutual Non-Disclosure", type: "PDF", size: "89 KB", date: "Jan 18, 2026", status: "active" },
  { id: 3, name: "Employment Contract Template v3", type: "DOCX", size: "234 KB", date: "Jan 15, 2026", status: "active" },
  { id: 4, name: "Data Processing Agreement", type: "PDF", size: "312 KB", date: "Jan 12, 2026", status: "review" },
  { id: 5, name: "Lease Agreement - Commercial", type: "PDF", size: "445 KB", date: "Jan 10, 2026", status: "active" },
];

const complianceAlerts = [
  { 
    id: 1, 
    title: "Annual Privacy Policy Review", 
    description: "Required annual review due by February 28, 2026",
    priority: "medium",
    dueDate: "Feb 28, 2026"
  },
  { 
    id: 2, 
    title: "Vendor Contract Renewals", 
    description: "3 vendor contracts expiring in the next 30 days require review",
    priority: "high",
    dueDate: "Feb 15, 2026"
  },
  { 
    id: 3, 
    title: "Employment Law Update", 
    description: "New labor regulations effective March 1 - policy updates needed",
    priority: "medium",
    dueDate: "Mar 01, 2026"
  },
];

const quickLinks = [
  { name: "Contract Request Form", icon: FileText },
  { name: "Legal Review Portal", icon: Scale },
  { name: "Compliance Training", icon: Shield },
  { name: "Policy Library", icon: ScrollText },
];

export default function LegalPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
      case "active":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">Active</Badge>;
      case "review":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">In Review</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageCollaborationStamp sectionName="legal" />
      
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <Button variant="outline" onClick={handleLaunchPowerBI} data-testid="button-launch-powerbi">
          <BarChart3 className="mr-2 h-4 w-4" />
          Launch Power BI
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-slate-700 to-slate-900 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Gavel className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-outfit">Legal & Compliance</h1>
          </div>
          <p className="text-slate-300 mb-6">
            Manage contracts, compliance documents, regulatory requirements, and legal resources.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search contracts, policies, or legal documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              data-testid="input-legal-search"
            />
          </div>
        </CardContent>
      </Card>

      <ExpandableSection title="Legal Documents" icon={Scale} defaultExpanded>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg font-outfit">Document Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {legalCategories.map((category) => (
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
                        <p className="text-xs text-muted-foreground">{category.count} documents</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg font-outfit">Recent Documents</CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all-documents">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDocuments.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{doc.type}</span>
                          <span className="text-muted-foreground/50">|</span>
                          <span>{doc.size}</span>
                          <span className="text-muted-foreground/50">|</span>
                          <span>{doc.date}</span>
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                      <Button variant="ghost" size="icon" data-testid={`button-download-${doc.id}`}>
                        <Download className="h-4 w-4" />
                      </Button>
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
                  Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceAlerts.map((alert) => (
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
                        Due: {alert.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-outfit">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quickLinks.map((link) => (
                    <Button 
                      key={link.name}
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
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
