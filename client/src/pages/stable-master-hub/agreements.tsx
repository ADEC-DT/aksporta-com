import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SmLiveryAgreement, SmStable, SmBox, SmHorse, SmCustomer, SmLiveryPackage } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, ClipboardList } from "lucide-react";

function computeStatus(agreement: SmLiveryAgreement): "ACTIVE" | "EXPIRED" {
  if (agreement.agreementType === "TEMPORARY" && agreement.endDate && new Date(agreement.endDate) < new Date()) {
    return "EXPIRED";
  }
  return "ACTIVE";
}

export default function AgreementsPage() {
  const [selectedAgreement, setSelectedAgreement] = useState<SmLiveryAgreement | null>(null);

  const { data: agreements, isLoading: loadingAgreements } = useQuery<SmLiveryAgreement[]>({
    queryKey: ["/api/sm/livery-agreements"],
  });

  const { data: stables } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: boxes } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: horses } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: packages } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });

  const lookup = useMemo(() => {
    const stableMap = new Map((stables || []).map((s) => [s.id, s]));
    const boxMap = new Map((boxes || []).map((b) => [b.id, b]));
    const horseMap = new Map((horses || []).map((h) => [h.id, h]));
    const customerMap = new Map((customers || []).map((c) => [c.id, c]));
    const packageMap = new Map((packages || []).map((p) => [p.id, p]));
    return { stableMap, boxMap, horseMap, customerMap, packageMap };
  }, [stables, boxes, horses, customers, packages]);

  const getBoxLabel = (a: SmLiveryAgreement) => {
    const stable = a.stableId ? lookup.stableMap.get(a.stableId) : null;
    const box = a.boxId ? lookup.boxMap.get(a.boxId) : null;
    if (stable && box) return `${stable.name} / ${box.name}`;
    if (box) return box.name;
    return "-";
  };

  if (loadingAgreements) {
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
        <h1 className="text-2xl font-semibold" data-testid="text-agreements-title">Livery Agreements</h1>
        <p className="text-sm text-muted-foreground">View all livery agreements. Create new ones from the New Agreement page.</p>
      </div>

      {(!agreements || agreements.length === 0) ? (
        <Card className="p-8 flex flex-col items-center justify-center gap-3">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium" data-testid="text-agreements-empty">No agreements yet</p>
          <p className="text-sm text-muted-foreground">Go to "New Agreement" to create one.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Horse</TableHead>
                <TableHead>Box</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((a) => {
                const status = computeStatus(a);
                const customer = a.customerId ? lookup.customerMap.get(a.customerId) : null;
                const horse = a.horseId ? lookup.horseMap.get(a.horseId) : null;
                const pkg = a.liveryPackageId ? lookup.packageMap.get(a.liveryPackageId) : null;
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => setSelectedAgreement(a)}
                    data-testid={`row-agreement-${a.id}`}
                  >
                    <TableCell data-testid={`text-agreement-ref-${a.id}`}>
                      {a.refNumber || "-"}
                    </TableCell>
                    <TableCell>{customer?.name || "-"}</TableCell>
                    <TableCell>
                      {horse ? horse.name : <span className="italic text-muted-foreground">Ghost</span>}
                    </TableCell>
                    <TableCell>{getBoxLabel(a)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {a.agreementType === "PERMANENT_AUTO_RENEW" ? "Permanent" : "Temporary"}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.startDate}</TableCell>
                    <TableCell>{a.endDate || "-"}</TableCell>
                    <TableCell>{pkg?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={status === "ACTIVE" ? "default" : "secondary"} data-testid={`badge-agreement-status-${a.id}`}>
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!selectedAgreement} onOpenChange={() => setSelectedAgreement(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle data-testid="text-agreement-detail-title">Agreement Details</DialogTitle>
          </DialogHeader>
          {selectedAgreement && (
            <AgreementDetail agreement={selectedAgreement} lookup={lookup} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgreementDetail({
  agreement,
  lookup,
}: {
  agreement: SmLiveryAgreement;
  lookup: {
    stableMap: Map<string, SmStable>;
    boxMap: Map<string, SmBox>;
    horseMap: Map<string, SmHorse>;
    customerMap: Map<string, SmCustomer>;
    packageMap: Map<string, SmLiveryPackage>;
  };
}) {
  const stable = agreement.stableId ? lookup.stableMap.get(agreement.stableId) : null;
  const box = agreement.boxId ? lookup.boxMap.get(agreement.boxId) : null;
  const horse = agreement.horseId ? lookup.horseMap.get(agreement.horseId) : null;
  const customer = agreement.customerId ? lookup.customerMap.get(agreement.customerId) : null;
  const pkg = agreement.liveryPackageId ? lookup.packageMap.get(agreement.liveryPackageId) : null;
  const status = computeStatus(agreement);

  const fields = [
    { label: "Ref Number", value: agreement.refNumber || "-" },
    { label: "Agreement Type", value: agreement.agreementType === "PERMANENT_AUTO_RENEW" ? "Permanent (Auto-Renew)" : "Temporary" },
    { label: "Status", value: status },
    { label: "Start Date", value: agreement.startDate },
    { label: "End Date", value: agreement.endDate || "-" },
    { label: "Stable", value: stable?.name || "-" },
    { label: "Box", value: box?.name || "-" },
    { label: "Horse", value: horse?.name || "Ghost (No horse)" },
    { label: "Customer", value: customer?.name || "-" },
    { label: "Customer Contact", value: agreement.customerContact || "-" },
    { label: "Livery Package", value: pkg?.name || "-" },
    { label: "Remarks", value: agreement.remarks || "-" },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-2">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-xs text-muted-foreground">{f.label}</p>
          <p className="text-sm font-medium" data-testid={`text-detail-${f.label.toLowerCase().replace(/\s+/g, "-")}`}>
            {f.value}
          </p>
        </div>
      ))}
    </div>
  );
}
