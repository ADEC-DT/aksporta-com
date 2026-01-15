import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Star, 
  Trophy, 
  Users, 
  ExternalLink,
  BarChart3,
  Sparkles,
  PartyPopper
} from "lucide-react";

const upcomingEvents = [
  { id: 1, name: "Annual Gala Dinner", date: "Feb 14, 2026", type: "Corporate", attendees: 250, status: "Confirmed" },
  { id: 2, name: "Equestrian Championship", date: "Mar 5, 2026", type: "Sports", attendees: 500, status: "Planning" },
  { id: 3, name: "Mall Grand Opening", date: "Mar 20, 2026", type: "Launch", attendees: 1000, status: "Confirmed" },
  { id: 4, name: "Kids Summer Camp", date: "Jun 1, 2026", type: "Education", attendees: 80, status: "Planning" },
];

export default function EventsPage() {
  const handleLaunchPowerBI = () => {
    window.open("https://app.powerbi.com", "_blank");
  };

  const handleLaunchPlatinumList = () => {
    window.open("https://platinumlist.net", "_blank");
  };

  const handleLaunchPick6 = () => {
    window.open("https://racingeye.com/pick6", "_blank");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold font-outfit">Events & Entertainment</h1>
          <p className="text-muted-foreground">Manage events, nominations, and entertainment services</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleLaunchPowerBI} data-testid="button-launch-powerbi">
            <BarChart3 className="mr-2 h-4 w-4" />
            Launch Power BI
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-purple-100 text-sm">Upcoming Events</p>
              <p className="text-3xl font-bold">12</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">This Month</p>
              <p className="text-3xl font-bold">3</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Total Attendees (YTD)</p>
              <p className="text-3xl font-bold">5.2K</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Active Vendors</p>
              <p className="text-3xl font-bold">24</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-elevate cursor-pointer" onClick={handleLaunchPlatinumList} data-testid="card-platinum-list">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-white">
                <Star className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Platinum List</h3>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Integrated</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Event ticketing and management platform. Sell tickets, manage guest lists, and track attendance.
                </p>
                <Button size="sm" data-testid="button-launch-platinum">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Launch Platform
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" onClick={handleLaunchPick6} data-testid="card-pick6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Trophy className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Pick6 by Racing Eye</h3>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Nominations</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Racing nominations and selections system. Manage horse racing events and participant registrations.
                </p>
                <Button size="sm" data-testid="button-launch-pick6">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Launch System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <PartyPopper className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant="outline">{event.type}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">{event.attendees} attendees</p>
                  </div>
                  <Badge className={event.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                    {event.status}
                  </Badge>
                </div>
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
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" className="justify-start" data-testid="button-report-events">
              <Calendar className="mr-2 h-4 w-4" />
              Event Calendar Report
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-report-attendance">
              <Users className="mr-2 h-4 w-4" />
              Attendance Analytics
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-report-revenue">
              <Sparkles className="mr-2 h-4 w-4" />
              Event Revenue Report
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-report-vendors">
              <Trophy className="mr-2 h-4 w-4" />
              Vendor Performance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
