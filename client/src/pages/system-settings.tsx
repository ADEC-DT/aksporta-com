import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Database, 
  Activity, 
  FileText, 
  Loader2, 
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Shield,
  Search
} from "lucide-react";
import { useLocation, Link } from "wouter";
import type { SystemSetting, AuditLog, IntegrationHealth, ManagedUser, ExternalService } from "@shared/schema";

export default function SystemSettingsPage() {
  const [, setLocation] = useLocation();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [settingForm, setSettingForm] = useState({
    key: "",
    value: "",
    description: "",
    category: "general" as "general" | "integration" | "security",
    isEncrypted: false,
  });
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategory, setAuditCategory] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(0);
  const AUDIT_PAGE_SIZE = 20;

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    url: "",
    icon: "",
    category: "general",
    isEnabled: false,
    isExternal: true,
  });
  const [editingService, setEditingService] = useState<ExternalService | null>(null);

  const { data: currentUser, isLoading: currentUserLoading } = useQuery<ManagedUser>({
    queryKey: ["/api/admin/users/current"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) throw new Error("Failed to fetch current user");
      return response.json();
    },
    enabled: !!authUser,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/admin/settings"],
    enabled: !!authUser && currentUser?.role === "admin",
  });

  const { data: integrationHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery<IntegrationHealth[]>({
    queryKey: ["/api/admin/integrations/health"],
    enabled: !!authUser && currentUser?.role === "admin",
    refetchInterval: 30000,
  });

  const { data: auditData, isLoading: auditsLoading } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ["/api/admin/audit-logs", auditPage, auditCategory, auditSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: AUDIT_PAGE_SIZE.toString(),
        offset: (auditPage * AUDIT_PAGE_SIZE).toString(),
      });
      if (auditCategory !== "all") params.set("category", auditCategory);
      if (auditSearch) params.set("search", auditSearch);
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
    enabled: !!authUser && currentUser?.role === "admin",
  });

  const { data: services, isLoading: servicesLoading } = useQuery<ExternalService[]>({
    queryKey: ["/api/admin/services"],
    enabled: !!authUser && currentUser?.role === "admin",
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: typeof serviceForm) => {
      return apiRequest("POST", "/api/admin/services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services/enabled"] });
      setServiceDialogOpen(false);
      resetServiceForm();
      toast({ title: editingService ? "Service updated" : "Service created" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save service", description: error.message, variant: "destructive" });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof serviceForm> }) => {
      return apiRequest("PATCH", `/api/admin/services/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services/enabled"] });
      setServiceDialogOpen(false);
      resetServiceForm();
      toast({ title: "Service updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update service", description: error.message, variant: "destructive" });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services/enabled"] });
      toast({ title: "Service deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete service", description: error.message, variant: "destructive" });
    },
  });

  const upsertSettingMutation = useMutation({
    mutationFn: async (data: typeof settingForm) => {
      return apiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setSettingDialogOpen(false);
      resetSettingForm();
      toast({ title: editingSetting ? "Setting updated" : "Setting created" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save setting", description: error.message, variant: "destructive" });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest("DELETE", `/api/admin/settings/${encodeURIComponent(key)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Setting deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete setting", description: error.message, variant: "destructive" });
    },
  });

  function resetSettingForm() {
    setSettingForm({
      key: "",
      value: "",
      description: "",
      category: "general",
      isEncrypted: false,
    });
    setEditingSetting(null);
  }

  function handleOpenCreate() {
    resetSettingForm();
    setSettingDialogOpen(true);
  }

  function handleOpenEdit(setting: SystemSetting) {
    setEditingSetting(setting);
    setSettingForm({
      key: setting.key,
      value: setting.isEncrypted ? "" : (setting.value || ""),
      description: setting.description || "",
      category: (setting.category as "general" | "integration" | "security") || "general",
      isEncrypted: setting.isEncrypted,
    });
    setSettingDialogOpen(true);
  }

  function handleSettingSubmit(e: React.FormEvent) {
    e.preventDefault();
    upsertSettingMutation.mutate(settingForm);
  }

  function resetServiceForm() {
    setServiceForm({
      name: "",
      description: "",
      url: "",
      icon: "",
      category: "general",
      isEnabled: false,
      isExternal: true,
    });
    setEditingService(null);
  }

  function handleOpenCreateService() {
    resetServiceForm();
    setServiceDialogOpen(true);
  }

  function handleOpenEditService(service: ExternalService) {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      url: service.url || "",
      icon: service.icon || "",
      category: service.category,
      isEnabled: service.isEnabled,
      isExternal: service.isExternal,
    });
    setServiceDialogOpen(true);
  }

  function handleServiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceForm });
    } else {
      createServiceMutation.mutate(serviceForm);
    }
  }

  function handleToggleService(service: ExternalService) {
    updateServiceMutation.mutate({ 
      id: service.id, 
      data: { isEnabled: !service.isEnabled } 
    });
  }

  function getHealthBadge(status: string) {
    switch (status) {
      case "healthy":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><Check className="mr-1 h-3 w-3" /> Healthy</Badge>;
      case "degraded":
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white"><AlertTriangle className="mr-1 h-3 w-3" /> Degraded</Badge>;
      case "offline":
        return <Badge variant="destructive"><X className="mr-1 h-3 w-3" /> Offline</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  if (authLoading || currentUserLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Authentication Required</h1>
        <p className="text-muted-foreground">Please log in to access system settings.</p>
        <Button asChild data-testid="button-login">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">You need admin privileges to access system settings.</p>
        <Button onClick={() => setLocation("/netsuite")} data-testid="button-go-back">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const groupedSettings = settings?.reduce((acc, setting) => {
    const category = setting.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>) || {};

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">System Settings</h1>
        <p className="text-muted-foreground">Configure system integrations and view audit logs</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList data-testid="system-settings-tabs">
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Database className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="config" data-testid="tab-config">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <FileText className="mr-2 h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">
            <Activity className="mr-2 h-4 w-4" />
            Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Integration Health</CardTitle>
                <CardDescription>Real-time connectivity status of external integrations</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refetchHealth()}
                disabled={healthLoading}
                data-testid="button-refresh-health"
              >
                <RefreshCw className={`h-4 w-4 ${healthLoading ? "animate-spin" : ""}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {integrationHealth?.map((integration) => (
                    <Card key={integration.name} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Activity className={`h-5 w-5 ${
                            integration.status === "healthy" ? "text-green-500" :
                            integration.status === "degraded" ? "text-yellow-500" :
                            "text-red-500"
                          }`} />
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Response: {integration.responseTime}ms
                            </p>
                          </div>
                        </div>
                        {getHealthBadge(integration.status)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Credentials</CardTitle>
              <CardDescription>Configure connection settings for external integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="netsuite-url">NetSuite RESTlet URL</Label>
                <Input
                  id="netsuite-url"
                  placeholder="https://your-account.restlets.api.netsuite.com/..."
                  defaultValue={settings?.find(s => s.key === "netsuite_restlet_url")?.value || ""}
                  data-testid="input-netsuite-url"
                />
                <p className="text-xs text-muted-foreground">
                  The URL for your NetSuite RESTlet endpoint
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="azure-connection">Azure SQL Connection String</Label>
                <Input
                  id="azure-connection"
                  type="password"
                  placeholder="Server=...;Database=...;User Id=...;Password=..."
                  data-testid="input-azure-connection"
                />
                <p className="text-xs text-muted-foreground">
                  Connection string for Azure SQL database (encrypted)
                </p>
              </div>

              <div className="flex justify-end">
                <Button data-testid="button-save-credentials">
                  Save Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage application configuration settings</CardDescription>
              </div>
              <Button onClick={handleOpenCreate} data-testid="button-add-setting">
                <Plus className="mr-2 h-4 w-4" />
                Add Setting
              </Button>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : settings && settings.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                    <div key={category}>
                      <h3 className="mb-3 text-sm font-medium uppercase text-muted-foreground">
                        {category}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categorySettings.map((setting) => (
                            <TableRow key={setting.id}>
                              <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                              <TableCell>
                                {setting.isEncrypted ? (
                                  <span className="text-muted-foreground">••••••••</span>
                                ) : (
                                  <span className="max-w-xs truncate">{setting.value || "-"}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {setting.description || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEdit(setting)}
                                    data-testid={`button-edit-setting-${setting.key}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteSettingMutation.mutate(setting.key)}
                                    data-testid={`button-delete-setting-${setting.key}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Settings className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No settings configured</h3>
                  <p className="text-muted-foreground">
                    Add your first configuration setting to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>View recent system actions and security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value);
                      setAuditPage(0);
                    }}
                    className="pl-9"
                    data-testid="input-audit-search"
                  />
                </div>
                <Select
                  value={auditCategory}
                  onValueChange={(value) => {
                    setAuditCategory(value);
                    setAuditPage(0);
                  }}
                >
                  <SelectTrigger className="w-40" data-testid="select-audit-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {auditsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditData && auditData.logs.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditData.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {log.createdAt ? formatDate(log.createdAt.toString()) : "-"}
                          </TableCell>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.category}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.userEmail || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.status === "success" ? "default" : "destructive"}>
                              {log.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {auditPage * AUDIT_PAGE_SIZE + 1} - {Math.min((auditPage + 1) * AUDIT_PAGE_SIZE, auditData.total)} of {auditData.total}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={auditPage === 0}
                        onClick={() => setAuditPage(p => p - 1)}
                        data-testid="button-audit-prev"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(auditPage + 1) * AUDIT_PAGE_SIZE >= auditData.total}
                        onClick={() => setAuditPage(p => p + 1)}
                        data-testid="button-audit-next"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No audit logs found</h3>
                  <p className="text-muted-foreground">
                    System actions will appear here as they occur
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>External Services</CardTitle>
                <CardDescription>Manage production-ready external services</CardDescription>
              </div>
              <Button onClick={handleOpenCreateService} data-testid="button-add-service">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : services && services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.name}</span>
                            {service.description && (
                              <span className="text-xs text-muted-foreground">{service.description}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {service.url ? (
                            <a 
                              href={service.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {service.url}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={service.isEnabled}
                              onCheckedChange={() => handleToggleService(service)}
                              data-testid={`switch-service-${service.id}`}
                            />
                            <span className="text-sm">
                              {service.isEnabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditService(service)}
                              data-testid={`button-edit-service-${service.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteServiceMutation.mutate(service.id)}
                              data-testid={`button-delete-service-${service.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No services configured</h3>
                  <p className="text-muted-foreground">
                    Add external services to enable them for production
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the external service configuration"
                : "Add a new external service to the portal"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleServiceSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Service name"
                required
                data-testid="input-service-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Input
                id="service-description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                placeholder="Brief description"
                data-testid="input-service-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-url">URL</Label>
              <Input
                id="service-url"
                value={serviceForm.url}
                onChange={(e) => setServiceForm({ ...serviceForm, url: e.target.value })}
                placeholder="https://..."
                data-testid="input-service-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-category">Category</Label>
              <Select
                value={serviceForm.category}
                onValueChange={(value) => setServiceForm({ ...serviceForm, category: value })}
              >
                <SelectTrigger data-testid="select-service-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="service-enabled"
                checked={serviceForm.isEnabled}
                onCheckedChange={(checked) => setServiceForm({ ...serviceForm, isEnabled: checked })}
                data-testid="switch-service-enabled"
              />
              <Label htmlFor="service-enabled">Enable service</Label>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleServiceSubmit}
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
              data-testid="button-save-service"
            >
              {(createServiceMutation.isPending || updateServiceMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingService ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingDialogOpen} onOpenChange={setSettingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetting ? "Edit Setting" : "Add Setting"}</DialogTitle>
            <DialogDescription>
              {editingSetting
                ? "Update the configuration setting value"
                : "Create a new configuration setting"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSettingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setting-key">Key</Label>
              <Input
                id="setting-key"
                value={settingForm.key}
                onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })}
                placeholder="setting_key"
                required
                disabled={!!editingSetting}
                data-testid="input-setting-key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setting-value">Value</Label>
              <Input
                id="setting-value"
                type={settingForm.isEncrypted ? "password" : "text"}
                value={settingForm.value}
                onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })}
                placeholder={editingSetting?.isEncrypted ? "Enter new value to update" : "Setting value"}
                data-testid="input-setting-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setting-description">Description</Label>
              <Input
                id="setting-description"
                value={settingForm.description}
                onChange={(e) => setSettingForm({ ...settingForm, description: e.target.value })}
                placeholder="What this setting does"
                data-testid="input-setting-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setting-category">Category</Label>
              <Select
                value={settingForm.category}
                onValueChange={(value) => setSettingForm({ ...settingForm, category: value as typeof settingForm.category })}
              >
                <SelectTrigger data-testid="select-setting-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="setting-encrypted">Encrypt Value</Label>
                <p className="text-sm text-muted-foreground">
                  Store this value securely
                </p>
              </div>
              <Switch
                id="setting-encrypted"
                checked={settingForm.isEncrypted}
                onCheckedChange={(checked) => setSettingForm({ ...settingForm, isEncrypted: checked })}
                disabled={!!editingSetting}
                data-testid="switch-setting-encrypted"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSettingDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={upsertSettingMutation.isPending}
                data-testid="button-submit-setting"
              >
                {upsertSettingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSetting ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
