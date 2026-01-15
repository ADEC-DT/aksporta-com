import { Card, CardContent } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function AssetLeasePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold font-outfit">Asset and Lease Management</h1>
        <p className="text-muted-foreground">Manage assets and lease agreements</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Asset and lease management features are currently under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
