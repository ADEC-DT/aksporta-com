import { UnderDevelopmentBanner } from "@/components/under-development-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServicePageLayout } from "@/components/service-page-layout";
import { OtherModulesSection } from "@/components/other-modules-section";
import { 
  Store, 
  Building, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  Calendar,
  FileText
} from "lucide-react";
import type { PageSectionWithTemplate } from "@shared/schema";

const SERVICE_URL = "/asset-lease";

const shopData: { id: number; name: string; unit: string; tenant: string; status: string; rent: number; leaseEnd: string }[] = [];

const floorSummary = [
  { floor: "Ground Floor", total: 0, occupied: 0, revenue: 0 },
  { floor: "First Floor", total: 0, occupied: 0, revenue: 0 },
  { floor: "Second Floor", total: 0, occupied: 0, revenue: 0 },
];

const totalShops = 0;
const occupiedShops = 0;
const vacantShops = 0;
const occupancyRate = 0;

function renderSection(section: PageSectionWithTemplate) {
  switch (section.title) {
    case "Property Overview":
      return (
        <Card className="bg-gradient-to-r from-pink-600 to-rose-600 text-white border-0">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-5">
              <div>
                <p className="text-pink-100 text-sm">Total Units</p>
                <p className="text-3xl font-bold">{totalShops}</p>
              </div>
              <div>
                <p className="text-pink-100 text-sm">Occupied</p>
                <p className="text-3xl font-bold">{occupiedShops}</p>
              </div>
              <div>
                <p className="text-pink-100 text-sm">Vacant</p>
                <p className="text-3xl font-bold">{vacantShops}</p>
              </div>
              <div>
                <p className="text-pink-100 text-sm">Occupancy Rate</p>
                <p className="text-3xl font-bold">{occupancyRate}%</p>
              </div>
              <div>
                <p className="text-pink-100 text-sm">Monthly Revenue</p>
                <p className="text-3xl font-bold">$0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case "Assets & Leases":
      return (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {floorSummary.map((floor) => (
              <Card key={floor.floor} className="hover-elevate" data-testid={`card-floor-${floor.floor}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{floor.floor}</h3>
                    <Badge variant="secondary">{floor.occupied}/{floor.total} Occupied</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-medium">{floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2" 
                        style={{ width: `${floor.total > 0 ? (floor.occupied / floor.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-muted-foreground">Monthly Revenue</span>
                      <span className="font-medium">${(floor.revenue / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Shop Directory</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {occupiedShops} Occupied
                </Badge>
                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {vacantShops} Vacant
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {shopData.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">No shops to display.</p>
                )}
                {shopData.map((shop) => (
                  <Card 
                    key={shop.id} 
                    className={`hover-elevate ${shop.status === "Vacant" ? "border-dashed border-2" : ""}`}
                    data-testid={`card-shop-${shop.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{shop.unit}</Badge>
                        <Badge className={shop.status === "Occupied" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {shop.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-1">{shop.name}</h4>
                      {shop.tenant ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">{shop.tenant}</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>${shop.rent.toLocaleString()}/mo</span>
                            <span>Ends: {shop.leaseEnd}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Available for lease</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      );

    case "Lease Renewals":
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">No lease renewals to display.</p>
        </div>
      );

    case "Reports & Analytics":
      return (
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" data-testid="button-report-occupancy">
            <Building className="mr-2 h-4 w-4" />
            Occupancy Report
          </Button>
          <Button variant="outline" className="w-full justify-start" data-testid="button-report-revenue">
            <DollarSign className="mr-2 h-4 w-4" />
            Revenue Analysis
          </Button>
          <Button variant="outline" className="w-full justify-start" data-testid="button-report-leases">
            <FileText className="mr-2 h-4 w-4" />
            Lease Summary
          </Button>
          <Button variant="outline" className="w-full justify-start" data-testid="button-report-footfall">
            <TrendingUp className="mr-2 h-4 w-4" />
            Footfall Analytics
          </Button>
        </div>
      );

    default:
      return null;
  }
}

export default function AssetLeasePage() {
  return (
    <ServicePageLayout
      serviceUrl={SERVICE_URL}
      title="Asset and Lease Management"
      subtitle="Boutique Mall - retail units management"
      collaborationSection="asset_lease"
      externalLinks={[
        { label: "Launch Power BI", url: "https://app.powerbi.com", icon: BarChart3 },
      ]}
      renderSection={renderSection}
    >
      <UnderDevelopmentBanner />
      <OtherModulesSection />
    </ServicePageLayout>
  );
}
