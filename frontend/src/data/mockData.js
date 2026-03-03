// Mock data for autocomplete searches

export const drivers = [
  { id: 1, name: "Nguyễn Văn An", phone: "0901234567" },
  { id: 2, name: "Trần Văn Bình", phone: "0912345678" },
  { id: 3, name: "Lê Văn Cường", phone: "0923456789" },
  { id: 4, name: "Phạm Văn Dũng", phone: "0934567890" },
  { id: 5, name: "Hoàng Văn Em", phone: "0945678901" },
  { id: 6, name: "Nguyễn Thị Hoa", phone: "0956789012" },
  { id: 7, name: "Trần Thị Lan", phone: "0967890123" },
  { id: 8, name: "Lê Thị Mai", phone: "0978901234" },
];

export const warehouses = [
  { id: 1, name: "Kho VL - A1", area: "Kho VL" },
  { id: 2, name: "Kho VL - A2", area: "Kho VL" },
  { id: 3, name: "Kho SX - B1", area: "Kho SX" },
  { id: 4, name: "Kho SX - B2", area: "Kho SX" },
  { id: 5, name: "Kho TP - C1", area: "Kho TP" },
  { id: 6, name: "Kho TP - C2", area: "Kho TP" },
];

export const products = [
  { id: 1, name: "Thép cuộn HRC", unit: "tấn" },
  { id: 2, name: "Thép tấm", unit: "tấn" },
  { id: 3, name: "Nhôm thanh", unit: "kg" },
  { id: 4, name: "Đồng thỏi", unit: "kg" },
  { id: 5, name: "Xi măng PCB40", unit: "bao" },
  { id: 6, name: "Cát xây dựng", unit: "m³" },
  { id: 7, name: "Gạch ống", unit: "viên" },
  { id: 8, name: "Sắt phi 10", unit: "cây" },
  { id: 9, name: "Ống nhựa PVC", unit: "ống" },
  { id: 10, name: "Dây điện 2.5mm", unit: "cuộn" },
];

export const purposes = [
  { value: "VL", label: "Vật liệu (VL)" },
  { value: "SX", label: "Sản xuất (SX)" },
  { value: "TP", label: "Thành phẩm (TP)" },
];

export const allowedAreas = [
  { value: "Kho VL", label: "Kho VL" },
  { value: "Kho SX", label: "Kho SX" },
  { value: "Kho TP", label: "Kho TP" },
];

export const workTypes = [
  { value: "nhap", label: "Nhập" },
  { value: "xuat", label: "Xuất" },
];
