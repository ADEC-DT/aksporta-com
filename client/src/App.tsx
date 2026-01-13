import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import NetSuiteDashboard from "@/pages/netsuite-dashboard";
import HRDashboard from "@/pages/hr-dashboard";
import LiveryDashboard from "@/pages/livery-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import SettingsPage from "@/pages/settings";
import SystemSettingsPage from "@/pages/system-settings";
import LoginPage from "@/pages/login";
import { Loader2 } from "lucide-react";

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const sidebarStyle = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b border-border px-4 lg:px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Switch>
              <Route path="/">
                <Redirect to="/netsuite" />
              </Route>
              <Route path="/netsuite" component={NetSuiteDashboard} />
              <Route path="/hr" component={HRDashboard} />
              <Route path="/livery" component={LiveryDashboard} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/system-settings" component={SystemSettingsPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="data-portal-theme">
        <TooltipProvider>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route>
              <ProtectedRoutes />
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
