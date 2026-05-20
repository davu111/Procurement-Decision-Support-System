import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { warehouseApi, transactionApi } from "@/api/warehouseApi";
import type {
  InOutTransaction,
  Warehouse,
  PageResponse,
} from "@/types/warehouse/warehouse";
import { formatNumber } from "@/utils/helpers";

const ALL_WAREHOUSES = "__all__";
const PAGE_SIZE = 10;

const formatDateTime = (s: string | null) => {
  if (!s) return "-";
  try {
    return format(new Date(s), "dd/MM/yyyy HH:mm");
  } catch {
    return s;
  }
};

const toIsoStartOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return format(x, "yyyy-MM-dd'T'HH:mm:ss");
};
const toIsoEndOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return format(x, "yyyy-MM-dd'T'HH:mm:ss");
};

export default function TransactionHistoryPage() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>(ALL_WAREHOUSES);
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<InOutTransaction> | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    warehouseApi
      .getAll()
      .then((d) => setWarehouses(d ?? []))
      .catch(() => undefined);
  }, []);

  const fetchData = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        size: PAGE_SIZE,
        startDate: from ? toIsoStartOfDay(from) : undefined,
        endDate: to ? toIsoEndOfDay(to) : undefined,
      };
      const result =
        warehouseId === ALL_WAREHOUSES
          ? await transactionApi.getAll(params)
          : await transactionApi.getByWarehouseId(warehouseId, params);
      setData(result);
    } catch (e) {
      toast({
        title: "Lỗi tải lịch sử",
        description: e instanceof Error ? e.message : "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, from, to]);

  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const warehouseNameById = useMemo(() => {
    const map = new Map<string, string>();
    warehouses.forEach((w) => map.set(w.id, w.warehouseName));
    return map;
  }, [warehouses]);

  const resetFilters = () => {
    setWarehouseId(ALL_WAREHOUSES);
    setFrom(undefined);
    setTo(undefined);
  };

  const hasActiveFilter =
    warehouseId !== ALL_WAREHOUSES || from !== undefined || to !== undefined;

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">
            Lịch sử Nhập/Xuất kho
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Truy vấn giao dịch nhập/xuất theo kho và khoảng thời gian
          </p>
        </div>
      </div>

      {/* ── Filter Card ─────────────────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Bộ lọc
          </span>
          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Warehouse */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">
              Kho hàng
            </Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Tất cả kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_WAREHOUSES}>Tất cả kho</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.warehouseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From date */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">
              Từ ngày
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl border-gray-200",
                    !from && "text-gray-400",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {from ? format(from, "dd/MM/yyyy") : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={from}
                  onSelect={setFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To date */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">
              Đến ngày
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl border-gray-200",
                    !to && "text-gray-400",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {to ? format(to, "dd/MM/yyyy") : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={to}
                  onSelect={setTo}
                  initialFocus
                  disabled={(d) => (from ? d < from : false)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* ── Results Card ────────────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <History className="h-4 w-4 text-primary" />
          <span className="font-semibold text-gray-900 text-sm">
            Danh sách giao dịch
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium ml-1">
            {totalElements} giao dịch
          </span>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
          )}
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : !data?.content?.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <History className="h-7 w-7 text-gray-200" />
            </div>
            <p className="text-gray-400 text-sm">
              Không có giao dịch nào phù hợp
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Mã GD
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Kho
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Loại
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Mặt hàng
                  </TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Tổng SL
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Tạo lúc
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((t) => {
                  const isImport = t.workType === "IMPORT";
                  const totalQty =
                    t.inOutDetails?.reduce(
                      (s, d) => s + Number(d.quantity ?? 0),
                      0,
                    ) ?? 0;
                  const isOpen = !!expanded[t.id];
                  return (
                    <Collapsible asChild key={t.id} open={isOpen}>
                      <>
                        <TableRow className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <span className="inline-block max-w-[120px] truncate font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                              {t.transactionCode ?? t.id}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">
                            {warehouseNameById.get(t.warehouseId) ??
                              t.warehouseId}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                                isImport
                                  ? "bg-primary/10 text-primary border border-primary/10"
                                  : "bg-amber-50 text-amber-700 border border-amber-100",
                              )}
                            >
                              {isImport ? (
                                <ArrowDownToLine className="h-3 w-3" />
                              ) : (
                                <ArrowUpFromLine className="h-3 w-3" />
                              )}
                              {isImport ? "Nhập" : "Xuất"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                              {t.status ?? "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-700">
                            {t.inOutDetails?.length ?? 0}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-gray-900">
                            {formatNumber(totalQty)}
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs">
                            {formatDateTime(t.createdAt)}
                          </TableCell>
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <button
                                onClick={() =>
                                  setExpanded((m) => ({
                                    ...m,
                                    [t.id]: !m[t.id],
                                  }))
                                }
                                className={cn(
                                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                                  isOpen
                                    ? "bg-primary/10 text-primary"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                                )}
                              >
                                {isOpen ? "Ẩn" : "Chi tiết"}
                              </button>
                            </CollapsibleTrigger>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="bg-gray-50/60 border-b border-gray-100 px-8 py-4"
                            >
                              {t.inOutDetails?.length ? (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5" />
                                    Chi tiết sản phẩm
                                  </p>
                                  <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-gray-50">
                                          <TableHead className="text-[11px] uppercase tracking-wide text-gray-400">
                                            Mã sản phẩm
                                          </TableHead>
                                          <TableHead className="text-[11px] uppercase tracking-wide text-gray-400">
                                            Tên sản phẩm
                                          </TableHead>
                                          <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400">
                                            Số lượng
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {t.inOutDetails.map((d) => (
                                          <TableRow key={d.id}>
                                            <TableCell className="font-mono text-xs text-gray-500">
                                              {d.productId}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-700">
                                              {d.productName}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-gray-900">
                                              {formatNumber(
                                                Number(d.quantity ?? 0),
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400">
                                  Không có chi tiết
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs text-gray-400">
                Trang{" "}
                <span className="font-semibold text-gray-700">{page + 1}</span>{" "}
                / {Math.max(totalPages, 1)} — Tổng{" "}
                <span className="font-semibold text-gray-700">
                  {totalElements}
                </span>{" "}
                giao dịch
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || loading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl gap-1"
                >
                  Sau <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
