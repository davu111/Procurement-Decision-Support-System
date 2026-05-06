import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  ImageIcon,
  Filter,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

import { productApi } from "@/api/productApi";
import { productCategoryApi } from "@/api/productCategoryApi";
import type {
  Product,
  ProductRequest,
  ProductStatus,
} from "@/types/product/product";
import type { ProductCategory } from "@/types/product/productCategory";
import { isCategoryActive } from "@/types/product/productCategory";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type StatusFilter = "ALL" | ProductStatus;
type SortOption = "name_desc" | "name_asc" | "newest" | "oldest";

const SORT_MAP: Record<SortOption, string> = {
  name_desc: "productName,desc",
  name_asc: "productName,asc",
  newest: "updatedAt,desc",
  oldest: "createdAt,asc",
};

const PAGE_SIZE = 12;

const emptyForm: ProductRequest = {
  code: "",
  productName: "",
  unit: "",
  description: "",
  categoryId: "",
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortOption>("name_desc");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductRequest>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Toggle confirm
  const [toggleTarget, setToggleTarget] = useState<Product | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.list({
        categoryId,
        status: status === "ALL" ? undefined : status,
        page,
        size: PAGE_SIZE,
        sort: SORT_MAP[sort],
      });
      // Hỗ trợ cả PageResponse lẫn mảng thuần
      let list: Product[] = [];
      if (Array.isArray(data)) {
        list = data;
        setTotalPages(1);
        setTotalElements(data.length);
      } else if (data && Array.isArray((data as any).content)) {
        list = (data as any).content;
        setTotalPages((data as any).totalPages ?? 1);
        setTotalElements((data as any).totalElements ?? list.length);
      }
      setProducts(list);
      // Fetch ảnh hàng loạt
      const ids = list.map((p) => p.id).filter(Boolean);
      if (ids.length > 0) {
        try {
          const urls = await productApi.getImageUrlsBatch(ids);
          setProducts((prev) =>
            prev.map((p) => ({ ...p, imageUrl: urls?.[p.id] || p.imageUrl })),
          );
        } catch {
          // bỏ qua nếu lỗi ảnh
        }
      }
    } catch (e) {
      toast({
        title: "Lỗi",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await productCategoryApi.getAll();
      setCategories(data || []);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Reset về trang 0 khi đổi filter/sort
  useEffect(() => {
    setPage(0);
  }, [categoryId, status, sort]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, status, sort, page]);

  const activeCategories = useMemo(
    () => categories.filter((c) => isCategoryActive(c.isActive)),
    [categories],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    setForm({
      code: p.code ?? p.code ?? "",
      productName: p.productName,
      unit: p.unit,
      description: p.description ?? "",
      categoryId: p.categoryId ?? "",
    });
    setImageFile(null);
    setImagePreview(p.imageUrl ?? null);
    setDialogOpen(true);
    // Lấy URL ảnh mới nhất từ server
    try {
      const url = await productApi.getImageUrl(p.id);
      if (url) setImagePreview(url);
    } catch {
      // bỏ qua
    }
  };

  const onPickImage = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(editing?.imageUrl ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!form.productName.trim() || !form.unit.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên và đơn vị",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const payload: ProductRequest = {
        ...form,
        categoryId: form.categoryId || undefined,
      };
      let saved: Product;
      if (editing) {
        saved = await productApi.update(editing.id, payload);
        toast({ title: "Đã cập nhật sản phẩm" });
      } else {
        saved = await productApi.create(payload);
        toast({ title: "Đã tạo sản phẩm" });
      }
      if (imageFile && saved?.id) {
        await productApi.uploadImage(saved.id, imageFile);
        toast({ title: "Đã tải ảnh sản phẩm" });
      }
      setDialogOpen(false);
      await loadProducts();
    } catch (e) {
      toast({
        title: "Lỗi",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    const willDeactivate = toggleTarget.status === "ACTIVE";
    try {
      if (willDeactivate) await productApi.deactivate(toggleTarget.id);
      else await productApi.activate(toggleTarget.id);
      toast({ title: willDeactivate ? "Đã ngừng hoạt động" : "Đã kích hoạt" });
      setToggleTarget(null);
      await loadProducts();
    } catch (e) {
      toast({
        title: "Lỗi",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Danh sách mặt hàng
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi tình trạng từng mặt hàng
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" /> Bộ lọc
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Danh mục</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trạng thái</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as StatusFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sắp xếp</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_desc">Tên sản phẩm (Z→A)</SelectItem>
              <SelectItem value="name_asc">Tên sản phẩm (A→Z)</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {totalElements > 0 && (
            <>
              Tổng:{" "}
              <span className="font-medium text-foreground">
                {totalElements}
              </span>{" "}
              sản phẩm
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          Đang tải...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Không có sản phẩm
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const isActive = product.status === "ACTIVE";
            return (
              <div
                key={product.id}
                className={cn(
                  "bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow",
                  !isActive && "opacity-70",
                )}
              >
                <div
                  className="aspect-video bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        {product.code ?? product.code ?? product.id}
                      </p>
                      <h3 className="font-semibold text-foreground truncate">
                        {product.productName}
                      </h3>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Hoạt động" : "Ngừng"}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Đơn vị: {product.unit}</span>
                    {product.categoryName && (
                      <span>{product.categoryName}</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEdit(product)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant={isActive ? "destructive" : "default"}
                      className="flex-1"
                      onClick={() => setToggleTarget(product)}
                    >
                      {isActive ? (
                        <PowerOff className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                      {isActive ? "Ngừng" : "Kích hoạt"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 0) setPage(page - 1);
                }}
                className={cn(
                  page === 0 && "pointer-events-none opacity-50",
                  "cursor-pointer",
                )}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, idx) => {
              // Hiển thị gọn: trang đầu, cuối, hiện tại ±1
              const isEdge = idx === 0 || idx === totalPages - 1;
              const isNear = Math.abs(idx - page) <= 1;
              if (!isEdge && !isNear) {
                if (idx === 1 || idx === totalPages - 2) {
                  return (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              }
              return (
                <PaginationItem key={idx}>
                  <PaginationLink
                    isActive={idx === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(idx);
                    }}
                    className="cursor-pointer"
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages - 1) setPage(page + 1);
                }}
                className={cn(
                  page >= totalPages - 1 && "pointer-events-none opacity-50",
                  "cursor-pointer",
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin sản phẩm và tải ảnh nếu cần.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã sản phẩm</Label>
                <Input
                  value={form.code ?? ""}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="SP001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Đơn vị *</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="cái, kg..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tên sản phẩm *</Label>
              <Input
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Select
                value={form.categoryId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, categoryId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Không chọn —</SelectItem>
                  {activeCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ảnh sản phẩm</Label>
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border cursor-pointer hover:bg-accent">
                    <Upload className="h-4 w-4" /> Chọn ảnh
                  </span>
                </label>
              </div>
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
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle confirm */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(o) => !o && setToggleTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.status === "ACTIVE"
                ? "Ngừng hoạt động sản phẩm?"
                : "Kích hoạt sản phẩm?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.productName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
