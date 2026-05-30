export type Language = "vi" | "en" | "zh";

export const languageOptions: Array<{ code: Language; label: string; short: string }> = [
  { code: "vi", label: "Tiếng Việt", short: "VI" },
  { code: "en", label: "English", short: "EN" },
  { code: "zh", label: "中文", short: "中文" }
];

export const languageStorageKey = "tt_language";

export function normalizeLanguage(value: string | null | undefined): Language {
  if (value === "en" || value === "zh" || value === "vi") {
    return value;
  }

  return "vi";
}

export function readStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "vi";
  }

  return normalizeLanguage(window.localStorage.getItem(languageStorageKey));
}

export function saveStoredLanguage(language: Language) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(languageStorageKey, language);
  document.documentElement.lang = language === "zh" ? "zh-CN" : language;
}

export const landingCopy = {
  vi: {
    nav: {
      booking: "Đặt xe",
      tickets: "Vé của tôi",
      offers: "Ưu đãi",
      operators: "Nhà xe",
      support: "Hỗ trợ"
    },
    auth: {
      login: "Đăng nhập",
      logout: "Đăng xuất",
      register: "Tạo tài khoản"
    },
    hero: {
      eyebrow: "Nền tảng đặt vé xe Thành Trung",
      title: "Đặt vé xe khách nhanh, chọn chỗ dễ và nhận xác nhận từ nhà xe",
      desc: "Tra cứu tuyến, giữ chỗ, thanh toán linh hoạt và gửi yêu cầu trực tiếp đến nhà xe để được xác nhận."
    },
    search: {
      from: "Nơi xuất phát",
      to: "Nơi đến",
      date: "Ngày đi",
      search: "Tìm kiếm"
    },
    sections: {
      trips: "Chọn chuyến, xem ghế trống và đặt xe",
      customer: "Danh mục dành cho khách hàng",
      offers: "Ưu đãi và thanh toán",
      operators: "Nhà xe và tiện ích",
      support: "Các mục cần có sau khi đặt xe"
    }
  },
  en: {
    nav: {
      booking: "Booking",
      tickets: "My tickets",
      offers: "Deals",
      operators: "Operators",
      support: "Support"
    },
    auth: {
      login: "Sign in",
      logout: "Sign out",
      register: "Create account"
    },
    hero: {
      eyebrow: "Thanh Trung bus ticket platform",
      title: "Book buses fast, pick seats easily, and get operator confirmation",
      desc: "Search routes, hold seats, choose flexible payment, and send requests directly to the operator."
    },
    search: {
      from: "From",
      to: "To",
      date: "Departure date",
      search: "Search"
    },
    sections: {
      trips: "Choose trips, check available seats, and book",
      customer: "Customer tools",
      offers: "Deals and payment",
      operators: "Operators and amenities",
      support: "Post-booking support"
    }
  },
  zh: {
    nav: {
      booking: "订车",
      tickets: "我的车票",
      offers: "优惠",
      operators: "车公司",
      support: "客服"
    },
    auth: {
      login: "登录",
      logout: "退出",
      register: "注册账号"
    },
    hero: {
      eyebrow: "Thanh Trung 客车订票平台",
      title: "快速订票，轻松选座，并获取车公司确认",
      desc: "查询线路、保留座位、选择灵活付款方式，并将订单直接发送给车公司确认。"
    },
    search: {
      from: "出发地",
      to: "目的地",
      date: "出发日期",
      search: "搜索"
    },
    sections: {
      trips: "选择班次、查看余座并订票",
      customer: "乘客服务",
      offers: "优惠与支付",
      operators: "车公司与服务",
      support: "订票后支持"
    }
  }
} as const;

export const portalCopy = {
  vi: {
    assurance: "Cam kết giữ chỗ và hỗ trợ đổi chuyến khi phát sinh sự cố vận hành",
    hotline: "Hotline 24/7",
    back: "Quay về đặt xe",
    auth: {
      login: "Đăng nhập",
      logout: "Đăng xuất"
    },
    ticketList: "Danh sách vé",
    customerNotifications: "Thông báo khách hàng",
    quickActions: "Tác vụ nhanh",
    noNotifications: "Chưa có thông báo mới.",
    loginRequired: "Vui lòng đăng nhập để xem vé, trạng thái xác nhận và thông báo từ nhà xe.",
    noTickets: "Bạn chưa có vé nào. Hãy quay về trang đặt xe để chọn chuyến và giữ chỗ.",
    actions: ["Đặt thêm vé", "Xem ưu đãi", "Yêu cầu hỗ trợ"],
    ticketFields: {
      code: "Mã vé",
      seats: "Ghế",
      pickup: "Điểm đón",
      dropoff: "Điểm trả",
      payment: "Thanh toán",
      total: "Tổng tiền",
      seatUnit: "ghế",
      rejectionReason: "Lý do từ chối"
    },
    statuses: {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      changeRequested: "Yêu cầu hủy/đổi",
      rejected: "Từ chối",
      canceled: "Đã hủy"
    },
    sections: {
      "my-tickets": ["Vé của tôi", "Theo dõi mã đặt chỗ, ghế, điểm đón/trả, trạng thái xác nhận và thông báo từ nhà xe."],
      cancel: ["Đổi / hủy vé", "Gửi yêu cầu đổi chuyến hoặc xem lý do khi nhà xe từ chối đơn đặt vé."],
      promotions: ["Mã giảm giá", "Lưu ưu đãi tuyến quen thuộc và áp dụng trước bước thanh toán."],
      payment: ["Thanh toán", "Theo dõi phương thức thanh toán sau, chuyển khoản hoặc QR demo."],
      tracking: ["Theo dõi chuyến", "Xem vị trí xe demo trên bản đồ, tiến độ đón khách và hotline tài xế."],
      feedback: ["Phản hồi chuyến", "Gửi đánh giá chuyến xe để admin theo dõi chất lượng dịch vụ."],
      luggage: ["Hành lý", "Ghi chú hành lý, gửi hàng kèm xe và chính sách phụ thu."],
      history: ["Lịch sử chuyến", "Lưu tuyến đã đi, nhà xe yêu thích và điểm đón thường dùng."],
      operators: ["Nhà xe", "Thông tin nhà xe, loại xe, tiện ích và tuyến đang khai thác."],
      support: ["Hỗ trợ", "Hướng dẫn lên xe, đổi/hủy, thanh toán và liên hệ hỗ trợ."]
    }
  },
  en: {
    assurance: "Seat holding and trip-change support when operations change",
    hotline: "24/7 hotline",
    back: "Back to booking",
    auth: {
      login: "Sign in",
      logout: "Sign out"
    },
    ticketList: "Ticket list",
    customerNotifications: "Customer notifications",
    quickActions: "Quick actions",
    noNotifications: "No new notifications.",
    loginRequired: "Please sign in to view tickets, confirmation status, and operator messages.",
    noTickets: "You have no tickets yet. Return to booking to choose a trip and hold a seat.",
    actions: ["Book another trip", "View deals", "Request support"],
    ticketFields: {
      code: "Ticket code",
      seats: "Seats",
      pickup: "Pickup",
      dropoff: "Dropoff",
      payment: "Payment",
      total: "Total",
      seatUnit: "seat(s)",
      rejectionReason: "Rejection reason"
    },
    statuses: {
      pending: "Pending",
      confirmed: "Confirmed",
      changeRequested: "Change requested",
      rejected: "Rejected",
      canceled: "Canceled"
    },
    sections: {
      "my-tickets": ["My tickets", "Track booking codes, seats, pickup/dropoff points, confirmation status, and operator messages."],
      cancel: ["Change / cancel ticket", "Request trip changes or view rejection reasons from the operator."],
      promotions: ["Promo codes", "Save frequent-route deals and apply them before payment."],
      payment: ["Payment", "Track pay-later, bank transfer, and demo QR payment methods."],
      tracking: ["Live tracking", "View the demo bus location on a map, pickup progress, and driver hotline."],
      feedback: ["Trip feedback", "Send trip ratings so admin can monitor service quality."],
      luggage: ["Luggage", "Add luggage notes, parcel requests, and surcharge policies."],
      history: ["Trip history", "Save traveled routes, preferred operators, and frequent pickup points."],
      operators: ["Operators", "Operator profiles, bus types, amenities, and active routes."],
      support: ["Support", "Boarding guide, change/cancel policy, payment help, and contact support."]
    }
  },
  zh: {
    assurance: "运营调整时支持保座和改签",
    hotline: "24小时客服",
    back: "返回订车",
    auth: {
      login: "登录",
      logout: "退出"
    },
    ticketList: "车票列表",
    customerNotifications: "乘客通知",
    quickActions: "快捷操作",
    noNotifications: "暂无新通知。",
    loginRequired: "请登录以查看车票、确认状态和车公司通知。",
    noTickets: "您还没有车票。请返回订车页选择班次并保留座位。",
    actions: ["继续订票", "查看优惠", "联系客服"],
    ticketFields: {
      code: "订单号",
      seats: "座位",
      pickup: "上车点",
      dropoff: "下车点",
      payment: "支付",
      total: "总价",
      seatUnit: "座",
      rejectionReason: "拒绝原因"
    },
    statuses: {
      pending: "待确认",
      confirmed: "已确认",
      changeRequested: "已申请改签/退票",
      rejected: "已拒绝",
      canceled: "已取消"
    },
    sections: {
      "my-tickets": ["我的车票", "查看订单号、座位、上下车点、确认状态和车公司通知。"],
      cancel: ["改签 / 退票", "提交改签请求或查看车公司拒绝订单的原因。"],
      promotions: ["优惠码", "保存常用路线优惠，并在付款前使用。"],
      payment: ["支付", "查看到店支付、银行转账或二维码演示支付方式。"],
      tracking: ["行程跟踪", "在地图上查看车辆演示位置、接客进度和司机热线。"],
      feedback: ["行程反馈", "提交行程评分，便于后台跟踪服务质量。"],
      luggage: ["行李", "添加行李备注、随车寄件和附加费政策。"],
      history: ["行程历史", "保存已乘路线、常用车公司和常用上车点。"],
      operators: ["车公司", "查看车公司、车型、服务和运营路线。"],
      support: ["客服", "上车指南、改签退票、支付帮助和联系方式。"]
    }
  }
} as const;
