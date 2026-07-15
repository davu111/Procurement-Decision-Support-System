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
import * as XLSX from "xlsx";

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
    const normalizedRecords = normalizeRecordDates(records);
    setImportedRecords((prev) => [...prev, ...normalizedRecords]);
  };

  // 🔥 Call API khi product + month thay đổi
  useEffect(() => {
    if (!productId || !yearMonth) return;

    const fetchData = async () => {
      // console.log("Fetching data for", productId, yearMonth);
      try {
        const res = await api.get(`/inventory/parameters/${productId}`, {
          params: { yearMonth },
        });

        const data = res.data;

        // mapping dữ liệu
        setActualConsumption(data.demandQ ? Number(data.demandQ) : 0);
        setPlannedConsumption(data.demandQ ? Number(data.demandQ) : 0);
        setActualLeadTime(
          data.snapshotLeadTimeL ? Math.ceil(data.snapshotLeadTimeL * 30) : 0,
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

  // Normalize date format from "dd-MM-yyyy" to "yyyy-MM-dd"
  const normalizeDateFormat = (dateString: string): string => {
    if (!dateString) return dateString;

    // Check if already in "yyyy-MM-dd" format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Check if in "dd-MM-yyyy" format
    const ddMmYyyyMatch = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddMmYyyyMatch) {
      const [, day, month, year] = ddMmYyyyMatch;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Check if in "dd/MM/yyyy" format
    const ddSlashMmSlashYyyyMatch = dateString.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    );
    if (ddSlashMmSlashYyyyMatch) {
      const [, day, month, year] = ddSlashMmSlashYyyyMatch;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // If format is not recognized, return as is
    return dateString;
  };

  // Normalize all date fields in records
  const normalizeRecordDates = (
    records: ConsumptionRecord[],
  ): ConsumptionRecord[] => {
    return records.map((record) => ({
      ...record,
      periodStartDate: normalizeDateFormat(record.periodStartDate),
      periodEndDate: normalizeDateFormat(record.periodEndDate),
    }));
  };

  // Convert records to Excel file for multipart upload
  const createExcelFileFromRecords = (records: ConsumptionRecord[]): File => {
    const headers = [
      "product_id",
      "period_start_date",
      "period_end_date",
      "actual_consumption",
      "planned_consumption",
      "actual_lead_time_days",
      "actual_supply_rate",
      "notes",
    ];

    const normalizedRecords = normalizeRecordDates(records);

    const data = normalizedRecords.map((record) => ({
      product_id: record.productId,
      period_start_date: record.periodStartDate,
      period_end_date: record.periodEndDate,
      actual_consumption: record.actualConsumption || "",
      planned_consumption: record.plannedConsumption || "",
      actual_lead_time_days: record.actualLeadTimeDays || "",
      actual_supply_rate: record.actualSupplyRate || "",
      notes: record.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return new File([blob], `consumption_${new Date().getTime()}.xlsx`, {
      type: blob.type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (importedRecords.length == 0 && (!productId || !yearMonth)) {
      toast.error("Thiếu thông tin", {
        description: "Vui lòng chọn mặt hàng và tháng",
      });
      return;
    }

    try {
      // Nếu có dữ liệu import, lưu hàng loạt qua API import
      if (importedRecords.length > 0) {
        // console.log("Imported records:", importedRecords);
        const file = createExcelFileFromRecords(importedRecords);
        const formData = new FormData();
        formData.append("file", file);

        await api.post("/consumption-history/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
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

        await api.post("/consumption-history", payload);
      }

      toast.success("Lưu thành công", {
        description: `Đã lưu dữ liệu${importedRecords.length > 0 ? ` + ${importedRecords.length} bản ghi từ file` : ""}`,
      });

      // Reset form sau khi lưu thành công
      setActualConsumption(0);
      setPlannedConsumption(0);
      setActualLeadTime(0);
      setActualSupplyRate(0);
      setNotes("");
      setImportedRecords([]);
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
    <div className="space-y-6">
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
