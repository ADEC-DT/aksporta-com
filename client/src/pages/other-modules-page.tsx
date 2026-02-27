import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Construction } from "lucide-react";

interface OtherModulesPageProps {
  section: "erp" | "equestrian";
}

export default function OtherModulesPage({ section }: OtherModulesPageProps) {
  const title = section === "erp" ? "ERP — Other Modules" : "Equestrian — Other Modules";

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="other-modules-page">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-outfit" data-testid="text-page-title">{title}</h1>
          <p className="text-muted-foreground text-sm">Additional modules and integrations</p>
        </div>
      </div>

      <Card className="border-dashed" data-testid="card-coming-soon">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Additional modules for this section are currently being configured. They will appear here once available.
          </p>
          <Badge variant="secondary" className="mt-4">Under Development</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
