import { Users, Truck, Warehouse, Package } from "lucide-react";
import { EmployeeTable } from "@/components/category/EmployeeTable";
import { VehicleTable } from "@/components/category/VehicleTable";
import { WarehouseTable } from "@/components/category/WarehouseTable";
import { ProductTable } from "@/components/category/ProductTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "../components/all/Header";

const Index = () => {
  return (
    <>
      <Header currentPage="Danh mục" menu="admin" />
      {/* Main Content */}
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          <Tabs defaultValue="employees" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger
                value="employees"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Nhân viên</span>
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Phương tiện</span>
              </TabsTrigger>
              <TabsTrigger
                value="warehouses"
                className="flex items-center gap-2"
              >
                <Warehouse className="h-4 w-4" />
                <span className="hidden sm:inline">Kho</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Hàng hóa</span>
              </TabsTrigger>
            </TabsList>

            <div className="bg-card rounded-lg border p-6">
              <TabsContent value="employees" className="mt-0">
                <EmployeeTable />
              </TabsContent>
              <TabsContent value="vehicles" className="mt-0">
                <VehicleTable />
              </TabsContent>
              <TabsContent value="warehouses" className="mt-0">
                <WarehouseTable />
              </TabsContent>
              <TabsContent value="products" className="mt-0">
                <ProductTable />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Index;
