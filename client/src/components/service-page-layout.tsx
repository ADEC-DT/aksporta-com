import { useState, useCallback, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ServiceSubSidebar } from "@/components/service-sub-sidebar";
import { ExpandableSection } from "@/components/expandable-section";
import { PageCollaborationStamp } from "@/components/collaboration-stamp";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PageSectionWithTemplate } from "@shared/schema";

function getIconByName(name: string | null | undefined): LucideIcon | undefined {
  if (!name) return undefined;
  const icons = LucideIcons as Record<string, unknown>;
  return icons[name] as LucideIcon | undefined;
}

interface ServicePageLayoutProps {
  serviceId: string;
  title: string;
  subtitle?: string;
  collaborationSection?: string;
  externalLinks?: Array<{
    label: string;
    url: string;
    icon?: LucideIcon;
  }>;
  renderSection?: (section: PageSectionWithTemplate) => ReactNode;
  headerActions?: ReactNode;
  children?: ReactNode;
}

export function ServicePageLayout({
  serviceId,
  title,
  subtitle,
  collaborationSection,
  externalLinks,
  renderSection,
  headerActions,
  children,
}: ServicePageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: sections, isLoading } = useQuery<PageSectionWithTemplate[]>({
    queryKey: ["/api/services/" + serviceId + "/sections"],
    enabled: !!serviceId,
  });

  const enabledSections = sections?.filter((s) => s.isEnabled) || [];

  const handleSectionClick = useCallback((id: string) => {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const sidebarSections = enabledSections.map((s) => ({
    id: s.id,
    title: s.title,
    icon: getIconByName(s.icon),
    isEnabled: s.isEnabled ?? true,
  }));

  return (
    <div className="flex h-full" data-testid="service-page-layout">
      {enabledSections.length > 1 && (
        <ServiceSubSidebar
          sections={sidebarSections}
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
        />
      )}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 p-6">
          {collaborationSection && (
            <PageCollaborationStamp sectionName={collaborationSection} />
          )}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold font-outfit" data-testid="text-page-title">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground" data-testid="text-page-subtitle">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {externalLinks?.map((link) => {
                const LinkIcon = link.icon || BarChart3;
                return (
                  <Button
                    key={link.url}
                    variant="outline"
                    onClick={() => window.open(link.url, "_blank")}
                    data-testid={`button-launch-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Button>
                );
              })}
              {headerActions}
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-48 w-full rounded-md" />
            </div>
          )}

          {enabledSections.map((section) => {
            const SectionIcon = getIconByName(section.icon);
            const content = renderSection ? renderSection(section) : null;

            if (!content) return null;

            if (section.isExpandable) {
              return (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                >
                  <ExpandableSection
                    id={section.id}
                    title={section.title}
                    icon={SectionIcon}
                    defaultExpanded
                  >
                    {content}
                  </ExpandableSection>
                </div>
              );
            }

            return (
              <div
                key={section.id}
                ref={(el) => {
                  sectionRefs.current[section.id] = el;
                }}
              >
                {content}
              </div>
            );
          })}

          {children}
        </div>
      </div>
    </div>
  );
}
