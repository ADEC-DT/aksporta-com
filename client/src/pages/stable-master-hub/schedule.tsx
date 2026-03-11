import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function SchedulePage() {
  return (
    <div data-testid="smh-schedule-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-smh-schedule-title">Schedule</h1>
        <p className="text-muted-foreground">Activity scheduling and calendar</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Clock className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-smh-schedule-coming-soon">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            The scheduling module is currently under development. Check back soon for activity scheduling and calendar features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
