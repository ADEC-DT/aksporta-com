import { ComingSoon } from "@/components/coming-soon";
import { Building } from "lucide-react";

export default function OpsFMPage() {
  return (
    <ComingSoon
      moduleName="Operations & Facilities Management"
      description="Facility maintenance tracking, work order management, and utility monitoring."
      icon={Building}
      plannedFeatures={[
        "Work order creation and assignment workflow",
        "Facility inspection checklists and scheduling",
        "Utility consumption monitoring and alerts",
        "Vendor and contractor management",
        "Preventive maintenance calendar",
      ]}
    />
  );
}
