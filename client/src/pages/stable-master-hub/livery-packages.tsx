import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SmLiveryPackage, SmItemService } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Pencil, PackageOpen } from "lucide-react";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function LiveryPackagesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<SmLiveryPackage | null>(null);
  const [name, setName] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const { data: packages, isLoading } = useQuery<SmLiveryPackage[]>({
    queryKey: ["/api/sm/livery-packages"],
  });

  const { data: itemServices } = useQuery<SmItemService[]>({
    queryKey: ["/api/sm/item-services"],
  });

  const activeItems = (itemServices || []).filter((i) => i.isActive);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; monthlyPrice: number; coveredItemServiceIds: string[] }) =>
      apiRequest("POST", "/api/sm/livery-packages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-packages"] });
      toast({ title: "Package created" });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; monthlyPrice: number; coveredItemServiceIds: string[] }> }) =>
      apiRequest("PATCH", `/api/sm/livery-packages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-packages"] });
      toast({ title: "Package updated" });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingPkg(null);
    setName("");
    setMonthlyPrice("");
    setSelectedItemIds([]);
    setDialogOpen(true);
  };

  const openEdit = (pkg: SmLiveryPackage) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setMonthlyPrice(String(pkg.monthlyPrice / 100));
    setSelectedItemIds(pkg.coveredItemServiceIds || []);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPkg(null);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const priceInCents = Math.round(parseFloat(monthlyPrice || "0") * 100);
    const payload = { name: name.trim(), monthlyPrice: priceInCents, coveredItemServiceIds: selectedItemIds };
    if (editingPkg) {
      updateMutation.mutate({ id: editingPkg.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-packages-title">Livery Packages</h1>
          <p className="text-sm text-muted-foreground">Manage reusable livery package templates</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-package">
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {(!packages || packages.length === 0) ? (
        <Card className="p-8 flex flex-col items-center justify-center gap-3">
          <PackageOpen className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium" data-testid="text-packages-empty">No packages yet</p>
          <p className="text-sm text-muted-foreground">Create your first livery package to get started.</p>
          <Button onClick={openCreate} data-testid="button-add-package-empty">
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Monthly Price</TableHead>
                <TableHead>Covered Items</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id} data-testid={`row-package-${pkg.id}`}>
                  <TableCell className="font-medium" data-testid={`text-package-name-${pkg.id}`}>
                    {pkg.name}
                  </TableCell>
                  <TableCell className="text-right" data-testid={`text-package-price-${pkg.id}`}>
                    {formatPrice(pkg.monthlyPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-package-items-${pkg.id}`}>
                      {(pkg.coveredItemServiceIds || []).length} items
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(pkg)}
                      data-testid={`button-edit-package-${pkg.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle data-testid="text-package-dialog-title">
              {editingPkg ? "Edit Package" : "Add Package"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Name *</Label>
              <Input
                id="pkg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Full Livery"
                data-testid="input-package-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-price">Monthly Price</Label>
              <Input
                id="pkg-price"
                type="number"
                step="0.01"
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="0.00"
                data-testid="input-package-price"
              />
            </div>
            <div className="space-y-2">
              <Label>Covered Items & Services</Label>
              <Card className="p-0">
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-1">
                    {activeItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">No active items available.</p>
                    ) : (
                      activeItems.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-md hover-elevate cursor-pointer"
                          data-testid={`checkbox-item-${item.id}`}
                        >
                          <Checkbox
                            checked={selectedItemIds.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <span className="text-sm flex-1">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-package">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isPending}
              data-testid="button-save-package"
            >
              {isPending ? "Saving..." : editingPkg ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
