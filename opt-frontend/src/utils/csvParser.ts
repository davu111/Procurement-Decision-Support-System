import * as XLSX from 'xlsx';
import type { ConsumptionRecord, ValidationError, ImportResult } from '@/types/forecast';

function parseDate(str: string): Date | null {
  // Support dd-MM-yyyy and yyyy-MM-dd
  const ddMM = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddMM) return new Date(+ddMM[3], +ddMM[2] - 1, +ddMM[1]);
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return null;
}

function formatDateStr(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function parseFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return reject(new Error('Không đọc được file'));

        if (file.name.endsWith('.csv')) {
          const text = data as string;
          const lines = text.split(/\r?\n/).filter(l => l.trim());
          if (lines.length < 2) return reject(new Error('File trống'));
          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim());
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
            return obj;
          });
          resolve(rows);
        } else {
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false });
          resolve(rows);
        }
      } catch (err) {
        reject(err);
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

export function validateConsumptionData(
  rows: Record<string, string>[],
  validProductCodes: string[],
  existingKeys?: Set<string>
): ImportResult {
  const records: ConsumptionRecord[] = [];
  const hardErrors: ValidationError[] = [];
  const softWarnings: ValidationError[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed + header
    const code = row['product_code']?.trim();
    const startStr = row['period_start_date']?.trim();
    const endStr = row['period_end_date']?.trim();
    const consumption = parseFloat(row['actual_consumption']);
    const planned = row['planned_consumption'] ? parseFloat(row['planned_consumption']) : null;
    const leadTime = parseInt(row['actual_lead_time_days']);
    const supplyRate = row['actual_supply_rate'] ? parseFloat(row['actual_supply_rate']) : null;
    const notes = row['notes']?.trim() || '';

    // Hard validations
    if (!code || !validProductCodes.includes(code)) {
      hardErrors.push({ row: rowNum, field: 'product_code', message: `Mã "${code}" không tồn tại trong danh sách mặt hàng`, type: 'hard' });
      return;
    }
    if (!startStr || !parseDate(startStr)) {
      hardErrors.push({ row: rowNum, field: 'period_start_date', message: 'Ngày bắt đầu không hợp lệ (dd-MM-yyyy)', type: 'hard' });
      return;
    }
    if (!endStr || !parseDate(endStr)) {
      hardErrors.push({ row: rowNum, field: 'period_end_date', message: 'Ngày kết thúc không hợp lệ (dd-MM-yyyy)', type: 'hard' });
      return;
    }
    const startDate = parseDate(startStr)!;
    const endDate = parseDate(endStr)!;
    if (endDate < startDate) {
      hardErrors.push({ row: rowNum, field: 'period_end_date', message: 'Ngày kết thúc trước ngày bắt đầu', type: 'hard' });
      return;
    }
    if (isNaN(consumption) || consumption <= 0) {
      hardErrors.push({ row: rowNum, field: 'actual_consumption', message: 'Tiêu thụ thực tế phải > 0', type: 'hard' });
      return;
    }
    if (isNaN(leadTime) || leadTime < 1) {
      hardErrors.push({ row: rowNum, field: 'actual_lead_time_days', message: 'Lead time phải ≥ 1 ngày', type: 'hard' });
      return;
    }

    const key = `${code}_${formatDateStr(startDate)}`;
    if (seenKeys.has(key)) {
      hardErrors.push({ row: rowNum, field: 'product_code+period_start_date', message: `Trùng lặp (${code}, ${startStr}) trong file`, type: 'hard' });
      return;
    }
    if (existingKeys?.has(key)) {
      hardErrors.push({ row: rowNum, field: 'product_code+period_start_date', message: `Dữ liệu (${code}, ${startStr}) đã tồn tại`, type: 'hard' });
      return;
    }
    seenKeys.add(key);

    // Soft validations
    // Outlier check will be done after all records are parsed

    records.push({
      productCode: code,
      periodStartDate: formatDateStr(startDate),
      periodEndDate: formatDateStr(endDate),
      actualConsumption: consumption,
      plannedConsumption: planned,
      actualLeadTimeDays: leadTime,
      actualSupplyRate: supplyRate,
      notes,
    });
  });

  // Soft: outlier detection (3x mean of neighbors)
  const byProduct = new Map<string, ConsumptionRecord[]>();
  records.forEach(r => {
    if (!byProduct.has(r.productCode)) byProduct.set(r.productCode, []);
    byProduct.get(r.productCode)!.push(r);
  });

  byProduct.forEach((recs) => {
    recs.sort((a, b) => a.periodStartDate.localeCompare(b.periodStartDate));
    if (recs.length < 3) return;
    const avg = recs.reduce((s, r) => s + r.actualConsumption, 0) / recs.length;
    recs.forEach((r, i) => {
      if (r.actualConsumption > avg * 3) {
        softWarnings.push({
          row: rows.findIndex(row => row['product_code']?.trim() === r.productCode && (row['period_start_date']?.trim().includes(r.periodStartDate) || formatDateStr(parseDate(row['period_start_date']?.trim() || '')!) === r.periodStartDate)) + 2,
          field: 'actual_consumption',
          message: `Giá trị ${r.actualConsumption} lệch > 3x trung bình (${avg.toFixed(1)}) — có thể là outlier`,
          type: 'soft',
        });
      }
    });

    // Gap detection
    for (let i = 1; i < recs.length; i++) {
      const prev = new Date(recs[i - 1].periodEndDate);
      const curr = new Date(recs[i].periodStartDate);
      const gapDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (gapDays > 7) {
        softWarnings.push({
          row: 0,
          field: 'period',
          message: `Khoảng trống ${Math.round(gapDays)} ngày giữa ${recs[i - 1].periodEndDate} và ${recs[i].periodStartDate} (${recs[i].productCode})`,
          type: 'soft',
        });
      }
    }
  });

  return { records, hardErrors, softWarnings, totalRows: rows.length };
}
