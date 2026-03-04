import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { ManagedUser, AdminStats, ExternalService, AllowedSubmodules } from "@shared/schema";
import { submoduleRegistry, pageRegistry } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Users, UserPlus, Shield, Activity, Loader2, Pencil, Trash2, Settings2, FileCheck } from "lucide-react";
import { useLocation, Link } from "wouter";

type FormMode = "create" | "edit";

interface UserFormData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "superadmin" | "admin" | "finance" | "procurement" | "others";
}

function getServiceRegistryKey(service: ExternalService): string | null {
  const url = service.url || "";
  if (url === "/erp") return "erp";
  if (url === "/equestrian") return "equestrian";
  if (url === "/projects") return "projects";
  return null;
}

function UserServicesCell({ userId, enabledServices }: { userId: string; enabledServices: ExternalService[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: userServiceIds = [], isLoading } = useQuery<string[]>({
    queryKey: ["/api/admin/users", userId, "services"],
  });

  const { data: userSubmodules = {}, isLoading: submodulesLoading } = useQuery<AllowedSubmodules>({
    queryKey: ["/api/admin/users", userId, "submodules"],
  });

  const updateServicesMutation = useMutation({
    mutationFn: async (serviceIds: string[]) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/services`, { serviceIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "services"] });
      toast({ title: "Services updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update services", description: error.message, variant: "destructive" });
    },
  });

  const updateSubmodulesMutation = useMutation({
    mutationFn: async (allowedSubmodules: AllowedSubmodules) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/submodules`, { allowedSubmodules });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "submodules"] });
      toast({ title: "Submodule access updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update submodule access", description: error.message, variant: "destructive" });
    },
  });

  const handleToggleService = (serviceId: string, checked: boolean) => {
    const newServiceIds = checked
      ? [...userServiceIds, serviceId]
      : userServiceIds.filter(id => id !== serviceId);
    updateServicesMutation.mutate(newServiceIds);
  };

  const handleToggleSubmodule = (registryKey: string, submoduleKey: string, checked: boolean) => {
    const allSubKeys = submoduleRegistry[registryKey]?.map(s => s.key) || [];
    const current = userSubmodules[registryKey] || [];
    const currentIsEmpty = !userSubmodules[registryKey];

    let newSubs: string[];
    if (checked) {
      if (currentIsEmpty) {
        newSubs = allSubKeys;
      } else {
        newSubs = [...current, submoduleKey];
      }
    } else {
      if (currentIsEmpty) {
        newSubs = allSubKeys.filter(k => k !== submoduleKey);
      } else {
        newSubs = current.filter(k => k !== submoduleKey);
      }
    }

    const allChecked = allSubKeys.every(k => newSubs.includes(k));
    const newAllowed = { ...userSubmodules };
    if (allChecked) {
      delete newAllowed[registryKey];
    } else {
      newAllowed[registryKey] = newSubs;
    }
    updateSubmodulesMutation.mutate(newAllowed);
  };

  const isSubmoduleChecked = (registryKey: string, submoduleKey: string): boolean => {
    if (!userSubmodules[registryKey]) return true;
    return userSubmodules[registryKey].includes(submoduleKey);
  };

  const assignedCount = userServiceIds.length;
  const isPending = updateServicesMutation.isPending || updateSubmodulesMutation.isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-services-${userId}`}>
          <Settings2 className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">{isLoading ? "-" : assignedCount}</Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <div className="font-medium text-sm">Assigned Services & Submodules</div>
          {(isLoading || submodulesLoading) ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : enabledServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services enabled in system settings</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {enabledServices.map(service => {
                const registryKey = getServiceRegistryKey(service);
                const submodules = registryKey ? submoduleRegistry[registryKey] : null;
                const isAssigned = userServiceIds.includes(service.id);

                return (
                  <div key={service.id}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`service-${userId}-${service.id}`}
                        checked={isAssigned}
                        onCheckedChange={(checked) => handleToggleService(service.id, checked as boolean)}
                        disabled={isPending}
                        data-testid={`checkbox-service-${userId}-${service.id}`}
                      />
                      <Label htmlFor={`service-${userId}-${service.id}`} className="text-sm cursor-pointer font-medium">
                        {service.name}
                      </Label>
                    </div>
                    {isAssigned && submodules && submodules.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-3">
                        {submodules.map(sub => (
                          <div key={sub.key} className="flex items-center gap-2">
                            <Checkbox
                              id={`sub-${userId}-${registryKey}-${sub.key}`}
                              checked={isSubmoduleChecked(registryKey!, sub.key)}
                              onCheckedChange={(checked) => handleToggleSubmodule(registryKey!, sub.key, checked as boolean)}
                              disabled={isPending}
                              data-testid={`checkbox-sub-${userId}-${registryKey}-${sub.key}`}
                            />
                            <Label htmlFor={`sub-${userId}-${registryKey}-${sub.key}`} className="text-xs cursor-pointer text-muted-foreground">
                              {sub.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserPagesCell({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: userPages = [], isLoading } = useQuery<string[]>({
    queryKey: ["/api/admin/users", userId, "pages"],
  });

  const updatePagesMutation = useMutation({
    mutationFn: async (allowedPages: string[]) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/pages`, { allowedPages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Page access updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update page access", description: error.message, variant: "destructive" });
    },
  });

  const handleTogglePage = (pagePath: string, checked: boolean) => {
    const newPages = checked
      ? [...userPages, pagePath]
      : userPages.filter(p => p !== pagePath);
    updatePagesMutation.mutate(newPages);
  };

  const handleSelectAll = () => {
    updatePagesMutation.mutate([]);
  };

  const isPageChecked = (pagePath: string): boolean => {
    if (userPages.length === 0) return true;
    return userPages.includes(pagePath);
  };

  const hasRestrictions = userPages.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-pages-${userId}`}>
          <FileCheck className="h-4 w-4" />
          <Badge variant={hasRestrictions ? "default" : "secondary"} className="text-xs">
            {isLoading ? "-" : hasRestrictions ? userPages.length : "All"}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">Page Access</div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleSelectAll} disabled={updatePagesMutation.isPending} data-testid={`button-pages-all-${userId}`}>
                All
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pageRegistry.map(page => (
                <div key={page.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`page-${userId}-${page.key}`}
                    checked={isPageChecked(page.path)}
                    onCheckedChange={(checked) => handleTogglePage(page.path, checked as boolean)}
                    disabled={updatePagesMutation.isPending}
                    data-testid={`checkbox-page-${userId}-${page.key}`}
                  />
                  <Label htmlFor={`page-${userId}-${page.key}`} className="text-sm cursor-pointer">
                    {page.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AdminDashboard() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "others",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const { data: currentUser, isLoading: currentUserLoading } = useQuery<ManagedUser>({
    queryKey: ["/api/me"],
    enabled: !!authUser,
  });

  const isAdminRole = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdminRole,
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<ManagedUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdminRole,
  });

  const { data: enabledServices = [] } = useQuery<ExternalService[]>({
    queryKey: ["/api/services/enabled"],
    enabled: isAdminRole,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "User updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({ title: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setFormData({ email: "", username: "", password: "", firstName: "", lastName: "", role: "others" });
    setEditingUser(null);
    setFormMode("create");
  }

  function handleOpenCreate() {
    resetForm();
    setFormMode("create");
    setDialogOpen(true);
  }

  function handleOpenEdit(user: ManagedUser) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: (user.role as "superadmin" | "admin" | "finance" | "procurement" | "others") || "others",
    });
    setFormMode("edit");
    setDialogOpen(true);
  }

  function validatePassword(password: string): string | null {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character (!@#$%^&*-_)";
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formMode === "create") {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        toast({ title: passwordError, variant: "destructive" });
        return;
      }
      createUserMutation.mutate(formData);
    } else if (editingUser) {
      const { password, ...rest } = formData;
      if (password) {
        const passwordError = validatePassword(password);
        if (passwordError) {
          toast({ title: passwordError, variant: "destructive" });
          return;
        }
      }
      const updateData = password ? formData : rest;
      updateUserMutation.mutate({ id: editingUser.id, data: updateData });
    }
  }

  function handleDeleteClick(user: ManagedUser) {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "superadmin":
        return "destructive";
      case "admin":
        return "default";
      case "finance":
      case "procurement":
        return "secondary";
      default:
        return "outline";
    }
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
        <p className="text-muted-foreground">Please log in to access the admin panel.</p>
        <Button asChild data-testid="button-login">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (currentUser && currentUser.role !== "admin" && currentUser.role !== "superadmin") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        <Button onClick={() => setLocation("/netsuite")} data-testid="button-go-back">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and system settings</p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-create-user">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-users">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Active (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-users">
              {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>

        {stats?.roleDistribution?.map((role) => (
          <Card key={role.role}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{role.role}s</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-${role.role}-count`}>
                {role.count}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : usersError ? (
            <div className="py-8 text-center text-destructive">
              Failed to load users. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role || "others")}>
                        {user.role || "others"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "outline" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserServicesCell userId={user.id} enabledServices={enabledServices} />
                    </TableCell>
                    <TableCell>
                      <UserPagesCell userId={user.id} />
                    </TableCell>
                    <TableCell>
                      {user.lastActiveAt
                        ? new Date(user.lastActiveAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(user)}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.id === currentUser?.id}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Add New User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Create a new user account with the specified role."
                : "Update the user's information and role."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
                disabled={formMode === "edit"}
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                required
                data-testid="input-user-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {formMode === "edit" && "(leave blank to keep current)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={formMode === "create" ? "Enter password" : "New password (optional)"}
                required={formMode === "create"}
                data-testid="input-user-password"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters, with uppercase letter, number, and special character (!@#$%^&*-_)
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  data-testid="input-user-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  data-testid="input-user-lastname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as "superadmin" | "admin" | "finance" | "procurement" | "others" })
                }
              >
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel-form"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                data-testid="button-submit-form"
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {formMode === "create" ? "Create User" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.username}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminDashboard;
