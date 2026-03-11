import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  SmCustomer,
  SmLiveryAgreement,
  SmLiveryPackage,
  SmBillingElement,
  SmHorse,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/searchable-select";
import { BarChart3, TrendingUp, DollarSign, Fence } from "lucide-react";

function getMonthsBetween(startStr: string, endStr: string): { year: number; month: number; label: string }[] {
  const start = new Date(startStr + "-01");
  const end = new Date(endStr + "-01");
  const months: { year: number; month: number; label: string }[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    months.push({
      year: cur.getFullYear(),
      month: cur.getMonth(),
      label: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`,
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function getMonthEnd(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

export default function LiveryReportPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [startDate, setStartDate] = useState(
    `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}`
  );
  const [endDate, setEndDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [filterCustomer, setFilterCustomer] = useState("");

  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: agreements = [], isLoading: agLoading } = useQuery<SmLiveryAgreement[]>({ queryKey: ["/api/sm/livery-agreements"] });
  const { data: packages = [] } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });
  const { data: billingElements = [], isLoading: beLoading } = useQuery<SmBillingElement[]>({ queryKey: ["/api/sm/billing-elements"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const packageMap = useMemo(() => new Map(packages.map((p) => [p.id, p])), [packages]);

  const customerOptions = useMemo(
    () => [
      { value: "", label: "All Customers" },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ],
    [customers]
  );

  const months = useMemo(() => {
    if (!startDate || !endDate) return [];
    return getMonthsBetween(startDate, endDate);
  }, [startDate, endDate]);

  const reportRows = useMemo(() => {
    const rows: {
      month: string;
      customerId: string;
      customerName: string;
      horseCount: number;
      liveryRevenue: number;
      adhocRevenue: number;
      totalRevenue: number;
    }[] = [];

    const custIdSet = new Set<string>();
    if (filterCustomer) {
      custIdSet.add(filterCustomer);
    } else {
      for (const a of agreements) { if (a.customerId) custIdSet.add(a.customerId); }
      for (const be of billingElements) { if (be.customerId) custIdSet.add(be.customerId); }
    }
    const relevantCustomerIds = Array.from(custIdSet);

    for (const m of months) {
      const monthStart = getMonthStart(m.year, m.month);
      const monthEnd = getMonthEnd(m.year, m.month);

      for (const custId of relevantCustomerIds) {
        const custAgreements = agreements.filter((a) => {
          if (a.customerId !== custId) return false;
          const aStart = new Date(a.startDate);
          const aEnd = a.endDate ? new Date(a.endDate) : new Date(9999, 11, 31);
          return aStart <= monthEnd && aEnd >= monthStart;
        });

        const uniqueHorseIds = new Set(
          custAgreements.filter((a) => a.horseId).map((a) => a.horseId!)
        );
        const horseCount = uniqueHorseIds.size;

        let liveryRevenue = 0;
        for (const ag of custAgreements) {
          if (ag.liveryPackageId) {
            const pkg = packageMap.get(ag.liveryPackageId);
            if (pkg) {
              liveryRevenue += pkg.monthlyPrice;
            }
          }
        }

        let adhocRevenue = 0;
        for (const be of billingElements) {
          if (be.customerId !== custId) continue;
          const txDate = new Date(be.transactionDate);
          if (txDate >= monthStart && txDate <= monthEnd) {
            const qty = parseFloat(be.quantity) || 0;
            adhocRevenue += be.unitPrice * qty;
          }
        }

        if (horseCount > 0 || adhocRevenue > 0) {
          rows.push({
            month: m.label,
            customerId: custId,
            customerName: customerMap.get(custId)?.name || custId,
            horseCount,
            liveryRevenue,
            adhocRevenue,
            totalRevenue: liveryRevenue + adhocRevenue,
          });
        }
      }
    }

    return rows;
  }, [months, agreements, billingElements, filterCustomer, packageMap, customerMap]);

  const kpis = useMemo(() => {
    const allHorseIds = new Set<string>();
    let totalLivery = 0;
    let totalAdhoc = 0;
    for (const row of reportRows) {
      totalLivery += row.liveryRevenue;
      totalAdhoc += row.adhocRevenue;
    }
    for (const ag of agreements) {
      if (ag.horseId) allHorseIds.add(ag.horseId);
    }
    return {
      totalHorses: allHorseIds.size,
      liveryRevenue: totalLivery,
      adhocRevenue: totalAdhoc,
      totalRevenue: totalLivery + totalAdhoc,
    };
  }, [reportRows, agreements]);

  const formatCents = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isLoading = agLoading || beLoading;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="report-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-livery-report">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-report-title">Livery Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue breakdown by customer and month</p>
      </div>

      <Card data-testid="card-report-filters">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <Label className="text-xs text-muted-foreground mb-1 block">Start Month</Label>
              <Input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-report-start"
              />
            </div>
            <div className="w-44">
              <Label className="text-xs text-muted-foreground mb-1 block">End Month</Label>
              <Input
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-report-end"
              />
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Customer</Label>
              <SearchableSelect
                options={customerOptions}
                value={filterCustomer}
                onValueChange={setFilterCustomer}
                placeholder="All Customers"
                data-testid="select-report-customer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grid-report-kpis">
        <Card data-testid="card-kpi-horses">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Fence className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Horses</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-horses">{kpis.totalHorses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-livery">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Livery Revenue</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-livery">{formatCents(kpis.liveryRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-adhoc">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ad-hoc Revenue</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-adhoc">{formatCents(kpis.adhocRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-total">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold" data-testid="text-kpi-total">{formatCents(kpis.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-report-table">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Monthly Revenue Breakdown</CardTitle>
          <Badge variant="secondary" data-testid="badge-report-rows">{reportRows.length} rows</Badge>
        </CardHeader>
        <CardContent>
          {reportRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-report-data">
              <BarChart3 className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No data for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-report">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Month</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Customer</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Horses</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Livery Revenue</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Ad-hoc Revenue</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, idx) => (
                    <tr key={`${row.month}-${row.customerId}`} className="border-b last:border-0" data-testid={`row-report-${idx}`}>
                      <td className="py-2 pr-4">{row.month}</td>
                      <td className="py-2 pr-4">{row.customerName}</td>
                      <td className="py-2 pr-4 text-right">{row.horseCount}</td>
                      <td className="py-2 pr-4 text-right">{formatCents(row.liveryRevenue)}</td>
                      <td className="py-2 pr-4 text-right">{formatCents(row.adhocRevenue)}</td>
                      <td className="py-2 text-right font-medium">{formatCents(row.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
