import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  SmFacility,
  SmStableBlock,
  SmStableUnit,
  SmHorse,
  SmCustomer,
  SmItemService,
  SmBillingElement,
  SmLiveryPackage,
  SmLiveryAgreement,
} from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Receipt,
  FileText,
  FilePlus,
  Settings,
  Horse,
  Users,
  Building2,
  Package,
  BarChart3,
  Shield,
  Cog,
  Plus,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

function formatAED(cents: number): string {
  return `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type NavItem = {
  id: string;
  label: string;
  icon?: typeof Calendar;
  children?: NavItem[];
};

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "MANAGEMENT",
    items: [
      {
        id: "activities",
        label: "Activities",
        icon: Calendar,
        children: [
          { id: "schedule", label: "Schedule", icon: Calendar },
          { id: "billing", label: "Post Customer Billing Element", icon: Receipt },
        ],
      },
      {
        id: "livery",
        label: "Livery Agreements",
        icon: FileText,
        children: [
          { id: "livery-list", label: "Livery Agreements List", icon: FileText },
          { id: "livery-new", label: "New Livery Agreement", icon: FilePlus },
          { id: "livery-packages", label: "Settings (Packages)", icon: Settings },
        ],
      },
      { id: "horses", label: "Horses", icon: Horse },
      { id: "customers", label: "Customers", icon: Users },
      { id: "facilities", label: "Facilities", icon: Building2 },
      { id: "items-services", label: "Items & Services", icon: Package },
      { id: "reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { id: "user-mgmt", label: "User Management", icon: Shield },
      { id: "global-settings", label: "Global Settings", icon: Cog },
    ],
  },
];

const ROUTE_MAP: Record<string, string> = {
  schedule: "schedule",
  billing: "billing",
  "livery-list": "livery",
  "livery-new": "livery-new",
  "livery-packages": "livery-packages",
  horses: "horses",
  customers: "customers",
  facilities: "facilities",
  "items-services": "items-services",
  reports: "reports",
  "user-mgmt": "user-management",
  "global-settings": "global-settings",
};

const REVERSE_ROUTE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([k, v]) => [v, k])
);

function SubSidebar({
  activeItem,
  onSelect,
  collapsed,
  onToggle,
}: {
  activeItem: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ activities: true, livery: true });

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div
      className={`flex flex-col border-r border-border bg-muted/30 dark:bg-muted/10 transition-all duration-200 ${collapsed ? "w-12" : "w-[220px]"} flex-shrink-0`}
      data-testid="sidebar-stable-master"
    >
      {!collapsed && (
        <div className="px-4 pt-4 pb-2 border-b border-border">
          <div className="text-sm font-bold text-foreground">StableMaster</div>
          <div className="text-xs text-muted-foreground">Equestrian Management</div>
        </div>
      )}
      <div className="flex items-center justify-end px-1 py-1 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onToggle} data-testid="button-toggle-sidebar">
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              <div className="px-4 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.children) {
                  const isOpen = expanded[item.id] ?? false;
                  return (
                    <div key={item.id}>
                      <button
                        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover-elevate rounded-none"
                        onClick={() => toggle(item.id)}
                        data-testid={`button-expand-${item.id}`}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span className="flex-1 text-left">{item.label}</span>
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                      {isOpen &&
                        item.children.map((child) => {
                          const CIcon = child.icon;
                          return (
                            <button
                              key={child.id}
                              className={`w-full flex items-center gap-2 pl-9 pr-4 py-1.5 text-xs rounded-none ${
                                activeItem === child.id
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : "text-muted-foreground hover-elevate"
                              }`}
                              onClick={() => onSelect(child.id)}
                              data-testid={`button-nav-${child.id}`}
                            >
                              {CIcon && <CIcon className="h-3.5 w-3.5" />}
                              <span className="truncate">{child.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.id}
                    className={`w-full flex items-center gap-2 px-4 py-1.5 text-xs rounded-none ${
                      activeItem === item.id
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover-elevate"
                    }`}
                    onClick={() => onSelect(item.id)}
                    data-testid={`button-nav-${item.id}`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SchedulePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground" data-testid="text-schedule-placeholder">
          Scheduled activities will be built later.
        </p>
      </CardContent>
    </Card>
  );
}

function BillingPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: billingElements = [], isLoading: loadingBE } = useQuery<SmBillingElement[]>({
    queryKey: ["/api/sm/billing-elements", "?limit=10"],
  });
  const { data: blocks = [] } = useQuery<SmStableBlock[]>({ queryKey: ["/api/sm/stable-blocks"] });
  const { data: units = [] } = useQuery<SmStableUnit[]>({ queryKey: ["/api/sm/stable-units"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: itemServices = [] } = useQuery<SmItemService[]>({ queryKey: ["/api/sm/item-services"] });

  const [formBlock, setFormBlock] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formHorse, setFormHorse] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formItemUnit, setFormItemUnit] = useState("");
  const [formUnitPrice, setFormUnitPrice] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [editPrice, setEditPrice] = useState(false);

  const filteredUnits = useMemo(
    () => units.filter((u) => u.stableBlockId === formBlock && u.unitType === "STALL"),
    [units, formBlock]
  );

  const selectedItem = useMemo(
    () => itemServices.find((i) => i.id === formItem),
    [itemServices, formItem]
  );

  useEffect(() => {
    if (selectedItem) {
      setFormUnitPrice((selectedItem.unitPrice / 100).toFixed(2));
      if (selectedItem.unitOptions?.length) {
        setFormItemUnit(selectedItem.defaultUnit || selectedItem.unitOptions[0]);
      }
      setEditPrice(false);
    }
  }, [selectedItem]);

  const resetForm = () => {
    setFormBlock("");
    setFormUnit("");
    setFormDate("");
    setFormRef("");
    setFormRemarks("");
    setFormHorse("");
    setFormCustomer("");
    setFormItem("");
    setFormItemUnit("");
    setFormUnitPrice("");
    setFormQty("1");
    setEditPrice(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/sm/billing-elements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] });
      toast({ title: "Billing element created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sm/billing-elements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] });
      toast({ title: "Deleted" });
    },
  });

  const handleSubmit = () => {
    if (!formBlock || !formUnit || !formDate || !formCustomer || !formHorse || !formItem) {
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }
    const qty = parseFloat(formQty);
    if (!qty || qty <= 0) {
      toast({ title: "Quantity must be > 0", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      stableBlockId: formBlock,
      stableUnitId: formUnit,
      transactionDate: formDate,
      refNumber: formRef || null,
      remarks: formRemarks || null,
      horseId: formHorse,
      customerId: formCustomer,
      itemServiceId: formItem,
      unit: formItemUnit || null,
      unitPrice: Math.round(parseFloat(formUnitPrice) * 100),
      quantity: formQty,
    });
  };

  const blockMap = useMemo(() => Object.fromEntries(blocks.map((b) => [b.id, b])), [blocks]);
  const unitMap = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units]);
  const horseMap = useMemo(() => Object.fromEntries(horses.map((h) => [h.id, h])), [horses]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const itemMap = useMemo(() => Object.fromEntries(itemServices.map((i) => [i.id, i])), [itemServices]);

  const sortedBE = useMemo(
    () => [...billingElements].sort((a, b) => (b.transactionDate || "").localeCompare(a.transactionDate || "")),
    [billingElements]
  );

  const activeItems = useMemo(() => itemServices.filter((i) => i.isActive), [itemServices]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-billing-title">Post Customer Billing Element</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-billing">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {loadingBE ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Ref #</th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Horse</th>
                <th className="py-2 px-2">Block</th>
                <th className="py-2 px-2">Stall/Unit</th>
                <th className="py-2 px-2">Item</th>
                <th className="py-2 px-2">Qty</th>
                <th className="py-2 px-2">Unit</th>
                <th className="py-2 px-2">Unit Price</th>
                <th className="py-2 px-2">Total</th>
                <th className="py-2 px-2">Remarks</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {sortedBE.map((be) => {
                const qty = parseFloat(be.quantity) || 0;
                const total = be.unitPrice * qty;
                return (
                  <tr key={be.id} className="border-b border-border/50" data-testid={`row-billing-${be.id}`}>
                    <td className="py-2 px-2">{be.transactionDate}</td>
                    <td className="py-2 px-2">{be.refNumber || "-"}</td>
                    <td className="py-2 px-2">{customerMap[be.customerId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{horseMap[be.horseId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{blockMap[be.stableBlockId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{unitMap[be.stableUnitId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{itemMap[be.itemServiceId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{be.quantity}</td>
                    <td className="py-2 px-2">{be.unit || "-"}</td>
                    <td className="py-2 px-2">{formatAED(be.unitPrice)}</td>
                    <td className="py-2 px-2">{formatAED(total)}</td>
                    <td className="py-2 px-2 max-w-[120px] truncate">{be.remarks || "-"}</td>
                    <td className="py-2 px-2">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(be.id)} data-testid={`button-delete-billing-${be.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {sortedBE.length === 0 && (
                <tr><td colSpan={13} className="py-8 text-center text-muted-foreground">No billing elements yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Billing Element</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Stable Block *</Label>
              <Select value={formBlock} onValueChange={(v) => { setFormBlock(v); setFormUnit(""); }}>
                <SelectTrigger data-testid="select-billing-block"><SelectValue placeholder="Select block" /></SelectTrigger>
                <SelectContent>{blocks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Stable Unit *</Label>
              <Select value={formUnit} onValueChange={setFormUnit}>
                <SelectTrigger data-testid="select-billing-unit"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>{filteredUnits.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Transaction Date *</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} data-testid="input-billing-date" />
            </div>
            <div className="space-y-1">
              <Label>Ref Number</Label>
              <Input value={formRef} onChange={(e) => setFormRef(e.target.value)} data-testid="input-billing-ref" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Remarks</Label>
              <Textarea value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} data-testid="input-billing-remarks" />
            </div>
            <div className="space-y-1">
              <Label>Horse *</Label>
              <Select value={formHorse} onValueChange={setFormHorse}>
                <SelectTrigger data-testid="select-billing-horse"><SelectValue placeholder="Select horse" /></SelectTrigger>
                <SelectContent>{horses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Customer *</Label>
              <Select value={formCustomer} onValueChange={setFormCustomer}>
                <SelectTrigger data-testid="select-billing-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Item *</Label>
              <Select value={formItem} onValueChange={setFormItem}>
                <SelectTrigger data-testid="select-billing-item"><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>{activeItems.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Select value={formItemUnit} onValueChange={setFormItemUnit}>
                <SelectTrigger data-testid="select-billing-item-unit"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  {(selectedItem?.unitOptions || []).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                Unit Price
                <button className="text-[10px] text-primary underline" onClick={() => setEditPrice(!editPrice)} data-testid="button-toggle-edit-price">
                  {editPrice ? "Lock price" : "Edit price"}
                </button>
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formUnitPrice}
                onChange={(e) => setFormUnitPrice(e.target.value)}
                readOnly={!editPrice}
                className={!editPrice ? "opacity-70" : ""}
                data-testid="input-billing-unit-price"
              />
            </div>
            <div className="space-y-1">
              <Label>Quantity *</Label>
              <Input type="number" step="0.01" min="0.01" value={formQty} onChange={(e) => setFormQty(e.target.value)} data-testid="input-billing-qty" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-billing">Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-billing">
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HorsesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const { data: horses = [], isLoading } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });

  const resetForm = () => { setName(""); setColor(""); setSex(""); setDob(""); setRemarks(""); setStatus("ACTIVE"); setEditingId(null); };

  const createMutation = useMutation({
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/horses/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/horses"] });
      toast({ title: "Horse deleted" });
    },
  });

  const openEdit = (h: SmHorse) => {
    setEditingId(h.id);
    setName(h.name);
    setColor(h.color || "");
    setSex(h.sex || "");
    setDob(h.dob || "");
    setRemarks(h.remarks || "");
    setStatus(h.status);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    createMutation.mutate({ name, color: color || null, sex: sex || null, dob: dob || null, remarks: remarks || null, status });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-horses-title">Horses</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-horse"><Plus className="h-4 w-4 mr-1" /> Add Horse</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Color</th>
                <th className="py-2 px-3">Sex</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Date of Birth</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {horses.map((h) => (
                <tr key={h.id} className="border-b border-border/50" data-testid={`row-horse-${h.id}`}>
                  <td className="py-2 px-3 font-medium">{h.name}</td>
                  <td className="py-2 px-3">{h.color || "-"}</td>
                  <td className="py-2 px-3">{h.sex || "-"}</td>
                  <td className="py-2 px-3">
                    <Badge variant={h.status === "ACTIVE" ? "default" : "secondary"} className="no-default-active-elevate" data-testid={`badge-horse-status-${h.id}`}>{h.status}</Badge>
                  </td>
                  <td className="py-2 px-3">{h.dob || "-"}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(h)} data-testid={`button-edit-horse-${h.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(h.id)} data-testid={`button-delete-horse-${h.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {horses.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No horses found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Horse" : "Add Horse"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-horse-name" /></div>
            <div className="space-y-1"><Label>Color</Label><Input value={color} onChange={(e) => setColor(e.target.value)} data-testid="input-horse-color" /></div>
            <div className="space-y-1">
              <Label>Sex</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger data-testid="select-horse-sex"><SelectValue placeholder="Select sex" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STALLION">Stallion</SelectItem>
                  <SelectItem value="MARE">Mare</SelectItem>
                  <SelectItem value="GELDING">Gelding</SelectItem>
                  <SelectItem value="COLT">Colt</SelectItem>
                  <SelectItem value="FILLY">Filly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} data-testid="input-horse-dob" /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-horse-remarks" /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-horse-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-horse">{createMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const { data: customers = [], isLoading } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });

  const resetForm = () => { setName(""); setEmail(""); setPhone(""); setRemarks(""); setStatus("ACTIVE"); setEditingId(null); };

  const createMutation = useMutation({
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/customers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/customers"] }); toast({ title: "Customer deleted" }); },
  });

  const openEdit = (c: SmCustomer) => {
    setEditingId(c.id); setName(c.name); setEmail(c.email || ""); setPhone(c.phone || ""); setRemarks(c.remarks || ""); setStatus(c.status); setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    createMutation.mutate({ name, email: email || null, phone: phone || null, remarks: remarks || null, status });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-customers-title">Customers</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-customer"><Plus className="h-4 w-4 mr-1" /> Add Customer</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50" data-testid={`row-customer-${c.id}`}>
                  <td className="py-2 px-3 font-medium">{c.name}</td>
                  <td className="py-2 px-3">{c.email || "-"}</td>
                  <td className="py-2 px-3">{c.phone || "-"}</td>
                  <td className="py-2 px-3">
                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="no-default-active-elevate" data-testid={`badge-customer-status-${c.id}`}>{c.status}</Badge>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} data-testid={`button-edit-customer-${c.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} data-testid={`button-delete-customer-${c.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-customer-name" /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-customer-email" /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-customer-phone" /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-customer-remarks" /></div>
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
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-customer">{createMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FacilitiesPage() {
  const { toast } = useToast();
  const [facilityDialog, setFacilityDialog] = useState(false);
  const [blockDialog, setBlockDialog] = useState(false);
  const [unitDialog, setUnitDialog] = useState(false);
  const [editingFacility, setEditingFacility] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);

  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("STABLE");
  const [bName, setBName] = useState("");
  const [bFacilityId, setBFacilityId] = useState("");
  const [uName, setUName] = useState("");
  const [uBlockId, setUBlockId] = useState("");
  const [uType, setUType] = useState("STALL");
  const [uStatus, setUStatus] = useState("AVAILABLE");

  const { data: facilities = [], isLoading } = useQuery<SmFacility[]>({ queryKey: ["/api/sm/facilities"] });
  const { data: blocks = [] } = useQuery<SmStableBlock[]>({ queryKey: ["/api/sm/stable-blocks"] });
  const { data: units = [] } = useQuery<SmStableUnit[]>({ queryKey: ["/api/sm/stable-units"] });

  const facilityMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingFacility) await apiRequest("PATCH", `/api/sm/facilities/${editingFacility}`, data);
      else await apiRequest("POST", "/api/sm/facilities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/facilities"] });
      toast({ title: editingFacility ? "Updated" : "Facility created" });
      setFacilityDialog(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const blockMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingBlock) await apiRequest("PATCH", `/api/sm/stable-blocks/${editingBlock}`, data);
      else await apiRequest("POST", "/api/sm/stable-blocks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/stable-blocks"] });
      toast({ title: editingBlock ? "Updated" : "Block created" });
      setBlockDialog(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unitMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingUnit) await apiRequest("PATCH", `/api/sm/stable-units/${editingUnit}`, data);
      else await apiRequest("POST", "/api/sm/stable-units", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/stable-units"] });
      toast({ title: editingUnit ? "Updated" : "Unit created" });
      setUnitDialog(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteFacility = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/facilities/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/facilities"] }); queryClient.invalidateQueries({ queryKey: ["/api/sm/stable-blocks"] }); toast({ title: "Deleted" }); },
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/stable-blocks/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/stable-blocks"] }); queryClient.invalidateQueries({ queryKey: ["/api/sm/stable-units"] }); toast({ title: "Deleted" }); },
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/stable-units/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/stable-units"] }); toast({ title: "Deleted" }); },
  });

  const statusBadge = (s: string) => {
    if (s === "AVAILABLE") return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 no-default-active-elevate">Available</Badge>;
    if (s === "OCCUPIED") return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 no-default-active-elevate">Occupied</Badge>;
    if (s === "MAINTENANCE") return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 no-default-active-elevate">Maintenance</Badge>;
    return <Badge variant="secondary" className="no-default-active-elevate">{s}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-facilities-title">Facilities</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => { setEditingFacility(null); setFName(""); setFType("STABLE"); setFacilityDialog(true); }} data-testid="button-add-facility"><Plus className="h-4 w-4 mr-1" /> Facility</Button>
          <Button variant="outline" onClick={() => { setEditingBlock(null); setBName(""); setBFacilityId(""); setBlockDialog(true); }} data-testid="button-add-block"><Plus className="h-4 w-4 mr-1" /> Block</Button>
          <Button variant="outline" onClick={() => { setEditingUnit(null); setUName(""); setUBlockId(""); setUType("STALL"); setUStatus("AVAILABLE"); setUnitDialog(true); }} data-testid="button-add-unit"><Plus className="h-4 w-4 mr-1" /> Unit</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-4">
          {facilities.map((f) => {
            const fBlocks = blocks.filter((b) => b.facilityId === f.id);
            return (
              <Card key={f.id} data-testid={`card-facility-${f.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{f.name}</CardTitle>
                    <Badge variant="outline" className="no-default-active-elevate">{f.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingFacility(f.id); setFName(f.name); setFType(f.type); setFacilityDialog(true); }} data-testid={`button-edit-facility-${f.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteFacility.mutate(f.id)} data-testid={`button-delete-facility-${f.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {fBlocks.length === 0 && <p className="text-xs text-muted-foreground">No blocks in this facility.</p>}
                  {fBlocks.map((b) => {
                    const bUnits = units.filter((u) => u.stableBlockId === b.id);
                    return (
                      <div key={b.id} className="ml-4 mb-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium">{b.name}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingBlock(b.id); setBName(b.name); setBFacilityId(b.facilityId); setBlockDialog(true); }} data-testid={`button-edit-block-${b.id}`}><Pencil className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteBlock.mutate(b.id)} data-testid={`button-delete-block-${b.id}`}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-wrap gap-2">
                          {bUnits.map((u) => (
                            <div key={u.id} className="flex items-center gap-1 text-xs border border-border rounded-md px-2 py-1" data-testid={`unit-${u.id}`}>
                              <span>{u.name}</span>
                              {statusBadge(u.status)}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingUnit(u.id); setUName(u.name); setUBlockId(u.stableBlockId); setUType(u.unitType); setUStatus(u.status); setUnitDialog(true); }} data-testid={`button-edit-unit-${u.id}`}><Pencil className="h-2.5 w-2.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteUnit.mutate(u.id)} data-testid={`button-delete-unit-${u.id}`}><Trash2 className="h-2.5 w-2.5" /></Button>
                            </div>
                          ))}
                          {bUnits.length === 0 && <span className="text-xs text-muted-foreground">No units</span>}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
          {facilities.length === 0 && <p className="text-center text-muted-foreground py-8">No facilities found.</p>}
        </div>
      )}

      <Dialog open={facilityDialog} onOpenChange={setFacilityDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFacility ? "Edit Facility" : "Add Facility"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={fName} onChange={(e) => setFName(e.target.value)} data-testid="input-facility-name" /></div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={fType} onValueChange={setFType}>
                <SelectTrigger data-testid="select-facility-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STABLE">Stable</SelectItem>
                  <SelectItem value="ARENA">Arena</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setFacilityDialog(false)}>Cancel</Button>
            <Button onClick={() => facilityMutation.mutate({ name: fName, type: fType })} disabled={facilityMutation.isPending} data-testid="button-submit-facility">{facilityMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBlock ? "Edit Block" : "Add Block"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={bName} onChange={(e) => setBName(e.target.value)} data-testid="input-block-name" /></div>
            <div className="space-y-1">
              <Label>Facility *</Label>
              <Select value={bFacilityId} onValueChange={setBFacilityId}>
                <SelectTrigger data-testid="select-block-facility"><SelectValue placeholder="Select facility" /></SelectTrigger>
                <SelectContent>{facilities.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setBlockDialog(false)}>Cancel</Button>
            <Button onClick={() => blockMutation.mutate({ name: bName, facilityId: bFacilityId })} disabled={blockMutation.isPending} data-testid="button-submit-block">{blockMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUnit ? "Edit Unit" : "Add Unit"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={uName} onChange={(e) => setUName(e.target.value)} data-testid="input-unit-name" /></div>
            <div className="space-y-1">
              <Label>Block *</Label>
              <Select value={uBlockId} onValueChange={setUBlockId}>
                <SelectTrigger data-testid="select-unit-block"><SelectValue placeholder="Select block" /></SelectTrigger>
                <SelectContent>{blocks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unit Type</Label>
              <Select value={uType} onValueChange={setUType}>
                <SelectTrigger data-testid="select-unit-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STALL">Stall</SelectItem>
                  <SelectItem value="PADDOCK">Paddock</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={uStatus} onValueChange={setUStatus}>
                <SelectTrigger data-testid="select-unit-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setUnitDialog(false)}>Cancel</Button>
            <Button onClick={() => unitMutation.mutate({ name: uName, stableBlockId: uBlockId, unitType: uType, status: uStatus })} disabled={unitMutation.isPending} data-testid="button-submit-unit">{unitMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemsServicesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("SERVICE");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [unitOptions, setUnitOptions] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: items = [], isLoading } = useQuery<SmItemService[]>({ queryKey: ["/api/sm/item-services"] });

  const resetForm = () => { setName(""); setCategory("SERVICE"); setDefaultUnit(""); setUnitOptions(""); setUnitPrice(""); setIsActive(true); setEditingId(null); };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/item-services/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/item-services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/item-services"] });
      toast({ title: editingId ? "Updated" : "Created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/item-services/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/item-services"] }); toast({ title: "Deleted" }); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await apiRequest("PATCH", `/api/sm/item-services/${id}`, { isActive: active });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/item-services"] }); },
  });

  const openEdit = (i: SmItemService) => {
    setEditingId(i.id);
    setName(i.name);
    setCategory(i.category);
    setDefaultUnit(i.defaultUnit);
    setUnitOptions((i.unitOptions || []).join(", "));
    setUnitPrice((i.unitPrice / 100).toFixed(2));
    setIsActive(i.isActive);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !defaultUnit.trim()) { toast({ title: "Name and default unit required", variant: "destructive" }); return; }
    const opts = unitOptions.split(",").map((s) => s.trim()).filter(Boolean);
    createMutation.mutate({
      name,
      category,
      defaultUnit,
      unitOptions: opts.length ? opts : [defaultUnit],
      unitPrice: Math.round(parseFloat(unitPrice || "0") * 100),
      isActive,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-items-title">Items & Services</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-item"><Plus className="h-4 w-4 mr-1" /> Add Item/Service</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Default Unit</th>
                <th className="py-2 px-3">Unit Price</th>
                <th className="py-2 px-3">Active</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-border/50" data-testid={`row-item-${i.id}`}>
                  <td className="py-2 px-3 font-medium">{i.name}</td>
                  <td className="py-2 px-3">
                    <Badge variant={i.category === "SERVICE" ? "default" : "secondary"} className="no-default-active-elevate" data-testid={`badge-category-${i.id}`}>{i.category}</Badge>
                  </td>
                  <td className="py-2 px-3">{i.defaultUnit}</td>
                  <td className="py-2 px-3">{formatAED(i.unitPrice)}</td>
                  <td className="py-2 px-3">
                    <Switch checked={i.isActive} onCheckedChange={(v) => toggleActive.mutate({ id: i.id, active: v })} data-testid={`switch-active-${i.id}`} />
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(i)} data-testid={`button-edit-item-${i.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(i.id)} data-testid={`button-delete-item-${i.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No items/services found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Item/Service" : "Add Item/Service"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-item-name" /></div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-item-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="ITEM">Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Default Unit *</Label><Input value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)} data-testid="input-item-default-unit" /></div>
            <div className="space-y-1"><Label>Unit Options (comma separated)</Label><Input value={unitOptions} onChange={(e) => setUnitOptions(e.target.value)} placeholder="e.g. kg, bag, session" data-testid="input-item-unit-options" /></div>
            <div className="space-y-1"><Label>Unit Price (AED)</Label><Input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} data-testid="input-item-unit-price" /></div>
            <div className="flex items-center gap-2">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-item-active" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-item">{createMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LiveryAgreementsListPage() {
  const { data: agreements = [], isLoading } = useQuery<SmLiveryAgreement[]>({ queryKey: ["/api/sm/livery-agreements"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: facilities = [] } = useQuery<SmFacility[]>({ queryKey: ["/api/sm/facilities"] });
  const { data: blocks = [] } = useQuery<SmStableBlock[]>({ queryKey: ["/api/sm/stable-blocks"] });
  const { data: units = [] } = useQuery<SmStableUnit[]>({ queryKey: ["/api/sm/stable-units"] });
  const { data: packages = [] } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });

  const horseMap = useMemo(() => Object.fromEntries(horses.map((h) => [h.id, h])), [horses]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const facilityMap = useMemo(() => Object.fromEntries(facilities.map((f) => [f.id, f])), [facilities]);
  const blockMap = useMemo(() => Object.fromEntries(blocks.map((b) => [b.id, b])), [blocks]);
  const unitMap = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units]);
  const packageMap = useMemo(() => Object.fromEntries(packages.map((p) => [p.id, p])), [packages]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" data-testid="text-livery-agreements-title">Livery Agreements</h2>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-2">Ref #</th>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 px-2">Horse</th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Facility</th>
                <th className="py-2 px-2">Block</th>
                <th className="py-2 px-2">Unit</th>
                <th className="py-2 px-2">Package</th>
                <th className="py-2 px-2">Start</th>
                <th className="py-2 px-2">End</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a) => (
                <tr key={a.id} className="border-b border-border/50" data-testid={`row-agreement-${a.id}`}>
                  <td className="py-2 px-2">{a.refNumber || "-"}</td>
                  <td className="py-2 px-2">
                    <Badge variant={a.agreementType?.includes("PERMANENT") ? "default" : "secondary"} className="no-default-active-elevate text-[10px]">
                      {a.agreementType?.includes("PERMANENT") ? "Permanent" : "Temporary"}
                    </Badge>
                  </td>
                  <td className="py-2 px-2">{horseMap[a.horseId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{customerMap[a.customerId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{facilityMap[a.facilityId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{blockMap[a.stableBlockId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{unitMap[a.stableUnitId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{packageMap[a.liveryPackageId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{a.startDate}</td>
                  <td className="py-2 px-2">{a.endDate || "-"}</td>
                </tr>
              ))}
              {agreements.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No livery agreements found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewLiveryAgreementPage() {
  const { toast } = useToast();
  const [agrType, setAgrType] = useState("PERMANENT_AUTO_RENEW");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [horseId, setHorseId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [packageId, setPackageId] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: facilities = [] } = useQuery<SmFacility[]>({ queryKey: ["/api/sm/facilities"] });
  const { data: blocks = [] } = useQuery<SmStableBlock[]>({ queryKey: ["/api/sm/stable-blocks"] });
  const { data: units = [] } = useQuery<SmStableUnit[]>({ queryKey: ["/api/sm/stable-units"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: packages = [] } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });

  const filteredBlocks = useMemo(() => blocks.filter((b) => b.facilityId === facilityId), [blocks, facilityId]);
  const filteredUnits = useMemo(() => units.filter((u) => u.stableBlockId === blockId), [units, blockId]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/sm/livery-agreements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-agreements"] });
      toast({ title: "Livery agreement created" });
      setAgrType("PERMANENT_AUTO_RENEW"); setStartDate(""); setEndDate(""); setFacilityId(""); setBlockId(""); setUnitId("");
      setHorseId(""); setCustomerId(""); setCustomerContact(""); setRefNumber(""); setPackageId(""); setRemarks("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!startDate) { toast({ title: "Start date is required", variant: "destructive" }); return; }
    createMutation.mutate({
      agreementType: agrType,
      startDate,
      endDate: endDate || null,
      facilityId: facilityId || null,
      stableBlockId: blockId || null,
      stableUnitId: unitId || null,
      horseId: horseId || null,
      customerId: customerId || null,
      customerContact: customerContact || null,
      refNumber: refNumber || null,
      liveryPackageId: packageId || null,
      remarks: remarks || null,
    });
  };

  const isTemp = agrType === "TEMPORARY";

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" data-testid="text-new-agreement-title">New Livery Agreement</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Agreement Type</Label>
              <Select value={agrType} onValueChange={setAgrType}>
                <SelectTrigger data-testid="select-agreement-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT_AUTO_RENEW">Permanent (Auto Renew)</SelectItem>
                  <SelectItem value="TEMPORARY">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="input-agreement-start" />
            </div>
            {isTemp && (
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-agreement-end" />
              </div>
            )}
            <div className="space-y-1">
              <Label>Facility</Label>
              <Select value={facilityId} onValueChange={(v) => { setFacilityId(v); setBlockId(""); setUnitId(""); }}>
                <SelectTrigger data-testid="select-agreement-facility"><SelectValue placeholder="Select facility" /></SelectTrigger>
                <SelectContent>{facilities.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Block</Label>
              <Select value={blockId} onValueChange={(v) => { setBlockId(v); setUnitId(""); }}>
                <SelectTrigger data-testid="select-agreement-block"><SelectValue placeholder="Select block" /></SelectTrigger>
                <SelectContent>{filteredBlocks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger data-testid="select-agreement-unit"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>{filteredUnits.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Horse</Label>
              <Select value={horseId} onValueChange={setHorseId}>
                <SelectTrigger data-testid="select-agreement-horse"><SelectValue placeholder="Select horse" /></SelectTrigger>
                <SelectContent>{horses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-agreement-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Customer Contact</Label>
              <Input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} data-testid="input-agreement-contact" />
            </div>
            <div className="space-y-1">
              <Label>Ref Number</Label>
              <Input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} data-testid="input-agreement-ref" />
            </div>
            <div className="space-y-1">
              <Label>Livery Package</Label>
              <Select value={packageId} onValueChange={setPackageId}>
                <SelectTrigger data-testid="select-agreement-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>{packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-agreement-remarks" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-agreement">
              {createMutation.isPending ? "Creating..." : "Create Agreement"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LiveryPackagesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");

  const { data: packages = [], isLoading } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });

  const resetForm = () => { setName(""); setMonthlyPrice(""); setEditingId(null); };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/livery-packages/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/livery-packages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-packages"] });
      toast({ title: editingId ? "Updated" : "Package created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/livery-packages/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-packages"] }); toast({ title: "Deleted" }); },
  });

  const openEdit = (p: SmLiveryPackage) => {
    setEditingId(p.id); setName(p.name); setMonthlyPrice((p.monthlyPrice / 100).toFixed(2)); setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    createMutation.mutate({ name, monthlyPrice: Math.round(parseFloat(monthlyPrice || "0") * 100) });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-packages-title">Livery Packages</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-package"><Plus className="h-4 w-4 mr-1" /> Add Package</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Monthly Price</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-border/50" data-testid={`row-package-${p.id}`}>
                  <td className="py-2 px-3 font-medium">{p.name}</td>
                  <td className="py-2 px-3">{formatAED(p.monthlyPrice)}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`button-edit-package-${p.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-package-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No packages found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Package" : "Add Package"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-package-name" /></div>
            <div className="space-y-1"><Label>Monthly Price (AED)</Label><Input type="number" step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} data-testid="input-package-price" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-package">{createMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportsPage() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Livery Report</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground" data-testid="text-reports-placeholder">Livery reports coming soon.</p>
      </CardContent>
    </Card>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground" data-testid={`text-placeholder-${title.toLowerCase().replace(/\s+/g, "-")}`}>This section is under development.</p>
      </CardContent>
    </Card>
  );
}

export default function StableMasterPage() {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const basePath = "/equestrian/stable-assets";

  const activeFromRoute = useMemo(() => {
    const suffix = location.replace(basePath, "").replace(/^\//, "");
    return REVERSE_ROUTE_MAP[suffix] || "billing";
  }, [location]);

  const [activeItem, setActiveItem] = useState(activeFromRoute);

  useEffect(() => {
    setActiveItem(activeFromRoute);
  }, [activeFromRoute]);

  const handleSelect = (id: string) => {
    setActiveItem(id);
    const route = ROUTE_MAP[id];
    if (route) setLocation(`${basePath}/${route}`);
  };

  const renderContent = () => {
    switch (activeItem) {
      case "schedule": return <SchedulePage />;
      case "billing": return <BillingPage />;
      case "horses": return <HorsesPage />;
      case "customers": return <CustomersPage />;
      case "facilities": return <FacilitiesPage />;
      case "items-services": return <ItemsServicesPage />;
      case "livery-list": return <LiveryAgreementsListPage />;
      case "livery-new": return <NewLiveryAgreementPage />;
      case "livery-packages": return <LiveryPackagesPage />;
      case "reports": return <ReportsPage />;
      case "user-mgmt": return <PlaceholderPage title="User Management" />;
      case "global-settings": return <PlaceholderPage title="Global Settings" />;
      default: return <BillingPage />;
    }
  };

  return (
    <div className="flex h-full" data-testid="page-stable-master">
      <SubSidebar
        activeItem={activeItem}
        onSelect={handleSelect}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
}
