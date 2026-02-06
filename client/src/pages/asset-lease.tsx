import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageCollaborationStamp } from "@/components/collaboration-stamp";
import { ExpandableSection } from "@/components/expandable-section";
import { 
  Store, 
  Building, 
  DollarSign, 
  Users, 
  TrendingUp,
  ExternalLink,
  BarChart3,
  Calendar,
  FileText,
  MapPin
} from "lucide-react";

const shopData = [
  { id: 1, name: "Luxury Watches", unit: "G-01", tenant: "TimeZone LLC", status: "Occupied", rent: 15000, leaseEnd: "Dec 2026" },
  { id: 2, name: "Fashion Boutique", unit: "G-02", tenant: "Style Co.", status: "Occupied", rent: 18000, leaseEnd: "Mar 2027" },
  { id: 3, name: "Jewelry Store", unit: "G-03", tenant: "Diamond Dreams", status: "Occupied", rent: 22000, leaseEnd: "Jun 2026" },
  { id: 4, name: "Café Corner", unit: "G-04", tenant: "Brew Masters", status: "Occupied", rent: 12000, leaseEnd: "Sep 2026" },
  { id: 5, name: "Electronics Hub", unit: "G-05", tenant: "TechWorld", status: "Occupied", rent: 16000, leaseEnd: "Jan 2027" },
  { id: 6, name: "Beauty Salon", unit: "G-06", tenant: "", status: "Vacant", rent: 14000, leaseEnd: "-" },
  { id: 7, name: "Art Gallery", unit: "F-01", tenant: "ArtSpace", status: "Occupied", rent: 20000, leaseEnd: "Nov 2026" },
  { id: 8, name: "Sports Store", unit: "F-02", tenant: "FitGear", status: "Occupied", rent: 17000, leaseEnd: "Aug 2026" },
];

const floorSummary = [
  { floor: "Ground Floor", total: 16, occupied: 15, revenue: 248000 },
  { floor: "First Floor", total: 12, occupied: 11, revenue: 187000 },
  { floor: "Second Floor", total: 4, occupied: 3, revenue: 45000 },
];

export default function AssetLeasePage() {
  const handleLaunchPowerBI = () => {
    window.open("https://app.powerbi.com", "_blank");
  };

  const totalShops = 32;
  const occupiedShops = 29;
  const vacantShops = totalShops - occupiedShops;
  const occupancyRate = Math.round((occupiedShops / totalShops) * 100);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageCollaborationStamp sectionName="asset_lease" />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-outfit">Asset and Lease Management</h1>
          <p className="text-muted-foreground">Boutique Mall - 32 retail units management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleLaunchPowerBI} data-testid="button-launch-powerbi">
            <BarChart3 className="mr-2 h-4 w-4" />
            Launch Power BI
          </Button>
        </div>
      </div>

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
              <p className="text-3xl font-bold">$480K</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpandableSection title="Assets & Leases" icon={Store} defaultExpanded={true}>
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
                  <span className="font-medium">{Math.round((floor.occupied / floor.total) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2" 
                    style={{ width: `${(floor.occupied / floor.total) * 100}%` }}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lease Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Jewelry Store (G-03)</p>
                    <p className="text-sm text-muted-foreground">Diamond Dreams</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-700">Expires Jun 2026</p>
                  <Button size="sm" variant="outline" className="mt-1">Renew</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sports Store (F-02)</p>
                    <p className="text-sm text-muted-foreground">FitGear</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Expires Aug 2026</p>
                  <Button size="sm" variant="outline" className="mt-1">View</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reports & Analytics</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
      </ExpandableSection>
    </div>
  );
}
