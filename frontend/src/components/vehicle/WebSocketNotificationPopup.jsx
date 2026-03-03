import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Package,
  MapPin,
  Clock,
  User,
  X,
} from "lucide-react";

const WebSocketNotificationPopup = ({ notification, onClose }) => {
  const [isOpen, setIsOpen] = useState(!!notification);

  useEffect(() => {
    setIsOpen(!!notification);

    // Auto-close after 15 seconds if notification exists
    // if (notification) {
    //   const timer = setTimeout(() => {
    //     handleClose();
    //   }, 15000);

    //   return () => clearTimeout(timer);
    // }
  }, [notification]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!notification) return null;

  console.log("Notification Data:", notification);
  const data = notification?.result;
  const status = notification?.status;

  const getStatusIcon = () => {
    if (status === "SUCCESS") {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    } else if (status === "FAILED") {
      return <XCircle className="h-6 w-6 text-red-600" />;
    }
    return <AlertCircle className="h-6 w-6 text-yellow-600" />;
  };

  const getStatusColor = () => {
    if (status === "SUCCESS") {
      return "bg-green-50 border-green-200";
    } else if (status === "FAILED") {
      return "bg-red-50 border-red-200";
    }
    return "bg-yellow-50 border-yellow-200";
  };

  const getStatusBadgeColor = () => {
    if (status === "SUCCESS") {
      return "bg-green-100 text-green-800";
    } else if (status === "FAILED") {
      return "bg-red-100 text-red-800";
    }
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <DialogTitle className="text-xl">
                Thông báo từ hệ thống
              </DialogTitle>
              <Badge className={getStatusBadgeColor()}>{status}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        {/* Content */}
        <div className="space-y-4">
          {/* Main Message */}
          {data?.message && (
            <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
              <p className="font-semibold text-sm">{data.message}</p>
            </div>
          )}

          {data && (
            <>
              {/* Basic Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* License Plate */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Biển số xe
                      </p>
                      <p className="text-lg font-semibold text-blue-600 mt-1">
                        {data.licensePlate}
                      </p>
                    </div>

                    {/* Plan Name */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tên kế hoạch
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {data.planName}
                      </p>
                    </div>

                    {/* Plan Code */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Mã kế hoạch
                      </p>
                      <p className="font-medium mt-1">{data.planCode}</p>
                    </div>

                    {/* Purpose */}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Mục đích vận chuyển
                      </p>
                      <p className="font-medium mt-1">{data.purpose}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Driver & Crew Info */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded">
                    <User className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Lái xe</p>
                      <p className="font-semibold">
                        {data.driverName} ({data.driverId})
                      </p>
                    </div>
                  </div>

                  {data.crewMembers && data.crewMembers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground px-3">
                        Thành viên kế hoạch
                      </p>
                      {data.crewMembers.map((member, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted rounded flex items-center gap-2"
                        >
                          <div className="h-2 w-2 bg-primary rounded-full" />
                          <span className="font-medium text-sm">{member}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {data.allowedAreas && data.allowedAreas.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-muted rounded">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Khu vực được phép
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {data.allowedAreas.map((area, idx) => (
                            <Badge key={idx} variant="outline">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Thời gian bắt đầu
                      </span>
                    </div>
                    <span className="font-semibold">
                      {new Date(data.startDate).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Dự kiến hoàn tất
                      </span>
                    </div>
                    <span className="font-semibold">
                      {new Date(data.endDate).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Note */}
              {data.note && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ghi chú
                    </p>
                    <p className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      {data.note}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Work Details */}
              {data.details && data.details.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-primary" />
                      <p className="font-semibold">Chi tiết kế hoạch</p>
                    </div>

                    <div className="space-y-4">
                      {data.details.map((detail, detailIdx) => (
                        <div
                          key={detailIdx}
                          className="border rounded p-4 bg-gray-50"
                        >
                          <div className="font-semibold mb-3 text-blue-600">
                            {detail.workType === "IMPORT"
                              ? "📥 Nhập hàng"
                              : "📤 Xuất hàng"}{" "}
                            - Bước {detail.sequenceOrder}
                          </div>

                          {detail.warehouseProducts &&
                            detail.warehouseProducts.map(
                              (warehouseProduct, whIdx) => (
                                <div key={whIdx} className="mb-3">
                                  <div className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    {warehouseProduct.warehouseName}
                                  </div>
                                  <div className="space-y-1 ml-6 text-xs">
                                    {warehouseProduct.productQuantities &&
                                      Object.entries(
                                        warehouseProduct.productQuantities,
                                      ).map(([productName, quantity]) => (
                                        <div
                                          key={productName}
                                          className="flex justify-between p-2 bg-white rounded border border-gray-200"
                                        >
                                          <span>{productName}</span>
                                          <span className="font-semibold">
                                            {quantity.toLocaleString("vi-VN")}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ),
                            )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Event Info */}
              <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded border">
                <p>
                  Processed At:{" "}
                  {new Date(notification.timestamp).toLocaleString("vi-VN")}
                </p>
              </div>
            </>
          )}

          {/* Error Message */}
          {!data && data?.message && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">{data.message}</p>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="border-t pt-4 flex justify-end">
          <Button onClick={handleClose} variant="default">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebSocketNotificationPopup;
