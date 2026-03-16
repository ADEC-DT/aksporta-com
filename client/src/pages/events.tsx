import { ComingSoon } from "@/components/coming-soon";
import { Calendar } from "lucide-react";

export default function EventsPage() {
  return (
    <ComingSoon
      moduleName="Events & Entertainment"
      description="Plan, manage, and track corporate events, campaigns, and communication channels."
      icon={Calendar}
      plannedFeatures={[
        "Event calendar with scheduling and RSVP tracking",
        "Communication channels management (WhatsApp, Email, Social)",
        "Campaign planning and performance analytics",
        "Venue and vendor coordination",
        "Budget tracking and post-event reporting",
      ]}
    />
  );
}
