import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Info } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sm/reset-demo-data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Demo data has been reset successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div data-testid="smh-settings-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-smh-settings-title">Global Settings</h1>
        <p className="text-muted-foreground">Application configuration and maintenance</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Demo Data
            </CardTitle>
            <CardDescription>
              Reset all StableMaster data and re-seed with demo records. This will delete all existing horses, customers, stables, boxes, agreements, billing elements, packages, and invoices, then create fresh demo data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              data-testid="button-smh-reset-demo"
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Demo Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Application</span>
              <span className="text-sm font-medium" data-testid="text-smh-about-name">StableMaster</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Version</span>
              <Badge variant="secondary" data-testid="text-smh-about-version">1.0.0 MVP</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Frontend</span>
              <span className="text-sm">React 18 + TypeScript</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Backend</span>
              <span className="text-sm">Express + PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ORM</span>
              <span className="text-sm">Drizzle ORM</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
