import { useState, useEffect } from "react";
import { mockProducts } from "@/data/mockData";
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
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { ConsumptionHistoryRequest } from "@/types/inventory-opt/consumption-history";

export default function ConsumptionPage() {
  const [productId, setProductId] = useState("");
  const [yearMonth, setYearMonth] = useState("");

  const [actualConsumption, setActualConsumption] = useState(0);
  const [plannedConsumption, setPlannedConsumption] = useState(0);
  const [actualLeadTime, setActualLeadTime] = useState(0);
  const [actualSupplyRate, setActualSupplyRate] = useState(0);
  const [notes, setNotes] = useState("");

  // 🔥 Call API khi product + month thay đổi
  useEffect(() => {
    if (!productId || !yearMonth) return;

    const fetchData = async () => {
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

    // ngày đầu tháng
    const start = new Date(year, month - 1, 1);

    // trick: ngày 0 của tháng sau = ngày cuối tháng hiện tại
    const end = new Date(year, month, 0);

    const format = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD

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
        productId: Number(productId),
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
      <h1 className="text-2xl font-bold">Nhập tiêu thụ thực tế</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-card border rounded-lg p-5 space-y-4"
      >
        <h2 className="font-semibold">Thông tin kỳ</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product */}
          <div className="space-y-2">
            <Label>Mặt hàng</Label>
            <Select
              value={productId}
              onValueChange={(v) => {
                setProductId(v);
                setYearMonth(""); // reset tháng
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn mặt hàng..." />
              </SelectTrigger>
              <SelectContent>
                {mockProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.code} - {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
