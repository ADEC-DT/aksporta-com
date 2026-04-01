import { UnderDevelopmentBanner } from "@/components/under-development-banner";
import { ServicePageLayout } from "@/components/service-page-layout";
import { OtherModulesSection } from "@/components/other-modules-section";
import { Database } from "lucide-react";
import type { PageSectionWithTemplate } from "@shared/schema";

const SERVICE_URL = "/azure-tables";

const renderSection = (section: PageSectionWithTemplate) => {
  const templateType = section.template?.sectionType;

  if (templateType === "other_modules") {
    return <OtherModulesSection key={section.id} section="azure-tables" />;
  }

  return null;
};

export default function AzureTablesPage() {
  return (
    <ServicePageLayout serviceUrl={SERVICE_URL} renderSection={renderSection}>
      <div className="space-y-6">
        <UnderDevelopmentBanner />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-azure-tables-title">Azure Tables</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-azure-tables-description">
              Azure Table Storage management and data explorer.
            </p>
          </div>
        </div>
      </div>
    </ServicePageLayout>
  );
}
