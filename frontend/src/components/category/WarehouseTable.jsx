import { useState } from "react";
import { mockWarehouses } from "@/data/mockWarehouseCategoryData";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { WarehouseModal } from "./WarehouseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

const getStatusLabel = (status) => {
  const labels = {
    active: "Đang hoạt động",
    inactive: "Ngừng hoạt động",
    maintenance: "Đang bảo trì",
  };
  return labels[status];
};

const getStatusVariant = (status) => {
  const variants = {
    active: "default",
    inactive: "destructive",
    maintenance: "secondary",
  };
  return variants[status];
};

export function WarehouseTable() {
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filteredWarehouses = warehouses.filter(
    (wh) =>
      wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.parentWarehouse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      setWarehouses(warehouses.filter((wh) => wh.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleSave = (warehouse) => {
    if (editingWarehouse) {
      // Giữ nguyên currentStock khi chỉnh sửa
      setWarehouses(
        warehouses.map((wh) =>
          wh.id === warehouse.id
            ? { ...warehouse, currentStock: wh.currentStock }
            : wh
        )
      );
    } else {
      setWarehouses([
        ...warehouses,
        { ...warehouse, id: Date.now().toString(), currentStock: 0 },
      ]);
    }
    setIsModalOpen(false);
  };

  const activeCount = warehouses.filter((wh) => wh.status === "active").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên kho, mã kho, kho tổng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Đang hoạt động:{" "}
            <span className="font-semibold text-foreground">{activeCount}</span>{" "}
            / {warehouses.length}
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
              <TableHead>Mã kho</TableHead>
              <TableHead>Tên kho</TableHead>
              <TableHead>Kho tổng</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead>Sức chứa</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWarehouses.map((warehouse) => {
              const usagePercent =
                warehouse.capacity > 0
                  ? (warehouse.currentStock / warehouse.capacity) * 100
                  : 0;
              return (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-mono text-sm">
                    {warehouse.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                      {warehouse.name}
                    </div>
                  </TableCell>
                  <TableCell>{warehouse.parentWarehouse}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {warehouse.location}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-30">
                      <div className="flex justify-between text-xs">
                        <span>{warehouse.currentStock}</span>
                        <span className="text-muted-foreground">
                          / {warehouse.capacity}
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(warehouse.status)}>
                      {getStatusLabel(warehouse.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(warehouse)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(warehouse.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredWarehouses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy kho nào
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Lưu ý:</strong> Tồn kho hiện tại được cập nhật tự động thông qua
        phiếu nhập/xuất. Không thể chỉnh sửa trực tiếp tại đây.
      </div>

      <WarehouseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        warehouse={editingWarehouse}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa kho này? Hành động này không thể hoàn
              tác.
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
