import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SmHorse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Fence } from "lucide-react";

export default function HorsesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [color, setColor] = useState("");
  const [sex, setSex] = useState("");
  const [group, setGroup] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: horses = [], isLoading } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });

  const resetForm = () => {
    setName("");
    setDob("");
    setStatus("ACTIVE");
    setColor("");
    setSex("");
    setGroup("");
    setRemarks("");
    setEditingId(null);
  };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/horses/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/horses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/horses"] });
      toast({ title: editingId ? "Horse updated" : "Horse created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (h: SmHorse) => {
    setEditingId(h.id);
    setName(h.name);
    setDob(h.dob || "");
    setStatus(h.status);
    setColor(h.color || "");
    setSex(h.sex || "");
    setGroup(h.group || "");
    setRemarks(h.remarks || "");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    mutation.mutate({
      name,
      dob: dob || null,
      status,
      color: color || null,
      sex: sex || null,
      group: group || null,
      remarks: remarks || null,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-horses-title">Horses</h2>
          <p className="text-sm text-muted-foreground">Manage horses in your stable</p>
        </div>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true); }}
          data-testid="button-add-horse"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Horse
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : horses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fence className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1" data-testid="text-horses-empty">No horses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first horse to get started</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-horse-empty">
              <Plus className="h-4 w-4 mr-1" /> Add Horse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">DOB</th>
                <th className="py-2 px-3">Color</th>
                <th className="py-2 px-3">Sex</th>
                <th className="py-2 px-3">Group</th>
                <th className="py-2 px-3">Remarks</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {horses.map((h) => (
                <tr key={h.id} className="border-b border-border/50" data-testid={`row-horse-${h.id}`}>
                  <td className="py-2 px-3 font-medium" data-testid={`text-horse-name-${h.id}`}>{h.name}</td>
                  <td className="py-2 px-3">
                    <Badge
                      variant={h.status === "ACTIVE" ? "default" : "secondary"}
                      className="no-default-active-elevate"
                      data-testid={`badge-horse-status-${h.id}`}
                    >
                      {h.status}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">{h.dob || "-"}</td>
                  <td className="py-2 px-3">{h.color || "-"}</td>
                  <td className="py-2 px-3">{h.sex || "-"}</td>
                  <td className="py-2 px-3">{h.group || "-"}</td>
                  <td className="py-2 px-3 text-xs max-w-[200px] truncate">{h.remarks || "-"}</td>
                  <td className="py-2 px-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(h)}
                      data-testid={`button-edit-horse-${h.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-horse-dialog-title">
              {editingId ? "Edit Horse" : "Add Horse"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-horse-name" />
            </div>
            <div className="space-y-1">
              <Label>Date of Birth</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} data-testid="input-horse-dob" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-horse-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} data-testid="input-horse-color" />
            </div>
            <div className="space-y-1">
              <Label>Sex</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger data-testid="select-horse-sex"><SelectValue placeholder="Select sex" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stallion">Stallion</SelectItem>
                  <SelectItem value="Mare">Mare</SelectItem>
                  <SelectItem value="Gelding">Gelding</SelectItem>
                  <SelectItem value="Colt">Colt</SelectItem>
                  <SelectItem value="Filly">Filly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Group</Label>
              <Input value={group} onChange={(e) => setGroup(e.target.value)} data-testid="input-horse-group" />
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-horse-remarks" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-horse">Cancel</Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending} data-testid="button-submit-horse">
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
