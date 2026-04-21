import * as XLSX from "xlsx";

export const generateTemplateFile = () => {
  // Create sample data with headers
  const headers = [
    "product_id",
    "period_start_date",
    "period_end_date",
    "actual_consumption",
    "planned_consumption",
    "actual_lead_time_days",
    "actual_supply_rate",
    "notes",
  ];

  // Sample rows with instructions
  const sampleData = [
    {
      product_id: 1,
      period_start_date: "2024-01-01",
      period_end_date: "2024-01-31",
      actual_consumption: 1000,
      planned_consumption: 950,
      actual_lead_time_days: 7,
      actual_supply_rate: 95,
      notes: "Ví dụ",
    },
    {
      product_id: 2,
      period_start_date: "2024-02-01",
      period_end_date: "2024-02-29",
      actual_consumption: 1200,
      planned_consumption: 1100,
      actual_lead_time_days: 5,
      actual_supply_rate: 98,
      notes: "Ví dụ",
    },
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create data worksheet
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Set column widths
  const colWidths = [12, 15, 15, 18, 18, 20, 18, 30];
  ws["!cols"] = colWidths.map((width) => ({ wch: width }));

  // Add instructions sheet
  const instructionsData = [
    ["Hướng dẫn Import Dữ Liệu Tiêu Thụ"],
    [""],
    ["Cấu trúc file (header bắt buộc):"],
    [""],
    ["Cột", "Tên", "Kiểu dữ liệu", "Bắt buộc", "Ghi chú"],
    [
      "product_id",
      "ID sản phẩm",
      "Số nguyên",
      "Có",
      "ID phải tồn tại trong hệ thống",
    ],
    [
      "period_start_date",
      "Ngày bắt đầu kỳ",
      "Ngày (yyyy-MM-dd)",
      "Có",
      "Định dạng: yyyy-MM-dd, dd/MM/yyyy hoặc Excel date",
    ],
    [
      "period_end_date",
      "Ngày kết thúc kỳ",
      "Ngày (yyyy-MM-dd)",
      "Có",
      "Định dạng: yyyy-MM-dd, dd/MM/yyyy hoặc Excel date",
    ],
    [
      "actual_consumption",
      "Tiêu thụ thực tế",
      "Số thập phân",
      "Có",
      "Lượng tiêu thụ thực tế trong kỳ",
    ],
    [
      "planned_consumption",
      "Tiêu thụ kế hoạch",
      "Số thập phân",
      "Không",
      "Lượng tiêu thụ dự kiến (có thể để trống)",
    ],
    [
      "actual_lead_time_days",
      "Lead time thực tế",
      "Số nguyên",
      "Không",
      "Số ngày từ đặt hàng đến nhận (có thể để trống)",
    ],
    [
      "actual_supply_rate",
      "Tỷ lệ cung cấp",
      "Số thập phân",
      "Không",
      "Phần trăm (0-100) hoặc tỷ lệ thập phân (0-1)",
    ],
    [
      "notes",
      "Ghi chú",
      "Văn bản",
      "Không",
      "Ghi chú bổ sung (có thể để trống)",
    ],
    [""],
    ["Định dạng ngày chấp nhận:"],
    ["- yyyy-MM-dd (ví dụ: 2024-01-31)"],
    ["- dd/MM/yyyy (ví dụ: 31/01/2024)"],
    ["- Excel date (ngày được nhập trực tiếp từ Excel)"],
    [""],
    ["Quy tắc xử lý:"],
    ["- Bản ghi trùng lặp sẽ bị bỏ qua"],
    ["- Các lỗi validation sẽ được báo cáo chi tiết"],
    ["- Dữ liệu hợp lệ sẽ được lưu ngay lập tức"],
    ["- Mô hình dự báo sẽ tự động cập nhật sau khi import thành công"],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs["!cols"] = [20, 20, 15, 12, 40].map((width) => ({
    wch: width,
  }));

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu");
  XLSX.utils.book_append_sheet(wb, instructionsWs, "Hướng dẫn");

  // Generate download link
  const fileName = `consumption_history_template_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
