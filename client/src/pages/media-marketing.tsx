import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  File
} from "lucide-react";

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

export default function MediaMarketingPage() {
  const handleLaunchPowerBI = () => {
    window.open("https://app.powerbi.com", "_blank");
  };

  const handleLaunchService = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-outfit">Media & Marketing</h1>
          <p className="text-muted-foreground">Manage media assets, campaigns, and marketing tools</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleLaunchPowerBI} data-testid="button-launch-powerbi">
            <BarChart3 className="mr-2 h-4 w-4" />
            Launch Power BI
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-rose-600 to-orange-600 text-white border-0">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-rose-100 text-sm">Media Assets</p>
              <p className="text-3xl font-bold">1,245</p>
            </div>
            <div>
              <p className="text-rose-100 text-sm">Active Campaigns</p>
              <p className="text-3xl font-bold">8</p>
            </div>
            <div>
              <p className="text-rose-100 text-sm">Email Subscribers</p>
              <p className="text-3xl font-bold">12.5K</p>
            </div>
            <div>
              <p className="text-rose-100 text-sm">Social Reach</p>
              <p className="text-3xl font-bold">45K</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">External Services</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

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
              <Button variant="outline" className="w-full justify-start" data-testid="button-report-campaigns">
                <Megaphone className="mr-2 h-4 w-4" />
                Campaign Performance
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-report-email">
                <Mail className="mr-2 h-4 w-4" />
                Email Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-report-social">
                <Share2 className="mr-2 h-4 w-4" />
                Social Media Insights
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-report-assets">
                <Image className="mr-2 h-4 w-4" />
                Asset Usage Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-document-center">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <FolderOpen className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Document Center</CardTitle>
          </div>
          <Button variant="outline" size="sm" data-testid="button-upload-document">
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border hover-elevate cursor-pointer" data-testid="doc-brand-guidelines">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100 dark:bg-red-900/30">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Brand Guidelines</p>
                <p className="text-xs text-muted-foreground">PDF - 2.4 MB</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border hover-elevate cursor-pointer" data-testid="doc-logo-pack">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30">
                <Image className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Logo Pack</p>
                <p className="text-xs text-muted-foreground">ZIP - 15 MB</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border hover-elevate cursor-pointer" data-testid="doc-media-kit">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-green-100 dark:bg-green-900/30">
                <File className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Media Kit 2026</p>
                <p className="text-xs text-muted-foreground">PDF - 8.2 MB</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border hover-elevate cursor-pointer" data-testid="doc-content-calendar">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/30">
                <FileSpreadsheet className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Content Calendar</p>
                <p className="text-xs text-muted-foreground">XLSX - 156 KB</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
