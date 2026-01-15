import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Users, 
  Shield, 
  FileText, 
  Palette,
  ChevronRight,
  Clock,
  MessageSquare,
  Download,
  BarChart3,
  Ticket
} from "lucide-react";

const categories = [
  { id: "hr", name: "HR Policies", count: 12, icon: Users, iconBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30" },
  { id: "security", name: "IT & Security", count: 8, icon: Shield, iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { id: "procurement", name: "Procurement Guidelines", count: 5, icon: FileText, iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
  { id: "branding", name: "Corporate Branding", count: 3, icon: Palette, iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
];

const recentDocuments = [
  { id: 1, name: "2026 Employee Handbook", type: "PDF", size: "2.4 MB", date: "Jan 10, 2026" },
  { id: 2, name: "Remote Work Guidelines", type: "PDF", size: "1.1 MB", date: "Jan 08, 2026" },
  { id: 3, name: "Travel Expense Policy v2", type: "DOCX", size: "850 KB", date: "Jan 05, 2026" },
  { id: 4, name: "Brand Assets & Logos", type: "ZIP", size: "43 MB", date: "Dec 28, 2025" },
];

const announcements = [
  { 
    id: 1, 
    title: "System Maintenance: NetSuite", 
    content: "Planned downtime this Saturday from 2:00 AM to 6:00 AM for quarterly updates.",
    time: "2 hours ago",
    isNew: true
  },
  { 
    id: 2, 
    title: "Welcome New Chief Strategy Officer", 
    content: "We are pleased to announce the appointment of Sarah Jenkins as CSO effective next week.",
    time: "Yesterday",
    isNew: false
  },
];

export default function IntranetPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleLaunchPowerBI = () => {
    window.open("https://app.powerbi.com", "_blank");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <Button variant="outline" onClick={handleLaunchPowerBI} data-testid="button-launch-powerbi">
          <BarChart3 className="mr-2 h-4 w-4" />
          Launch Power BI
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold font-outfit mb-2">Knowledge Base & Intranet</h1>
          <p className="text-blue-100 mb-6">
            Find regulations, policies, forms, and the latest company announcements in one place.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for documents, policies, or people..."
              className="pl-12 h-12 bg-white dark:bg-gray-900 text-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-intranet"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Browse Categories
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-category-${category.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${category.iconBg}`}>
                          <category.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.count} articles</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Documents
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentDocuments.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                      data-testid={`doc-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {doc.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className={`h-2 w-2 rounded-full mt-2 ${announcement.isNew ? "bg-blue-500" : "bg-gray-400"}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">{announcement.time}</p>
                      <p className="font-medium text-sm">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground">{announcement.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" data-testid="button-view-announcements">
                View All Announcements
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Need Support?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Raise a ticket for IT, HR, or Facility Management issues directly from here.
              </p>
              <Link href="/tickets/new">
                <Button variant="secondary" className="w-full" data-testid="button-create-request">
                  <Ticket className="mr-2 h-4 w-4" />
                  Create Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
