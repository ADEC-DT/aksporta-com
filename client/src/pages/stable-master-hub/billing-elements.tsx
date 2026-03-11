import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  SmHorse,
  SmCustomer,
  SmItemService,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { DollarSign, Plus, Trash2, UserPlus } from "lucide-react";

type HorseWithAgreement = {
  horseId: string;
  horseName: string;
  customerId: string;
  customerName: string;
  boxId: string;
  boxName: string;
  stableId: string;
  stableName: string;
  agreementId: string;
};

type EnrichedBillingElement = {
  id: string;
  stableId: string | null;
  boxId: string | null;
  transactionDate: string;
  refNumber: string | null;
  remarks: string | null;
  horseId: string | null;
  customerId: string | null;
  itemServiceId: string | null;
  unit: string | null;
  unitPrice: number;
  quantity: string;
  billed: boolean;
  invoiceId: string | null;
  agreementId: string | null;
  billingMonth: string | null;
  source: string;
  horseName: string;
  customerName: string;
  boxName: string;
  stableName: string;
  itemName: string;
};

export default function BillingElementsPage() {
  const { toast } = useToast();

  const [horseSearch, setHorseSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [stableSearch, setStableSearch] = useState("");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAgreementHorse, setSelectedAgreementHorse] = useState<HorseWithAgreement | null>(null);

  const [showNonLiveryDialog, setShowNonLiveryDialog] = useState(false);
  const [nlCustomerId, setNlCustomerId] = useState("");
  const [nlHorseId, setNlHorseId] = useState("");

  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [finalSellingPrice, setFinalSellingPrice] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: horsesWithAgreements = [], isLoading: loadingAgreements } = useQuery<HorseWithAgreement[]>({
    queryKey: ["/api/sm/horses-with-agreements"],
  });

  const { data: items = [] } = useQuery<SmItemService[]>({
    queryKey: ["/api/sm/item-services"],
  });

  const { data: billingElements = [], isLoading: loadingBilling } = useQuery<EnrichedBillingElement[]>({
    queryKey: ["/api/sm/billing-elements/enriched"],
  });

  const { data: allCustomers = [] } = useQuery<SmCustomer[]>({
    queryKey: ["/api/sm/customers"],
  });

  const { data: allHorses = [] } = useQuery<SmHorse[]>({
    queryKey: ["/api/sm/horses"],
  });

  const activeItems = useMemo(() => items.filter((i) => i.isActive), [items]);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const itemOptions = useMemo(
    () =>
      activeItems.map((i) => ({
        value: i.id,
        label: i.name,
        sublabel: i.category,
      })),
    [activeItems]
  );

  const customerOptions = useMemo(
    () =>
      allCustomers
        .filter((c) => c.status === "active")
        .map((c) => ({ value: c.id, label: c.name })),
    [allCustomers]
  );

  const horseOptions = useMemo(
    () =>
      allHorses
        .filter((h) => h.status === "active")
        .map((h) => ({ value: h.id, label: h.name })),
    [allHorses]
  );

  const filteredHorses = useMemo(() => {
    let result = horsesWithAgreements;
    if (horseSearch) {
      const q = horseSearch.toLowerCase();
      result = result.filter((h) => h.horseName.toLowerCase().includes(q));
    }
    if (customerSearch) {
      const q = customerSearch.toLowerCase();
      result = result.filter((h) => h.customerName.toLowerCase().includes(q));
    }
    if (stableSearch) {
      const q = stableSearch.toLowerCase();
      result = result.filter(
        (h) =>
          h.stableName.toLowerCase().includes(q) ||
          h.boxName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [horsesWithAgreements, horseSearch, customerSearch, stableSearch]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return itemMap.get(selectedItemId) || null;
  }, [selectedItemId, itemMap]);

  const computedPrice = useMemo(() => {
    if (!selectedItem) return 0;
    return (selectedItem.unitPrice / 100) * quantity;
  }, [selectedItem, quantity]);

  const formatCurrency = (val: number) =>
    val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatCents = (cents: number) =>
    (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const resetForm = () => {
    setSelectedItemId("");
    setQuantity(1);
    setFinalSellingPrice("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setNlCustomerId("");
    setNlHorseId("");
  };

  const handleItemChange = (val: string) => {
    setSelectedItemId(val);
    const item = itemMap.get(val);
    if (item) {
      const computed = (item.unitPrice / 100) * quantity;
      setFinalSellingPrice(computed.toFixed(2));
    }
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    if (selectedItem) {
      const computed = (selectedItem.unitPrice / 100) * newQty;
      setFinalSellingPrice(computed.toFixed(2));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/sm/billing-elements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements/enriched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sm/horses-with-agreements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] });
      toast({ title: "Billing element added successfully" });
      setShowAddDialog(false);
      setShowNonLiveryDialog(false);
      setSelectedAgreementHorse(null);
      resetForm();
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sm/billing-elements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements/enriched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] });
      toast({ title: "Billing element deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleLiverySubmit = () => {
    if (!selectedAgreementHorse || !selectedItemId || !transactionDate) {
      toast({ title: "Missing fields", description: "Fill required fields", variant: "destructive" });
      return;
    }
    const priceInCents = Math.round(parseFloat(finalSellingPrice || "0") * 100);
    createMutation.mutate({
      horseId: selectedAgreementHorse.horseId,
      customerId: selectedAgreementHorse.customerId,
      boxId: selectedAgreementHorse.boxId,
      stableId: selectedAgreementHorse.stableId,
      itemServiceId: selectedItemId,
      agreementId: selectedAgreementHorse.agreementId,
      quantity: String(quantity),
      unitPrice: priceInCents,
      unit: selectedItem?.defaultUnit || "",
      transactionDate,
      billingMonth: transactionDate.substring(0, 7),
      billed: false,
      source: "MANUAL",
    });
  };

  const handleNonLiverySubmit = () => {
    if (!nlCustomerId || !nlHorseId || !selectedItemId || !transactionDate) {
      toast({ title: "Missing fields", description: "Fill required fields", variant: "destructive" });
      return;
    }
    const priceInCents = Math.round(parseFloat(finalSellingPrice || "0") * 100);
    createMutation.mutate({
      horseId: nlHorseId,
      customerId: nlCustomerId,
      boxId: null,
      stableId: null,
      itemServiceId: selectedItemId,
      agreementId: null,
      quantity: String(quantity),
      unitPrice: priceInCents,
      unit: selectedItem?.defaultUnit || "",
      transactionDate,
      billingMonth: transactionDate.substring(0, 7),
      billed: false,
      source: "MANUAL",
    });
  };

  const openLiveryDialog = (horse: HorseWithAgreement) => {
    resetForm();
    setSelectedAgreementHorse(horse);
    setShowAddDialog(true);
  };

  const openNonLiveryDialog = () => {
    resetForm();
    setShowNonLiveryDialog(true);
  };

  if (loadingAgreements || loadingBilling) {
    return (
      <div className="space-y-6" data-testid="billing-elements-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-billing-elements">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-billing-elements-title">Billing Elements</h1>
          <p className="text-sm text-muted-foreground mt-1">Add extra charges to horses — livery or non-livery</p>
        </div>
        <Button onClick={openNonLiveryDialog} data-testid="button-bill-non-livery">
          <UserPlus className="h-4 w-4 mr-2" />
          Bill Non-Livery Customer
        </Button>
      </div>

      <Card data-testid="card-be-filters">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Horse</Label>
              <Input
                placeholder="Search horse..."
                value={horseSearch}
                onChange={(e) => setHorseSearch(e.target.value)}
                data-testid="input-be-horse-search"
              />
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Customer</Label>
              <Input
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                data-testid="input-be-customer-search"
              />
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Stable</Label>
              <Input
                placeholder="Search stable..."
                value={stableSearch}
                onChange={(e) => setStableSearch(e.target.value)}
                data-testid="input-be-stable-search"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-horses-agreements">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Horses with Active Agreements</CardTitle>
          <Badge variant="secondary" data-testid="badge-horses-count">{filteredHorses.length}</Badge>
        </CardHeader>
        <CardContent>
          {filteredHorses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-horses">
              <DollarSign className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No horses with active agreements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-horses-agreements">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Horse</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Customer</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Stable</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Box</th>
                    <th className="pb-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHorses.map((h) => (
                    <tr key={h.agreementId} className="border-b last:border-0" data-testid={`row-horse-${h.agreementId}`}>
                      <td className="py-2 pr-4">{h.horseName}</td>
                      <td className="py-2 pr-4">{h.customerName}</td>
                      <td className="py-2 pr-4">{h.stableName}</td>
                      <td className="py-2 pr-4">{h.boxName}</td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          onClick={() => openLiveryDialog(h)}
                          data-testid={`button-add-be-${h.agreementId}`}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-billing-history">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Recent Billing Elements</CardTitle>
          <Badge variant="secondary" data-testid="badge-be-count">{billingElements.length}</Badge>
        </CardHeader>
        <CardContent>
          {billingElements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-billing">
              <DollarSign className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No billing elements yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-billing-history">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Horse</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Customer</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Item</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Qty</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">Selling Price</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Billing Month</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">Billed</th>
                    <th className="pb-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billingElements.map((be) => {
                    const qty = parseFloat(be.quantity) || 0;
                    const total = be.unitPrice * qty;
                    return (
                      <tr key={be.id} className="border-b last:border-0" data-testid={`row-be-${be.id}`}>
                        <td className="py-2 pr-3">{be.horseName || "—"}</td>
                        <td className="py-2 pr-3">{be.customerName || "—"}</td>
                        <td className="py-2 pr-3">{be.itemName || "—"}</td>
                        <td className="py-2 pr-3 text-right">{be.quantity}</td>
                        <td className="py-2 pr-3 text-right">{formatCents(total)}</td>
                        <td className="py-2 pr-3">{be.transactionDate}</td>
                        <td className="py-2 pr-3">{be.billingMonth || "—"}</td>
                        <td className="py-2 pr-3">
                          <Badge variant={be.billed ? "default" : "outline"} data-testid={`badge-billed-${be.id}`}>
                            {be.billed ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(be.id)}
                            disabled={be.billed || deleteMutation.isPending}
                            data-testid={`button-delete-be-${be.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setSelectedAgreementHorse(null); resetForm(); } }}>
        <DialogContent className="max-w-lg" data-testid="dialog-livery-billing">
          <DialogHeader>
            <DialogTitle>Add Billing Element — Livery</DialogTitle>
          </DialogHeader>
          {selectedAgreementHorse && (
            <div className="space-y-4">
              <Card className="bg-muted/50" data-testid="card-livery-context">
                <CardContent className="pt-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Horse: </span>
                      <span className="font-medium">{selectedAgreementHorse.horseName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Customer: </span>
                      <span className="font-medium">{selectedAgreementHorse.customerName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stable: </span>
                      <span className="font-medium">{selectedAgreementHorse.stableName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Box: </span>
                      <span className="font-medium">{selectedAgreementHorse.boxName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label>Item / Service *</Label>
                <SearchableSelect
                  options={itemOptions}
                  value={selectedItemId}
                  onValueChange={handleItemChange}
                  placeholder="Select item or service..."
                  data-testid="select-be-item"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="be-qty">Quantity *</Label>
                  <Input
                    id="be-qty"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    data-testid="input-be-quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="be-date">Transaction Date *</Label>
                  <Input
                    id="be-date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    data-testid="input-be-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Computed Price</Label>
                  <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm" data-testid="text-be-computed-price">
                    {formatCurrency(computedPrice)}
                  </div>
                </div>
                <div>
                  <Label htmlFor="be-final-price">Final Selling Price</Label>
                  <Input
                    id="be-final-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={finalSellingPrice}
                    onChange={(e) => setFinalSellingPrice(e.target.value)}
                    data-testid="input-be-final-price"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowAddDialog(false); setSelectedAgreementHorse(null); resetForm(); }} data-testid="button-be-livery-cancel">
                  Cancel
                </Button>
                <Button onClick={handleLiverySubmit} disabled={createMutation.isPending} data-testid="button-be-livery-save">
                  {createMutation.isPending ? "Saving..." : "Add Billing Element"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNonLiveryDialog} onOpenChange={(open) => { if (!open) { setShowNonLiveryDialog(false); resetForm(); } }}>
        <DialogContent className="max-w-lg" data-testid="dialog-non-livery-billing">
          <DialogHeader>
            <DialogTitle>Bill Non-Livery Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer *</Label>
              <SearchableSelect
                options={customerOptions}
                value={nlCustomerId}
                onValueChange={setNlCustomerId}
                placeholder="Select customer..."
                data-testid="select-be-nl-customer"
              />
            </div>

            <div>
              <Label>Horse *</Label>
              <SearchableSelect
                options={horseOptions}
                value={nlHorseId}
                onValueChange={setNlHorseId}
                placeholder="Select horse..."
                data-testid="select-be-nl-horse"
              />
            </div>

            <div>
              <Label>Item / Service *</Label>
              <SearchableSelect
                options={itemOptions}
                value={selectedItemId}
                onValueChange={handleItemChange}
                placeholder="Select item or service..."
                data-testid="select-be-nl-item"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="be-nl-qty">Quantity *</Label>
                <Input
                  id="be-nl-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  data-testid="input-be-nl-quantity"
                />
              </div>
              <div>
                <Label htmlFor="be-nl-date">Transaction Date *</Label>
                <Input
                  id="be-nl-date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  data-testid="input-be-nl-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Computed Price</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50 text-sm" data-testid="text-be-nl-computed-price">
                  {formatCurrency(computedPrice)}
                </div>
              </div>
              <div>
                <Label htmlFor="be-nl-final-price">Final Selling Price</Label>
                <Input
                  id="be-nl-final-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={finalSellingPrice}
                  onChange={(e) => setFinalSellingPrice(e.target.value)}
                  data-testid="input-be-nl-final-price"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowNonLiveryDialog(false); resetForm(); }} data-testid="button-be-nl-cancel">
                Cancel
              </Button>
              <Button onClick={handleNonLiverySubmit} disabled={createMutation.isPending} data-testid="button-be-nl-save">
                {createMutation.isPending ? "Saving..." : "Add Billing Element"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
