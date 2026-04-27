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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  // Backend expects LocalDateTime: yyyy-MM-ddTHH:mm:ss
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

  // Initial load + reload when filters change
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

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Lịch sử Nhập/Xuất kho
        </h1>
        <p className="text-muted-foreground mt-1">
          Truy vấn các giao dịch nhập/xuất theo kho và khoảng thời gian
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Kho hàng</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
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

            <div className="space-y-1">
              <Label>Từ ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !from && "text-muted-foreground",
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

            <div className="space-y-1">
              <Label>Đến ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !to && "text-muted-foreground",
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

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" /> Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Danh sách giao dịch
            <Badge variant="secondary" className="ml-2">
              {totalElements} giao dịch
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.content?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có giao dịch nào phù hợp
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã GD</TableHead>
                    <TableHead>Kho</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số mặt hàng</TableHead>
                    <TableHead>Tổng SL</TableHead>
                    <TableHead>Tạo lúc</TableHead>
                    <TableHead>Xác nhận lúc</TableHead>
                    <TableHead></TableHead>
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
                          <TableRow>
                            <TableCell className="font-mono text-xs">
                              {t.transactionCode ?? t.id}
                            </TableCell>
                            <TableCell>
                              {warehouseNameById.get(t.warehouseId) ??
                                t.warehouseId}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isImport ? "default" : "secondary"}
                                className="gap-1"
                              >
                                {isImport ? (
                                  <ArrowDownToLine className="h-3 w-3" />
                                ) : (
                                  <ArrowUpFromLine className="h-3 w-3" />
                                )}
                                {isImport ? "Nhập" : "Xuất"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{t.status ?? "-"}</Badge>
                            </TableCell>
                            <TableCell>{t.inOutDetails?.length ?? 0}</TableCell>
                            <TableCell className="font-medium">
                              {formatNumber(totalQty)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDateTime(t.createdAt)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDateTime(t.confirmedAt)}
                            </TableCell>
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpanded((m) => ({
                                      ...m,
                                      [t.id]: !m[t.id],
                                    }))
                                  }
                                >
                                  {isOpen ? "Ẩn" : "Chi tiết"}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow>
                              <TableCell colSpan={9} className="bg-muted/30">
                                {t.inOutDetails?.length ? (
                                  <div className="py-2">
                                    <div className="text-xs font-medium text-muted-foreground mb-2">
                                      Chi tiết sản phẩm
                                    </div>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Mã sản phẩm</TableHead>
                                          <TableHead>Tên sản phẩm</TableHead>
                                          <TableHead className="text-right">
                                            Số lượng
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {t.inOutDetails.map((d) => (
                                          <TableRow key={d.id}>
                                            <TableCell className="font-mono text-xs">
                                              {d.productId}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                              {d.productName}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                              {formatNumber(
                                                Number(d.quantity ?? 0),
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground py-2">
                                    Không có chi tiết
                                  </div>
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
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {page + 1} / {Math.max(totalPages, 1)} — Tổng{" "}
                  {totalElements} giao dịch
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || loading}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page + 1 >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
