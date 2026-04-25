import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Search,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { productCategoryApi } from "@/api/productCategoryApi";
import {
  isCategoryActive,
  type ProductCategory,
} from "@/types/product/productCategory";

const categorySchema = z.object({
  categoryName: z
    .string()
    .trim()
    .nonempty({ message: "Tên danh mục không được trống" })
    .max(100, { message: "Tên danh mục tối đa 100 ký tự" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Mô tả tối đa 500 ký tự" })
    .optional()
    .or(z.literal("")),
});

export default function ProductCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [form, setForm] = useState({ categoryName: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<ProductCategory | null>(
    null,
  );
  const [toggling, setToggling] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await productCategoryApi.getAll();
      console.log("Loaded categories:", data);
      setCategories(data ?? []);
    } catch (e) {
      toast({
        title: "Lỗi tải danh mục",
        description: e instanceof Error ? e.message : "Không thể tải danh mục",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryName: "", description: "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (c: ProductCategory) => {
    setEditing(c);
    setForm({
      categoryName: c.categoryName ?? "",
      description: c.description ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const parsed = categorySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((iss) => {
        if (iss.path[0]) fieldErrors[String(iss.path[0])] = iss.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        categoryName: parsed.data.categoryName,
        description: parsed.data.description ?? "",
      };
      if (editing) {
        await productCategoryApi.update(editing.id, payload);
        toast({ title: "Đã cập nhật danh mục" });
      } else {
        await productCategoryApi.create(payload);
        toast({ title: "Đã tạo danh mục mới" });
      }
      setDialogOpen(false);
      await loadCategories();
    } catch (e) {
      toast({
        title: editing ? "Cập nhật thất bại" : "Tạo mới thất bại",
        description: e instanceof Error ? e.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmTarget) return;
    setToggling(true);
    const wasActive = isCategoryActive(confirmTarget.isActive);
    try {
      if (wasActive) {
        await productCategoryApi.deactivate(confirmTarget.id);
        toast({ title: "Đã vô hiệu hóa danh mục" });
      } else {
        await productCategoryApi.activate(confirmTarget.id);
        toast({ title: "Đã kích hoạt danh mục" });
      }
      setConfirmTarget(null);
      await loadCategories();
    } catch (e) {
      toast({
        title: "Thao tác thất bại",
        description: e instanceof Error ? e.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  const filtered = categories.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.categoryName?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  const activeCount = categories.filter((c) =>
    isCategoryActive(c.isActive),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            Danh mục sản phẩm
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các danh mục dùng để phân loại mặt hàng trong kho
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Tổng danh mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Vô hiệu hóa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-muted-foreground">
              {categories.length - activeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base">Danh sách danh mục</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc mô tả..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search
                ? "Không tìm thấy danh mục phù hợp"
                : "Chưa có danh mục nào"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="w-[140px]">Trạng thái</TableHead>
                  <TableHead className="w-[160px] text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, idx) => {
                  const active = isCategoryActive(c.isActive);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.categoryName}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md">
                        <span className="line-clamp-2">
                          {c.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {active ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Vô hiệu hóa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(c)}
                            title="Chỉnh sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmTarget(c)}
                            title={active ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            {active ? (
                              <PowerOff className="h-4 w-4 text-destructive" />
                            ) : (
                              <Power className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Cập nhật thông tin danh mục sản phẩm."
                : "Tạo một danh mục mới để phân loại mặt hàng."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="categoryName">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="categoryName"
                value={form.categoryName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryName: e.target.value }))
                }
                placeholder="VD: Nguyên liệu thô"
                maxLength={100}
              />
              {errors.categoryName && (
                <p className="text-xs text-destructive">
                  {errors.categoryName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Mô tả ngắn gọn về danh mục..."
                rows={4}
                maxLength={500}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm activate/deactivate */}
      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget && isCategoryActive(confirmTarget.isActive)
                ? "Vô hiệu hóa danh mục?"
                : "Kích hoạt danh mục?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget && isCategoryActive(confirmTarget.isActive)
                ? `Danh mục "${confirmTarget?.categoryName}" sẽ bị vô hiệu hóa và không hiển thị khi chọn cho mặt hàng mới.`
                : `Danh mục "${confirmTarget?.categoryName}" sẽ được kích hoạt trở lại.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive} disabled={toggling}>
              {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
