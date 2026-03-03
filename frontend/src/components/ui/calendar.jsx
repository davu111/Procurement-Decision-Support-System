import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Calendar = ({ selected, onSelect, className = "", minDate = null }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selected) return new Date(selected);
    return new Date();
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isBeforeMinDate = (date) => {
    if (!minDate) return false;
    const compareDate = new Date(date);
    const compareMin = new Date(minDate);
    compareDate.setHours(0, 0, 0, 0);
    compareMin.setHours(0, 0, 0, 0);
    return compareDate < compareMin;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateClick = (dayObj) => {
    if (isBeforeMinDate(dayObj.date)) return;
    if (onSelect) {
      onSelect(dayObj.date);
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayObj, index) => {
          const isSelectedDay = selected && isSameDay(dayObj.date, selected);
          const isTodayDate = isToday(dayObj.date);
          const isDisabled = isBeforeMinDate(dayObj.date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(dayObj)}
              disabled={isDisabled}
              className={`
                relative px-3 py-2 text-center rounded-lg transition-all min-w-11 min-h-11
                ${!dayObj.isCurrentMonth ? "text-gray-300" : "text-gray-900"}
                ${isDisabled ? "text-gray-300 cursor-not-allowed" : ""}
                ${
                  isSelectedDay
                    ? "bg-indigo-500 text-white font-semibold hover:bg-indigo-600"
                    : !isDisabled
                    ? "hover:bg-gray-100"
                    : ""
                }
                ${
                  isTodayDate && !isSelectedDay
                    ? "bg-gray-100 font-semibold"
                    : ""
                }
              `}
            >
              {dayObj.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export { Calendar };
