import { ComingSoon } from "@/components/coming-soon";
import { Building2 } from "lucide-react";

export default function BusinessUnitsPage() {
  return (
    <ComingSoon
      moduleName="Business Units"
      description="Overview and management of organizational divisions and operational entities."
      icon={Building2}
      plannedFeatures={[
        "Business unit profiles with key metrics",
        "Organizational hierarchy visualization",
        "Cross-unit collaboration and shared resources",
        "Unit-level financial performance summaries",
        "Contact directory per business unit",
      ]}
    />
  );
}
