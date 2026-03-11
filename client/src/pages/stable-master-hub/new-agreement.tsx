import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SmBox, SmStable, SmHorse, SmCustomer, SmLiveryPackage, SmItemService } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SearchableSelect } from "@/components/searchable-select";
import { FilePlus, Plus, BoxSelect } from "lucide-react";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function NewAgreementPage() {
  const { toast } = useToast();
  const [stableFilter, setStableFilter] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<SmBox | null>(null);

  const [agreementType, setAgreementType] = useState("PERMANENT_AUTO_RENEW");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [horseId, setHorseId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [liveryPackageId, setLiveryPackageId] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: boxes, isLoading: loadingBoxes } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: stables } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: horses } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: packages } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });
  const { data: itemServices } = useQuery<SmItemService[]>({ queryKey: ["/api/sm/item-services"] });

  const stableMap = useMemo(() => new Map((stables || []).map((s) => [s.id, s])), [stables]);
  const horseMap = useMemo(() => new Map((horses || []).map((h) => [h.id, h])), [horses]);
  const packageMap = useMemo(() => new Map((packages || []).map((p) => [p.id, p])), [packages]);
  const itemMap = useMemo(() => new Map((itemServices || []).map((i) => [i.id, i])), [itemServices]);

  const activeCustomers = useMemo(() => (customers || []).filter((c) => c.status === "ACTIVE"), [customers]);
  const activeHorses = useMemo(() => (horses || []).filter((h) => h.status === "ACTIVE"), [horses]);

  const filteredBoxes = useMemo(() => {
    let result = (boxes || []).filter((b) => b.boxType === "STALL");
    if (stableFilter) result = result.filter((b) => b.stableId === stableFilter);
    if (availableOnly) result = result.filter((b) => b.status === "AVAILABLE");
    return result;
  }, [boxes, stableFilter, availableOnly]);

  const stableOptions = useMemo(
    () => (stables || []).map((s) => ({ value: s.id, label: s.name })),
    [stables]
  );

  const horseOptions = useMemo(
    () => activeHorses.map((h) => ({ value: h.id, label: h.name })),
    [activeHorses]
  );

  const customerOptions = useMemo(
    () => activeCustomers.map((c) => ({ value: c.id, label: c.name, sublabel: c.email || undefined })),
    [activeCustomers]
  );

  const packageOptions = useMemo(
    () => (packages || []).map((p) => ({ value: p.id, label: p.name, sublabel: formatPrice(p.monthlyPrice) })),
    [packages]
  );

  const selectedPackage = liveryPackageId ? packageMap.get(liveryPackageId) : null;
  const coveredItems = selectedPackage?.coveredItemServiceIds
    ?.map((id) => itemMap.get(id))
    .filter(Boolean) || [];

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/sm/livery-agreements", data);
      return res.json();
    },
    onSuccess: async () => {
      if (selectedBox) {
        await apiRequest("PATCH", `/api/sm/boxes/${selectedBox.id}`, {
          status: "OCCUPIED",
          currentHorseId: horseId || null,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sm/boxes"] });
      toast({ title: "Agreement created", description: "The livery agreement has been created and the box marked as occupied." });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openCreateDialog = (box: SmBox) => {
    setSelectedBox(box);
    setAgreementType("PERMANENT_AUTO_RENEW");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setHorseId("");
    setCustomerId("");
    setCustomerContact("");
    setRefNumber("");
    setLiveryPackageId("");
    setRemarks("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedBox(null);
  };

  const handleSubmit = () => {
    if (!selectedBox || !customerId || !startDate) return;
    const stable = stableMap.get(selectedBox.stableId);
    createMutation.mutate({
      agreementType,
      startDate,
      endDate: agreementType === "TEMPORARY" ? endDate || null : null,
      stableId: selectedBox.stableId,
      boxId: selectedBox.id,
      horseId: horseId || null,
      customerId,
      customerContact: customerContact || null,
      refNumber: refNumber || null,
      liveryPackageId: liveryPackageId || null,
      remarks: remarks || null,
    });
  };

  if (loadingBoxes) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
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
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-new-agreement-title">New Livery Agreement</h1>
        <p className="text-sm text-muted-foreground">Select an available box to create a new livery agreement</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-[220px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Stable</Label>
            <SearchableSelect
              options={[{ value: "", label: "All Stables" }, ...stableOptions]}
              value={stableFilter}
              onValueChange={setStableFilter}
              placeholder="All Stables"
              data-testid="select-filter-stable"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Switch
              checked={availableOnly}
              onCheckedChange={setAvailableOnly}
              data-testid="switch-available-only"
            />
            <Label className="text-sm">Available only</Label>
          </div>
        </div>
      </Card>

      {filteredBoxes.length === 0 ? (
        <Card className="p-8 flex flex-col items-center justify-center gap-3">
          <BoxSelect className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium" data-testid="text-boxes-empty">No boxes found</p>
          <p className="text-sm text-muted-foreground">Adjust filters or generate boxes in Stables & Boxes.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stable</TableHead>
                <TableHead>Box</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Horse</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBoxes.map((box) => {
                const stable = stableMap.get(box.stableId);
                const horse = box.currentHorseId ? horseMap.get(box.currentHorseId) : null;
                return (
                  <TableRow key={box.id} data-testid={`row-box-${box.id}`}>
                    <TableCell>{stable?.name || "-"}</TableCell>
                    <TableCell className="font-medium">{box.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{box.boxType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={box.status === "AVAILABLE" ? "default" : box.status === "OCCUPIED" ? "secondary" : "outline"}
                      >
                        {box.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{horse?.name || "-"}</TableCell>
                    <TableCell>
                      {box.status === "AVAILABLE" && (
                        <Button
                          size="sm"
                          onClick={() => openCreateDialog(box)}
                          data-testid={`button-create-agreement-${box.id}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-create-agreement-dialog-title">Create Livery Agreement</DialogTitle>
          </DialogHeader>
          {selectedBox && (
            <div className="space-y-4 py-2">
              <Card className="p-3 bg-muted/50">
                <p className="text-sm font-medium">
                  Box: {stableMap.get(selectedBox.stableId)?.name} / {selectedBox.name}
                </p>
                <p className="text-xs text-muted-foreground">Type: {selectedBox.boxType}</p>
              </Card>

              <div className="space-y-2">
                <Label>Agreement Type</Label>
                <Select value={agreementType} onValueChange={setAgreementType}>
                  <SelectTrigger data-testid="select-agreement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERMANENT_AUTO_RENEW">Permanent (Auto-Renew)</SelectItem>
                    <SelectItem value="TEMPORARY">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                {agreementType === "TEMPORARY" && (
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      data-testid="input-end-date"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Horse (optional — leave empty for Ghost Agreement)</Label>
                <SearchableSelect
                  options={horseOptions}
                  value={horseId}
                  onValueChange={setHorseId}
                  placeholder="None (Ghost Agreement)"
                  data-testid="select-horse"
                />
              </div>

              <div className="space-y-2">
                <Label>Customer *</Label>
                <SearchableSelect
                  options={customerOptions}
                  value={customerId}
                  onValueChange={setCustomerId}
                  placeholder="Select customer..."
                  data-testid="select-customer"
                />
              </div>

              <div className="space-y-2">
                <Label>Customer Contact</Label>
                <Input
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="Contact info"
                  data-testid="input-customer-contact"
                />
              </div>

              <div className="space-y-2">
                <Label>Ref Number</Label>
                <Input
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="Reference number"
                  data-testid="input-ref-number"
                />
              </div>

              <div className="space-y-2">
                <Label>Livery Package</Label>
                <SearchableSelect
                  options={packageOptions}
                  value={liveryPackageId}
                  onValueChange={setLiveryPackageId}
                  placeholder="No package"
                  data-testid="select-livery-package"
                />
                {selectedPackage && coveredItems.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {coveredItems.map((item) => (
                      <Badge key={item!.id} variant="secondary" className="text-xs">
                        {item!.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Additional notes..."
                  data-testid="input-remarks"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-agreement">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!customerId || !startDate || createMutation.isPending}
              data-testid="button-submit-agreement"
            >
              {createMutation.isPending ? "Creating..." : "Create Agreement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
