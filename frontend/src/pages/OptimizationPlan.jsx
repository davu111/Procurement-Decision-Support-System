import { useState, useMemo, useEffect, useRef } from "react";
import axios from "../contexts/axios";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Header from "../components/all/Header";
import PlanPopup from "../components/plan/PlanPopup"; // maybe reuse or ignore
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PlanningUnitOptions = [
  { value: "MONTH", label: "Tháng" },
  { value: "DAY", label: "Ngày" },
];

const OptimizationPlan = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productIds: [],
    planningUnit: "MONTH",
    planStartDate: "",
    demandQ: "",
    storageCostCoefficientI: "",
    warehouseConfigId: "",
  });
  const [calcResults, setCalcResults] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detailPanelRef = useRef(null);

  useEffect(() => {
    // load product list
    const fetchProducts = async () => {
      try {
        const res = await axios.get("/products");
        if (res.data && res.data.success) {
          setProducts(res.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchProducts();
  }, []);

  // fetch schedules for all selected products
  useEffect(() => {
    const fetchSchedules = async () => {
      if (form.productIds.length === 0) {
        setSchedules([]);
        return;
      }
      try {
        const year = currentDate.getFullYear();
        const from = new Date(year, 0, 1).toISOString().split("T")[0];
        const to = new Date(year, 11, 31).toISOString().split("T")[0];

        const allSchedules = [];
        for (const productId of form.productIds) {
          const res = await axios.get(
            `/inventory/schedule/${productId}?from=${from}&to=${to}`,
          );
          if (res.data && res.data.success) {
            allSchedules.push(...res.data.data);
          }
        }
        setSchedules(allSchedules);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSchedules();
  }, [currentDate, form.productIds, calcResults]);

  // convert schedules to tasks for calendar display
  const tasks = useMemo(() => {
    return schedules.map((s) => ({
      id: s.id,
      title: `#${s.orderSequence}`,
      startDate: new Date(s.orderDate),
      endDate: new Date(s.orderDate),
      color: s.isReorderWarning ? "bg-red-500" : "bg-blue-500",
      planData: s,
    }));
  }, [schedules]);

  // reuse Plan.jsx helpers (could be extracted but we replicate simple functions here)
  const [filterCategories] = useState(new Set()); // unused
  const [filterStatus] = useState(new Set());

  const taskLines = useMemo(() => {
    const lines = [];
    const sorted = [...tasks].sort((a, b) => a.startDate - b.startDate);
    sorted.forEach((task) => {
      let placed = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (task.startDate > line[line.length - 1].startDate) {
          line.push(task);
          placed = true;
          break;
        }
      }
      if (!placed) lines.push([task]);
    });
    return lines;
  }, [tasks]);

  const filteredTasks = tasks; // no filter implemented
  const filteredLines = taskLines;

  // calendar helpers: same as Plan.jsx
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const adjustedStartingDayOfWeek = (startingDayOfWeek - 1 + 7) % 7;
  const calendarDays = [];
  for (let i = 0; i < adjustedStartingDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getTasksForDate = (day) => {
    if (!day) return [];
    const date = new Date(year, month, day);
    return filteredTasks.filter((task) => {
      const start = task.startDate;
      return (
        date.getFullYear() === start.getFullYear() &&
        date.getMonth() === start.getMonth() &&
        date.getDate() === start.getDate()
      );
    });
  };

  const getTaskLineIndex = (task) => {
    for (let i = 0; i < filteredLines.length; i++) {
      if (filteredLines[i].some((t) => t.id === task.id)) return i;
    }
    return 0;
  };

  const isTaskStart = (task, day) => {
    const date = new Date(year, month, day);
    return date.toDateString() === task.startDate.toDateString();
  };

  const getTaskSpan = (task, day) => {
    return isTaskStart(task, day) ? 1 : 0;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day) => {
    const today = new Date();
    return (
      day &&
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleProductToggle = (productId) => {
    setForm((f) => {
      const ids = f.productIds.includes(productId)
        ? f.productIds.filter((id) => id !== productId)
        : [...f.productIds, productId];
      return { ...f, productIds: ids };
    });
  };

  const handleCalculate = async () => {
    if (form.productIds.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    setLoading(true);
    try {
      const results = [];
      for (const productId of form.productIds) {
        const payload = {
          productId: parseInt(productId),
          planningUnit: form.planningUnit,
          planStartDate: form.planStartDate,
          demandQ: form.demandQ,
          storageCostCoefficientI: form.storageCostCoefficientI,
          warehouseConfigId: form.warehouseConfigId || null,
        };
        const res = await axios.post("/inventory/calculate", payload);
        if (res.data && res.data.success) {
          results.push(res.data.data);
        }
      }
      setCalcResults(results);
      setShowForm(false);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openTaskDetail = (task) => {
    setSelectedCell(task.planData);
    const rect = event.target.getBoundingClientRect();
    setPopupPosition({ top: rect.top + 20, left: rect.left });
  };

  return (
    <>
      <Header currentPage="Tối ưu tồn kho" menu="admin" />
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {!showForm && (
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-indigo-900">
                Lịch Kế Hoạch Tối Ưu
              </h1>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo lịch
              </Button>
            </div>
          )}

          {showForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Thông số tối ưu</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Chọn sản phẩm</Label>
                    <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2 bg-gray-50">
                      {products.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`product-${p.id}`}
                            checked={form.productIds.includes(p.id)}
                            onChange={() => handleProductToggle(p.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <label
                            htmlFor={`product-${p.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {p.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Đơn vị kỳ kế hoạch</Label>
                    <Select
                      value={form.planningUnit}
                      onValueChange={(v) => handleFormChange("planningUnit", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PlanningUnitOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ngày bắt đầu</Label>
                    <Input
                      type="date"
                      value={form.planStartDate}
                      onChange={(e) =>
                        handleFormChange("planStartDate", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Nhu cầu Q</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={form.demandQ}
                      onChange={(e) =>
                        handleFormChange("demandQ", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Hệ số bảo quản I</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={form.storageCostCoefficientI}
                      onChange={(e) =>
                        handleFormChange(
                          "storageCostCoefficientI",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCalculate} disabled={loading}>
                    {loading ? "Đang tính..." : "Tính toán & tạo lịch"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {calcResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Kết quả tính toán ({calcResults.length} sản phẩm)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calcResults.map((result, idx) => (
                    <div key={idx} className="border rounded p-4 bg-gray-50">
                      <div className="font-semibold text-sm mb-2">
                        Sản phẩm {idx + 1}
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          S* = {result.optimalOrderQtyS?.toLocaleString()}
                        </div>
                        <div>
                          τ* = {result.optimalCycleTimeTau?.toLocaleString()}
                        </div>
                        <div>
                          Chi phí tối ưu ={" "}
                          {result.minTotalCost?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Grid View (structure from Plan.jsx) */}
          <div className="bg-white border border-indigo-100 rounded-lg shadow-sm">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-indigo-900">Lịch</h2>
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-indigo-100 rounded"
                >
                  <ChevronLeft className="w-5 h-5 text-indigo-600" />
                </button>
                <span className="text-lg font-semibold text-indigo-900 min-w-32 text-center">
                  {monthNames[month]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-indigo-100 rounded"
                >
                  <ChevronRight className="w-5 h-5 text-indigo-600" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-indigo-50 border-b border-indigo-100">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="p-3 text-center text-sm font-semibold text-indigo-900"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayTasks = getTasksForDate(day);
                const barTasks = dayTasks.filter((t) => isTaskStart(t, day));
                const taskHeightPx = 28;
                const baseHeight = 60;
                const additionalHeight = filteredLines.length;
                const minHeight =
                  baseHeight + additionalHeight * taskHeightPx + 10;

                return (
                  <div
                    key={idx}
                    className={`border-b border-r border-indigo-50 p-2 ${!day ? "bg-gray-50" : ""} ${isToday(day) ? "bg-indigo-50" : ""}`}
                    style={{
                      minHeight: `${minHeight}px`,
                      position: "relative",
                      overflow: "visible",
                    }}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`text-sm font-semibold ${isToday(day) ? "text-white bg-indigo-600 w-6 h-6 rounded-full flex items-center justify-center" : "text-gray-700"}`}
                          >
                            {day}
                          </div>
                        </div>
                        <div
                          className="relative"
                          style={{
                            minHeight: `${additionalHeight * taskHeightPx}px`,
                          }}
                        >
                          {barTasks.map((task) => {
                            const lineIndex = getTaskLineIndex(task);
                            const span = getTaskSpan(task, day);
                            return (
                              <div
                                key={task.id}
                                className={`${task.color} text-white px-2 rounded h-6 text-xs flex items-center cursor-pointer hover:opacity-90 transition-all`}
                                style={{
                                  position: "absolute",
                                  left: "8px",
                                  top: `${taskHeightPx * lineIndex}px`,
                                  width: `calc(${span * 100}% + ${span - 1}px - 16px)`,
                                  zIndex: 50 - lineIndex,
                                  minWidth: "60px",
                                }}
                                title={`Lịch #${task.planData.orderSequence} - ${task.planData.orderQuantity}`}
                                onClick={() => openTaskDetail(task)}
                              >
                                <span className="truncate font-medium whitespace-nowrap">
                                  {task.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* detail popup */}
          {selectedCell && popupPosition && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setSelectedCell(null);
                  setPopupPosition(null);
                }}
              />
              <div
                className="fixed bg-white rounded-lg shadow-2xl z-50 border border-indigo-100 max-w-xs w-80"
                style={{
                  top: `${popupPosition.top}px`,
                  left: `${popupPosition.left}px`,
                  maxHeight: "400px",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-indigo-100 p-3 flex justify-between items-center bg-indigo-50 rounded-t-lg">
                  <h3 className="text-sm font-bold text-indigo-900">
                    Lịch #{selectedCell.orderSequence}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCell(null);
                      setPopupPosition(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-3">
                  <div className="space-y-2">
                    <div>
                      Ngày đặt:{" "}
                      {new Date(selectedCell.orderDate).toLocaleDateString()}
                    </div>
                    <div>Số lượng: {selectedCell.orderQuantity}</div>
                    <div>Chi phí ước tính: {selectedCell.estimatedCost}</div>
                    <div>
                      Dự kiến nhận:{" "}
                      {new Date(
                        selectedCell.expectedDeliveryDate,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OptimizationPlan;
