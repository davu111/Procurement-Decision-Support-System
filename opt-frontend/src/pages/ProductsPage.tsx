// import { mockProducts, mockOrderSchedules } from '@/data/mockData';
import type { Product } from "@/types/inventory-opt/product";
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";
import api from "@/api/axiosConfig";
import { formatDate, getUrgencyInfo, formatNumber } from "@/utils/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Filter, X, Image as ImageIcon } from "lucide-react";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);
  const [productImages, setProductImages] = useState<Record<number, string>>(
    {},
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products based on filter
  const fetchProducts = async (status: "all" | "active" | "inactive") => {
    try {
      setIsLoading(true);
      setError(null);
      const statusParam =
        status === "all"
          ? undefined
          : status === "active"
            ? "ACTIVE"
            : "INACTIVE";
      const response = await api.get("/products", {
        params: statusParam ? { status: statusParam } : {},
      });
      setProducts(response.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Lỗi khi tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch product image
  const fetchProductImage = async (productId: number) => {
    try {
      const response = await api.get(`/product-images/${productId}`);
      if (response.data) {
        setProductImages((prev) => ({ ...prev, [productId]: response.data }));
      }
    } catch (err) {
      console.error(`Error fetching image for product ${productId}:`, err);
    }
  };

  useEffect(() => {
    fetchProducts(filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    // Fetch order schedules
    api
      .get("/order-schedules", {
        params: {
          from: "2025-01-01",
          to: "2026-12-31",
        },
      })
      .then((response) => setOrderSchedules(response.data || []))
      .catch((error) =>
        console.error("Error fetching order schedules:", error),
      );
  }, []);

  // Fetch images for all products
  useEffect(() => {
    products.forEach((product) => {
      if (!productImages[product.id]) {
        fetchProductImage(product.id);
      }
    });
  }, [products]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Danh sách mặt hàng
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý và theo dõi tình trạng từng mặt hàng
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={18} className="text-muted-foreground" />
          <span className="font-semibold text-sm">Bộ lọc</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="text-sm"
          >
            Tất cả
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("active")}
            className="text-sm"
          >
            Đang hoạt động
          </Button>
          <Button
            variant={filterStatus === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("inactive")}
            className="text-sm"
          >
            Ngừng hoạt động
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
          <X size={18} className="text-destructive mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-destructive">Lỗi</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Không có sản phẩm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const orders = orderSchedules.filter(
              (o) => o.productId === product.id,
            );
            const urgency = getUrgencyInfo(orders);
            const pendingOrders = orders.filter(
              (o) => !o.actualOrderDate,
            ).length;
            const imageUrl = productImages[product.id];

            return (
              <div
                key={product.id}
                className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                {/* Product Image */}
                <div className="relative w-full bg-muted h-40 overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        const fallback = parent?.querySelector(
                          '[data-fallback="true"]',
                        );
                        if (fallback) fallback.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    data-fallback="true"
                    className={imageUrl ? "hidden" : ""}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon size={24} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Không có ảnh
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {product.code}
                      </p>
                      <h3 className="font-semibold text-foreground">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge
                        className={cn(
                          urgency.level === "red" &&
                            "bg-status-danger text-destructive-foreground",
                          urgency.level === "yellow" &&
                            "bg-status-warning text-foreground",
                          urgency.level === "green" &&
                            "bg-status-success text-destructive-foreground",
                        )}
                      >
                        {urgency.level === "red"
                          ? "Khẩn"
                          : urgency.level === "yellow"
                            ? "Sắp hạn"
                            : "Ổn"}
                      </Badge>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {product.isActive ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between text-sm mb-3 mt-auto">
                    <span className="text-muted-foreground">
                      Đơn vị: {product.unit}
                    </span>
                    <span className="text-muted-foreground">
                      {pendingOrders} đơn chờ
                    </span>
                  </div>
                  {urgency.nextOrder && (
                    <div className="pt-3 border-t text-sm">
                      <span className="text-muted-foreground">
                        Đặt tiếp theo:{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatDate(urgency.nextOrder.orderDate)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        · {formatNumber(urgency.nextOrder.orderQuantity)}{" "}
                        {product.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
