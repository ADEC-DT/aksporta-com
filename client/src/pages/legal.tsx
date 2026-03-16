import { ComingSoon } from "@/components/coming-soon";
import { Scale } from "lucide-react";

export default function LegalPage() {
  return (
    <ComingSoon
      moduleName="Legal & Compliance"
      description="Document management, contract tracking, and compliance monitoring for legal operations."
      icon={Scale}
      plannedFeatures={[
        "Contract repository with categorization and search",
        "Compliance alerts and deadline tracking",
        "Document version control and approval workflows",
        "Legal entity and jurisdiction management",
        "Regulatory reporting templates",
      ]}
    />
  );
}
