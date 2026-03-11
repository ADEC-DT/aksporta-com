import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  SmStable,
  SmBox,
  SmHorse,
  SmCustomer,
  SmItemService,
  SmLiveryAgreement,
  SmBillingElement,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { Receipt, Plus, FileText } from "lucide-react";

export default function BillingPage() {
  const { toast } = useToast();
  const [filterStable, setFilterStable] = useState("");
  const [filterHorse, setFilterHorse] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<SmLiveryAgreement | null>(null);

  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNumber, setRefNumber] = useState("");
  const [itemServiceId, setItemServiceId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [editPrice, setEditPrice] = useState(false);
  const [quantity, setQuantity] = useState("1");

  const { data: stables = [] } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: boxes = [] } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: items = [] } = useQuery<SmItemService[]>({ queryKey: ["/api/sm/item-services"] });
  const { data: agreements = [], isLoading: agreementsLoading } = useQuery<SmLiveryAgreement[]>({ queryKey: ["/api/sm/livery-agreements"] });
  const { data: billingElements = [], isLoading: billingLoading } = useQuery<SmBillingElement[]>({ queryKey: ["/api/sm/billing-elements"] });

  const stableMap = useMemo(() => new Map(stables.map((s) => [s.id, s])), [stables]);
  const boxMap = useMemo(() => new Map(boxes.map((b) => [b.id, b])), [boxes]);
  const horseMap = useMemo(() => new Map(horses.map((h) => [h.id, h])), [horses]);
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const activeAgreements = useMemo(() => {
    const today = new Date();
    return agreements.filter((a) => {
      const start = new Date(a.startDate);
      const end = a.endDate ? new Date(a.endDate) : new Date(9999, 11, 31);
      return start <= today && end >= today;
    });
  }, [agreements]);

  const horsesWithActiveAgreements = useMemo(() => {
    const ids = new Set(activeAgreements.filter((a) => a.horseId).map((a) => a.horseId!));
    return horses.filter((h) => ids.has(h.id));
  }, [activeAgreements, horses]);

  const filteredAgreements = useMemo(() => {
    return activeAgreements.filter((a) => {
      if (filterStable && a.stableId !== filterStable) return false;
      if (filterHorse && a.horseId !== filterHorse) return false;
      return true;
    });
  }, [activeAgreements, filterStable, filterHorse]);

  const agreementBillingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const be of billingElements) {
      const key = `${be.boxId}-${be.customerId}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [billingElements]);

  const recentBillingEntries = useMemo(() => {
    return billingElements.slice(0, 20);
  }, [billingElements]);

  const lineTotal = useMemo(() => {
    const price = unitPrice;
    const qty = parseFloat(quantity) || 0;
    return price * qty;
  }, [unitPrice, quantity]);

  const stableOptions = useMemo(
    () => stables.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name })),
    [stables]
  );

  const horseFilterOptions = useMemo(
    () => horsesWithActiveAgreements.map((h) => ({ value: h.id, label: h.name })),
    [horsesWithActiveAgreements]
  );

  const itemOptions = useMemo(
    () =>
      items
        .filter((i) => i.isActive)
        .map((i) => ({
          value: i.id,
          label: i.name,
          sublabel: i.category,
        })),
    [items]
  );

  const resetForm = (clearAgreement = true) => {
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setRefNumber("");
    setItemServiceId("");
    setRemarks("");
    setUnit("");
    setUnitPrice(0);
    setEditPrice(false);
    setQuantity("1");
    if (clearAgreement) setSelectedAgreement(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/sm/billing-elements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] });
      toast({ title: "Billing entry created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAddDialog = (agreement: SmLiveryAgreement) => {
    resetForm(false);
    setSelectedAgreement(agreement);
    setDialogOpen(true);
  };

  const handleItemChange = (id: string) => {
    setItemServiceId(id);
    const item = itemMap.get(id);
    if (item) {
      setUnit(item.defaultUnit);
      setUnitPrice(item.unitPrice);
      setEditPrice(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedAgreement || !transactionDate || !itemServiceId) {
      toast({ title: "Missing fields", description: "Fill required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      stableId: selectedAgreement.stableId,
      boxId: selectedAgreement.boxId,
      transactionDate,
      refNumber: refNumber || null,
      remarks: remarks || null,
      horseId: selectedAgreement.horseId || null,
      customerId: selectedAgreement.customerId,
      itemServiceId,
      unit,
      unitPrice,
      quantity,
      billed: false,
      source: "MANUAL",
    });
  };

  const formatCents = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getHorseName = (id: string | null) => {
    if (!id) return null;
    return horseMap.get(id)?.name || id;
  };

  const getCustomerName = (id: string | null) => {
    if (!id) return "—";
    return customerMap.get(id)?.name || id;
  };

  const getStableName = (id: string | null) => {
    if (!id) return "—";
    return stableMap.get(id)?.name || id;
  };

  const getBoxName = (id: string | null) => {
    if (!id) return "—";
    return boxMap.get(id)?.name || id;
  };

  const getItemName = (id: string | null) => {
    if (!id) return "—";
    return itemMap.get(id)?.name || id;
  };

  if (agreementsLoading || billingLoading) {
    return (
      <div className="space-y-6" data-testid="billing-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-billing">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-billing-title">Post Customer Billing Element</h1>
        <p className="text-sm text-muted-foreground mt-1">Add billing entries for active livery agreements</p>
      </div>

      <Card data-testid="card-billing-filters">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Stable</Label>
              <SearchableSelect
                options={[{ value: "", label: "All Stables" }, ...stableOptions]}
                value={filterStable}
                onValueChange={setFilterStable}
                placeholder="All Stables"
                data-testid="select-billing-stable"
              />
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Horse</Label>
              <SearchableSelect
                options={[{ value: "", label: "All Horses" }, ...horseFilterOptions]}
                value={filterHorse}
                onValueChange={setFilterHorse}
                placeholder="All Horses"
                data-testid="select-billing-horse"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-active-agreements">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Active Agreements</CardTitle>
          <Badge variant="secondary" data-testid="badge-agreement-count">{filteredAgreements.length}</Badge>
        </CardHeader>
        <CardContent>
          {filteredAgreements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-active-agreements">
              <Receipt className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No active agreements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-active-agreements">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Stable</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Box</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Horse</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Customer</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Type</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Entries</th>
                    <th className="pb-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgreements.map((a) => {
                    const key = `${a.boxId}-${a.customerId}`;
                    const count = agreementBillingCounts[key] || 0;
                    return (
                      <tr key={a.id} className="border-b last:border-0" data-testid={`row-agreement-${a.id}`}>
                        <td className="py-2 pr-4">{getStableName(a.stableId)}</td>
                        <td className="py-2 pr-4">{getBoxName(a.boxId)}</td>
                        <td className="py-2 pr-4">
                          {a.horseId ? (
                            getHorseName(a.horseId)
                          ) : (
                            <span className="italic text-muted-foreground">Ghost</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">{getCustomerName(a.customerId)}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={a.agreementType === "TEMPORARY" ? "outline" : "secondary"} data-testid={`badge-agreement-type-${a.id}`}>
                            {a.agreementType === "TEMPORARY" ? "Temporary" : "Permanent"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary" data-testid={`badge-billing-count-${a.id}`}>{count}</Badge>
                        </td>
                        <td className="py-2">
                          <Button
                            size="sm"
                            onClick={() => openAddDialog(a)}
                            data-testid={`button-add-billing-${a.id}`}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {recentBillingEntries.length > 0 && (
        <Card data-testid="card-recent-billing">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Recent Billing Entries</CardTitle>
            <Badge variant="secondary" data-testid="badge-recent-count">{recentBillingEntries.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-recent-billing">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Ref#</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Customer</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Horse</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Box</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Item</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Qty</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Unit</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Unit Price</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Total</th>
                    <th className="pb-2 font-medium text-muted-foreground">Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBillingEntries.map((be) => {
                    const qty = parseFloat(be.quantity) || 0;
                    const total = be.unitPrice * qty;
                    return (
                      <tr key={be.id} className="border-b last:border-0" data-testid={`row-billing-${be.id}`}>
                        <td className="py-2 pr-3">{be.transactionDate}</td>
                        <td className="py-2 pr-3">{be.refNumber || "—"}</td>
                        <td className="py-2 pr-3">{getCustomerName(be.customerId)}</td>
                        <td className="py-2 pr-3">
                          {be.horseId ? getHorseName(be.horseId) : <span className="italic text-muted-foreground">Ghost</span>}
                        </td>
                        <td className="py-2 pr-3">{getBoxName(be.boxId)}</td>
                        <td className="py-2 pr-3">{getItemName(be.itemServiceId)}</td>
                        <td className="py-2 pr-3 text-right">{be.quantity}</td>
                        <td className="py-2 pr-3">{be.unit || "—"}</td>
                        <td className="py-2 pr-3 text-right">{formatCents(be.unitPrice)}</td>
                        <td className="py-2 pr-3 text-right">{formatCents(total)}</td>
                        <td className="py-2">
                          <Badge variant={be.billed ? "default" : "outline"} data-testid={`badge-billed-${be.id}`}>
                            {be.billed ? "Yes" : "No"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } else { setDialogOpen(true); } }}>
        <DialogContent className="max-w-lg" data-testid="dialog-add-billing">
          <DialogHeader>
            <DialogTitle>Add Billing Entry</DialogTitle>
          </DialogHeader>
          {selectedAgreement && (
            <div className="space-y-4">
              <Card className="bg-muted/50" data-testid="card-billing-context">
                <CardContent className="pt-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stable/Box: </span>
                      <span className="font-medium">{getStableName(selectedAgreement.stableId)} / {getBoxName(selectedAgreement.boxId)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Horse: </span>
                      <span className="font-medium">
                        {selectedAgreement.horseId ? getHorseName(selectedAgreement.horseId) : <span className="italic">Ghost</span>}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Customer: </span>
                      <span className="font-medium">{getCustomerName(selectedAgreement.customerId)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transactionDate">Transaction Date *</Label>
                  <Input
                    id="transactionDate"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    data-testid="input-billing-date"
                  />
                </div>
                <div>
                  <Label htmlFor="refNumber">Ref Number</Label>
                  <Input
                    id="refNumber"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Optional ref"
                    data-testid="input-billing-ref"
                  />
                </div>
              </div>

              <div>
                <Label>Item / Service *</Label>
                <SearchableSelect
                  options={itemOptions}
                  value={itemServiceId}
                  onValueChange={handleItemChange}
                  placeholder="Select item or service..."
                  data-testid="select-billing-item"
                />
              </div>

              <div>
                <Label htmlFor="billingRemarks">Remarks</Label>
                <Textarea
                  id="billingRemarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                  className="resize-none"
                  data-testid="input-billing-remarks"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit</Label>
                  <Input value={unit} readOnly className="bg-muted/50" data-testid="input-billing-unit" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Unit Price</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Edit</span>
                      <Switch
                        checked={editPrice}
                        onCheckedChange={setEditPrice}
                        data-testid="switch-edit-price"
                      />
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                    readOnly={!editPrice}
                    className={!editPrice ? "bg-muted/50" : ""}
                    data-testid="input-billing-price"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    data-testid="input-billing-qty"
                  />
                </div>
                <div>
                  <Label>Line Total</Label>
                  <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 font-medium" data-testid="text-billing-total">
                    {formatCents(lineTotal)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} data-testid="button-billing-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-billing-save">
                  {createMutation.isPending ? "Saving..." : "Create Entry"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
