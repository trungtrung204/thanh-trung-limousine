export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
  points?: number;
  status?: "Hoạt động" | "Đã khóa";
  tier?: "Thường" | "Bạc" | "Vàng";
};

export type BookingStatus = "Chờ xác nhận" | "Đã xác nhận" | "Yêu cầu hủy/đổi" | "Từ chối" | "Đã hủy";

export type CustomerBooking = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  route: string;
  from: string;
  to: string;
  travelDate: string;
  seats: number;
  seatCodes?: string[];
  pickupPoint?: string;
  dropoffPoint?: string;
  price: number;
  paymentMethod: string;
  paymentReference?: string;
  paymentStatus?: "Chờ thanh toán" | "Đã ghi nhận demo";
  paidAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  changeRequestReason?: string;
  changeRequestedAt?: string;
  status: BookingStatus;
  createdAt: string;
};

export type DriverNotification = {
  id: string;
  bookingId: string;
  driverName: string;
  vehicle: string;
  route: string;
  message: string;
  createdAt: string;
  status: "Đã gửi";
};

export type CustomerNotification = {
  id: string;
  bookingId: string;
  customerId: string;
  title: string;
  message: string;
  createdAt: string;
  status: "Đã gửi";
};

export type CustomerFeedback = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  bookingId: string;
  route: string;
  rating: number;
  message: string;
  createdAt: string;
  status: "Mới";
};

export type PaymentTransaction = {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  route: string;
  amount: number;
  method: string;
  provider: string;
  reference: string;
  balanceDate: string;
  createdAt: string;
  status: "Đã ghi nhận demo";
};

export type RouteInventory = {
  code: string;
  route: string;
  time: string;
  price: number;
  sold: number;
  total: number;
  status: "Đang chạy" | "Sắp chạy" | "Hoàn thành" | "Đã hủy";
  driver: string;
  vehicle: string;
  pickup?: string;
  dropoff?: string;
};

export type SearchConfig = {
  locations: string[];
  pickupPoints: string[];
};

export type Coupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  active: boolean;
  createdAt: string;
};

export type PendingBooking = {
  route: string;
  from: string;
  to: string;
  travelDate: string;
  seats: number;
  seatCodes?: string[];
  pickupPoint?: string;
  dropoffPoint?: string;
  paymentMethod?: string;
  price: number;
};

const keys = {
  bookings: "tt_bookings",
  customerNotifications: "tt_customer_notifications",
  customers: "tt_customers",
  currentCustomer: "tt_current_customer",
  customerFeedbacks: "tt_customer_feedbacks",
  driverNotifications: "tt_driver_notifications",
  paymentTransactions: "tt_payment_transactions",
  pendingBooking: "tt_pending_booking",
  routeInventory: "tt_route_inventory",
  searchConfig: "tt_search_config",
  coupons: "tt_coupons",
  adminTrips: "tt_admin_trips"
};

const defaultSearchConfig: SearchConfig = {
  locations: ["Vinh", "Hoàng Mai", "Diễn Châu", "Quỳnh Lưu", "Hà Nội", "Sài Gòn", "Đà Lạt"],
  pickupPoints: ["VP Thành Trung", "Bến xe Vinh", "Bến xe Bắc Vinh", "Bến xe Hoàng Mai"]
};

const defaultCoupons: Coupon[] = [
  {
    active: true,
    code: "NGHEAN20",
    createdAt: new Date(2026, 4, 20).toISOString(),
    description: "Giảm 20K tuyến nội tỉnh Nghệ An khi đặt từ 2 ghế.",
    discount: "20.000đ",
    id: "CP-NGHEAN20",
    title: "Giảm 20K tuyến Nghệ An"
  },
  {
    active: true,
    code: "PAYNOW",
    createdAt: new Date(2026, 4, 20).toISOString(),
    description: "Áp dụng cho đơn thanh toán QR demo hoặc chuyển khoản.",
    discount: "5%",
    id: "CP-PAYNOW",
    title: "Ưu đãi thanh toán"
  }
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

function splitRoute(route: string) {
  const [from = "", to = ""] = route.split("-").map((part) => part.trim());
  return { from, to };
}

function parsePrice(price: string | number) {
  if (typeof price === "number") {
    return price;
  }

  const digits = price.replace(/[^\d]/g, "");
  return Number(digits || 0);
}

function formatLocalDate(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function isDemoQrPayment(method: string | undefined) {
  return Boolean(method && method.toLowerCase().includes("qr"));
}

export function listCustomers() {
  return readJson<Customer[]>(keys.customers, []);
}

export function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const customers = listCustomers();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (customers.some((customer) => customer.email === email)) {
    return { customer: null, error: "Email này đã được đăng ký." };
  }

  if (customers.some((customer) => customer.phone === phone)) {
    return { customer: null, error: "Số điện thoại này đã được đăng ký." };
  }

  const customer: Customer = {
    id: makeId("KH"),
    name: input.name.trim(),
    email,
    phone,
    password: input.password,
    createdAt: new Date().toISOString(),
    points: 0,
    status: "Hoạt động",
    tier: "Thường"
  };

  writeJson(keys.customers, [customer, ...customers]);
  setCurrentCustomer(customer);

  return { customer, error: null };
}

export function loginCustomer(emailOrPhone: string, password: string) {
  const identifier = emailOrPhone.trim().toLowerCase();
  const phone = normalizePhone(emailOrPhone);
  const customer = listCustomers().find(
    (item) => (item.email === identifier || item.phone === phone) && item.password === password
  );

  if (!customer) {
    return { customer: null, error: "Sai email/số điện thoại hoặc mật khẩu." };
  }

  if (customer.status === "Đã khóa") {
    return { customer: null, error: "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ." };
  }

  setCurrentCustomer(customer);
  return { customer, error: null };
}

export function setCurrentCustomer(customer: Customer) {
  setCurrentCustomerSession(customer);
}

export function setCurrentCustomerSession(customer: {
  email: string;
  id: string;
  name: string;
  phone: string;
}) {
  writeJson(keys.currentCustomer, {
    email: customer.email,
    id: customer.id,
    name: customer.name,
    phone: customer.phone
  });
}

export function getCurrentCustomer() {
  return readJson<Omit<Customer, "password" | "createdAt"> | null>(keys.currentCustomer, null);
}

export function updateCustomerAdmin(
  id: string,
  patch: Partial<Pick<Customer, "points" | "status" | "tier">>
) {
  const updated = listCustomers().map((customer) =>
    customer.id === id ? { ...customer, ...patch } : customer
  );

  writeJson(keys.customers, updated);
  return updated.find((customer) => customer.id === id) || null;
}

export function logoutCustomer() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(keys.currentCustomer);
}

export function setPendingBooking(booking: PendingBooking) {
  writeJson(keys.pendingBooking, booking);
}

export function getPendingBooking() {
  return readJson<PendingBooking | null>(keys.pendingBooking, null);
}

export function clearPendingBooking() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(keys.pendingBooking);
}

export function listBookings() {
  return readJson<CustomerBooking[]>(keys.bookings, []);
}

export function getBookedSeatCodes(route: string, travelDate: string) {
  return listBookings()
    .filter(
      (booking) =>
        booking.route === route &&
        booking.travelDate === travelDate &&
        booking.status !== "Từ chối" &&
        booking.status !== "Đã hủy"
    )
    .flatMap((booking) => booking.seatCodes || []);
}

export function updateBookingStatus(id: string, status: BookingStatus) {
  const updated = listBookings().map((booking) =>
    booking.id === id ? { ...booking, status } : booking
  );

  writeJson(keys.bookings, updated);
  return updated.find((booking) => booking.id === id) || null;
}

export function rejectBooking(id: string, reason: string) {
  const updated = listBookings().map((booking) =>
    booking.id === id
      ? {
          ...booking,
          rejectionReason: reason.trim(),
          rejectedAt: new Date().toISOString(),
          status: "Từ chối" as BookingStatus
        }
      : booking
  );

  writeJson(keys.bookings, updated);
  return updated.find((booking) => booking.id === id) || null;
}

export function requestBookingChange(id: string, reason: string) {
  const updated = listBookings().map((booking) =>
    booking.id === id
      ? {
          ...booking,
          changeRequestReason: reason.trim(),
          changeRequestedAt: new Date().toISOString(),
          status: "Yêu cầu hủy/đổi" as BookingStatus
        }
      : booking
  );

  writeJson(keys.bookings, updated);
  return updated.find((booking) => booking.id === id) || null;
}

export function listCustomerNotifications() {
  return readJson<CustomerNotification[]>(keys.customerNotifications, []);
}

export function addCustomerNotification(input: Omit<CustomerNotification, "createdAt" | "id" | "status">) {
  const notification: CustomerNotification = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("TB-KH"),
    status: "Đã gửi"
  };

  writeJson(keys.customerNotifications, [notification, ...listCustomerNotifications()]);
  return notification;
}

export function listCustomerFeedbacks() {
  return readJson<CustomerFeedback[]>(keys.customerFeedbacks, []);
}

export function addCustomerFeedback(input: Omit<CustomerFeedback, "createdAt" | "id" | "status">) {
  const feedback: CustomerFeedback = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("FB"),
    status: "Mới"
  };

  writeJson(keys.customerFeedbacks, [feedback, ...listCustomerFeedbacks()]);
  return feedback;
}

export function listDriverNotifications() {
  return readJson<DriverNotification[]>(keys.driverNotifications, []);
}

export function addDriverNotification(input: Omit<DriverNotification, "createdAt" | "id" | "status">) {
  const notification: DriverNotification = {
    ...input,
    createdAt: new Date().toISOString(),
    id: makeId("TB-TX"),
    status: "Đã gửi"
  };

  writeJson(keys.driverNotifications, [notification, ...listDriverNotifications()]);
  return notification;
}

export function listPaymentTransactions() {
  return readJson<PaymentTransaction[]>(keys.paymentTransactions, []);
}

export function recordDemoPayment(booking: CustomerBooking) {
  const existing = listPaymentTransactions();
  const duplicate = existing.find((transaction) => transaction.bookingId === booking.id);

  if (duplicate) {
    return duplicate;
  }

  const transaction: PaymentTransaction = {
    amount: booking.price,
    balanceDate: formatLocalDate(),
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
    customerId: booking.customerId,
    customerName: booking.customerName,
    id: makeId("PAY"),
    method: booking.paymentMethod,
    provider: "QR demo Thành Trung",
    reference: booking.paymentReference || makeId("QR"),
    route: booking.route,
    status: "Đã ghi nhận demo"
  };

  writeJson(keys.paymentTransactions, [transaction, ...existing]);
  return transaction;
}

export function listRouteInventory() {
  return readJson<RouteInventory[]>(keys.routeInventory, []);
}

export function saveRouteInventory(inventory: RouteInventory[]) {
  writeJson(keys.routeInventory, inventory);
}

export function syncRouteInventoryFromTrip(input: RouteInventory) {
  const current = listRouteInventory();
  const next = [input, ...current.filter((item) => item.code !== input.code)];
  saveRouteInventory(next);
  return input;
}

export function removeRouteInventory(code: string) {
  saveRouteInventory(listRouteInventory().filter((item) => item.code !== code));
}

export function listSearchConfig() {
  return readJson<SearchConfig>(keys.searchConfig, defaultSearchConfig);
}

export function saveSearchConfig(config: SearchConfig) {
  const cleanConfig: SearchConfig = {
    locations: Array.from(new Set(config.locations.map((item) => item.trim()).filter(Boolean))),
    pickupPoints: Array.from(new Set(config.pickupPoints.map((item) => item.trim()).filter(Boolean)))
  };
  writeJson(keys.searchConfig, cleanConfig);
  return cleanConfig;
}

export function listCoupons() {
  return readJson<Coupon[]>(keys.coupons, defaultCoupons);
}

export function saveCoupons(coupons: Coupon[]) {
  writeJson(keys.coupons, coupons);
}

export function upsertCoupon(input: Omit<Coupon, "createdAt" | "id"> & { id?: string }) {
  const coupons = listCoupons();
  const coupon: Coupon = {
    ...input,
    createdAt: coupons.find((item) => item.id === input.id)?.createdAt || new Date().toISOString(),
    id: input.id || makeId("CP")
  };
  saveCoupons([coupon, ...coupons.filter((item) => item.id !== coupon.id)]);
  return coupon;
}

export function listAdminTrips<T>(fallback: T[]) {
  return readJson<T[]>(keys.adminTrips, fallback);
}

export function saveAdminTrips<T>(trips: T[]) {
  writeJson(keys.adminTrips, trips);
}

export function createBooking(input: {
  customer: Omit<Customer, "password" | "createdAt">;
  route: string;
  travelDate: string;
  seats?: number;
  seatCodes?: string[];
  pickupPoint?: string;
  dropoffPoint?: string;
  price: string | number;
  paymentMethod?: string;
}) {
  const { from, to } = splitRoute(input.route);
  const requestedSeats = input.seatCodes || [];
  const occupiedSeats = getBookedSeatCodes(input.route, input.travelDate);
  const duplicatedSeat = requestedSeats.find((seat) => occupiedSeats.includes(seat));

  if (duplicatedSeat) {
    throw new Error(`Ghế ${duplicatedSeat} vừa được người khác giữ. Vui lòng chọn ghế khác.`);
  }

  const paymentReference = isDemoQrPayment(input.paymentMethod) ? makeId("QR") : undefined;
  const booking: CustomerBooking = {
    id: makeId("BK"),
    createdAt: new Date().toISOString(),
    customerEmail: input.customer.email,
    customerId: input.customer.id,
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    dropoffPoint: input.dropoffPoint,
    from,
    paymentMethod: input.paymentMethod || "Thanh toán sau",
    paymentReference,
    paymentStatus: paymentReference ? "Đã ghi nhận demo" : "Chờ thanh toán",
    paidAt: paymentReference ? new Date().toISOString() : undefined,
    pickupPoint: input.pickupPoint,
    price: parsePrice(input.price),
    route: input.route,
    seats: input.seats || 1,
    seatCodes: input.seatCodes,
    status: "Chờ xác nhận",
    to,
    travelDate: input.travelDate
  };

  writeJson(keys.bookings, [booking, ...listBookings()]);
  if (paymentReference) {
    recordDemoPayment(booking);
  }

  return booking;
}

export function createBookingFromPending(customer: Omit<Customer, "password" | "createdAt">) {
  const pending = getPendingBooking();
  if (!pending) {
    return null;
  }

  const booking = createBooking({
    customer,
    dropoffPoint: pending.dropoffPoint,
    paymentMethod: pending.paymentMethod,
    price: pending.price,
    pickupPoint: pending.pickupPoint,
    route: pending.route,
    seatCodes: pending.seatCodes,
    seats: pending.seats,
    travelDate: pending.travelDate
  });

  clearPendingBooking();
  return booking;
}
