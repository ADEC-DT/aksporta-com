import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicePageLayout } from "@/components/service-page-layout";
import { 
  CircleDot, 
  Home, 
  GraduationCap, 
  Heart, 
  Stethoscope,
  ExternalLink,
  BarChart3,
  Calendar,
  Users,
  DollarSign
} from "lucide-react";
import type { PageSectionWithTemplate } from "@shared/schema";

const sectionRouteMap: Record<string, string> = {
  "/equestrian/overview": "Equestrian Overview",
  "/equestrian/equinem": "Equinem",
  "/equestrian/quick-stats": "Quick Stats",
};

const SERVICE_ID = "a1318a85-9804-4ca8-99dc-ad47730fb746";

const stables = [
  { id: 1, name: "Stable A", capacity: 12, occupied: 11, status: "Active" },
  { id: 2, name: "Stable B", capacity: 12, occupied: 10, status: "Active" },
  { id: 3, name: "Stable C", capacity: 12, occupied: 12, status: "Full" },
  { id: 4, name: "Stable D", capacity: 14, occupied: 9, status: "Active" },
];

const ridingClasses = [
  { id: 1, name: "Beginner Dressage", instructor: "Sarah Ahmed", students: 8, time: "9:00 AM" },
  { id: 2, name: "Advanced Jumping", instructor: "John Smith", students: 5, time: "11:00 AM" },
  { id: 3, name: "Children's Riding", instructor: "Maria Garcia", students: 10, time: "2:00 PM" },
  { id: 4, name: "Evening Trail Ride", instructor: "Ahmed Hassan", students: 6, time: "5:00 PM" },
];

const therapySchedule = [
  { id: 1, patient: "Child A", therapy: "Hippotherapy", horse: "Luna", time: "10:00 AM" },
  { id: 2, patient: "Child B", therapy: "Therapeutic Riding", horse: "Storm", time: "11:30 AM" },
  { id: 3, patient: "Adult C", therapy: "Equine-Assisted Therapy", horse: "Bella", time: "2:00 PM" },
];

function RenderEquestrianSection({ section }: { section: PageSectionWithTemplate }) {
  const [activeTab, setActiveTab] = useState("livery");

  const handleLaunchEzyVet = () => {
    window.open("https://ezyvet.com", "_blank");
  };

  switch (section.title) {
    case "Equestrian Overview":
      return (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <p className="text-emerald-100 text-sm">Total Horses</p>
                  <p className="text-3xl font-bold">42</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Stables Occupied</p>
                  <p className="text-3xl font-bold">42/50</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Monthly Revenue</p>
                  <p className="text-3xl font-bold">$450K</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Active Members</p>
                  <p className="text-3xl font-bold">186</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl">
              <TabsTrigger value="livery" data-testid="tab-livery">
                <Home className="mr-2 h-4 w-4" />
                Livery
              </TabsTrigger>
              <TabsTrigger value="stable" data-testid="tab-stable">
                <CircleDot className="mr-2 h-4 w-4" />
                Stable Mgmt
              </TabsTrigger>
              <TabsTrigger value="riding" data-testid="tab-riding">
                <GraduationCap className="mr-2 h-4 w-4" />
                Riding School
              </TabsTrigger>
              <TabsTrigger value="therapy" data-testid="tab-therapy">
                <Heart className="mr-2 h-4 w-4" />
                Therapeutic
              </TabsTrigger>
              <TabsTrigger value="vet" data-testid="tab-vet">
                <Stethoscope className="mr-2 h-4 w-4" />
                Vet Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="livery" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Livery Services Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">32</p>
                      <p className="text-sm text-muted-foreground">Full Livery</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-sm text-muted-foreground">Part Livery</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">2</p>
                      <p className="text-sm text-muted-foreground">DIY Livery</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Full livery includes daily feeding, turnout, grooming, and exercise. Part livery provides basic care with owner responsibilities for exercise.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stable" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stable Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stables.map((stable) => (
                      <Card key={stable.id} className="hover-elevate">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{stable.name}</h4>
                            <Badge variant={stable.status === "Full" ? "destructive" : "secondary"}>
                              {stable.status}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold">{stable.occupied}/{stable.capacity}</p>
                          <p className="text-sm text-muted-foreground">Stalls occupied</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="riding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ridingClasses.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            <p className="text-sm text-muted-foreground">Instructor: {cls.instructor}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{cls.time}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">{cls.students} students</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="therapy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Therapeutic Center</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-center">
                      <Heart className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                      <p className="font-medium">Hippotherapy</p>
                      <p className="text-sm text-muted-foreground">Medical treatment</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
                      <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="font-medium">Therapeutic Riding</p>
                      <p className="text-sm text-muted-foreground">Recreational therapy</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                      <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="font-medium">Equine-Assisted</p>
                      <p className="text-sm text-muted-foreground">Mental health support</p>
                    </div>
                  </div>
                  <h4 className="font-medium mb-3">Today's Sessions</h4>
                  <div className="space-y-3">
                    {therapySchedule.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{session.patient}</p>
                          <p className="text-sm text-muted-foreground">{session.therapy} with {session.horse}</p>
                        </div>
                        <Badge>{session.time}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vet" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="text-lg">Veterinary Services</CardTitle>
                  <Button onClick={handleLaunchEzyVet} data-testid="button-launch-ezyvet">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Launch EZYVET
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-green-600">38</p>
                      <p className="text-sm text-muted-foreground">Healthy Horses</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-yellow-600">3</p>
                      <p className="text-sm text-muted-foreground">Under Treatment</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-blue-600">1</p>
                      <p className="text-sm text-muted-foreground">Scheduled Checkups</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-medical-records">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      View Medical Records
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-vaccination">
                      <Calendar className="mr-2 h-4 w-4" />
                      Vaccination Schedule
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-vet-expenses">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Vet Expenses Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      );

    case "Equinem":
      return null;

    case "Quick Stats":
      return null;

    default:
      return null;
  }
}

function renderSection(section: PageSectionWithTemplate) {
  return <RenderEquestrianSection section={section} />;
}

export default function EquestrianPage() {
  const [location] = useLocation();
  const activeSectionTitle = sectionRouteMap[location] || null;

  const filterSection = (section: PageSectionWithTemplate) => {
    if (!activeSectionTitle) return true;
    return section.title === activeSectionTitle;
  };

  return (
    <ServicePageLayout
      serviceId={SERVICE_ID}
      title="Equestrian Center"
      subtitle="Complete management of riding school, livery, and veterinary services"
      collaborationSection="equestrian"
      externalLinks={[
        { label: "Launch Power BI", url: "https://app.powerbi.com", icon: BarChart3 },
      ]}
      renderSection={renderSection}
      sectionFilter={filterSection}
    />
  );
}
