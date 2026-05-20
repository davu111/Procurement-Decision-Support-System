import { useState, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateTemplateFile } from "@/utils/templateGenerator";
import type { ConsumptionRecord } from "@/types/forecast";
import * as XLSX from "xlsx";

interface ParsedFileResult {
  totalRows: number;
  validRows: number;
  errorCount: number;
  errors: string[];
  records: ConsumptionRecord[];
}

interface FileImporterProps {
  onImportSuccess: (records: ConsumptionRecord[]) => void;
}

export default function FileImporter({ onImportSuccess }: FileImporterProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedFileResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Convert Excel serial date number to "yyyy-MM-dd" format
  const convertExcelDateToString = (serialNumber: any): string => {
    // If already a string, return as is
    if (typeof serialNumber === "string") {
      return serialNumber;
    }

    // If it's a number (Excel serial date)
    if (typeof serialNumber === "number") {
      // Excel date serial number formula: (date - 25569) * 86400000
      // 25569 is the number of days between 1900-01-01 and 1970-01-01
      const date = new Date((serialNumber - 25569) * 86400000);

      // Format as "yyyy-MM-dd"
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    return String(serialNumber);
  };

  const parseFile = useCallback((file: File) => {
    return new Promise<ParsedFileResult>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet);

          const records: ConsumptionRecord[] = [];
          const errors: string[] = [];

          rows.forEach((row: any, index: number) => {
            const rowNum = index + 2; // +2 vì dòng 1 là header, index bắt đầu từ 0

            try {
              // Validate required fields
              if (
                !row.product_id ||
                !row.period_start_date ||
                !row.period_end_date
              ) {
                errors.push(
                  `Dòng ${rowNum}: Thiếu thông tin bắt buộc (product_id, period_start_date, period_end_date)`,
                );
                return;
              }

              const record: ConsumptionRecord = {
                productId: String(row.product_id),
                periodStartDate: convertExcelDateToString(
                  row.period_start_date,
                ),
                periodEndDate: convertExcelDateToString(row.period_end_date),
                actualConsumption: row.actual_consumption
                  ? Number(row.actual_consumption)
                  : undefined,
                plannedConsumption: row.planned_consumption
                  ? Number(row.planned_consumption)
                  : undefined,
                actualLeadTimeDays: row.actual_lead_time_days
                  ? Number(row.actual_lead_time_days)
                  : undefined,
                actualSupplyRate: row.actual_supply_rate
                  ? Number(row.actual_supply_rate)
                  : undefined,
                notes: row.notes ? String(row.notes) : undefined,
              };

              records.push(record);
            } catch (err) {
              errors.push(`Dòng ${rowNum}: Lỗi xử lý dữ liệu - ${String(err)}`);
            }
          });

          resolve({
            totalRows: rows.length,
            validRows: records.length,
            errorCount: errors.length,
            errors,
            records,
          });
        } catch (err) {
          reject(new Error("Lỗi khi đọc file"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Lỗi khi đọc file"));
      };

      reader.readAsBinaryString(file);
    });
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
        setError("Chỉ hỗ trợ file .csv hoặc .xlsx");
        return;
      }

      setLoading(true);
      setError(null);
      setFileName(file.name);
      setResult(null);

      try {
        const parseResult = await parseFile(file);
        setResult(parseResult);

        if (parseResult.validRows > 0) {
          onImportSuccess(parseResult.records);
        } else if (parseResult.errorCount > 0) {
          setError("File không có dòng dữ liệu hợp lệ");
        }
      } catch (err: any) {
        const errorMessage = err.message || "Lỗi khi import file";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [parseFile, onImportSuccess],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDownloadTemplate = () => {
    generateTemplateFile();
  };

  return (
    <div className="space-y-4">
      {/* Download Template Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Tải template mẫu
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-primary/50",
        )}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileInput}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Đang xử lý file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">
              Kéo thả file vào đây hoặc click để chọn
            </p>
            <p className="text-sm text-muted-foreground">
              Hỗ trợ .csv và .xlsx
            </p>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <XCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{fileName}</span>
            <Badge variant="outline">{result.totalRows} dòng</Badge>
          </div>

          {/* Success Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Hợp lệ</div>
              <div className="text-2xl font-bold text-status-success">
                {result.validRows}
              </div>
            </div>
            <div
              className={cn(
                "rounded-lg p-4 border",
                result.errorCount > 0
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-muted",
              )}
            >
              <div className="text-sm text-muted-foreground">Lỗi</div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  result.errorCount > 0
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {result.errorCount}
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Tổng dòng</div>
              <div className="text-2xl font-bold text-blue-600">
                {result.totalRows}
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Sẵn sàng lưu</div>
              <div className="text-2xl font-bold text-primary">
                {result.validRows > 0 ? "✓" : "—"}
              </div>
            </div>
          </div>

          {/* Error Details */}
          {result.errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <AlertTriangle className="h-5 w-5" />
                {result.errors.length} lỗi chi tiết
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.slice(0, 20).map((err, i) => (
                  <p key={i} className="text-sm text-destructive/80">
                    • {err}
                  </p>
                ))}
              </div>
              {result.errors.length > 20 && (
                <p className="text-xs text-muted-foreground">
                  ... và {result.errors.length - 20} lỗi khác
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
