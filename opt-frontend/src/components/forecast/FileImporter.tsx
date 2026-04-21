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
import api from "@/api/axiosConfig";
import { generateTemplateFile } from "@/utils/templateGenerator";
import type { ConsumptionRecord } from "@/types/forecast";

interface ImportResultResponse {
  totalRows: number;
  successCount: number;
  skipCount: number;
  errorCount: number;
  errors: string[];
  modelReadiness: string;
}

interface FileImporterProps {
  onImportSuccess: (records: ConsumptionRecord[]) => void;
}

export default function FileImporter({ onImportSuccess }: FileImporterProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResultResponse | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post<{ data: ImportResultResponse }>(
          "/consumption-history/import",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const importResult = response.data;
        setResult(importResult);

        if (importResult.successCount > 0) {
          onImportSuccess([]);
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || "Lỗi khi import file";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [onImportSuccess],
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
              <div className="text-sm text-muted-foreground">Thành công</div>
              <div className="text-2xl font-bold text-status-success">
                {result.successCount}
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Bỏ qua</div>
              <div className="text-2xl font-bold text-yellow-600">
                {result.skipCount}
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
              <div className="text-sm text-muted-foreground">Tổng cộng</div>
              <div className="text-2xl font-bold text-blue-600">
                {result.totalRows}
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
