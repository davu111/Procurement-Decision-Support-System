import { useState } from "react";
import { mockVehicles } from "@/data/mockVehicleData";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { VehicleModal } from "./VehicleModal";
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

const getTypeLabel = (type) => {
  const labels = {
    truck: "Xe tải",
    forklift: "Xe nâng",
    van: "Xe van",
    motorcycle: "Xe máy",
  };
  return labels[type];
};

const getStatusLabel = (status) => {
  const labels = {
    available: "Sẵn sàng",
    "in-use": "Đang sử dụng",
    maintenance: "Bảo trì",
  };
  return labels[status];
};

const getStatusVariant = (status) => {
  const variants = {
    available: "default",
    "in-use": "secondary",
    maintenance: "destructive",
  };
  return variants[status];
};

export function VehicleTable() {
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      setVehicles(vehicles.filter((v) => v.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleSave = (vehicle) => {
    if (editingVehicle) {
      setVehicles(vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)));
    } else {
      setVehicles([...vehicles, { ...vehicle, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
  };

  const availableCount = vehicles.filter(
    (v) => v.status === "available"
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên xe, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Sẵn sàng:{" "}
            <span className="font-semibold text-foreground">
              {availableCount}
            </span>{" "}
            / {vehicles.length}
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
              <TableHead>Tên xe</TableHead>
              <TableHead>Biển số</TableHead>
              <TableHead>Loại phương tiện</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.name}</TableCell>
                <TableCell>{vehicle.licensePlate}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getTypeLabel(vehicle.type)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredVehicles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy phương tiện nào
          </div>
        )}
      </div>

      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        vehicle={editingVehicle}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phương tiện này? Hành động này không thể
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
