import { useState, useEffect, useRef } from "react";
import axios from "../contexts/axios";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import Header from "../components/all/Header";
import { SupplierModal } from "../components/supplier/SupplierModal";
import { SupplierProductModal } from "../components/supplier/SupplierProductModal";
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

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const detailPanelRef = useRef(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/suppliers");
      console.log(res);

      if (res.data && res.data.success) {
        setSuppliers(res.data.data);
      } else {
        setError("Không thể tải danh sách nhà cung cấp");
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Lỗi khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSupplierProducts = async (supplierId) => {
    try {
      const res = await axios.get(`/suppliers/${supplierId}/products`);
      if (res.data && res.data.success) {
        setSupplierProducts(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
      setSupplierProducts([]);
    }
  };

  useEffect(() => {
    if (!selectedSupplier) return;
    fetchSupplierProducts(selectedSupplier.id);
  }, [selectedSupplier]);

  const filtered = suppliers.filter(
    (s) =>
      s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      let res;
      if (editingSupplier) {
        // update
        const payload = { ...data, id: editingSupplier.id };
        res = await axios.put(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        res = await axios.post(`/suppliers`, data);
      }

      if (res && res.data && (res.data.success || res.data.code === 200)) {
        // refresh list regardless of returned item differences
        await fetchSuppliers();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      // you may want to show error notification
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await axios.delete(`/suppliers/${deleteId}`);
      if (res && res.data && (res.data.success || res.data.code === 200)) {
        await fetchSuppliers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteId(null);
    }
  };

  const getStatusBadge = (active) =>
    active ? (
      <Badge className="bg-green-500 hover:bg-green-600">Hoạt động</Badge>
    ) : (
      <Badge variant="secondary">Ngừng hoạt động</Badge>
    );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (data) => {
    try {
      let res;
      if (editingProduct && editingProduct.id) {
        res = await axios.put(`/supplier-products/${editingProduct.id}`, {
          ...data,
          id: editingProduct.id,
        });
      } else {
        res = await axios.post(
          `/suppliers/${selectedSupplier.id}/products`,
          data,
        );
      }

      if (res && res.data && (res.data.success || res.data.code === 200)) {
        await fetchSupplierProducts(selectedSupplier.id);
        setIsProductModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    try {
      const res = await axios.delete(`/supplier-products/${deleteProductId}`);
      if (res && res.data && (res.data.success || res.data.code === 200)) {
        await fetchSupplierProducts(selectedSupplier.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteProductId(null);
    }
  };

  return (
    <>
      <Header currentPage="Nhà cung cấp" menu="admin" />

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo mã hoặc tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm mới
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>Mã NCC</TableHead>
                    <TableHead>Tên NCC</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Điện thoại</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, idx) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setSelectedSupplier(s)}
                    >
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{s.supplierCode}</TableCell>
                      <TableCell className="font-semibold">
                        {s.supplierName}
                      </TableCell>
                      <TableCell>{s.contactPerson}</TableCell>
                      <TableCell>{s.phone || "-"}</TableCell>
                      <TableCell>{s.email || "-"}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(s.isActive)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {loading ? "Đang tải..." : "Không tìm thấy nhà cung cấp nào"}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Detail Panel Overlay */}
        {selectedSupplier && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedSupplier(null)}
            />
            <div
              ref={detailPanelRef}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-lg z-50 overflow-y-auto flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
                <h2 className="text-lg font-semibold">
                  Sản phẩm của {selectedSupplier.supplierName}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSupplier(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <Button onClick={handleAddProduct} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                </div>

                {supplierProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Chưa có sản phẩm nào
                  </div>
                ) : (
                  <div className="space-y-2">
                    {supplierProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-3 space-y-1 text-sm"
                      >
                        <div className="font-semibold text-sm">
                          Sản phẩm ID: {product.productId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>Tên sản phẩm: {product.productName}</div>
                          <div>
                            Cấp cung tối đa: {product.maxSupplyPerMonth} KL
                            /tháng
                          </div>
                          <div>
                            Giá bán: {product.unitPrice?.toLocaleString() || 0}
                          </div>
                          <div>
                            Chi phí đặt hàng:{" "}
                            {product.fixedOrderCost?.toLocaleString() || 0}
                          </div>
                          <div>
                            Thời gian giao: {product.committedLeadTimeDays} ngày
                          </div>
                          {product.effectiveDate && (
                            <div>
                              Từ ngày:{" "}
                              {new Date(
                                product.effectiveDate,
                              ).toLocaleDateString("vi-VN")}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-destructive"
                            onClick={() => setDeleteProductId(product.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <SupplierModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          supplier={editingSupplier}
        />

        <SupplierProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
          product={editingProduct}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận vô hiệu hóa</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này sẽ đánh dấu nhà cung cấp là không hoạt động. Bạn
                có chắc chắn?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Đồng ý
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!deleteProductId}
          onOpenChange={() => setDeleteProductId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách cung cấp
                không?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-destructive hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Suppliers;
