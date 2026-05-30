export type TripStatus = "Đang chạy" | "Sắp chạy" | "Hoàn thành" | "Đã hủy";

export type Trip = {
  code: string;
  route: string;
  time: string;
  price: number;
  sold: number;
  total: number;
  status: TripStatus;
  driver: string;
  vehicle: string;
  platform: string;
};

export const initialTrips: Trip[] = [
  {
    code: "TT240520-001",
    route: "Vinh - Hoàng Mai",
    time: "07:30",
    price: 230000,
    sold: 16,
    total: 16,
    status: "Đang chạy",
    driver: "Nguyễn Văn Hùng",
    vehicle: "37B-216.88",
    platform: "Website"
  },
  {
    code: "TT240520-002",
    route: "Vinh - Diễn Châu",
    time: "08:30",
    price: 150000,
    sold: 12,
    total: 40,
    status: "Sắp chạy",
    driver: "Trần Minh Đức",
    vehicle: "37B-901.24",
    platform: "Đại lý"
  },
  {
    code: "TT240520-003",
    route: "Hoàng Mai - Vinh",
    time: "09:30",
    price: 250000,
    sold: 5,
    total: 45,
    status: "Sắp chạy",
    driver: "Lê Quốc Bảo",
    vehicle: "37B-775.10",
    platform: "Mobile"
  },
  {
    code: "TT240520-004",
    route: "Vinh - Hoàng Mai",
    time: "10:30",
    price: 230000,
    sold: 20,
    total: 40,
    status: "Đã hủy",
    driver: "Phạm Duy Khánh",
    vehicle: "37B-120.45",
    platform: "Hotline"
  },
  {
    code: "TT240520-005",
    route: "Vinh - Quỳnh Lưu",
    time: "13:00",
    price: 200000,
    sold: 10,
    total: 16,
    status: "Hoàn thành",
    driver: "Hồ Anh Tuấn",
    vehicle: "37B-518.33",
    platform: "Website"
  }
];

export const revenueData = [
  { label: "T2", revenue: 32, tickets: 188 },
  { label: "T3", revenue: 18, tickets: 121 },
  { label: "T4", revenue: 24, tickets: 154 },
  { label: "T5", revenue: 15, tickets: 96 },
  { label: "T6", revenue: 28, tickets: 171 },
  { label: "T7", revenue: 12, tickets: 74 },
  { label: "CN", revenue: 30, tickets: 184 }
];

export const tripMixData = [
  { label: "Hoàn thành", value: 75, color: "#465FFF" },
  { label: "Đang chạy", value: 15, color: "#12B76A" },
  { label: "Đã hủy", value: 10, color: "#F79009" }
];

export const bookings = [
  ["BK-8291", "Mai Anh", "Vinh - Hoàng Mai", "MoMo", "Đã thanh toán"],
  ["BK-8284", "Quang Huy", "Vinh - Diễn Châu", "Tiền mặt", "Giữ chỗ"],
  ["BK-8277", "Bảo Ngọc", "Hoàng Mai - Vinh", "Thẻ", "Đã thanh toán"],
  ["BK-8268", "Minh Châu", "Vinh - Quỳnh Lưu", "Chuyển khoản", "Hoàn vé"]
];

export const customers = [
  ["KH-1024", "Nguyễn Mai Anh", "12 chuyến", "4.820.000đ", "VIP"],
  ["KH-1017", "Phan Minh Châu", "7 chuyến", "2.180.000đ", "Thân thiết"],
  ["KH-1009", "Lê Thanh Tùng", "3 chuyến", "690.000đ", "Mới"],
  ["KH-0988", "Hoàng Gia Bảo", "18 chuyến", "7.430.000đ", "VIP"]
];

export const drivers = [
  ["TX-31", "Nguyễn Văn Hùng", "Đang chạy", "98%", "37B-216.88"],
  ["TX-28", "Trần Minh Đức", "Sẵn sàng", "96%", "37B-901.24"],
  ["TX-21", "Lê Quốc Bảo", "Nghỉ ca", "93%", "37B-775.10"],
  ["TX-18", "Hồ Anh Tuấn", "Sẵn sàng", "97%", "37B-518.33"]
];

export const vehicles = [
  ["37B-216.88", "Limousine 16", "Đang khai thác", "92%", "23/05/2026"],
  ["37B-901.24", "Ghế ngồi 40", "Sẵn sàng", "81%", "25/05/2026"],
  ["37B-775.10", "Giường nằm 45", "Bảo dưỡng", "64%", "20/05/2026"],
  ["37B-518.33", "Limousine 16", "Sẵn sàng", "88%", "28/05/2026"]
];

export const revenueChannels = [
  ["Website", "72.400.000đ", "+18%", "41%"],
  ["Mobile", "51.900.000đ", "+11%", "29%"],
  ["Đại lý", "36.700.000đ", "+6%", "20%"],
  ["Hotline", "17.800.000đ", "-2%", "10%"]
];

export const reviews = [
  ["RV-901", "Ngọc Anh", "5.0", "Xe sạch, tài xế đúng giờ", "Đã phản hồi"],
  ["RV-887", "Minh Phúc", "4.5", "Đặt vé nhanh, cần cải thiện SMS", "Đang xử lý"],
  ["RV-872", "Hải Nam", "5.0", "Nhân viên hỗ trợ tốt", "Đã phản hồi"],
  ["RV-861", "Thanh Hằng", "4.0", "Ghế cuối hơi rung", "Đang xử lý"]
];

export const notifications = [
  ["Hệ thống", "Nhắc lịch bảo dưỡng xe 37B-775.10", "10 phút trước"],
  ["Đặt vé", "BK-8291 đã thanh toán thành công", "22 phút trước"],
  ["Điều hành", "Chuyến TT240520-002 còn 28 ghế trống", "45 phút trước"],
  ["Đánh giá", "Có 2 đánh giá mới cần phản hồi", "1 giờ trước"]
];
