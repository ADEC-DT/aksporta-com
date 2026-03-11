import { Card, CardContent } from "@/components/ui/card";

export default function StableMasterHubPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-page-title">Stable Master</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-muted-foreground text-lg" data-testid="text-placeholder">
              This section is under development
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
