import { useState } from "react";
import { mockProducts } from "@/data/mockProductCategoryData";
import { mockWarehouses } from "@/data/mockWarehouseCategoryData";
import { Pencil, Trash2, Plus, Search, Package } from "lucide-react";
import { ProductModal } from "./ProductModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productCategories } from "@/data/mockProductCategoryData";

export function ProductTable() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const getWarehouseName = (warehouseId) => {
    const warehouse = mockWarehouses.find((wh) => wh.id === warehouseId);
    return warehouse ? warehouse.name : "Chưa gắn kho";
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      setProducts(products.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleSave = (product) => {
    if (editingProduct) {
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
    } else {
      setProducts([...products, { ...product, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
  };

  // Thống kê theo chủng loại
  const categoryCounts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, mã, chủng loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Lọc theo chủng loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chủng loại</SelectItem>
              {productCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Tổng:{" "}
            <span className="font-semibold text-foreground">
              {products.length}
            </span>{" "}
            hàng hóa
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm mới
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã hàng</TableHead>
              <TableHead>Tên hàng hóa</TableHead>
              <TableHead>Chủng loại</TableHead>
              <TableHead>Đơn vị tính</TableHead>
              <TableHead>Kho</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">
                  {product.code}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {product.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.unit}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getWarehouseName(product.warehouseId)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-50 truncate">
                  {product.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy hàng hóa nào
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Lưu ý:</strong> Hàng hóa được gắn với Kho, Kế hoạch và Phiếu
        xuất/nhập. Số lượng tồn kho được cập nhật tự động qua các phiếu.
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        product={editingProduct}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hàng hóa này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
