import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ExpandableSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  defaultExpanded?: boolean;
  allowClose?: boolean;
  maxHeight?: string;
  className?: string;
}

export function ExpandableSection({
  title,
  icon: Icon,
  children,
  defaultExpanded = false,
  allowClose = false,
  maxHeight,
  className,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isClosed, setIsClosed] = useState(false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    },
    [isExpanded]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  if (isClosed) {
    return null;
  }

  if (isExpanded) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
        data-testid="expandable-section-fullscreen"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-3 bg-background">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <h3 className="text-lg font-semibold font-outfit">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              data-testid="button-minimize-section"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            {allowClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsExpanded(false);
                  setIsClosed(true);
                }}
                data-testid="button-close-section"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <h3 className="text-lg font-semibold font-outfit">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(true)}
            data-testid="button-expand-section"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          {allowClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsClosed(true)}
              data-testid="button-close-section-inline"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div
        className={cn("rounded-md", maxHeight && "overflow-auto")}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
