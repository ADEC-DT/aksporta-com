import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { SearchableSelect } from "@/components/searchable-select";
import { Plus, Pencil, Building, Box, Boxes } from "lucide-react";
import type { SmStable, SmBox, SmHorse } from "@shared/schema";

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; testId: string };
}) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && (
        <Button onClick={action.onClick} data-testid={action.testId}>
          <Plus className="h-4 w-4 mr-1" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default function FacilitiesPage() {
  const { toast } = useToast();

  const [stableDialogOpen, setStableDialogOpen] = useState(false);
  const [editingStable, setEditingStable] = useState<SmStable | null>(null);
  const [stableName, setStableName] = useState("");
  const [stableNotes, setStableNotes] = useState("");
  const [stableActive, setStableActive] = useState(true);

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [genStableId, setGenStableId] = useState("");
  const [genPrefix, setGenPrefix] = useState("");
  const [genCount, setGenCount] = useState("5");
  const [genBoxType, setGenBoxType] = useState("STALL");

  const [boxStableFilter, setBoxStableFilter] = useState("");
  const [boxTypeFilter, setBoxTypeFilter] = useState("ALL");
  const [boxStatusFilter, setBoxStatusFilter] = useState("ALL");

  const { data: stables, isLoading: stablesLoading } = useQuery<SmStable[]>({
    queryKey: ["/api/sm/stables"],
  });

  const { data: boxes, isLoading: boxesLoading } = useQuery<SmBox[]>({
    queryKey: ["/api/sm/boxes"],
  });

  const { data: horses } = useQuery<SmHorse[]>({
    queryKey: ["/api/sm/horses"],
  });

  const horseLookup = (horses || []).reduce<Record<string, string>>((acc, h) => {
    acc[h.id] = h.name;
    return acc;
  }, {});

  const stableLookup = (stables || []).reduce<Record<string, string>>((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {});

  const boxCountByStable = (boxes || []).reduce<Record<string, number>>((acc, b) => {
    acc[b.stableId] = (acc[b.stableId] || 0) + 1;
    return acc;
  }, {});

  const filteredBoxes = (boxes || []).filter((b) => {
    if (boxStableFilter && b.stableId !== boxStableFilter) return false;
    if (boxTypeFilter !== "ALL" && b.boxType !== boxTypeFilter) return false;
    if (boxStatusFilter !== "ALL" && b.status !== boxStatusFilter) return false;
    return true;
  });

  const createStableMutation = useMutation({
    mutationFn: async (data: { name: string; notes: string; isActive: boolean }) => {
      const res = await apiRequest("POST", "/api/sm/stables", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/stables"] });
      toast({ title: "Stable created successfully" });
      closeStableDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateStableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; notes: string; isActive: boolean } }) => {
      const res = await apiRequest("PATCH", `/api/sm/stables/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/stables"] });
      toast({ title: "Stable updated successfully" });
      closeStableDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const generateBoxesMutation = useMutation({
    mutationFn: async (data: { stableId: string; prefix: string; count: number; boxType: string }) => {
      const res = await apiRequest("POST", "/api/sm/boxes/generate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/boxes"] });
      toast({ title: "Boxes generated successfully" });
      closeGenerateDialog();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openAddStable = () => {
    setEditingStable(null);
    setStableName("");
    setStableNotes("");
    setStableActive(true);
    setStableDialogOpen(true);
  };

  const openEditStable = (stable: SmStable) => {
    setEditingStable(stable);
    setStableName(stable.name);
    setStableNotes(stable.notes || "");
    setStableActive(stable.isActive);
    setStableDialogOpen(true);
  };

  const closeStableDialog = () => {
    setStableDialogOpen(false);
    setEditingStable(null);
  };

  const handleSaveStable = () => {
    if (!stableName.trim()) return;
    const data = { name: stableName.trim(), notes: stableNotes.trim(), isActive: stableActive };
    if (editingStable) {
      updateStableMutation.mutate({ id: editingStable.id, data });
    } else {
      createStableMutation.mutate(data);
    }
  };

  const openGenerateDialog = () => {
    setGenStableId("");
    setGenPrefix("");
    setGenCount("5");
    setGenBoxType("STALL");
    setGenerateDialogOpen(true);
  };

  const closeGenerateDialog = () => {
    setGenerateDialogOpen(false);
  };

  const handleGenerateBoxes = () => {
    const count = parseInt(genCount, 10);
    if (!genStableId || !genPrefix.trim() || isNaN(count) || count < 1 || count > 100) return;
    generateBoxesMutation.mutate({
      stableId: genStableId,
      prefix: genPrefix.trim(),
      count,
      boxType: genBoxType,
    });
  };

  const stableOptions = (stables || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const isLoading = stablesLoading || boxesLoading;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Stables & Boxes" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-600";
      case "OCCUPIED": return "bg-amber-600";
      case "MAINTENANCE": return "bg-red-600";
      default: return "";
    }
  };

  return (
    <div>
      <PageHeader
        title="Stables & Boxes"
        description="Manage stables and their boxes"
        action={{ label: "Add Stable", onClick: openAddStable, testId: "button-add-stable" }}
      />

      <Card className="mb-8" data-testid="table-stables">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Boxes</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(stables || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No stables yet. Add your first stable.
                </TableCell>
              </TableRow>
            ) : (
              (stables || []).map((stable) => (
                <TableRow key={stable.id} data-testid={`row-stable-${stable.id}`}>
                  <TableCell className="font-medium" data-testid={`text-stable-name-${stable.id}`}>
                    {stable.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {stable.notes || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-stable-boxes-${stable.id}`}>
                      {boxCountByStable[stable.id] || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={stable.isActive ? "default" : "secondary"}
                      className={stable.isActive ? "bg-green-600" : ""}
                      data-testid={`badge-stable-active-${stable.id}`}
                    >
                      {stable.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditStable(stable)}
                      data-testid={`button-edit-stable-${stable.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Boxes</h2>
        </div>
        <Button onClick={openGenerateDialog} data-testid="button-generate-boxes">
          <Plus className="h-4 w-4 mr-1" />
          Generate Boxes
        </Button>
      </div>

      <Card className="p-4 mb-4" data-testid="card-boxes-filter">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-48">
            <Label className="text-xs text-muted-foreground mb-1 block">Stable</Label>
            <SearchableSelect
              options={[{ value: "", label: "All Stables" }, ...stableOptions]}
              value={boxStableFilter}
              onValueChange={setBoxStableFilter}
              placeholder="All Stables"
              data-testid="select-box-stable-filter"
            />
          </div>
          <div className="w-40">
            <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
            <Select value={boxTypeFilter} onValueChange={setBoxTypeFilter}>
              <SelectTrigger data-testid="select-box-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="STALL">Stall</SelectItem>
                <SelectItem value="STORAGE">Storage</SelectItem>
                <SelectItem value="TACKING_ROOM">Tacking Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
            <Select value={boxStatusFilter} onValueChange={setBoxStatusFilter}>
              <SelectTrigger data-testid="select-box-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card data-testid="table-boxes">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stable</TableHead>
              <TableHead>Box</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Horse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBoxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No boxes found. Generate boxes for a stable.
                </TableCell>
              </TableRow>
            ) : (
              filteredBoxes.map((box) => (
                <TableRow key={box.id} data-testid={`row-box-${box.id}`}>
                  <TableCell className="text-muted-foreground" data-testid={`text-box-stable-${box.id}`}>
                    {stableLookup[box.stableId] || "—"}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-box-name-${box.id}`}>
                    {box.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-box-type-${box.id}`}>
                      {box.boxType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusColor(box.status)}
                      data-testid={`badge-box-status-${box.id}`}
                    >
                      {box.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-box-horse-${box.id}`}>
                    {box.currentHorseId ? horseLookup[box.currentHorseId] || "Unknown" : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={stableDialogOpen} onOpenChange={setStableDialogOpen}>
        <DialogContent data-testid="dialog-stable">
          <DialogHeader>
            <DialogTitle>{editingStable ? "Edit Stable" : "Add Stable"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={stableName}
                onChange={(e) => setStableName(e.target.value)}
                placeholder="Stable name"
                data-testid="input-stable-name"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={stableNotes}
                onChange={(e) => setStableNotes(e.target.value)}
                placeholder="Optional notes"
                data-testid="input-stable-notes"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="stable-active"
                checked={stableActive}
                onCheckedChange={setStableActive}
                data-testid="switch-stable-active"
              />
              <Label htmlFor="stable-active" className="cursor-pointer">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeStableDialog} data-testid="button-cancel-stable">
              Cancel
            </Button>
            <Button
              onClick={handleSaveStable}
              disabled={!stableName.trim() || createStableMutation.isPending || updateStableMutation.isPending}
              data-testid="button-save-stable"
            >
              {(createStableMutation.isPending || updateStableMutation.isPending) ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent data-testid="dialog-generate-boxes">
          <DialogHeader>
            <DialogTitle>Generate Boxes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Stable *</Label>
              <SearchableSelect
                options={stableOptions}
                value={genStableId}
                onValueChange={setGenStableId}
                placeholder="Select stable..."
                data-testid="select-gen-stable"
              />
            </div>
            <div>
              <Label>Prefix *</Label>
              <Input
                value={genPrefix}
                onChange={(e) => setGenPrefix(e.target.value)}
                placeholder="e.g., A, B, BS"
                data-testid="input-gen-prefix"
              />
            </div>
            <div>
              <Label>Count (1-100)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={genCount}
                onChange={(e) => setGenCount(e.target.value)}
                data-testid="input-gen-count"
              />
            </div>
            <div>
              <Label>Box Type</Label>
              <Select value={genBoxType} onValueChange={setGenBoxType}>
                <SelectTrigger data-testid="select-gen-box-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STALL">Stall</SelectItem>
                  <SelectItem value="STORAGE">Storage</SelectItem>
                  <SelectItem value="TACKING_ROOM">Tacking Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeGenerateDialog} data-testid="button-cancel-generate">
              Cancel
            </Button>
            <Button
              onClick={handleGenerateBoxes}
              disabled={
                !genStableId ||
                !genPrefix.trim() ||
                isNaN(parseInt(genCount, 10)) ||
                parseInt(genCount, 10) < 1 ||
                parseInt(genCount, 10) > 100 ||
                generateBoxesMutation.isPending
              }
              data-testid="button-confirm-generate"
            >
              {generateBoxesMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
