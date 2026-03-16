import { ComingSoon } from "@/components/coming-soon";
import { Store } from "lucide-react";

export default function AssetLeasePage() {
  return (
    <ComingSoon
      moduleName="Asset & Lease Management"
      description="Centralized management of property assets, shop leases, and rental agreements."
      icon={Store}
      plannedFeatures={[
        "Shop and unit occupancy tracking with tenant details",
        "Lease agreement management with renewal alerts",
        "Floor plan visualization and availability dashboard",
        "Rent collection tracking and financial summaries",
        "Maintenance request integration",
      ]}
    />
  );
}
