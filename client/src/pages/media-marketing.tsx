import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServicePageLayout } from "@/components/service-page-layout";
import { 
  Video, 
  Camera, 
  Presentation, 
  Mail, 
  Globe, 
  FileText,
  ExternalLink,
  BarChart3,
  Share2,
  Megaphone,
  Image,
  Film,
  Layout,
  FolderOpen,
  Download,
  FileSpreadsheet,
  File,
  ChevronRight
} from "lucide-react";
import type { PageSectionWithTemplate } from "@shared/schema";

const SERVICE_URL = "/media-marketing";

const externalServices = [
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing campaigns and customer newsletters",
    icon: Mail,
    iconBg: "bg-yellow-500",
    url: "https://mailchimp.com",
  },
  {
    id: "wordpress",
    name: "WordPress",
    description: "Website content management and blog",
    icon: Globe,
    iconBg: "bg-blue-600",
    url: "https://wordpress.com",
  },
  {
    id: "easywordpress",
    name: "EasyWP",
    description: "Quick WordPress hosting and management",
    icon: Layout,
    iconBg: "bg-green-500",
    url: "https://easywp.com",
  },
  {
    id: "jotform",
    name: "JotForm",
    description: "Forms, surveys, and data collection",
    icon: FileText,
    iconBg: "bg-orange-500",
    url: "https://jotform.com",
  },
];

const mediaAssets = [
  { id: 1, type: "Video", name: "Corporate Overview 2026", size: "245 MB", date: "Jan 10, 2026" },
  { id: 2, type: "Photo", name: "Mall Grand Opening", size: "12 MB", date: "Jan 8, 2026" },
  { id: 3, type: "Presentation", name: "Q4 Investor Deck", size: "8 MB", date: "Jan 5, 2026" },
  { id: 4, type: "Video", name: "Equestrian Promo", size: "180 MB", date: "Jan 3, 2026" },
];

const documents = [
  { id: "brand-guidelines", name: "Brand Guidelines", type: "PDF", size: "2.4 MB", icon: FileText, iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600" },
  { id: "logo-pack", name: "Logo Pack", type: "ZIP", size: "15 MB", icon: Image, iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
  { id: "media-kit", name: "Media Kit 2026", type: "PDF", size: "8.2 MB", icon: File, iconBg: "bg-green-100 dark:bg-green-900/30 text-green-600" },
  { id: "content-calendar", name: "Content Calendar", type: "XLSX", size: "156 KB", icon: FileSpreadsheet, iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
];

const reportButtons = [
  { name: "Campaign Performance", icon: Megaphone, testId: "button-report-campaigns" },
  { name: "Email Analytics", icon: Mail, testId: "button-report-email" },
  { name: "Social Media Insights", icon: Share2, testId: "button-report-social" },
  { name: "Asset Usage Report", icon: Image, testId: "button-report-assets" },
];

function handleLaunchService(url: string) {
  window.open(url, "_blank");
}

function renderSection(section: PageSectionWithTemplate) {
  switch (section.title) {
    case "Media Production":
      return (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover-elevate cursor-pointer" data-testid="card-video">
            <CardContent className="p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
                <Video className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold mb-2">Video Library</h3>
              <p className="text-sm text-muted-foreground mb-4">Corporate videos, promos, and training content</p>
              <Badge variant="secondary">156 Videos</Badge>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer" data-testid="card-photo">
            <CardContent className="p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-4">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Photo Gallery</h3>
              <p className="text-sm text-muted-foreground mb-4">Event photos, product shots, and brand assets</p>
              <Badge variant="secondary">2,450 Photos</Badge>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer" data-testid="card-presentation">
            <CardContent className="p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4">
                <Presentation className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Presentations</h3>
              <p className="text-sm text-muted-foreground mb-4">Decks, proposals, and corporate templates</p>
              <Badge variant="secondary">89 Decks</Badge>
            </CardContent>
          </Card>
        </div>
      );

    case "External Services":
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {externalServices.map((service) => (
            <Card 
              key={service.id} 
              className="hover-elevate cursor-pointer" 
              onClick={() => handleLaunchService(service.url)}
              data-testid={`card-service-${service.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${service.iconBg} text-white`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-medium">{service.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{service.description}</p>
                <Button size="sm" variant="outline" className="w-full">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Launch
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case "Brand Assets":
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {documents.map((doc) => {
            const DocIcon = doc.icon;
            return (
              <div 
                key={doc.id}
                className="flex items-center gap-3 p-4 rounded-lg border hover-elevate cursor-pointer" 
                data-testid={`doc-${doc.id}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded ${doc.iconBg}`}>
                  <DocIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.type} - {doc.size}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      );

    case "Reports & Downloads":
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Media Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mediaAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded ${
                        asset.type === "Video" ? "bg-red-100 text-red-600" :
                        asset.type === "Photo" ? "bg-blue-100 text-blue-600" :
                        "bg-green-100 text-green-600"
                      }`}>
                        {asset.type === "Video" ? <Film className="h-4 w-4" /> :
                         asset.type === "Photo" ? <Image className="h-4 w-4" /> :
                         <Presentation className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.size}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{asset.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reports & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportButtons.map((report) => (
                  <Button 
                    key={report.name}
                    variant="outline" 
                    className="w-full justify-start" 
                    data-testid={report.testId}
                  >
                    <report.icon className="mr-2 h-4 w-4" />
                    {report.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );

    default:
      return null;
  }
}

export default function MediaMarketingPage() {
  return (
    <ServicePageLayout
      serviceUrl={SERVICE_URL}
      title="Media & Marketing"
      subtitle="Content management, brand assets, and marketing campaigns"
      collaborationSection="media_marketing"
      externalLinks={[
        { label: "Launch Power BI", url: "https://app.powerbi.com", icon: BarChart3 },
      ]}
      renderSection={renderSection}
    />
  );
}
