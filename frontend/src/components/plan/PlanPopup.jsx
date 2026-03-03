import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarIcon,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { AutocompleteInput } from "./AutocompleteInput";
import {
  drivers,
  warehouses,
  products,
  purposes,
  allowedAreas,
  workTypes,
} from "../../data/mockData";

export function PlanPopup({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  initialData = null,
}) {
  const [planName, setPlanName] = useState(initialData?.planName || "");
  const [startDate, setStartDate] = useState(initialData?.startDate);
  const [endDate, setEndDate] = useState(initialData?.endDate);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [vehicles, setVehicles] = useState(
    initialData?.vehiclePlans || [
      {
        id: 1,
        licensePlate: "",
        purpose: "",
        allowedAreas: [],
        driverId: null,
        driverName: "",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ]
  );

  const [passengerInputs, setPassengerInputs] = useState({});

  const addVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        id: Date.now(),
        licensePlate: "",
        purpose: "",
        allowedAreas: [],
        driverId: null,
        driverName: "",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ]);
  };

  const removeVehicle = (vehicleId) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((v) => v.id !== vehicleId));
    }
  };

  const updateVehicle = (vehicleId, field, value) => {
    setVehicles(
      vehicles.map((v) => (v.id === vehicleId ? { ...v, [field]: value } : v))
    );
  };

  const toggleVehicleExpand = (vehicleId) => {
    setVehicles(
      vehicles.map((v) =>
        v.id === vehicleId ? { ...v, expanded: !v.expanded } : v
      )
    );
  };

  const toggleAllowedArea = (vehicleId, area) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const newAreas = vehicle.allowedAreas.includes(area)
      ? vehicle.allowedAreas.filter((a) => a !== area)
      : [...vehicle.allowedAreas, area];

    updateVehicle(vehicleId, "allowedAreas", newAreas);
  };

  const addPassenger = (vehicleId) => {
    const inputValue = passengerInputs[vehicleId];
    if (!inputValue?.trim()) return;

    const driver = drivers.find(
      (d) => d.name.toLowerCase() === inputValue.toLowerCase()
    );

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const newPassenger = {
      id: driver?.id || Date.now(),
      name: driver?.name || inputValue,
    };

    updateVehicle(vehicleId, "passengers", [
      ...vehicle.passengers,
      newPassenger,
    ]);
    setPassengerInputs({ ...passengerInputs, [vehicleId]: "" });
  };

  const removePassenger = (vehicleId, passengerId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    updateVehicle(
      vehicleId,
      "passengers",
      vehicle.passengers.filter((p) => p.id !== passengerId)
    );
  };

  const addDetailPlan = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const newDetailPlan = {
      id: Date.now(),
      workType: "",
      warehouses: [
        {
          id: Date.now(),
          warehouseId: null,
          warehouseName: "",
          products: [],
        },
      ],
    };

    updateVehicle(vehicleId, "detailPlans", [
      ...vehicle.detailPlans,
      newDetailPlan,
    ]);
  };

  const removeDetailPlan = (vehicleId, planId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    updateVehicle(
      vehicleId,
      "detailPlans",
      vehicle.detailPlans.filter((p) => p.id !== planId)
    );
  };

  const updateDetailPlan = (vehicleId, planId, field, value) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const updatedPlans = vehicle.detailPlans.map((p) =>
      p.id === planId ? { ...p, [field]: value } : p
    );

    updateVehicle(vehicleId, "detailPlans", updatedPlans);
  };

  const addWarehouseToDetail = (vehicleId, planId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const plan = vehicle.detailPlans.find((p) => p.id === planId);
    if (!plan) return;

    const newWarehouse = {
      id: Date.now(),
      warehouseId: null,
      warehouseName: "",
      products: [],
    };

    updateDetailPlan(vehicleId, planId, "warehouses", [
      ...plan.warehouses,
      newWarehouse,
    ]);
  };

  const removeWarehouseFromDetail = (vehicleId, planId, warehouseDetailId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const plan = vehicle.detailPlans.find((p) => p.id === planId);
    if (!plan || plan.warehouses.length <= 1) return;

    updateDetailPlan(
      vehicleId,
      planId,
      "warehouses",
      plan.warehouses.filter((w) => w.id !== warehouseDetailId)
    );
  };

  const updateWarehouseDetail = (
    vehicleId,
    planId,
    warehouseDetailId,
    field,
    value
  ) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const plan = vehicle.detailPlans.find((p) => p.id === planId);
    if (!plan) return;

    const updatedWarehouses = plan.warehouses.map((w) =>
      w.id === warehouseDetailId ? { ...w, [field]: value } : w
    );

    updateDetailPlan(vehicleId, planId, "warehouses", updatedWarehouses);
  };

  const addProductToWarehouse = (
    vehicleId,
    planId,
    warehouseDetailId,
    productName
  ) => {
    if (!productName.trim()) return;

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const plan = vehicle.detailPlans.find((p) => p.id === planId);
    if (!plan) return;

    const warehouseDetail = plan.warehouses.find(
      (w) => w.id === warehouseDetailId
    );
    if (!warehouseDetail) return;

    const product = products.find(
      (p) => p.name.toLowerCase() === productName.toLowerCase()
    );

    const newProduct = {
      id: product?.id || Date.now(),
      name: product?.name || productName,
      quantity: 1,
    };

    updateWarehouseDetail(vehicleId, planId, warehouseDetailId, "products", [
      ...warehouseDetail.products,
      newProduct,
    ]);
  };

  const removeProductFromWarehouse = (
    vehicleId,
    planId,
    warehouseDetailId,
    productId
  ) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const plan = vehicle.detailPlans.find((p) => p.id === planId);
    if (!plan) return;

    const warehouseDetail = plan.warehouses.find(
      (w) => w.id === warehouseDetailId
    );
    if (!warehouseDetail) return;

    updateWarehouseDetail(
      vehicleId,
      planId,
      warehouseDetailId,
      "products",
      warehouseDetail.products.filter((p) => p.id !== productId)
    );
  };

  const updateProductQuantity = (
    vehicleId,
    planId,
    warehouseDetailId,
    productId,
    quantity
  ) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const plan = vehicle.detailPlans.find((p) => p.id === planId);
    if (!plan) return;

    const warehouseDetail = plan.warehouses.find(
      (w) => w.id === warehouseDetailId
    );
    if (!warehouseDetail) return;

    const updatedProducts = warehouseDetail.products.map((p) =>
      p.id === productId ? { ...p, quantity } : p
    );

    updateWarehouseDetail(
      vehicleId,
      planId,
      warehouseDetailId,
      "products",
      updatedProducts
    );
  };

  const formatDate = (date) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = () => {
    const data = {
      planName,
      startDate,
      endDate,
      notes,
      vehicles,
    };
    onSubmit?.(data);
    onClose();
  };

  const [startInput, setStartInput] = useState(() => {
    return initialData?.startDate && typeof initialData.startDate === "object"
      ? formatDate(initialData.startDate)
      : "21/01/2026";
  });
  const [endInput, setEndInput] = useState(() => {
    return initialData?.endDate && typeof initialData.endDate === "object"
      ? formatDate(initialData.endDate)
      : "25/01/2026";
  });

  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");

  const parseDate = (dateString) => {
    const parts = dateString.split("/");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;

    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1) return null;

    return date;
  };

  const handleStartInputChange = (value) => {
    setStartInput(value);

    if (value.length === 10) {
      const parsed = parseDate(value);
      if (parsed) {
        setStartDate(parsed);
        setStartError("");

        // Check if end date is before new start date
        if (endDate && parsed > endDate) {
          setEndDate(parsed);
          setEndInput(formatDate(parsed));
        }
      } else {
        setStartError("Định dạng không hợp lệ (dd/MM/yyyy)");
      }
    } else if (value.length > 10) {
      setStartError("Định dạng không hợp lệ (dd/MM/yyyy)");
    } else {
      setStartError("");
    }
  };

  // Initialize start/end input based on initial dates
  const initStartInput =
    initialData?.startDate && typeof initialData.startDate === "object"
      ? formatDate(initialData.startDate)
      : "21/01/2026";
  const initEndInput =
    initialData?.endDate && typeof initialData.endDate === "object"
      ? formatDate(initialData.endDate)
      : "25/01/2026";

  const handleEndInputChange = (value) => {
    setEndInput(value);

    if (value.length === 10) {
      const parsed = parseDate(value);
      if (parsed) {
        if (startDate && parsed < startDate) {
          setEndError("Ngày kết thúc phải sau ngày bắt đầu");
        } else {
          setEndDate(parsed);
          setEndError("");
        }
      } else {
        setEndError("Định dạng không hợp lệ (dd/MM/yyyy)");
      }
    } else if (value.length > 10) {
      setEndError("Định dạng không hợp lệ (dd/MM/yyyy)");
    } else {
      setEndError("");
    }
  };

  const handleStartDateSelect = (date) => {
    setStartDate(date);
    setStartInput(formatDate(date));
    setStartError("");

    if (!endDate) {
      setEndDate(date);
      setEndInput(formatDate(date));
    }

    // Adjust end date if it's before new start date
    if (endDate && date > endDate) {
      setEndDate(date);
      setEndInput(formatDate(date));
    }
  };

  const handleEndDateSelect = (date) => {
    setEndDate(date);
    setEndInput(formatDate(date));
    setEndError("");
  };

  const [productInputs, setProductInputs] = useState({});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] bg-background rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <h2 className="text-lg font-semibold">
            {mode === "create"
              ? "Tạo Kế Hoạch Mới"
              : mode === "edit"
              ? "Chỉnh Sửa Kế Hoạch"
              : "Xem Kế Hoạch"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-primary-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="planName">Tên kế hoạch *</Label>
            <Input
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Nhập tên kế hoạch"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày bắt đầu *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "dd/MM/yyyy", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(endDate, "dd/MM/yyyy", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    minDate={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Vehicles Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Danh sách xe</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVehicle}
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm xe
              </Button>
            </div>

            {vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="border rounded-lg bg-muted/30">
                {/* Vehicle Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleVehicleExpand(vehicle.id)}
                >
                  <div className="flex items-center gap-2">
                    {vehicle.expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      Xe {index + 1}
                      {vehicle.licensePlate && `: ${vehicle.licensePlate}`}
                    </span>
                  </div>
                  {vehicles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVehicle(vehicle.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Vehicle Content */}
                {vehicle.expanded && (
                  <div className="p-4 pt-0 space-y-4">
                    {/* License Plate & Purpose */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Biển số xe *</Label>
                        <Input
                          value={vehicle.licensePlate}
                          onChange={(e) =>
                            updateVehicle(
                              vehicle.id,
                              "licensePlate",
                              e.target.value
                            )
                          }
                          placeholder="VD: 51A-123.45"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mục đích *</Label>
                        <Select
                          value={vehicle.purpose}
                          onValueChange={(value) =>
                            updateVehicle(vehicle.id, "purpose", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn mục đích" />
                          </SelectTrigger>
                          <SelectContent>
                            {purposes.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Allowed Areas */}
                    <div className="space-y-2">
                      <Label>Khu vực được phép vào *</Label>
                      <div className="flex gap-4">
                        {allowedAreas.map((area) => (
                          <div
                            key={area.value}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${vehicle.id}-${area.value}`}
                              checked={vehicle.allowedAreas.includes(
                                area.value
                              )}
                              onCheckedChange={() =>
                                toggleAllowedArea(vehicle.id, area.value)
                              }
                            />
                            <label
                              htmlFor={`${vehicle.id}-${area.value}`}
                              className="text-sm cursor-pointer"
                            >
                              {area.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Driver */}
                    <div className="space-y-2">
                      <Label>Tên tài xế *</Label>
                      <AutocompleteInput
                        options={drivers}
                        value={vehicle.driverName}
                        onChange={(value) =>
                          updateVehicle(vehicle.id, "driverName", value)
                        }
                        onSelect={(option) => {
                          updateVehicle(vehicle.id, "driverId", option.id);
                          updateVehicle(vehicle.id, "driverName", option.name);
                        }}
                        placeholder="Nhập tên tài xế"
                      />
                    </div>

                    {/* Passengers */}
                    <div className="space-y-2">
                      <Label>Người đi theo xe (nếu có)</Label>
                      <div className="flex gap-2">
                        <AutocompleteInput
                          options={drivers}
                          value={passengerInputs[vehicle.id] || ""}
                          onChange={(value) =>
                            setPassengerInputs({
                              ...passengerInputs,
                              [vehicle.id]: value,
                            })
                          }
                          onSelect={(option) =>
                            setPassengerInputs({
                              ...passengerInputs,
                              [vehicle.id]: option.name,
                            })
                          }
                          placeholder="Nhập tên người đi theo"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => addPassenger(vehicle.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {vehicle.passengers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {vehicle.passengers.map((passenger) => (
                            <Badge
                              key={passenger.id}
                              variant="secondary"
                              className="gap-1"
                            >
                              {passenger.name}
                              <button
                                onClick={() =>
                                  removePassenger(vehicle.id, passenger.id)
                                }
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Detail Plans */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Kế hoạch chi tiết</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addDetailPlan(vehicle.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm kế hoạch
                        </Button>
                      </div>

                      {vehicle.detailPlans.map((plan, planIndex) => (
                        <div
                          key={plan.id}
                          className="p-3 border rounded-md bg-background space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Kế hoạch {planIndex + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeDetailPlan(vehicle.id, plan.id)
                              }
                              className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Work Type */}
                          <div className="space-y-2">
                            <Label className="text-xs">Loại công việc *</Label>
                            <Select
                              value={plan.workType}
                              onValueChange={(value) =>
                                updateDetailPlan(
                                  vehicle.id,
                                  plan.id,
                                  "workType",
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Chọn loại công việc" />
                              </SelectTrigger>
                              <SelectContent>
                                {workTypes.map((wt) => (
                                  <SelectItem key={wt.value} value={wt.value}>
                                    {wt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Warehouses */}
                          {plan.warehouses.map((wh, whIndex) => (
                            <div
                              key={wh.id}
                              className="p-2 border rounded bg-muted/20 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">
                                  Kho {whIndex + 1}
                                </Label>
                                {plan.warehouses.length > 1 && (
                                  <button
                                    onClick={() =>
                                      removeWarehouseFromDetail(
                                        vehicle.id,
                                        plan.id,
                                        wh.id
                                      )
                                    }
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* Warehouse Name */}
                              <AutocompleteInput
                                options={warehouses}
                                value={wh.warehouseName}
                                onChange={(value) =>
                                  updateWarehouseDetail(
                                    vehicle.id,
                                    plan.id,
                                    wh.id,
                                    "warehouseName",
                                    value
                                  )
                                }
                                onSelect={(option) => {
                                  updateWarehouseDetail(
                                    vehicle.id,
                                    plan.id,
                                    wh.id,
                                    "warehouseId",
                                    option.id
                                  );
                                  updateWarehouseDetail(
                                    vehicle.id,
                                    plan.id,
                                    wh.id,
                                    "warehouseName",
                                    option.name
                                  );
                                }}
                                placeholder="Nhập tên kho"
                              />

                              {/* Products */}
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <AutocompleteInput
                                    options={products}
                                    value={
                                      productInputs[`${plan.id}-${wh.id}`] || ""
                                    }
                                    onChange={(value) =>
                                      setProductInputs({
                                        ...productInputs,
                                        [`${plan.id}-${wh.id}`]: value,
                                      })
                                    }
                                    onSelect={(option) =>
                                      setProductInputs({
                                        ...productInputs,
                                        [`${plan.id}-${wh.id}`]: option.name,
                                      })
                                    }
                                    placeholder="Thêm sản phẩm"
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => {
                                      addProductToWarehouse(
                                        vehicle.id,
                                        plan.id,
                                        wh.id,
                                        productInputs[`${plan.id}-${wh.id}`] ||
                                          ""
                                      );
                                      setProductInputs({
                                        ...productInputs,
                                        [`${plan.id}-${wh.id}`]: "",
                                      });
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>

                                {wh.products.length > 0 && (
                                  <div className="space-y-1">
                                    {wh.products.map((product) => (
                                      <div
                                        key={product.id}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        <span className="flex-1 truncate">
                                          {product.name}
                                        </span>
                                        <Input
                                          type="number"
                                          value={product.quantity}
                                          onChange={(e) =>
                                            updateProductQuantity(
                                              vehicle.id,
                                              plan.id,
                                              wh.id,
                                              product.id,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          className="w-20 h-7 text-sm"
                                          min={1}
                                        />
                                        <button
                                          onClick={() =>
                                            removeProductFromWarehouse(
                                              vehicle.id,
                                              plan.id,
                                              wh.id,
                                              product.id
                                            )
                                          }
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() =>
                              addWarehouseToDetail(vehicle.id, plan.id)
                            }
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Thêm kho
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú (nếu có)"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t bg-background rounded-b-lg">
          <Button type="button" variant="outline" onClick={onClose}>
            {mode === "view" ? "Đóng" : "Hủy"}
          </Button>
          {mode !== "view" && (
            <Button type="button" onClick={handleSubmit}>
              {mode === "create" ? "Lưu kế hoạch" : "Cập nhật kế hoạch"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlanPopup;
