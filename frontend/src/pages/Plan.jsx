import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import Header from "../components/all/Header";
import PlanPopup from "../components/plan/PlanPopup";
import { mockPlans } from "../data/mockPlanData";

function Plan() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);
  const [viewDensity, setViewDensity] = useState("comfortable"); // compact, comfortable, spacious
  const [maxVisibleTasks, setMaxVisibleTasks] = useState(4);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const [planPopupMode, setPlanPopupMode] = useState("create");
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Sample tasks data - includes overlapping schedules to demonstrate the solution
  const [tasks] = useState(
    mockPlans.map((plan) => ({
      id: plan.id,
      title: plan.planName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      color: plan.color,
      category: "Development",
      planData: plan, // Store the full plan data
    }))
  );

  const [filterCategories, setFilterCategories] = useState(new Set());

  // Get all unique categories
  const categories = useMemo(() => {
    return [...new Set(tasks.map((t) => t.category))];
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filterCategories.size === 0) return tasks;
    return tasks.filter((t) => filterCategories.has(t.category));
  }, [tasks, filterCategories]);

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

  // Get task layer index - determines vertical position
  const getTaskLayerIndex = (task, day, allTasksInWeek) => {
    // Get all tasks that overlap with this specific task across their full date ranges
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    taskStart.setHours(0, 0, 0, 0);
    taskEnd.setHours(23, 59, 59, 999);

    // Get tasks that overlap with this one - check against ALL filtered tasks, not just dayTasks
    const overlappingTasks = filteredTasks.filter((t) => {
      if (t.id === task.id) return false;
      const tStart = new Date(t.startDate);
      const tEnd = new Date(t.endDate);
      tStart.setHours(0, 0, 0, 0);
      tEnd.setHours(23, 59, 59, 999);

      // Tasks overlap only if one starts before the other ends
      // If one ends exactly when another starts, they don't overlap
      return tStart <= taskEnd || tEnd >= taskStart;
    });

    // Sort overlapping tasks by start date, then by ID
    const sortedOverlapping = [...overlappingTasks].sort((a, b) => {
      const aStart = new Date(a.startDate).getTime();
      const bStart = new Date(b.startDate).getTime();
      if (aStart !== bStart) return aStart - bStart;
      return a.id - b.id;
    });

    // Find this task's position in sorted list
    const thisTaskStart = new Date(task.startDate).getTime();
    let layer = 0;
    for (const t of sortedOverlapping) {
      const tStart = new Date(t.startDate).getTime();
      if (
        tStart < thisTaskStart ||
        (tStart === thisTaskStart && t.id < task.id)
      ) {
        layer++;
      }
    }
    return layer;
  };

  // Check if task starts on this date
  const isTaskStart = (task, day) => {
    const date = new Date(year, month, day);
    const start = new Date(task.startDate);
    return date.toDateString() === start.toDateString();
  };

  // Check if this is a continuation day for a task (first day of a week where task is ongoing)
  const isTaskContinuation = (task, day) => {
    const date = new Date(year, month, day);
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(12, 0, 0, 0);

    // Check if task is active on this day
    if (date < start || date > end) return false;

    // Task started on this day - not a continuation
    if (date.toDateString() === start.toDateString()) return false;

    // Check if this is the first day of a week (Monday)
    const dayOfWeek = new Date(year, month, day).getDay();
    const adjustedDayOfWeek = (dayOfWeek - 1 + 7) % 7;

    return adjustedDayOfWeek === 0; // Monday is first day of week
  };

  // Calculate task span in days for current week view
  const getTaskSpan = (task, day) => {
    const date = new Date(year, month, day);
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);

    // Normalize dates
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(0, 0, 0, 0);

    // For task start day or continuation day, calculate span to end of week
    if (isTaskStart(task, day) || isTaskContinuation(task, day)) {
      // Find the actual start for this rendering (could be task start or week start)
      const renderStart = isTaskStart(task, day)
        ? date
        : new Date(year, month, day);
      renderStart.setHours(0, 0, 0, 0);

      // Month boundaries
      const monthStart = new Date(firstDayOfMonth);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(lastDayOfMonth);
      monthEnd.setHours(23, 59, 59, 999);

      // Actual end date
      const actualEnd = end < monthEnd ? end : monthEnd;

      // Calculate total days
      const diffTime = actualEnd - renderStart;
      const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Calculate days until end of week (Sunday)
      const dayOfWeek = renderStart.getDay();
      const adjustedDayOfWeek = (dayOfWeek - 1 + 7) % 7; // Monday = 0
      const daysUntilSunday = 7 - adjustedDayOfWeek; // Days from current day to Sunday (inclusive)

      return Math.min(totalDays, daysUntilSunday);
    }

    return 0;
  };

  // Get full task span across entire month (for positioning calculations)
  const getFullTaskSpan = (task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const monthStart = new Date(firstDayOfMonth);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(lastDayOfMonth);
    monthEnd.setHours(23, 59, 59, 999);

    const actualStart = start > monthStart ? start : monthStart;
    const actualEnd = end < monthEnd ? end : monthEnd;

    const diffTime = actualEnd - actualStart;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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

  const toggleDayExpansion = (day) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const openTaskPlanPopup = (task) => {
    setPlanPopupMode("edit");
    setSelectedPlan(task.planData);
    setShowPlanPopup(true);
  };

  return (
    <>
      <Header currentPage="Kế hoạch" menu="admin" />

      {/* Main content */}
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

          {/* Filter Categories */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-gray-600">Lọc:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterCategories.has(cat)
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                {cat}
              </button>
            ))}
            {filterCategories.size > 0 && (
              <button
                onClick={() => setFilterCategories(new Set())}
                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Calendar Grid View */}
          <div
            className="bg-white border border-indigo-100 rounded-lg shadow-sm"
            style={{ overflow: "visible", position: "relative" }}
          >
            {/* Day Headers */}
            <div
              className="grid grid-cols-7 bg-indigo-50 border-b border-indigo-100"
              style={{ position: "relative", zIndex: 20 }}
            >
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
            <div
              className="grid grid-cols-7"
              style={{ position: "relative", overflow: "visible" }}
            >
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                // Tasks that start in this cell or are continuation segments starting this week
                const barTasks = dayTasks.filter(
                  (task) =>
                    isTaskStart(task, day) || isTaskContinuation(task, day)
                );

                // QUAN TRỌNG: Kiểm tra expanded state - dùng dayTasks.length để đếm tất cả task đi qua ngày
                const isExpanded = expandedDays.has(day);
                const effectiveMaxVisible = isExpanded
                  ? dayTasks.length
                  : maxVisibleTasks;

                // Chỉ lấy số lượng task cần hiển thị từ dayTasks (tất cả task đi qua ngày)
                const visibleTasks = dayTasks.slice(0, effectiveMaxVisible);
                const hiddenCount = Math.max(
                  0,
                  dayTasks.length - effectiveMaxVisible
                );

                // Tính chiều cao dựa trên số task HIỂN THỊ thực tế
                const taskHeightPx =
                  viewDensity === "compact"
                    ? 24
                    : viewDensity === "comfortable"
                    ? 28
                    : 32;
                const baseHeight = 60; // Header của ngày
                const additionalHeight =
                  visibleTasks.length > 0
                    ? Math.max(
                        ...visibleTasks.map((task) =>
                          getTaskLayerIndex(task, day, dayTasks)
                        )
                      ) + 1
                    : 0;
                const buttonHeight = hiddenCount > 0 ? 28 : 0;
                const minHeight =
                  baseHeight + additionalHeight * taskHeightPx + buttonHeight;

                // Calculate max layer across visible tasks for cell height
                const maxLayer =
                  visibleTasks.length > 0
                    ? Math.max(
                        ...visibleTasks.map((task) =>
                          getTaskLayerIndex(task, day, dayTasks)
                        )
                      )
                    : 0;

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
                        <div
                          className="flex items-center justify-between mb-2"
                          style={{ position: "relative", zIndex: 10 }}
                        >
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
                            zIndex: 1,
                            overflow: "visible",
                            position: "relative",
                            minHeight: `${additionalHeight * taskHeightPx}px`,
                          }}
                        >
                          {visibleTasks.map((task) => {
                            // Chỉ vẽ task bar nếu task bắt đầu hoặc tiếp tục ở ngày này
                            if (
                              !isTaskStart(task, day) &&
                              !isTaskContinuation(task, day)
                            ) {
                              return null;
                            }

                            const layerIndex = getTaskLayerIndex(
                              task,
                              day,
                              dayTasks
                            );
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
                                  top: `${taskHeightPx * layerIndex}px`,
                                  width: `calc(${span * 100}% + ${
                                    span - 1
                                  }px - 16px)`,
                                  zIndex: 50 - layerIndex,
                                  minWidth: "60px",
                                  pointerEvents: "auto",
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

                        {/* "More tasks" indicator - ĐẶT BÊN NGOÀI div của tasks */}
                        {hiddenCount > 0 && (
                          <div
                            className="mt-1"
                            style={{
                              position: "relative",
                              zIndex: 15,
                              marginTop: `${
                                additionalHeight * taskHeightPx + 4
                              }px`,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();

                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                const popupHeight = 400;
                                const viewportHeight = window.innerHeight;

                                let top = rect.bottom;

                                // Nếu popup bị tràn xuống dưới viewport → hiển thị phía trên
                                if (
                                  rect.bottom + popupHeight >
                                  viewportHeight
                                ) {
                                  top = rect.top - popupHeight;
                                }

                                // Đảm bảo popup không vượt khỏi phía trên màn hình
                                top = Math.max(top, 0);

                                setPopupPosition({
                                  top,
                                  left: rect.left,
                                });

                                setSelectedCell({ day, tasks: dayTasks });
                              }}
                              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 px-2 py-1 rounded transition-colors w-full text-left"
                            >
                              {`+${hiddenCount} mục khác`}
                            </button>
                          </div>
                        )}
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
              {/* Backdrop để đóng popup */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setSelectedCell(null);
                  setPopupPosition(null);
                }}
              />
              {/* Popup nhỏ */}
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
                {/* Header */}
                <div className="border-b border-indigo-100 p-3 flex justify-between items-center bg-indigo-50 rounded-t-lg">
                  <h3 className="text-sm font-bold text-indigo-900">
                    Ngày {selectedCell.day} {monthNames[month]}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCell(null);
                      setPopupPosition(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none w-5 h-5 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* Tasks List */}
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
                        <div className="text-xs opacity-80 mt-0.5 bg-black bg-opacity-20 inline-block px-1.5 py-0.5 rounded">
                          {task.category}
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
            className="cursor-pointer fixed bottom-8 right-8 bg-white text-indigo-600 rounded-full p-4 shadow-lg transition-all hover:shadow-xl z-40 flex items-center justify-center"
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
