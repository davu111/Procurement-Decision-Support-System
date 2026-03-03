import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Truck,
  Search,
  X,
  Package,
  Clock,
  Zap,
  MapPin,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VehicleStateTimeline from "@/components/vehicle/VehicleStateTimeline";
import WebSocketNotificationPopup from "@/components/vehicle/WebSocketNotificationPopup";
import { connectSocket, disconnectSocket } from "@/socket/socket";

import Header from "../components/all/Header";

const Vehicle = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsNotification, setWsNotification] = useState(null);
  const detailPanelRef = useRef(null);

  // Fetch all vehicles on component mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:9000/api/vehicles");
        if (response.data.code === 200) {
          setVehicles(response.data.data);
        }
      } catch (err) {
        setError("Lỗi khi tải danh sách phương tiện");
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();

    // Connect to WebSocket
    const handleWebSocketMessage = (message) => {
      console.log("WebSocket message received:", message);
      setWsNotification(message);
    };

    connectSocket(handleWebSocketMessage);
    console.log(import.meta.env.VITE_SOCKET_URL);

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicleName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || vehicle.currentState === filterStatus;

      const matchesType =
        filterType === "all" || vehicle.vehicleType.typeName === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vehicles, searchTerm, filterStatus, filterType]);

  // Get plan details for selected vehicle
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    if (!selectedVehicle) {
      setSelectedPlan(null);
      return;
    }

    const fetchPlan = async () => {
      try {
        setPlanLoading(true);
        const response = await axios.get(
          `http://localhost:9000/api/plans/search/${selectedVehicle.licensePlate}`,
        );
        if (response.data.code === 200) {
          setSelectedPlan(response.data.data);
          console.log("Fetched plan details:", response.data.data);
        }
      } catch (err) {
        console.error("Error fetching plan details:", err);
        setSelectedPlan(null);
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlan();
  }, [selectedVehicle]);

  // Handle click outside detail panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        detailPanelRef.current &&
        !detailPanelRef.current.contains(event.target) &&
        selectedVehicle
      ) {
        const tableRow = event.target.closest("tr");
        if (!tableRow) {
          setSelectedVehicle(null);
        }
      }
    };

    if (selectedVehicle) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [selectedVehicle]);

  const getStatusBadge = (status) => {
    const statusMap = {
      S0: { label: "Chưa đăng ký", color: "bg-gray-500" },
      S1: { label: "Đã đăng ký", color: "bg-yellow-500" },
      S2: { label: "Đã vào cổng", color: "bg-blue-500" },
      S3: { label: "Di chuyển nội bộ", color: "bg-indigo-500" },
      S4: { label: "Đến đúng kho", color: "bg-cyan-500" },
      S5: { label: "Chờ bốc/dỡ", color: "bg-amber-500" },
      S6: { label: "Đang bốc/dỡ hàng", color: "bg-orange-500" },
      S7: { label: "Hoàn tất bốc/dỡ", color: "bg-lime-500" },
      S8: { label: "Chờ xác nhận xuất kho", color: "bg-purple-500" },
      S9: { label: "Đã xuất kho", color: "bg-green-500" },
      S10: { label: "Vi phạm", color: "bg-red-600" },
    };

    const statusInfo = statusMap[status];
    if (statusInfo) {
      return (
        <Badge
          className={`${statusInfo.color} hover:opacity-80 text-white text-xs`}
        >
          {statusInfo.label}
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getTypeLabel = (vehicleType) => {
    if (typeof vehicleType === "object") {
      return vehicleType.typeName || "Không xác định";
    }
    const labels = {
      "Xe tải nhỏ": "Xe tải nhỏ",
      "Xe tải lớn": "Xe tải lớn",
      "Xe nâng": "Xe nâng",
      "Xe van": "Xe van",
      "Xe ba gác": "Xe ba gác",
    };
    return labels[vehicleType] || vehicleType;
  };

  const getInWarehouseStatus = (inWarehouse) => {
    return inWarehouse ? (
      <Badge className="bg-green-100 text-green-800">Trong kho</Badge>
    ) : (
      <Badge variant="outline">Ngoài kho</Badge>
    );
  };

  return (
    <>
      <Header currentPage="Phương tiện" menu="admin" />

      {/* WebSocket Notification Popup */}
      <WebSocketNotificationPopup
        notification={wsNotification}
        onClose={() => setWsNotification(null)}
      />

      {/* Main Container */}
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          {/* Vehicle List View */}
          <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo biển số hoặc tên xe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="S0">Chưa đăng ký</SelectItem>
                  <SelectItem value="S1">Đã đăng ký – chờ vào</SelectItem>
                  <SelectItem value="S2">Đã vào cổng</SelectItem>
                  <SelectItem value="S3">Đang di chuyển nội bộ</SelectItem>
                  <SelectItem value="S4">Đến đúng kho</SelectItem>
                  <SelectItem value="S5">Chờ bốc/dỡ</SelectItem>
                  <SelectItem value="S6">Đang bốc/dỡ hàng</SelectItem>
                  <SelectItem value="S7">Hoàn tất bốc/dỡ</SelectItem>
                  <SelectItem value="S8">Chờ xác nhận xuất kho</SelectItem>
                  <SelectItem value="S9">Đã xuất kho</SelectItem>
                  <SelectItem value="S10">Vi phạm</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Type */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo loại xe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại xe</SelectItem>
                  <SelectItem value="Xe tải nhỏ">Xe tải nhỏ</SelectItem>
                  <SelectItem value="Xe tải lớn">Xe tải lớn</SelectItem>
                  <SelectItem value="Xe nâng">Xe nâng</SelectItem>
                  <SelectItem value="Xe van">Xe van</SelectItem>
                  <SelectItem value="Xe ba gác">Xe ba gác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Table */}
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Đang tải danh sách phương tiện...
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : filteredVehicles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">STT</TableHead>
                          <TableHead>Biển số</TableHead>
                          <TableHead>Tên xe</TableHead>
                          <TableHead className="text-center">Loại xe</TableHead>
                          <TableHead className="text-center">
                            Trạng thái
                          </TableHead>
                          <TableHead className="text-center">Vị trí</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVehicles.map((vehicle, index) => (
                          <TableRow
                            key={vehicle.id}
                            className={`cursor-pointer hover:bg-muted transition-colors ${
                              selectedVehicle?.id === vehicle.id
                                ? "bg-muted"
                                : ""
                            }`}
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <TableCell className="font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {vehicle.licensePlate}
                            </TableCell>
                            <TableCell>{vehicle.vehicleName}</TableCell>
                            <TableCell className="text-center">
                              {getTypeLabel(vehicle.vehicleType)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(vehicle.currentState)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getInWarehouseStatus(vehicle.inWarehouseFlag)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Không tìm thấy phương tiện nào
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Vehicle Detail Panel - Overlay */}
        {selectedVehicle && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-30"
              onClick={() => setSelectedVehicle(null)}
            />

            {/* Detail Panel */}
            <div
              ref={detailPanelRef}
              className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-background shadow-lg z-40 overflow-y-auto"
            >
              {/* Detail Panel Header */}
              <div className="sticky top-0 bg-background border-b z-50">
                <div className="flex items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Truck className="h-6 w-6 text-primary shrink-0" />
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold truncate">
                        {selectedVehicle.licensePlate}
                      </h2>
                      <div className="text-sm text-muted-foreground">
                        {selectedVehicle.vehicleName}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Detail Panel Content */}
              <div className="p-6 space-y-4">
                {/* Quick Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Loại xe
                        </div>
                        <div className="text-lg font-semibold mt-1">
                          {getTypeLabel(selectedVehicle.vehicleType)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Trạng thái
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(selectedVehicle.currentState)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Vị trí hiện tại
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-primary" />
                          <div className="font-semibold">
                            {selectedVehicle.currentLocation}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Kế hoạch hiện tại
                        </div>
                        <div className="text-lg font-semibold mt-1">
                          {selectedPlan?.planName || "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="plan" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="plan" className="gap-2">
                      <Package className="h-4 w-4" />
                      Kế hoạch
                    </TabsTrigger>
                    <TabsTrigger value="status" className="gap-2">
                      <Zap className="h-4 w-4" />
                      Trạng thái
                    </TabsTrigger>
                  </TabsList>

                  {/* Plan Tab */}
                  <TabsContent value="plan">
                    {planLoading ? (
                      <Card>
                        <CardContent className="pt-6 text-center py-8 text-muted-foreground">
                          Đang tải thông tin kế hoạch...
                        </CardContent>
                      </Card>
                    ) : selectedPlan ? (
                      <div className="space-y-4">
                        {/* Plan Overview */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">
                              {selectedPlan?.planName || "Không có kế hoạch"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Driver Info */}
                            <div className="flex items-center gap-3 p-3 bg-muted rounded">
                              <User className="h-5 w-5 text-primary" />
                              <div className="flex-1">
                                <div className="text-sm text-muted-foreground">
                                  Lái xe
                                </div>
                                <div className="font-semibold">
                                  {selectedPlan.driverName}
                                </div>
                              </div>
                            </div>

                            {/* Crew Members - displayed below driver */}
                            {selectedPlan.crewMembers &&
                              selectedPlan.crewMembers.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-sm text-muted-foreground px-3">
                                    Thành viên kế hoạch
                                  </div>
                                  {selectedPlan.crewMembers.map(
                                    (member, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 bg-muted rounded"
                                      >
                                        <UserPlus className="h-5 w-5 text-primary ml-0.5" />
                                        <div className="font-medium text-sm">
                                          {member}
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}

                            {/* Warehouse Info - Note: This will need to be mapped from details */}
                            <div className="flex items-center gap-3 p-3 bg-muted rounded">
                              <MapPin className="h-5 w-5 text-primary" />
                              <div className="flex-1">
                                <div className="text-sm text-muted-foreground">
                                  Mục đích vận chuyển
                                </div>
                                <div className="font-semibold">
                                  {selectedPlan.purpose}
                                </div>
                              </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Thời gian bắt đầu
                                </span>
                                <span className="font-medium">
                                  {new Date(
                                    selectedPlan.startDate,
                                  ).toLocaleString("vi-VN")}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Dự kiến hoàn tất
                                </span>
                                <span className="font-medium">
                                  {new Date(
                                    selectedPlan.endDate,
                                  ).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            </div>

                            {/* Note */}
                            {selectedPlan.note && (
                              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <div className="text-sm text-muted-foreground mb-1">
                                  Ghi chú
                                </div>
                                <div className="text-sm">
                                  {selectedPlan.note}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Work Details */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Chi tiết kế hoạch
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {selectedPlan.details &&
                                selectedPlan.details.map(
                                  (detail, detailIdx) => (
                                    <div
                                      key={detailIdx}
                                      className="border rounded p-4"
                                    >
                                      <div className="font-semibold mb-3 text-blue-600">
                                        {detail.workType === "IMPORT"
                                          ? "Nhập hàng"
                                          : "Xuất hàng"}{" "}
                                        - Bước {detail.sequenceOrder}
                                      </div>
                                      {detail.warehouseProducts &&
                                        detail.warehouseProducts.map(
                                          (warehouseProduct, whIdx) => (
                                            <div key={whIdx} className="mb-3">
                                              <div className="font-medium text-sm mb-2">
                                                {warehouseProduct.warehouseName}
                                              </div>
                                              <div className="space-y-1 ml-2">
                                                {warehouseProduct.productQuantities &&
                                                  Object.entries(
                                                    warehouseProduct.productQuantities,
                                                  ).map(
                                                    ([
                                                      productName,
                                                      quantity,
                                                    ]) => (
                                                      <div
                                                        key={productName}
                                                        className="flex justify-between text-xs"
                                                      >
                                                        <span>
                                                          {productName}
                                                        </span>
                                                        <span className="font-semibold">
                                                          {quantity}
                                                        </span>
                                                      </div>
                                                    ),
                                                  )}
                                              </div>
                                            </div>
                                          ),
                                        )}
                                    </div>
                                  ),
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="pt-6 text-center py-8 text-muted-foreground">
                          Không có thông tin kế hoạch
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Status Tab */}
                  <TabsContent value="status">
                    <Card>
                      <CardContent className="pt-6">
                        <VehicleStateTimeline
                          currentState={selectedVehicle.currentState}
                        />
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

export default Vehicle;
