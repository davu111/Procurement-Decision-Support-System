import { useState, useEffect } from "react";
import axios from "axios";
import { Package, Filter, Warehouse, Loader } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { categories, warehouses } from "@/data/mockProductData";

import Header from "../components/all/Header";

const API_BASE_URL = "http://localhost:9000/api";

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/product-categories`);
      if (response.data && response.data.code === 200) {
        setCategories(response.data.data);
      } else {
        setError("Failed to fetch categories from server");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.message || "An error occurred while fetching categories");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouses`);
      if (response.data && response.data.code === 200) {
        setWarehouses(response.data.data);
      } else {
        setError("Failed to fetch warehouses from server");
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
      setError(err.message || "An error occurred while fetching warehouses");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchWarehouses();
  }, []);

  // Get category ID
  const getCategoryIdByIndex = (categoryIndex) => {
    if (categoryIndex === "all") return null;
    const categoryId = categories.find(
      (c) => c.id.toString() === categoryIndex
    )?.id;
    return categoryId || null;
  };

  // Get warehouse ID
  const getWarehouseIdByIndex = (warehouseIndex) => {
    if (warehouseIndex === "all") return "all";
    const warehouseId = warehouses.find(
      (w) => w.id.toString() === warehouseIndex
    )?.id;
    return warehouseId || "all";
  };

  // Fetch data from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const categoryId = getCategoryIdByIndex(selectedCategory);
        const warehouseId = getWarehouseIdByIndex(selectedWarehouse);

        // Build query parameters
        const params = {
          categoryId: categoryId,
          warehouseId: warehouseId,
          status: "ACTIVE",
        };

        // Remove null/undefined parameters
        Object.keys(params).forEach(
          (key) => params[key] === null && delete params[key]
        );

        const response = await axios.get(
          `${API_BASE_URL}/products/grouped-inventory`,
          { params }
        );

        if (response.data && response.data.code === 200) {
          const data = response.data.data;
          setFilteredProducts(data.items || []);
          setTotalItems(data.totalItems || 0);
          setTotalStock(data.totalStock || 0);
        } else {
          setError("Failed to fetch products from server");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message || "An error occurred while fetching products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, selectedWarehouse]);

  const getCategoryName = (categoryId) => {
    return categories.find((c) => c.id === categoryId)?.categoryName || "";
  };

  return (
    <>
      <Header currentPage="Hàng hóa" menu="admin" />

      {/* Main content */}
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng loại hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalItems}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng tồn kho (đơn vị)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {totalStock.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Bộ lọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Chủng loại
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả chủng loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả chủng loại</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Kho
                  </label>
                  <Select
                    value={selectedWarehouse}
                    onValueChange={setSelectedWarehouse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả kho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả kho</SelectItem>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id.toString()}>
                          {wh.warehouseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Warehouse className="w-4 h-4" />
                Danh sách hàng hóa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-red-800">
                  {error}
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 text-primary animate-spin" />
                  <span className="ml-2 text-muted-foreground">
                    Đang tải dữ liệu...
                  </span>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên hàng hóa</TableHead>
                        <TableHead>Chủng loại</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Tồn kho theo kho</TableHead>
                        <TableHead className="text-right">Tổng tồn</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.categoryName}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {product.warehouses.map((wh) => (
                                <span
                                  key={wh.warehouseId}
                                  className="inline-flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded"
                                >
                                  <span className="text-muted-foreground">
                                    {wh.warehouseName}:
                                  </span>
                                  <span className="font-medium">
                                    {wh.quantity.toLocaleString()}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {product.totalQuantity.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Không tìm thấy hàng hóa phù hợp với bộ lọc
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default Products;
