import { useState } from "react";
import { mockEmployees } from "@/data/mockEmployeeData";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { EmployeeModal } from "./EmployeeModal";
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

const getRoleLabel = (role) => {
  const labels = {
    admin: "Quản trị viên",
    manager: "Quản lý",
    staff: "Nhân viên",
  };
  return labels[role];
};

const getRoleVariant = (role) => {
  const variants = {
    admin: "default",
    manager: "secondary",
    staff: "outline",
  };
  return variants[role];
};

const getSafetyStatusLabel = (status) => {
  const labels = {
    compliant: "Đạt yêu cầu",
    "non-compliant": "Không đạt",
    pending: "Chờ xác nhận",
  };
  return labels[status];
};

const getSafetyStatusVariant = (status) => {
  const variants = {
    compliant: "default",
    "non-compliant": "destructive",
    pending: "secondary",
  };
  return variants[status];
};

const getWarehouseStatusLabel = (status) => {
  return status === "inside" ? "Trong kho" : "Ngoài kho";
};

export function EmployeeTable() {
  const [employees, setEmployees] = useState(mockEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      setEmployees(employees.filter((emp) => emp.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleSave = (employee) => {
    if (editingEmployee) {
      setEmployees(
        employees.map((emp) => (emp.id === employee.id ? employee : emp))
      );
    } else {
      setEmployees([...employees, { ...employee, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
  };

  const insideCount = employees.filter(
    (emp) => emp.warehouseStatus === "inside"
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên, phòng ban, chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Trong kho:{" "}
            <span className="font-semibold text-foreground">{insideCount}</span>{" "}
            / {employees.length}
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
              <TableHead>Họ tên</TableHead>
              <TableHead>Chức vụ</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Phân quyền</TableHead>
              <TableHead>Bảo hộ LĐ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">
                  {employee.fullName}
                </TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell className="text-muted-foreground">
                  {employee.username}
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleVariant(employee.role)}>
                    {getRoleLabel(employee.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getSafetyStatusVariant(employee.safetyStatus)}
                  >
                    {getSafetyStatusLabel(employee.safetyStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      employee.warehouseStatus === "inside"
                        ? "default"
                        : "outline"
                    }
                  >
                    {getWarehouseStatusLabel(employee.warehouseStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(employee.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy nhân viên nào
          </div>
        )}
      </div>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        employee={editingEmployee}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể
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
