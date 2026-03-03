import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { mockPlans } from "../data/mockPlanData";
import Header from "../components/all/Header";
import PlanPopup from "../components/plan/PlanPopup";

// Hàm thuật toán chia line
const organizeTasksIntoLines = (plans) => {
  const lines = [];

  // Sắp xếp plans theo startDate trước
  const sortedPlans = [...plans].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  sortedPlans.forEach((plan) => {
    let inserted = false;

    // Duyệt từng line
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      // Kiểm tra nếu plan.endDate < savedPlan(0).startDate
      if (new Date(plan.endDate) < new Date(line[0].startDate)) {
        line.unshift(plan);
        inserted = true;
        break;
      }

      // Kiểm tra nếu plan.startDate > savedPlan(cuối).endDate
      if (new Date(plan.startDate) > new Date(line[line.length - 1].endDate)) {
        line.push(plan);
        inserted = true;
        break;
      }

      // Kiểm tra vị trí giữa các phần tử
      for (let i = 0; i < line.length - 1; i++) {
        if (
          new Date(plan.startDate) > new Date(line[i].endDate) &&
          new Date(plan.endDate) < new Date(line[i + 1].startDate)
        ) {
          line.splice(i + 1, 0, plan);
          inserted = true;
          break;
        }
      }

      if (inserted) break;
    }

    // Nếu chưa chèn được vào line nào, tạo line mới
    if (!inserted) {
      lines.push([plan]);
    }
  });

  return lines;
};

function Plan() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);
  const [viewDensity, setViewDensity] = useState("comfortable");
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planPopupMode, setPlanPopupMode] = useState("create");

  // Khởi tạo tasks từ mockData và tổ chức thành lines
  const [tasks] = useState(
    mockPlans.map((plan) => ({
      id: plan.id,
      title: plan.planName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      color: plan.color,
      category: "Development",
      planData: plan,
    }))
  );

  // Tính toán lines một lần khi component mount
  const taskLines = useMemo(() => {
    return organizeTasksIntoLines(tasks);
  }, [tasks]);

  const [filterCategories, setFilterCategories] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState(new Set());

  // Get all unique categories
  const categories = useMemo(() => {
    return [...new Set(tasks.map((t) => t.category))];
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by category
    if (filterCategories.size > 0) {
      result = result.filter((t) => filterCategories.has(t.category));
    }

    // Filter by status
    if (filterStatus.size > 0) {
      result = result.filter((t) => filterStatus.has(t.planData.status));
    }

    return result;
  }, [tasks, filterCategories, filterStatus]);

  // Tính toán filtered lines
  const filteredLines = useMemo(() => {
    if (filterCategories.size === 0 && filterStatus.size === 0)
      return taskLines;

    const filtered = filteredTasks.map((t) => t.id);
    return taskLines
      .map((line) => line.filter((task) => filtered.includes(task.id)))
      .filter((line) => line.length > 0);
  }, [taskLines, filteredTasks, filterCategories, filterStatus]);

  // Calendar calculations
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

  // Generate calendar grid (starting with Monday)
  const adjustedStartingDayOfWeek = (startingDayOfWeek - 1 + 7) % 7;
  const calendarDays = [];
  for (let i = 0; i < adjustedStartingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get tasks for a specific date
  const getTasksForDate = (day) => {
    if (!day) return [];
    const date = new Date(year, month, day);
    return filteredTasks.filter((task) => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      date.setHours(12, 0, 0, 0);
      return date >= start && date <= end;
    });
  };

  // Lấy line index của task (thay thế getTaskLayerIndex)
  const getTaskLineIndex = (task) => {
    for (let i = 0; i < filteredLines.length; i++) {
      if (filteredLines[i].some((t) => t.id === task.id)) {
        return i;
      }
    }
    return 0;
  };

  // Check if task starts on this date
  const isTaskStart = (task, day) => {
    const date = new Date(year, month, day);
    const start = new Date(task.startDate);
    return date.toDateString() === start.toDateString();
  };

  // Check if this is a continuation day for a task
  const isTaskContinuation = (task, day) => {
    const date = new Date(year, month, day);
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(12, 0, 0, 0);

    if (date < start || date > end) return false;
    if (date.toDateString() === start.toDateString()) return false;

    const dayOfWeek = new Date(year, month, day).getDay();
    const adjustedDayOfWeek = (dayOfWeek - 1 + 7) % 7;

    return adjustedDayOfWeek === 0;
  };

  // Calculate task span in days for current week view
  const getTaskSpan = (task, day) => {
    const date = new Date(year, month, day);
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(0, 0, 0, 0);

    if (isTaskStart(task, day) || isTaskContinuation(task, day)) {
      const renderStart = isTaskStart(task, day)
        ? date
        : new Date(year, month, day);
      renderStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(firstDayOfMonth);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(lastDayOfMonth);
      monthEnd.setHours(23, 59, 59, 999);

      const actualEnd = end < monthEnd ? end : monthEnd;
      const diffTime = actualEnd - renderStart;
      const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const dayOfWeek = renderStart.getDay();
      const adjustedDayOfWeek = (dayOfWeek - 1 + 7) % 7;
      const daysUntilSunday = 7 - adjustedDayOfWeek;

      return Math.min(totalDays, daysUntilSunday);
    }

    return 0;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day) => {
    return (
      day &&
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const toggleFilter = (category) => {
    const newFilters = new Set(filterCategories);
    if (newFilters.has(category)) {
      newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    setFilterCategories(newFilters);
  };

  const toggleStatusFilter = (status) => {
    const newFilters = new Set(filterStatus);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setFilterStatus(newFilters);
  };

  const getTaskHeight = () => {
    if (viewDensity === "compact") return "h-5";
    if (viewDensity === "comfortable") return "h-6";
    return "h-8";
  };

  const getTaskText = () => {
    if (viewDensity === "compact") return "text-xs";
    if (viewDensity === "comfortable") return "text-xs";
    return "text-sm";
  };

  const openTaskPlanPopup = (task) => {
    setPlanPopupMode("edit");
    setSelectedPlan(task.planData);
    setShowPlanPopup(true);
  };

  return (
    <>
      <Header currentPage="Kế hoạch" menu="admin" />
      {/* Main Content */}
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-indigo-900">
                Lịch Làm Việc
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-indigo-50 rounded"
                >
                  <ChevronLeft className="w-5 h-5 text-indigo-600" />
                </button>
                <span className="text-lg font-semibold text-indigo-900 min-w-32 text-center">
                  {monthNames[month]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-indigo-50 rounded"
                >
                  <ChevronRight className="w-5 h-5 text-indigo-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="space-y-3">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-indigo-900 mb-2">
                  Lọc theo trạng thái:
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => toggleStatusFilter("pending")}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      filterStatus.has("pending")
                        ? "bg-yellow-500 text-white shadow-md"
                        : "bg-white text-yellow-600 border-2 border-yellow-500 hover:bg-yellow-50"
                    }`}
                  >
                    Chưa thực hiện
                  </button>
                  <button
                    onClick={() => toggleStatusFilter("in-progress")}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      filterStatus.has("in-progress")
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white text-blue-600 border-2 border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    Đang thực hiện
                  </button>
                  <button
                    onClick={() => toggleStatusFilter("completed")}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      filterStatus.has("completed")
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-white text-green-600 border-2 border-green-500 hover:bg-green-50"
                    }`}
                  >
                    Đã hoàn thành
                  </button>
                  {filterStatus.size > 0 && (
                    <button
                      onClick={() => setFilterStatus(new Set())}
                      className="px-2 py-1 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid View */}
          <div className="bg-white border border-indigo-100 rounded-lg shadow-sm">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-indigo-50 border-b border-indigo-100">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold text-indigo-900"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const barTasks = dayTasks.filter(
                  (task) =>
                    isTaskStart(task, day) || isTaskContinuation(task, day)
                );

                const taskHeightPx =
                  viewDensity === "compact"
                    ? 24
                    : viewDensity === "comfortable"
                    ? 28
                    : 32;
                const baseHeight = 60;
                const additionalHeight = filteredLines.length;
                const minHeight =
                  baseHeight + additionalHeight * taskHeightPx + 10;

                return (
                  <div
                    key={index}
                    className={`border-b border-r border-indigo-50 p-2 ${
                      !day ? "bg-gray-50" : ""
                    } ${isToday(day) ? "bg-indigo-50" : ""}`}
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
                            className={`text-sm font-semibold ${
                              isToday(day)
                                ? "text-white bg-indigo-600 w-6 h-6 rounded-full flex items-center justify-center"
                                : "text-gray-700"
                            }`}
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
                                className={`${
                                  task.color
                                } text-white px-2 rounded ${getTaskHeight()} ${getTaskText()} flex items-center cursor-pointer hover:opacity-90 transition-all`}
                                style={{
                                  position: "absolute",
                                  left: "8px",
                                  top: `${taskHeightPx * lineIndex}px`,
                                  width: `calc(${span * 100}% + ${
                                    span - 1
                                  }px - 16px)`,
                                  zIndex: 50 - lineIndex,
                                  minWidth: "60px",
                                }}
                                title={`${
                                  task.title
                                } (${task.startDate.toLocaleDateString()} - ${task.endDate.toLocaleDateString()})`}
                                onClick={() => openTaskPlanPopup(task)}
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

          {/* Popup for more tasks */}
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
                    Ngày {selectedCell.day} {monthNames[month]}
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
                    {selectedCell.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`${task.color} text-white p-3 rounded-lg shadow hover:shadow-md transition-all cursor-pointer text-sm`}
                      >
                        <div className="font-semibold">{task.title}</div>
                        <div className="text-xs opacity-95 mt-0.5">
                          {task.startDate.toLocaleDateString("vi-VN")} -{" "}
                          {task.endDate.toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Button Thêm kế hoạch - cố định ở góc dưới phải */}
          <button
            onClick={() => {
              setPlanPopupMode("create");
              setSelectedPlan(null);
              setShowPlanPopup(true);
            }}
            className="cursor-pointer fixed bottom-8 right-8 bg-white text-indigo-600 rounded-full p-4 shadow-lg transition-all hover:shadow-xl z-100 flex items-center justify-center"
            title="Thêm kế hoạch"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* PlanPopup */}
          {showPlanPopup && (
            <PlanPopup
              isOpen={showPlanPopup}
              onClose={() => {
                setShowPlanPopup(false);
                setSelectedPlan(null);
              }}
              mode={planPopupMode}
              initialData={selectedPlan}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default Plan;
