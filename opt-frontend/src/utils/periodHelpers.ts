import type { PlanningUnit } from "@/types";

export function isPeriodValid(
  planningUnit: PlanningUnit,
  targetPeriod: number,
  targetYear: number,
  today: Date = new Date(),
): boolean {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  switch (planningUnit) {
    case "MONTH":
      if (targetYear < currentYear) return false;
      if (targetYear === currentYear && targetPeriod < currentMonth)
        return false;
      return true;
    case "QUARTER":
      if (targetYear < currentYear) return false;
      if (targetYear === currentYear && targetPeriod < currentQuarter)
        return false;
      return true;
    case "YEAR":
      return targetYear >= currentYear;
  }
}

export function getMonthOptions(targetYear: number, today: Date = new Date()) {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}/${targetYear}`,
    disabled: targetYear === currentYear && i + 1 < currentMonth,
  }));
}

export function getQuarterOptions(
  targetYear: number,
  today: Date = new Date(),
) {
  const currentYear = today.getFullYear();
  const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);

  return Array.from({ length: 4 }, (_, i) => ({
    value: i + 1,
    label: `Q${i + 1}/${targetYear}`,
    disabled: targetYear === currentYear && i + 1 < currentQuarter,
  }));
}

export function getYearOptions(today: Date = new Date()) {
  const currentYear = today.getFullYear();
  return [currentYear, currentYear + 1, currentYear + 2].map((y) => ({
    value: y,
    label: `${y}`,
    disabled: false,
  }));
}

export function formatPeriodLabel(
  planningUnit: PlanningUnit,
  targetPeriod: number,
  targetYear: number,
): string {
  switch (planningUnit) {
    case "MONTH":
      return `Tháng ${targetPeriod}/${targetYear}`;
    case "QUARTER":
      return `Q${targetPeriod}/${targetYear}`;
    case "YEAR":
      return `Năm ${targetYear}`;
  }
}
