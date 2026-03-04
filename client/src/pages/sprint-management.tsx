import { OtherModulesSection } from "@/components/other-modules-section";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Sprint, ManagedUser } from "@shared/schema";
import { 
  Plus, 
  Calendar, 
  Edit, 
  Trash2, 
  Archive,
  CheckCircle,
  Clock,
  ArrowLeft
} from "lucide-react";

export default function SprintManagementPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false,
  });

  const { data: currentUser } = useQuery<ManagedUser>({
    queryKey: ["/api/auth/user"],
  });

  const { data: sprints = [], isLoading } = useQuery<Sprint[]>({
    queryKey: ["/api/sprints"],
  });

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  const createSprintMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/sprints", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sprints"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Sprint created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create sprint", variant: "destructive" });
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/sprints/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sprints"] });
      setDialogOpen(false);
      setEditingSprint(null);
      resetForm();
      toast({ title: "Sprint updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update sprint", variant: "destructive" });
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/sprints/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sprints"] });
      setDeleteDialogOpen(false);
      setSelectedSprint(null);
      toast({ title: "Sprint deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete sprint", variant: "destructive" });
    },
  });

  const closeSprintMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/sprints/${id}/close`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sprints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setCloseDialogOpen(false);
      setSelectedSprint(null);
      toast({ 
        title: "Sprint closed", 
        description: `${data.archivedCount} completed tasks archived.`
      });
    },
    onError: () => {
      toast({ title: "Failed to close sprint", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      isActive: false,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingSprint(null);
    
    const nextSprintNumber = sprints.length + 1;
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);
    
    setFormData({
      name: `Sprint ${nextSprintNumber}`,
      startDate: format(today, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      isActive: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setFormData({
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      isActive: sprint.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSprint) {
      updateSprintMutation.mutate({ id: editingSprint.id, data: formData });
    } else {
      createSprintMutation.mutate(formData);
    }
  };

  const handleCloseSprint = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setCloseDialogOpen(true);
  };

  const handleDeleteSprint = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setDeleteDialogOpen(true);
  };

  const getSprintStatus = (sprint: Sprint) => {
    if (sprint.isClosed) return { label: "Closed", variant: "secondary" as const };
    if (sprint.isActive) return { label: "Active", variant: "default" as const };
    
    const now = new Date();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    
    if (now < start) return { label: "Upcoming", variant: "outline" as const };
    if (now > end) return { label: "Ended", variant: "destructive" as const };
    return { label: "In Progress", variant: "default" as const };
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Admin access required to manage sprints.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation("/it-dt")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to IT Service Desk
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/it-dt")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold font-outfit">Sprint Management</h1>
            <p className="text-sm text-muted-foreground">Create and manage project sprints</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-sprint">
          <Plus className="w-4 h-4 mr-2" />
          Create Sprint
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading sprints...</div>
      ) : sprints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Sprints Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first sprint to organize tasks into time-boxed iterations.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sprints.map((sprint) => {
            const status = getSprintStatus(sprint);
            return (
              <Card key={sprint.id} className={sprint.isClosed ? "opacity-60" : ""}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-medium">{sprint.name}</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {sprint.isActive && (
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active Sprint
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!sprint.isClosed && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(sprint)}
                          data-testid={`button-edit-sprint-${sprint.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseSprint(sprint)}
                          data-testid={`button-close-sprint-${sprint.id}`}
                        >
                          <Archive className="w-4 h-4 mr-1" />
                          Close Sprint
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSprint(sprint)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-sprint-${sprint.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(sprint.startDate), "MMM d, yyyy")} — {format(new Date(sprint.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {Math.ceil((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSprint ? "Edit Sprint" : "Create New Sprint"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sprint Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sprint 1"
                required
                data-testid="input-sprint-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  data-testid="input-sprint-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  data-testid="input-sprint-end-date"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Set as Active Sprint</Label>
                <p className="text-sm text-muted-foreground">
                  Mark this sprint as the currently active one
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-sprint-active"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSprintMutation.isPending || updateSprintMutation.isPending}
                data-testid="button-save-sprint"
              >
                {editingSprint ? "Update" : "Create"} Sprint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close "{selectedSprint?.name}"? 
              All completed tasks in this sprint will be archived and removed from the Task Management page.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSprint && closeSprintMutation.mutate(selectedSprint.id)}
              disabled={closeSprintMutation.isPending}
              data-testid="button-confirm-close-sprint"
            >
              Close Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSprint?.name}"? 
              This will not delete tasks assigned to this sprint, but they will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSprint && deleteSprintMutation.mutate(selectedSprint.id)}
              disabled={deleteSprintMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-sprint"
            >
              Delete Sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <OtherModulesSection />
    </div>
  );
}
