import { ComingSoon } from "@/components/coming-soon";
import { BarChart3 } from "lucide-react";

export default function PerformanceKPIPage() {
  return (
    <ComingSoon
      moduleName="Performance & KPIs"
      description="Track key performance indicators across departments with category-based metrics and alerts."
      icon={BarChart3}
      plannedFeatures={[
        "Department-level KPI dashboards with targets",
        "Performance trend analysis and historical data",
        "Automated threshold alerts and notifications",
        "Custom metric definitions and formulas",
        "Quarterly and annual performance reports",
      ]}
    />
  );
}
