import { useState, useEffect } from "react";
import api from "@/api/axiosConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConsumptionRecord } from "@/types/forecast";
import { CheckCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import ProductSelector from "@/components/product/ProductSelector";
import FileImporter from "@/components/forecast/FileImporter";
import { Badge } from "@/components/ui/badge";
import type { ConsumptionHistoryRequest } from "@/types/inventory-opt/consumption-history";

export default function ConsumptionPage() {
  const [productId, setProductId] = useState("");
  const [yearMonth, setYearMonth] = useState("");

  const [actualConsumption, setActualConsumption] = useState(0);
  const [plannedConsumption, setPlannedConsumption] = useState(0);
  const [actualLeadTime, setActualLeadTime] = useState(0);
  const [actualSupplyRate, setActualSupplyRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [importedRecords, setImportedRecords] = useState<ConsumptionRecord[]>(
    [],
  );

  const handleImportSuccess = (records: ConsumptionRecord[]) => {
    setImportedRecords((prev) => [...prev, ...records]);
  };

  // 🔥 Call API khi product + month thay đổi
  useEffect(() => {
    if (!productId || !yearMonth) return;

    const fetchData = async () => {
      console.log("Fetching data for", productId, yearMonth);
      try {
        const res = await api.get(`/inventory/parameters/${productId}`, {
          params: { yearMonth },
        });

        const data = res.data;

        // mapping dữ liệu
        setActualConsumption(data.demandQ ? Number(data.demandQ) : 0);
        setPlannedConsumption(data.demandQ ? Number(data.demandQ) : 0);
        setActualLeadTime(
          data.snapshotLeadTimeL ? Number(data.snapshotLeadTimeL * 30) : 0,
        );
        setActualSupplyRate(
          data.snapshotSupplyRateK ? Number(data.snapshotSupplyRateK) : 0,
        );
      } catch (err: any) {
        toast.error("Không lấy được dữ liệu kỳ", {
          description: err?.response?.data?.message || "Lỗi hệ thống",
        });
      }
    };

    fetchData();
  }, [productId, yearMonth]);

  const buildPeriodDates = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-").map(Number);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return {
      periodStartDate: format(start),
      periodEndDate: format(end),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId || !yearMonth) {
      toast.error("Thiếu thông tin", {
        description: "Vui lòng chọn mặt hàng và tháng",
      });
      return;
    }

    try {
      const { periodStartDate, periodEndDate } = buildPeriodDates(yearMonth);

      const payload: ConsumptionHistoryRequest = {
        productId: productId,
        periodStartDate,
        periodEndDate,
        actualConsumption: Number(actualConsumption),
        plannedConsumption: plannedConsumption
          ? Number(plannedConsumption)
          : null,
        actualLeadTimeDays: actualLeadTime ? Number(actualLeadTime) : null,
        actualSupplyRate: actualSupplyRate ? Number(actualSupplyRate) : null,
        notes,
      };

      const res = await api.post("/consumption-history", payload);

      toast.success("Lưu thành công", {
        description: res.data.message,
      });
    } catch (err: any) {
      toast.error("Lỗi khi lưu dữ liệu", {
        description: err?.response?.data?.message || "Lỗi hệ thống",
      });
    }
  };

  // generate tháng 2026
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, "0");
    return {
      label: `2026 - Tháng ${i + 1}`,
      value: `2026-${m}`,
    };
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">
            Nhập tiêu thụ thực tế
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Nhập tiêu thụ thực tế cho kỳ tiêu thụ
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Import dữ liệu tiêu thụ
        </h2>
        <FileImporter onImportSuccess={handleImportSuccess} />

        {importedRecords.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{importedRecords.length} bản ghi</Badge>
            đã có trong hệ thống
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border rounded-lg p-5 space-y-4"
      >
        <h2 className="font-semibold">Thông tin kỳ</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product */}
          <div className="space-y-2">
            <Label>Mặt hàng</Label>
            <ProductSelector
              mode="combobox"
              value={productId}
              onChange={(v) => {
                setProductId(v);
                setYearMonth(""); // reset tháng
              }}
            />
          </div>

          {/* Month selector */}
          <div className="space-y-2">
            <Label>Chọn tháng</Label>
            <Select value={yearMonth} onValueChange={setYearMonth}>
              <SelectTrigger disabled={!productId}>
                <SelectValue placeholder="Chọn tháng..." />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <h2 className="font-semibold pt-2">Dữ liệu thực tế</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Actual Q */}
          <div className="space-y-2">
            <Label>Tiêu thụ thực tế</Label>
            <Input
              type="number"
              value={actualConsumption}
              onChange={(e) => setActualConsumption(Number(e.target.value))}
              required
            />
          </div>

          {/* Planned Q (readonly) */}
          <div className="space-y-2">
            <Label>Tiêu thụ kế hoạch</Label>
            <Input
              type="number"
              value={plannedConsumption}
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>

          {/* L */}
          <div className="space-y-2">
            <Label>Lead time thực tế</Label>
            <Input
              type="number"
              value={actualLeadTime}
              onChange={(e) => setActualLeadTime(Number(e.target.value))}
            />
          </div>

          {/* K */}
          <div className="space-y-2">
            <Label>Tốc độ cung cấp thực tế</Label>
            <Input
              type="number"
              value={actualSupplyRate}
              onChange={(e) => setActualSupplyRate(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ghi chú</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <Button type="submit" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Lưu dữ liệu
        </Button>
      </form>
    </div>
  );
}
