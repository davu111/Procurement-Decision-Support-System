import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseFile, validateConsumptionData } from '@/utils/csvParser';
import { mockProducts } from '@/data/mockData';
import type { ImportResult, ConsumptionRecord } from '@/types/forecast';

interface FileImporterProps {
  onImportSuccess: (records: ConsumptionRecord[]) => void;
}

export default function FileImporter({ onImportSuccess }: FileImporterProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const validCodes = mockProducts.map(p => p.code);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setResult({ records: [], hardErrors: [{ row: 0, field: 'file', message: 'Chỉ hỗ trợ file .csv hoặc .xlsx', type: 'hard' }], softWarnings: [], totalRows: 0 });
      return;
    }
    setLoading(true);
    setFileName(file.name);
    try {
      const rows = await parseFile(file);
      const importResult = validateConsumptionData(rows, validCodes);
      setResult(importResult);
    } catch (err: any) {
      setResult({ records: [], hardErrors: [{ row: 0, field: 'file', message: err.message || 'Lỗi đọc file', type: 'hard' }], softWarnings: [], totalRows: 0 });
    } finally {
      setLoading(false);
    }
  }, [validCodes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleConfirmImport = () => {
    if (result && result.hardErrors.length === 0 && result.records.length > 0) {
      onImportSuccess(result.records);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
        )}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Đang xử lý file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">Kéo thả file vào đây hoặc click để chọn</p>
            <p className="text-sm text-muted-foreground">Hỗ trợ .csv và .xlsx — File <code>consumption_history</code></p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{fileName}</span>
            <Badge variant="outline">{result.totalRows} dòng</Badge>
          </div>

          {/* Hard errors */}
          {result.hardErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <XCircle className="h-5 w-5" />
                {result.hardErrors.length} lỗi nghiêm trọng — không thể import
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.hardErrors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive/80">
                    {err.row > 0 && <span className="font-mono">Dòng {err.row}: </span>}
                    {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Soft warnings */}
          {result.softWarnings.length > 0 && (
            <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-status-warning font-medium">
                <AlertTriangle className="h-5 w-5" />
                {result.softWarnings.length} cảnh báo — vẫn có thể import
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.softWarnings.map((w, i) => (
                  <p key={i} className="text-sm text-status-warning/80">
                    {w.row > 0 && <span className="font-mono">Dòng {w.row}: </span>}
                    {w.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {result.hardErrors.length === 0 && result.records.length > 0 && (
            <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-status-success font-medium">
                  <CheckCircle className="h-5 w-5" />
                  {result.records.length} bản ghi hợp lệ, sẵn sàng import
                </div>
                <Button onClick={handleConfirmImport} size="sm" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Xác nhận Import
                </Button>
              </div>
            </div>
          )}

          {/* Preview table */}
          {result.records.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mã SP</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kỳ</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tiêu thụ TT</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tiêu thụ KH</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Lead time</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{r.productCode}</td>
                        <td className="px-3 py-2">{r.periodStartDate}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.actualConsumption}</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">{r.plannedConsumption ?? '—'}</td>
                        <td className="px-3 py-2 text-right font-mono">{r.actualLeadTimeDays}d</td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.records.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2 bg-muted">
                  Hiển thị 20/{result.records.length} bản ghi
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
