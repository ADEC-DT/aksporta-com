import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SmCustomer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Users } from "lucide-react";

export default function CustomersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [remarks, setRemarks] = useState("");

  const { data: customers = [], isLoading } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setStatus("ACTIVE");
    setRemarks("");
    setEditingId(null);
  };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/customers/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/customers"] });
      toast({ title: editingId ? "Customer updated" : "Customer created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (c: SmCustomer) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setStatus(c.status);
    setRemarks(c.remarks || "");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    mutation.mutate({
      name,
      email: email || null,
      phone: phone || null,
      status,
      remarks: remarks || null,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-customers-title">Customers</h2>
          <p className="text-sm text-muted-foreground">Manage your customer records</p>
        </div>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true); }}
          data-testid="button-add-customer"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1" data-testid="text-customers-empty">No customers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first customer to get started</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-customer-empty">
              <Plus className="h-4 w-4 mr-1" /> Add Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Remarks</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50" data-testid={`row-customer-${c.id}`}>
                  <td className="py-2 px-3 font-medium" data-testid={`text-customer-name-${c.id}`}>{c.name}</td>
                  <td className="py-2 px-3">{c.email || "-"}</td>
                  <td className="py-2 px-3">{c.phone || "-"}</td>
                  <td className="py-2 px-3">
                    <Badge
                      variant={c.status === "ACTIVE" ? "default" : "secondary"}
                      className="no-default-active-elevate"
                      data-testid={`badge-customer-status-${c.id}`}
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-xs max-w-[200px] truncate">{c.remarks || "-"}</td>
                  <td className="py-2 px-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                      data-testid={`button-edit-customer-${c.id}`}
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
            <DialogTitle data-testid="text-customer-dialog-title">
              {editingId ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-customer-name" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-customer-email" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-customer-phone" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-customer-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-customer-remarks" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-customer">Cancel</Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending} data-testid="button-submit-customer">
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
