import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home";
import Plan from "./pages/PlanNew";
import Product from "./pages/Product";
import Warehouse from "./pages/Warehouse";
import Category from "./pages/Category";
import Vehicle from "./pages/Vehicle";
// import Setting from "./pages/Setting";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/trang-chu" />} />
      <Route path="/trang-chu" element={<Home />} />
      <Route path="/ke-hoach" element={<Plan />} />
      <Route path="/hang-hoa" element={<Product />} />
      <Route path="/kho-hang" element={<Warehouse />} />
      <Route path="/danh-muc" element={<Category />} />
      <Route path="/phuong-tien" element={<Vehicle />} />
      {/* <Route path="/cai-dat" element={<Setting />} />  */}
    </Routes>
  );
}

export default App;
