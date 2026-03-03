import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Warehouse,
  Package,
  History,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  warehouses,
  warehouseInventory,
  warehouseHistory,
} from "@/data/mockWarehouseData";

import Header from "../components/all/Header";

const Warehouses = () => {
  const location = useLocation();
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const detailPanelRef = useRef(null);

  // Filter warehouses based on search term
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.area.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Calculate total stock for each warehouse
  const warehouseTotals = useMemo(() => {
    const totals = {};
    warehouseInventory.forEach((item) => {
      totals[item.warehouseId] =
        (totals[item.warehouseId] || 0) + item.quantity;
    });
    return totals;
  }, []);

  // Handle click outside detail panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        detailPanelRef.current &&
        !detailPanelRef.current.contains(event.target) &&
        selectedWarehouse
      ) {
        // Check if click is on the table row
        const tableRow = event.target.closest("tr");
        if (!tableRow) {
          setSelectedWarehouse(null);
        }
      }
    };

    if (selectedWarehouse) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [selectedWarehouse]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Hoạt động</Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Ngừng hoạt động</Badge>;
      case "maintenance":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Bảo trì</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Header currentPage="Kho hàng" menu="admin" />

      {/* Main Container */}
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          {/* Warehouse List View */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Tìm kiếm theo tên kho hoặc khu vực..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Warehouse Table */}
            <Card>
              <CardContent className="pt-6">
                {filteredWarehouses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead>Tên kho</TableHead>
                        <TableHead>Khu vực</TableHead>
                        <TableHead className="text-right">
                          Tổng tồn kho
                        </TableHead>
                        <TableHead className="text-center">
                          Số mặt hàng
                        </TableHead>
                        <TableHead className="text-center">
                          Trạng thái
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarehouses.map((warehouse, index) => (
                        <TableRow
                          key={warehouse.id}
                          className={`cursor-pointer hover:bg-muted transition-colors ${
                            selectedWarehouse?.id === warehouse.id
                              ? "bg-muted"
                              : ""
                          }`}
                          onClick={() => setSelectedWarehouse(warehouse)}
                        >
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {warehouse.name}
                          </TableCell>
                          <TableCell>{warehouse.area}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {(
                              warehouseTotals[warehouse.id] || 0
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {
                              warehouseInventory.filter(
                                (i) => i.warehouseId === warehouse.id
                              ).length
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(warehouse.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Không tìm thấy kho hàng nào
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Warehouse Detail Panel - Overlay */}
        {selectedWarehouse && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-30"
              onClick={() => setSelectedWarehouse(null)}
            />

            {/* Detail Panel */}
            <div
              ref={detailPanelRef}
              className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-background shadow-lg z-40 overflow-y-auto"
            >
              {/* Detail Panel Header */}
              <div className="sticky top-0 bg-background border-b z-50">
                <div className="flex items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-3 flex-1">
                    <Warehouse className="h-6 w-6 text-primary" />
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold truncate">
                        {selectedWarehouse.name}
                      </h2>
                      <div className="text-sm text-muted-foreground">
                        {selectedWarehouse.area}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWarehouse(null)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Detail Panel Content */}
              <div className="p-6 space-y-4">
                {/* Status and Quick Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Trạng thái
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(selectedWarehouse.status)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Tổng tồn kho
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">
                          {(
                            warehouseTotals[selectedWarehouse.id] || 0
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Số mặt hàng
                        </div>
                        <div className="text-2xl font-bold mt-1">
                          {
                            warehouseInventory.filter(
                              (i) => i.warehouseId === selectedWarehouse.id
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="inventory" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="inventory" className="gap-2">
                      <Package className="h-4 w-4" />
                      Hàng trong kho
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="h-4 w-4" />
                      Lịch sử
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="inventory">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Hàng hóa trong kho
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {warehouseInventory.filter(
                          (i) => i.warehouseId === selectedWarehouse.id
                        ).length > 0 ? (
                          <div className="space-y-2">
                            {warehouseInventory
                              .filter(
                                (i) => i.warehouseId === selectedWarehouse.id
                              )
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center p-2 border rounded hover:bg-muted transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {item.productName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.unit}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-primary">
                                      {item.quantity.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            Không có hàng hóa
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="history">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Lịch sử nhập xuất
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {warehouseHistory
                          .filter((i) => i.warehouseId === selectedWarehouse.id)
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          ).length > 0 ? (
                          <div className="space-y-3">
                            {warehouseHistory
                              .filter(
                                (i) => i.warehouseId === selectedWarehouse.id
                              )
                              .sort(
                                (a, b) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime()
                              )
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="border rounded p-3 hover:bg-muted transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="text-xs text-muted-foreground">
                                        {item.date}
                                      </div>
                                      <div className="font-medium mt-1">
                                        {item.productName}
                                      </div>
                                    </div>
                                    {item.type === "nhap" ? (
                                      <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                                        <ArrowDownCircle className="h-3 w-3" />
                                        Nhập
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-blue-500 hover:bg-blue-600 gap-1">
                                        <ArrowUpCircle className="h-3 w-3" />
                                        Xuất
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm space-y-1">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Số lượng:
                                      </span>{" "}
                                      <span className="font-semibold">
                                        {item.quantity.toLocaleString()}{" "}
                                        {item.unit}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Xe:
                                      </span>{" "}
                                      <span className="font-semibold">
                                        {item.vehicle}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Lái xe:
                                      </span>{" "}
                                      {item.driver}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            Chưa có lịch sử
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Warehouses;
