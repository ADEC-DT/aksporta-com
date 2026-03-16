import { ComingSoon } from "@/components/coming-soon";
import { Megaphone } from "lucide-react";

export default function MediaMarketingPage() {
  return (
    <ComingSoon
      moduleName="Media & Marketing"
      description="Brand asset management, campaign coordination, and external marketing service integrations."
      icon={Megaphone}
      plannedFeatures={[
        "Brand asset library with version control",
        "Campaign planning and scheduling",
        "Integration with email marketing platforms",
        "Social media content calendar",
        "Marketing analytics and ROI tracking",
      ]}
    />
  );
}
