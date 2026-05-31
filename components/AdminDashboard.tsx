"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  Bus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  Filter,
  Gift,
  IdCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Route,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Ticket,
  Trash2,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  Wrench,
  X
} from "lucide-react";
import {
  bookings,
  customers,
  drivers,
  notifications,
  revenueChannels,
  revenueData,
  reviews,
  tripMixData,
  type Trip,
  type TripStatus,
  vehicles
} from "@/lib/dashboard-data";
import {
  addDriverNotification,
  addCustomerNotification,
  listCoupons,
  listCustomers,
  listCustomerNotifications,
  listCustomerFeedbacks,
  listDriverNotifications,
  listPaymentTransactions,
  listSearchConfig,
  saveSearchConfig,
  updateCustomerAdmin,
  upsertCoupon,
  type Coupon,
  type Customer,
  type CustomerBooking,
  type CustomerFeedback,
  type CustomerNotification,
  type DriverNotification,
  type PaymentTransaction,
  type SearchConfig
} from "@/lib/local-db";
import type { ApiBooking, ApiTrip } from "@/lib/transport-api";
import { cn } from "@/lib/utils";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type PageKey =
  | "overview"
  | "trips"
  | "booking"
  | "customers"
  | "drivers"
  | "vehicles"
  | "revenue"
  | "reviews"
  | "notifications"
  | "settings";

type NavItem = {
  key: PageKey;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { key: "trips", label: "Quản lý chuyến xe", icon: Route },
  { key: "booking", label: "Đặt vé", icon: Ticket },
  { key: "customers", label: "Khách hàng", icon: Users },
  { key: "drivers", label: "Tài xế", icon: IdCard },
  { key: "vehicles", label: "Xe", icon: Bus },
  { key: "revenue", label: "Doanh thu", icon: DollarSign },
  { key: "reviews", label: "Đánh giá", icon: Star },
  { key: "notifications", label: "Thông báo", icon: Bell },
  { key: "settings", label: "Cài đặt", icon: Settings }
];

const pageContent: Record<PageKey, { title: string; description: string }> = {
  overview: {
    title: "Tổng quan vận hành",
    description: "Theo dõi doanh thu, chuyến xe và hiệu suất ghế theo thời gian thực."
  },
  trips: {
    title: "Quản lý chuyến xe",
    description: "Điều phối lịch chạy, trạng thái tuyến, tài xế và số ghế đã bán."
  },
  booking: {
    title: "Đặt vé",
    description: "Kiểm soát các giao dịch giữ chỗ, thanh toán và hoàn vé."
  },
  customers: {
    title: "Khách hàng",
    description: "Theo dõi nhóm khách, lịch sử mua vé và giá trị vòng đời."
  },
  drivers: {
    title: "Tài xế",
    description: "Quản lý trạng thái ca chạy, hiệu suất đúng giờ và xe được phân công."
  },
  vehicles: {
    title: "Xe",
    description: "Theo dõi tình trạng đội xe, lịch bảo dưỡng và mức sẵn sàng."
  },
  revenue: {
    title: "Doanh thu",
    description: "Đối chiếu doanh thu theo kênh bán và xu hướng tăng trưởng."
  },
  reviews: {
    title: "Đánh giá",
    description: "Tổng hợp phản hồi khách hàng và trạng thái xử lý."
  },
  notifications: {
    title: "Thông báo",
    description: "Quản lý luồng cảnh báo nội bộ và thông báo vận hành."
  },
  settings: {
    title: "Cài đặt",
    description: "Cấu hình hồ sơ doanh nghiệp, thông báo và quyền thao tác."
  }
};

const statusOptions: TripStatus[] = ["Đang chạy", "Sắp chạy", "Hoàn thành", "Đã hủy"];

const statusTone: Record<TripStatus, string> = {
  "Đang chạy": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Sắp chạy": "border-blue-200 bg-blue-50 text-blue-700",
  "Hoàn thành": "border-violet-200 bg-violet-50 text-violet-700",
  "Đã hủy": "border-amber-200 bg-amber-50 text-amber-700"
};

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatShortDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getLocalDateKey(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getLastSevenDateKeys() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return getLocalDateKey(date);
  });
}

function formatRevenueDayLabel(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [registeredCustomers, setRegisteredCustomers] = useState<Customer[]>([]);
  const [customerFeedbacks, setCustomerFeedbacks] = useState<CustomerFeedback[]>([]);
  const [customerNotifications, setCustomerNotifications] = useState<CustomerNotification[]>([]);
  const [driverNotifications, setDriverNotifications] = useState<DriverNotification[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [toast, setToast] = useState("");
  const [rejectModal, setRejectModal] = useState<{ booking: CustomerBooking | null; reason: string }>({
    booking: null,
    reason: ""
  });
  const [tripModal, setTripModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    trip: Trip | null;
  }>({ open: false, mode: "add", trip: null });

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAdmin() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = response.ok
          ? ((await response.json()) as { user?: { role?: string } | null })
          : { user: null };

        if (cancelled) {
          return;
        }

        if (data.user?.role !== "ADMIN") {
          router.replace("/admin/login");
          return;
        }

        const hash = window.location.hash.replace("#", "") as PageKey;
        if (navItems.some((item) => item.key === hash)) {
          setActivePage(hash);
        }

        await Promise.all([refreshAdminTrips(), refreshAdminBookings()]);
        setRegisteredCustomers(listCustomers());
        setCustomerFeedbacks(listCustomerFeedbacks());
        setCustomerNotifications(listCustomerNotifications());
        setDriverNotifications(listDriverNotifications());
        setPaymentTransactions(listPaymentTransactions());
        setCoupons(listCoupons());
        setIsAuthorized(true);
      } catch {
        if (!cancelled) {
          router.replace("/admin/login");
        }
      }
    }

    bootstrapAdmin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      window.history.replaceState(null, "", `#${activePage}`);
    }
  }, [activePage, isAuthorized]);

  useEffect(() => {
    if (isAuthorized && (activePage === "booking" || activePage === "revenue" || activePage === "customers" || activePage === "reviews")) {
      void refreshAdminBookings();
      setRegisteredCustomers(listCustomers());
      setCustomerFeedbacks(listCustomerFeedbacks());
      setCustomerNotifications(listCustomerNotifications());
      setDriverNotifications(listDriverNotifications());
      setPaymentTransactions(listPaymentTransactions());
      setCoupons(listCoupons());
    }
  }, [activePage, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    function handleStorageChange() {
      setRegisteredCustomers(listCustomers());
      setCustomerFeedbacks(listCustomerFeedbacks());
      setPaymentTransactions(listPaymentTransactions());
      setCoupons(listCoupons());
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isAuthorized]);

  async function refreshAdminTrips() {
    try {
      const response = await fetch("/api/trips", { cache: "no-store" });
      const data = (await response.json()) as { trips?: ApiTrip[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải chuyến xe.");
      }
      setTrips((data.trips || []).map(apiTripToDashboardTrip));
    } catch (error) {
      setTrips([]);
      setToast(error instanceof Error ? error.message : "Không thể tải chuyến xe từ server.");
    }
  }

  async function refreshAdminBookings() {
    try {
      const response = await fetch("/api/admin/bookings", { cache: "no-store" });
      const data = (await response.json()) as { bookings?: ApiBooking[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải đặt vé.");
      }
      setCustomerBookings((data.bookings || []).map(apiBookingToCustomerBooking));
    } catch (error) {
      setCustomerBookings([]);
      setToast(error instanceof Error ? error.message : "Không thể tải vé từ server.");
    }
  }

  function handleConfirmBooking(booking: CustomerBooking) {
    addCustomerNotification({
      bookingId: booking.id,
      customerId: booking.customerId,
      message: `Vé ${booking.id} tuyến ${booking.route} đã được xác nhận. Vui lòng có mặt đúng điểm đón ${booking.pickupPoint || booking.from}.`,
      title: "Vé xe đã được xác nhận"
    });
    setCustomerBookings((current) =>
      current.map((item) => (item.id === booking.id ? { ...item, status: "Đã xác nhận" } : item))
    );
    setCustomerNotifications(listCustomerNotifications());
    setToast(`Đã đánh dấu xác nhận vé ${booking.id} trên giao diện. API cập nhật trạng thái sẽ làm ở bước sau.`);
  }

  function handleRejectBooking() {
    if (!rejectModal.booking) {
      return;
    }

    const reason = rejectModal.reason.trim();
    if (!reason) {
      setToast("Vui lòng nhập lý do từ chối để gửi cho khách hàng.");
      return;
    }

    const rejected = rejectModal.booking;
    addCustomerNotification({
      bookingId: rejected.id,
      customerId: rejected.customerId,
      message: `Đơn ${rejected.id} tuyến ${rejected.route} bị từ chối. Lý do: ${reason}`,
      title: "Đơn đặt vé bị từ chối"
    });

    setRejectModal({ booking: null, reason: "" });
    setCustomerBookings((current) =>
      current.map((item) =>
        item.id === rejected.id ? { ...item, rejectionReason: reason, status: "Từ chối" } : item
      )
    );
    setCustomerNotifications(listCustomerNotifications());
    setToast(`Đã đánh dấu từ chối vé ${rejected.id} trên giao diện và gửi lý do demo cho khách.`);
  }

  function handleNotifyDriver(booking: CustomerBooking) {
    const assignedTrip =
      trips.find((trip) => trip.route === booking.route) ||
      trips.find((trip) => booking.route.includes(trip.route.split("-")[0].trim())) ||
      trips[0];

    const notification = addDriverNotification({
      bookingId: booking.id,
      driverName: assignedTrip?.driver || "Tài xế phụ trách",
      message: [
        `Vé ${booking.id} đã xác nhận cho ${booking.customerName}.`,
        `Tuyến ${booking.route}, ngày ${formatShortDate(booking.travelDate)}.`,
        `Ghế ${booking.seatCodes?.join(", ") || booking.seats}.`,
        `Đón: ${booking.pickupPoint || booking.from}.`,
        `Trả: ${booking.dropoffPoint || booking.to}.`,
        `Thanh toán: ${booking.paymentMethod}.`
      ].join(" "),
      route: booking.route,
      vehicle: assignedTrip?.vehicle || "Chưa phân xe"
    });

    setDriverNotifications([notification, ...listDriverNotifications().filter((item) => item.id !== notification.id)]);
    setToast(`Đã gửi thông báo cho ${notification.driverName}.`);
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Still send the operator back to login if logout API is unavailable.
    }
    router.replace("/admin/login");
  }

  async function saveTrip(payload: Trip) {
    const duplicated = trips.some(
      (trip) => trip.code === payload.code && (trip.id || trip.code) !== (tripModal.trip?.id || tripModal.trip?.code)
    );

    if (duplicated) {
      return "Mã chuyến đã tồn tại.";
    }

    if (tripModal.mode === "edit" && !tripModal.trip?.id) {
      return "Không tìm thấy ID chuyến trong database để cập nhật.";
    }

    try {
      const response = await fetch(
        tripModal.mode === "edit" ? `/api/admin/trips/${tripModal.trip?.id}` : "/api/admin/trips",
        {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: tripModal.mode === "edit" ? "PUT" : "POST"
        }
      );
      const data = (await response.json()) as { error?: string; trip?: ApiTrip };

      if (!response.ok || !data.trip) {
        return data.error || "Không thể lưu chuyến xe.";
      }

      await refreshAdminTrips();
      setToast(`Đã lưu chuyến ${data.trip.code} vào database và đồng bộ sang màn hình user.`);
      return null;
    } catch {
      return "Không thể kết nối API lưu chuyến xe.";
    }
  }

  async function deleteTrip(trip: Trip) {
    if (!trip.id) {
      setToast("Không tìm thấy ID chuyến trong database để xóa.");
      return;
    }

    if (!window.confirm(`Xóa chuyến ${trip.code}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Không thể xóa chuyến xe.");
      }

      await refreshAdminTrips();
      setToast(`Đã xóa chuyến ${trip.code} khỏi database.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể xóa chuyến xe.");
    }
  }

  if (!isAuthorized) {
    return <AuthLoading />;
  }

  const currentPage = pageContent[activePage];

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-900">
      <AnimatePresence>
        {mobileSidebarOpen ? (
          <motion.button
            aria-label="Đóng menu"
            className="fixed inset-0 z-30 bg-gray-950/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            type="button"
          />
        ) : null}
      </AnimatePresence>

      <Sidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
        onNavigate={(key) => {
          setActivePage(key);
          setMobileSidebarOpen(false);
        }}
      />

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-out",
          sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[280px]"
        )}
      >
        <Topbar
          activePage={activePage}
          description={currentPage.description}
          onLogout={handleLogout}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          title={currentPage.title}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {activePage === "overview" ? (
              <OverviewPage key="overview" trips={trips} />
            ) : activePage === "trips" ? (
              <TripsPage
                key="trips"
                onAdd={() => setTripModal({ open: true, mode: "add", trip: null })}
                onDelete={(trip) => void deleteTrip(trip)}
                onEdit={(trip) => setTripModal({ open: true, mode: "edit", trip })}
                trips={trips}
              />
            ) : activePage === "settings" ? (
              <SettingsPage key="settings" />
            ) : activePage === "booking" ? (
              <BookingAdminPage
                bookings={customerBookings}
                customerNotifications={customerNotifications}
                driverNotifications={driverNotifications}
                key="booking"
                onConfirm={handleConfirmBooking}
                onNotifyDriver={handleNotifyDriver}
                onOpenReject={(booking) => setRejectModal({ booking, reason: "" })}
              />
            ) : activePage === "revenue" ? (
              <RevenueAdminPage
                bookings={customerBookings}
                coupons={coupons}
                key="revenue"
                onCouponSaved={() => setCoupons(listCoupons())}
                payments={paymentTransactions}
              />
            ) : activePage === "customers" ? (
              <CustomerAdminPage
                bookings={customerBookings}
                customers={registeredCustomers}
                key="customers"
                onCustomerUpdate={(customerId, patch) => {
                  updateCustomerAdmin(customerId, patch);
                  setRegisteredCustomers(listCustomers());
                }}
                onRefresh={() => {
                  setRegisteredCustomers(listCustomers());
                  void refreshAdminBookings();
                }}
              />
            ) : activePage === "reviews" ? (
              <FeedbackAdminPage
                feedbacks={customerFeedbacks}
                key="reviews"
                onRefresh={() => setCustomerFeedbacks(listCustomerFeedbacks())}
              />
            ) : (
              <WorkspacePage
                bookingRows={makeAdminBookingRows(customerBookings)}
                key={activePage}
                pageKey={activePage}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      <TripModal
        mode={tripModal.mode}
        onClose={() => setTripModal({ open: false, mode: "add", trip: null })}
        onSave={saveTrip}
        open={tripModal.open}
        trip={tripModal.trip}
        trips={trips}
      />

      <RejectBookingModal
        booking={rejectModal.booking}
        onClose={() => setRejectModal({ booking: null, reason: "" })}
        onConfirm={handleRejectBooking}
        onReasonChange={(reason) => setRejectModal((current) => ({ ...current, reason }))}
        reason={rejectModal.reason}
      />

      <AnimatePresence>
        {toast ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            role="status"
          >
            <div className="flex items-center justify-between gap-4">
              <span>{toast}</span>
              <button className="font-bold" onClick={() => setToast("")} type="button">
                Đóng
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7fb]">
      <div className="flex items-center gap-3 rounded-2xl border border-[#dbe7f3] bg-white px-5 py-4 text-sm font-semibold text-gray-600 shadow-[0_18px_50px_rgba(16,24,40,0.08)]">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#075bbf]" />
        Đang kiểm tra phiên đăng nhập...
      </div>
    </main>
  );
}

function Sidebar({
  activePage,
  collapsed,
  mobileOpen,
  onCollapse,
  onNavigate
}: {
  activePage: PageKey;
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onNavigate: (key: PageKey) => void;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[#0a4f9f] bg-[#073b7a] text-white shadow-[18px_0_50px_rgba(7,59,122,0.22)] transition-all duration-300 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-[88px]" : "lg:w-[280px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#ffd43b] text-[#111827]">
          <Building2 className="h-5 w-5" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0"
            >
              <p className="truncate text-sm font-semibold uppercase tracking-[0.16em] text-[#bad7f5]">
                Thành Trung
              </p>
              <p className="truncate text-base font-black text-white">Admin</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key;

          return (
            <button
              key={item.key}
              className={cn(
                "group flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold transition",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-white text-[#073b7a] shadow-sm"
                  : "text-[#d7ebff] hover:bg-white/10 hover:text-white"
              )}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              type="button"
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 text-sm font-bold text-[#d7ebff] transition hover:bg-white/15 hover:text-white",
            collapsed && "px-0"
          )}
          onClick={onCollapse}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          type="button"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed ? <span>Thu gọn menu</span> : null}
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  activePage,
  description,
  onLogout,
  onOpenSidebar,
  title
}: {
  activePage: PageKey;
  description: string;
  onLogout: () => void;
  onOpenSidebar: () => void;
  title: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#dbe7f3] bg-white/95 shadow-[0_10px_30px_rgba(16,24,40,0.05)] backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Mở menu"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[#dbe7f3] text-gray-600 transition hover:bg-[#f8fbff] lg:hidden"
            onClick={onOpenSidebar}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#075bbf]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {navItems.find((item) => item.key === activePage)?.label}
            </div>
            <h1 className="mt-1 truncate text-lg font-black text-gray-950 sm:text-xl">{title}</h1>
            <p className="hidden truncate text-sm text-gray-500 md:block">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 md:flex">
            Demo localStorage
          </div>

          <label className="hidden h-10 w-[260px] items-center gap-2 rounded-2xl border border-[#dbe7f3] bg-[#f8fbff] px-3 text-sm text-gray-500 transition focus-within:border-[#075bbf] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#e8f3ff] xl:flex">
            <Search className="h-4 w-4" />
            <input
              className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-gray-400 focus:ring-0"
              placeholder="Tìm nhanh..."
              type="search"
            />
          </label>

          <button
            aria-label="Thông báo"
            className="relative grid h-10 w-10 place-items-center rounded-2xl border border-[#dbe7f3] bg-white text-gray-600 transition hover:bg-[#f8fbff]"
            type="button"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
          </button>

          <button
            aria-label="Đăng xuất"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[#dbe7f3] bg-white text-gray-600 transition hover:bg-red-50 hover:text-red-600"
            onClick={onLogout}
            title="Đăng xuất"
            type="button"
          >
            <LogOut className="h-5 w-5" />
          </button>

          <div className="hidden h-10 items-center gap-2 rounded-2xl border border-[#dbe7f3] bg-white px-2 pr-3 sm:flex">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#e8f3ff] text-[#075bbf]">
              <UserRound className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function OverviewPage({ trips }: { trips: Trip[] }) {
  const soldSeats = trips.reduce((sum, trip) => sum + trip.sold, 0);
  const totalSeats = trips.reduce((sum, trip) => sum + trip.total, 0);
  const revenueToday = trips.reduce((sum, trip) => sum + trip.sold * trip.price, 0);
  const seatRate = totalSeats ? (soldSeats / totalSeats) * 100 : 0;

  const revenueOptions: ApexOptions = {
    chart: {
      animations: { enabled: true, speed: 650 },
      fontFamily: "Inter, system-ui, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ["#075bbf"],
    dataLabels: { enabled: false },
    fill: {
      gradient: { opacityFrom: 0.28, opacityTo: 0.04, shadeIntensity: 1 },
      type: "gradient"
    },
    grid: {
      borderColor: "#EAECF0",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } }
    },
    stroke: { curve: "smooth", width: 3 },
    tooltip: {
      y: {
        formatter: (value) => `${Math.round(Number(value))} triệu`
      }
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      categories: revenueData.map((item) => item.label),
      labels: { style: { colors: "#667085", fontSize: "12px" } }
    },
    yaxis: {
      labels: {
        formatter: (value) => `${Math.round(Number(value))}tr`,
        style: { colors: "#667085", fontSize: "12px" }
      }
    }
  };

  const donutOptions: ApexOptions = {
    chart: {
      animations: { enabled: true, speed: 700 },
      fontFamily: "Inter, system-ui, sans-serif"
    },
    colors: tripMixData.map((item) => item.color),
    dataLabels: { enabled: false },
    labels: tripMixData.map((item) => item.label),
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              color: "#101828",
              fontSize: "22px",
              fontWeight: 700,
              label: "Ổn định",
              show: true
            },
            value: { color: "#101828", fontSize: "18px", fontWeight: 700 }
          },
          size: "72%"
        }
      }
    },
    stroke: { width: 0 },
    tooltip: {
      y: {
        formatter: (value) => `${value}%`
      }
    }
  };

  return (
    <motion.section
      animate="animate"
      className="space-y-5"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Ticket}
          index={0}
          label="Tổng vé bán"
          tone="blue"
          trend="+12.5%"
          value="1.256"
        />
        <KpiCard
          icon={DollarSign}
          index={1}
          label="Doanh thu hôm nay"
          tone="emerald"
          trend="+8.2%"
          value={formatCurrency(revenueToday)}
        />
        <KpiCard
          icon={Users}
          index={2}
          label="Khách hàng mới"
          tone="amber"
          trend="+24"
          value="86"
        />
        <KpiCard
          icon={Bus}
          index={3}
          label="Tỷ lệ lấp ghế"
          tone="violet"
          trend={`${trips.length} chuyến`}
          value={formatPercent(seatRate)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <Panel
          action={
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
          }
          title="Doanh thu 7 ngày"
        >
          <div className="h-[320px]">
            <Chart
              height="100%"
              options={revenueOptions}
              series={[
                {
                  data: revenueData.map((item) => item.revenue),
                  name: "Doanh thu"
                }
              ]}
              type="area"
              width="100%"
            />
          </div>
        </Panel>

        <Panel title="Tỷ lệ chuyến xe">
          <div className="grid gap-3">
            <div className="h-[230px]">
              <Chart
                height="100%"
                options={donutOptions}
                series={tripMixData.map((item) => item.value)}
                type="donut"
                width="100%"
              />
            </div>
            <div className="space-y-3">
              {tripMixData.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-gray-950">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Tuyến đang ưu tiên">
          <div className="space-y-4">
            {trips.slice(0, 4).map((trip) => (
              <div key={trip.code} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-950">{trip.route}</p>
                  <p className="text-xs text-gray-500">
                    {trip.time} · {trip.vehicle}
                  </p>
                </div>
                <span className={cn("rounded-lg border px-2 py-1 text-xs font-semibold", statusTone[trip.status])}>
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Hiệu suất vận hành">
          <div className="space-y-4">
            {[
              ["Đúng giờ", 98, "bg-emerald-500"],
              ["Lấp ghế", Math.round(seatRate), "bg-[#075bbf]"],
              ["Thanh toán online", 72, "bg-amber-500"],
              ["Phản hồi trong ngày", 89, "bg-violet-500"]
            ].map(([label, value, bar]) => (
              <div key={label as string}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="font-semibold text-gray-950">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <motion.div
                    animate={{ width: `${value}%` }}
                    className={cn("h-2 rounded-full", bar as string)}
                    initial={{ width: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Cảnh báo nhanh">
          <div className="space-y-3">
            {[
              ["Bảo dưỡng", "Xe 37B-775.10 đến lịch kiểm tra", Wrench, "text-amber-600"],
              ["Thanh toán", "3 giao dịch đang chờ đối soát", CreditCard, "text-blue-600"],
              ["Đánh giá", "2 phản hồi cần xử lý trong hôm nay", MessageSquare, "text-violet-600"]
            ].map(([title, text, Icon, tone]) => {
              const AlertIcon = Icon as LucideIcon;
              return (
                <div key={title as string} className="flex gap-3 rounded-lg border border-gray-200 p-3">
                  <AlertIcon className={cn("mt-0.5 h-5 w-5 shrink-0", tone as string)} />
                  <div>
                    <p className="text-sm font-semibold text-gray-950">{title as string}</p>
                    <p className="mt-1 text-sm text-gray-500">{text as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </motion.section>
  );
}

function KpiCard({
  icon: Icon,
  index,
  label,
  tone,
  trend,
  value
}: {
  icon: LucideIcon;
  index: number;
  label: string;
  tone: "blue" | "emerald" | "amber" | "violet";
  trend: string;
  value: string;
}) {
  const tones = {
    blue: "bg-blue-50 text-[#075bbf]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600"
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-[#e6eef8] bg-white p-5 shadow-[0_14px_40px_rgba(16,24,40,0.06)]"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-gray-950">{value}</p>
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#f8fbff] px-3 py-1 text-xs font-bold text-gray-600 ring-1 ring-[#e6eef8]">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        {trend}
      </div>
    </motion.div>
  );
}

function TripsPage({
  onAdd,
  onDelete,
  onEdit,
  trips
}: {
  onAdd: () => void;
  onDelete: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  trips: Trip[];
}) {
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [detailTrip, setDetailTrip] = useState<Trip | null>(null);

  const routeOptions = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.route))).sort(),
    [trips]
  );

  const filteredTrips = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return trips.filter((trip) => {
      const routeMatched = routeFilter === "all" || trip.route === routeFilter;
      const statusMatched = statusFilter === "all" || trip.status === statusFilter;
      const queryMatched =
        !normalizedQuery ||
        trip.code.toLowerCase().includes(normalizedQuery) ||
        trip.route.toLowerCase().includes(normalizedQuery) ||
        trip.driver.toLowerCase().includes(normalizedQuery);

      return routeMatched && statusMatched && queryMatched;
    });
  }, [query, routeFilter, statusFilter, trips]);

  const soldSeats = trips.reduce((sum, trip) => sum + trip.sold, 0);
  const totalSeats = trips.reduce((sum, trip) => sum + trip.total, 0);

  return (
    <motion.section
      animate="animate"
      className="space-y-5"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat icon={Route} label="Chuyến đang quản lý" value={String(trips.length)} />
        <MiniStat icon={UserCheck} label="Ghế đã bán" value={`${soldSeats}/${totalSeats}`} />
        <MiniStat
          icon={Clock}
          label="Chuyến sắp chạy"
          value={String(trips.filter((trip) => trip.status === "Sắp chạy").length)}
        />
      </div>

      <Panel
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#073b7a]"
            onClick={onAdd}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Thêm chuyến
          </button>
        }
        title="Danh sách chuyến xe"
      >
        <div className="mb-4 grid gap-3 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 text-gray-400" />
              Tuyến
            </span>
            <select
              className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => setRouteFilter(event.target.value)}
              value={routeFilter}
            >
              <option value="all">Tất cả tuyến</option>
              {routeOptions.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              Trạng thái
            </span>
            <select
              className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => setStatusFilter(event.target.value as TripStatus | "all")}
              value={statusFilter}
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Search className="h-4 w-4 text-gray-400" />
              Tìm kiếm
            </span>
            <input
              className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Mã chuyến, tuyến hoặc tài xế..."
              type="search"
              value={query}
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                <tr>
                  <th className="px-4 py-3">Mã chuyến</th>
                  <th className="px-4 py-3">Tuyến đường</th>
                  <th className="px-4 py-3">Giờ đi</th>
                  <th className="px-4 py-3">Giá vé</th>
                  <th className="px-4 py-3">Ghế</th>
                  <th className="px-4 py-3">Tài xế</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredTrips.length ? (
                  filteredTrips.map((trip) => (
                    <tr key={trip.code} className="transition hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-950">
                        {trip.code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{trip.route}</p>
                        <p className="text-xs text-gray-500">{trip.vehicle}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{trip.time}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#075bbf]">
                        {formatCurrency(trip.price)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {trip.sold}/{trip.total}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{trip.driver}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold",
                            statusTone[trip.status]
                          )}
                        >
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <IconButton
                            icon={Eye}
                            label="Xem chi tiết"
                            onClick={() => setDetailTrip(trip)}
                          />
                          <IconButton icon={Pencil} label="Sửa chuyến" onClick={() => onEdit(trip)} />
                          <IconButton
                            danger
                            icon={Trash2}
                            label="Xóa chuyến"
                            onClick={() => onDelete(trip)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
                      Không có chuyến nào phù hợp bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <TripDetailPanel onClose={() => setDetailTrip(null)} trip={detailTrip} />
    </motion.section>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-[#e6eef8] bg-white p-4 shadow-[0_12px_36px_rgba(16,24,40,0.05)]">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f3ff] text-[#075bbf]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="text-xl font-black text-gray-950">{value}</p>
      </div>
    </div>
  );
}

function IconButton({
  danger,
  icon: Icon,
  label,
  onClick
}: {
  danger?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-2xl border border-[#dbe7f3] bg-white text-gray-500 transition hover:bg-[#f8fbff] hover:text-gray-900",
        danger && "hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function TripDetailPanel({ onClose, trip }: { onClose: () => void; trip: Trip | null }) {
  return (
    <AnimatePresence>
      {trip ? (
        <>
          <motion.button
            aria-label="Đóng chi tiết chuyến"
            className="fixed inset-0 z-40 bg-gray-950/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white p-5 shadow-xl"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#075bbf]">
                  {trip.code}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-gray-950">{trip.route}</h3>
              </div>
              <button
                aria-label="Đóng"
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["Giờ đi", trip.time, Clock],
                ["Giá vé", formatCurrency(trip.price), DollarSign],
                ["Ghế đã bán", `${trip.sold}/${trip.total}`, Ticket],
                ["Tài xế", trip.driver, IdCard],
                ["Xe", trip.vehicle, Bus],
                ["Kênh bán", trip.platform, CreditCard]
              ].map(([label, value, Icon]) => {
                const FieldIcon = Icon as LucideIcon;
                return (
                  <div key={label as string} className="flex gap-3 rounded-lg border border-gray-200 p-3">
                    <FieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-500">
                        {label as string}
                      </p>
                      <p className="mt-1 font-semibold text-gray-950">{value as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

type TripFormState = {
  code: string;
  route: string;
  time: string;
  price: string;
  sold: string;
  total: string;
  status: TripStatus;
  driver: string;
  vehicle: string;
  platform: string;
};

const emptyTripForm: TripFormState = {
  code: "",
  route: "",
  time: "07:30",
  price: "200000",
  sold: "0",
  total: "40",
  status: "Sắp chạy",
  driver: "",
  vehicle: "",
  platform: "Website"
};

function TripModal({
  mode,
  onClose,
  onSave,
  open,
  trip,
  trips
}: {
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (trip: Trip) => Promise<string | null>;
  open: boolean;
  trip: Trip | null;
  trips: Trip[];
}) {
  const [form, setForm] = useState<TripFormState>(emptyTripForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    if (trip) {
      setForm({
        code: trip.code,
        driver: trip.driver,
        platform: trip.platform,
        price: String(trip.price),
        route: trip.route,
        sold: String(trip.sold),
        status: trip.status,
        time: trip.time,
        total: String(trip.total),
        vehicle: trip.vehicle
      });
    } else {
      setForm(emptyTripForm);
    }
  }, [open, trip]);

  function updateField<K extends keyof TripFormState>(key: K, value: TripFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function genCode() {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    const prefix = `TT${dd}${mm}${yy}`;
    const count = trips.filter((item) => item.code.startsWith(prefix)).length + 1;
    return `${prefix}-${String(count).padStart(3, "0")}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const route = form.route.trim();
    const price = Number(form.price);
    const sold = Number(form.sold);
    const total = Number(form.total);

    if (!route) {
      setError("Vui lòng nhập tuyến đường.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Giá vé không hợp lệ.");
      return;
    }

    if (!Number.isInteger(sold) || !Number.isInteger(total) || total <= 0 || sold < 0 || sold > total) {
      setError("Số ghế đã bán phải nằm trong tổng số ghế.");
      return;
    }

    const payload: Trip = {
      code: form.code.trim() || genCode(),
      driver: form.driver.trim() || "Chưa phân công",
      id: trip?.id,
      platform: form.platform.trim() || "Website",
      price,
      route,
      sold,
      status: form.status,
      time: form.time || "07:30",
      total,
      vehicle: form.vehicle.trim() || "Chưa chọn"
    };

    setSaving(true);
    try {
      const result = await onSave(payload);
      if (result) {
        setError(result);
        return;
      }

      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6">
          <motion.button
            aria-label="Đóng modal"
            className="absolute inset-0 bg-gray-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          <motion.form
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            onSubmit={handleSubmit}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#075bbf]">
                  Chuyến xe
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-950">
                  {mode === "edit" ? "Sửa chuyến" : "Thêm chuyến"}
                </h3>
              </div>
              <button
                aria-label="Đóng"
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <FormField label="Mã chuyến">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  onChange={(event) => updateField("code", event.target.value)}
                  placeholder="Tự tạo nếu để trống"
                  value={form.code}
                />
              </FormField>
              <FormField label="Tuyến đường">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  onChange={(event) => updateField("route", event.target.value)}
                  placeholder="VD: Vinh - Hoàng Mai"
                  value={form.route}
                />
              </FormField>
              <FormField label="Giờ đi">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  onChange={(event) => updateField("time", event.target.value)}
                  type="time"
                  value={form.time}
                />
              </FormField>
              <FormField label="Giá vé">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  min={0}
                  onChange={(event) => updateField("price", event.target.value)}
                  step={1000}
                  type="number"
                  value={form.price}
                />
              </FormField>
              <FormField label="Ghế đã bán">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  min={0}
                  onChange={(event) => updateField("sold", event.target.value)}
                  type="number"
                  value={form.sold}
                />
              </FormField>
              <FormField label="Tổng ghế">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  min={1}
                  onChange={(event) => updateField("total", event.target.value)}
                  type="number"
                  value={form.total}
                />
              </FormField>
              <FormField label="Tài xế">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  onChange={(event) => updateField("driver", event.target.value)}
                  placeholder="Tên tài xế"
                  value={form.driver}
                />
              </FormField>
              <FormField label="Xe">
                <input
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  onChange={(event) => updateField("vehicle", event.target.value)}
                  placeholder="Biển số xe"
                  value={form.vehicle}
                />
              </FormField>
              <FormField label="Trạng thái">
                <select
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  onChange={(event) => updateField("status", event.target.value as TripStatus)}
                  value={form.status}
                >
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Kênh bán">
                <select
                  className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                  onChange={(event) => updateField("platform", event.target.value)}
                  value={form.platform}
                >
                  {["Website", "Mobile", "Đại lý", "Hotline"].map((platform) => (
                    <option key={platform}>{platform}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="border-t border-gray-200 px-5 py-4">
              <AnimatePresence>
                {error ? (
                  <motion.p
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    exit={{ opacity: 0, y: -4 }}
                    initial={{ opacity: 0, y: -4 }}
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>
              <div className="flex justify-end gap-3">
                <button
                  className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  onClick={onClose}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white hover:bg-[#073b7a] disabled:cursor-not-allowed disabled:bg-gray-300"
                  disabled={saving}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function FormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

type WorkspaceConfig = {
  action: string;
  columns: string[];
  focus: Array<{ label: string; value: string; tone: string }>;
  icon: LucideIcon;
  metrics: Array<{ icon: LucideIcon; label: string; value: string }>;
  rows: string[][];
  title: string;
};

const workspaceConfigs: Record<Exclude<PageKey, "overview" | "trips" | "settings">, WorkspaceConfig> = {
  booking: {
    action: "Tạo vé",
    columns: ["Mã vé", "Khách hàng", "Tuyến", "Thanh toán", "Trạng thái"],
    focus: [
      { label: "Giữ chỗ", value: "18", tone: "bg-blue-50 text-blue-700" },
      { label: "Chờ thanh toán", value: "7", tone: "bg-amber-50 text-amber-700" },
      { label: "Hoàn vé", value: "3", tone: "bg-red-50 text-red-700" }
    ],
    icon: Ticket,
    metrics: [
      { icon: Ticket, label: "Vé hôm nay", value: "312" },
      { icon: CreditCard, label: "Online", value: "72%" },
      { icon: CheckCircle2, label: "Xác nhận", value: "96%" }
    ],
    rows: bookings,
    title: "Giao dịch gần đây"
  },
  customers: {
    action: "Thêm khách",
    columns: ["Mã KH", "Họ tên", "Tần suất", "Chi tiêu", "Nhóm"],
    focus: [
      { label: "VIP", value: "128", tone: "bg-violet-50 text-violet-700" },
      { label: "Thân thiết", value: "482", tone: "bg-emerald-50 text-emerald-700" },
      { label: "Mới", value: "86", tone: "bg-blue-50 text-blue-700" }
    ],
    icon: Users,
    metrics: [
      { icon: Users, label: "Tổng khách", value: "8.429" },
      { icon: TrendingUp, label: "Tăng trưởng", value: "+14%" },
      { icon: Star, label: "Điểm hài lòng", value: "4.8" }
    ],
    rows: customers,
    title: "Khách hàng hoạt động"
  },
  drivers: {
    action: "Phân ca",
    columns: ["Mã TX", "Tài xế", "Trạng thái", "Đúng giờ", "Xe"],
    focus: [
      { label: "Đang chạy", value: "21", tone: "bg-emerald-50 text-emerald-700" },
      { label: "Sẵn sàng", value: "34", tone: "bg-blue-50 text-blue-700" },
      { label: "Nghỉ ca", value: "9", tone: "bg-gray-100 text-gray-700" }
    ],
    icon: IdCard,
    metrics: [
      { icon: UserCheck, label: "Tài xế", value: "64" },
      { icon: Clock, label: "Đúng giờ", value: "97%" },
      { icon: ShieldCheck, label: "An toàn", value: "99%" }
    ],
    rows: drivers,
    title: "Ca trực hiện tại"
  },
  vehicles: {
    action: "Thêm xe",
    columns: ["Biển số", "Loại xe", "Trạng thái", "Sức khỏe", "Bảo dưỡng"],
    focus: [
      { label: "Sẵn sàng", value: "42", tone: "bg-emerald-50 text-emerald-700" },
      { label: "Đang chạy", value: "27", tone: "bg-blue-50 text-blue-700" },
      { label: "Bảo dưỡng", value: "4", tone: "bg-amber-50 text-amber-700" }
    ],
    icon: Bus,
    metrics: [
      { icon: Bus, label: "Tổng xe", value: "73" },
      { icon: Activity, label: "Sẵn sàng", value: "91%" },
      { icon: Wrench, label: "Đến lịch", value: "4" }
    ],
    rows: vehicles,
    title: "Đội xe"
  },
  revenue: {
    action: "Xuất báo cáo",
    columns: ["Kênh", "Doanh thu", "Tăng trưởng", "Tỷ trọng"],
    focus: [
      { label: "Hôm nay", value: "32.45M", tone: "bg-emerald-50 text-emerald-700" },
      { label: "Tuần này", value: "178.8M", tone: "bg-blue-50 text-blue-700" },
      { label: "Hoàn vé", value: "2.1M", tone: "bg-amber-50 text-amber-700" }
    ],
    icon: DollarSign,
    metrics: [
      { icon: DollarSign, label: "Doanh thu", value: "178.8M" },
      { icon: TrendingUp, label: "So với tuần trước", value: "+13%" },
      { icon: CreditCard, label: "Online", value: "70%" }
    ],
    rows: revenueChannels,
    title: "Doanh thu theo kênh"
  },
  reviews: {
    action: "Phản hồi",
    columns: ["Mã", "Khách hàng", "Điểm", "Nội dung", "Trạng thái"],
    focus: [
      { label: "5 sao", value: "78%", tone: "bg-emerald-50 text-emerald-700" },
      { label: "Cần xử lý", value: "6", tone: "bg-amber-50 text-amber-700" },
      { label: "Đã phản hồi", value: "92%", tone: "bg-blue-50 text-blue-700" }
    ],
    icon: Star,
    metrics: [
      { icon: Star, label: "Điểm TB", value: "4.8" },
      { icon: MessageSquare, label: "Đánh giá mới", value: "24" },
      { icon: CheckCircle2, label: "Đã phản hồi", value: "92%" }
    ],
    rows: reviews,
    title: "Phản hồi mới"
  },
  notifications: {
    action: "Gửi mới",
    columns: ["Nguồn", "Nội dung", "Thời gian"],
    focus: [
      { label: "Hệ thống", value: "8", tone: "bg-blue-50 text-blue-700" },
      { label: "Điều hành", value: "14", tone: "bg-violet-50 text-violet-700" },
      { label: "Khẩn cấp", value: "2", tone: "bg-red-50 text-red-700" }
    ],
    icon: Bell,
    metrics: [
      { icon: Bell, label: "Thông báo", value: "46" },
      { icon: AlertTriangle, label: "Khẩn cấp", value: "2" },
      { icon: CheckCircle2, label: "Đã xử lý", value: "89%" }
    ],
    rows: notifications,
    title: "Luồng thông báo"
  }
};

function CustomerAdminPage({
  bookings,
  customers: registeredCustomers,
  onCustomerUpdate,
  onRefresh
}: {
  bookings: CustomerBooking[];
  customers: Customer[];
  onCustomerUpdate: (
    customerId: string,
    patch: Partial<Pick<Customer, "points" | "status" | "tier">>
  ) => void;
  onRefresh: () => void;
}) {
  const customersWithStats = registeredCustomers.map((customer) => {
    const customerBookings = bookings.filter((booking) => booking.customerId === customer.id);
    const totalSpent = customerBookings.reduce((sum, booking) => sum + booking.price, 0);

    return { customer, customerBookings, totalSpent };
  });

  return (
    <motion.section
      animate="animate"
      className="space-y-5"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat icon={Users} label="Tài khoản đã đăng ký" value={String(registeredCustomers.length)} />
        <MiniStat icon={Ticket} label="Khách đã đặt vé" value={String(customersWithStats.filter((item) => item.customerBookings.length).length)} />
        <MiniStat icon={CreditCard} label="Tổng chi tiêu" value={formatCurrency(customersWithStats.reduce((sum, item) => sum + item.totalSpent, 0))} />
      </div>

      <Panel
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#073b7a]"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        }
        title="Khách hàng đăng ký từ website"
      >
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                <tr>
                  {["Mã KH", "Họ tên", "Liên hệ", "Trạng thái", "Hạng/Điểm", "Số vé", "Chi tiêu", "Thao tác"].map((column) => (
                    <th className="px-4 py-3" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {customersWithStats.length ? (
                  customersWithStats.map(({ customer, customerBookings, totalSpent }) => (
                    <tr className="transition hover:bg-gray-50" key={customer.id}>
                      <td className="px-4 py-3 font-semibold text-gray-950">{customer.id}</td>
                      <td className="px-4 py-3">{customer.name}</td>
                      <td className="px-4 py-3">
                        <p>{customer.phone}</p>
                        <p className="mt-1 text-xs text-gray-500">{customer.email}</p>
                        <p className="mt-1 text-xs text-gray-500">ĐK {formatDateTime(customer.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "rounded-lg px-2 py-1 text-xs font-semibold",
                          customer.status === "Đã khóa" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                          {customer.status || "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="h-9 rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                          onChange={(event) => onCustomerUpdate(customer.id, { tier: event.target.value as Customer["tier"] })}
                          value={customer.tier || "Thường"}
                        >
                          {["Thường", "Bạc", "Vàng"].map((tier) => (
                            <option key={tier}>{tier}</option>
                          ))}
                        </select>
                        <input
                          className="mt-2 h-9 w-24 rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                          min={0}
                          onChange={(event) => onCustomerUpdate(customer.id, { points: Number(event.target.value) || 0 })}
                          type="number"
                          value={customer.points || 0}
                        />
                      </td>
                      <td className="px-4 py-3">{customerBookings.length}</td>
                      <td className="px-4 py-3 font-semibold text-[#075bbf]">{formatCurrency(totalSpent)}</td>
                      <td className="px-4 py-3">
                        <button
                          className={cn(
                            "rounded-lg px-3 py-2 text-xs font-semibold",
                            customer.status === "Đã khóa"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          )}
                          onClick={() =>
                            onCustomerUpdate(customer.id, {
                              status: customer.status === "Đã khóa" ? "Hoạt động" : "Đã khóa"
                            })
                          }
                          type="button"
                        >
                          {customer.status === "Đã khóa" ? "Mở khóa" : "Khóa"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={8}>
                      Chưa có tài khoản khách hàng mới. Khi khách đăng ký, hồ sơ sẽ xuất hiện tại đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>
    </motion.section>
  );
}

function FeedbackAdminPage({
  feedbacks,
  onRefresh
}: {
  feedbacks: CustomerFeedback[];
  onRefresh: () => void;
}) {
  const averageRating = feedbacks.length
    ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length
    : 0;
  const todayFeedbacks = feedbacks.filter((feedback) => feedback.createdAt.slice(0, 10) === getLocalDateKey());

  return (
    <motion.section
      animate="animate"
      className="space-y-5"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat icon={MessageSquare} label="Phản hồi từ user" value={String(feedbacks.length)} />
        <MiniStat icon={Star} label="Điểm trung bình" value={averageRating ? averageRating.toFixed(1) : "0.0"} />
        <MiniStat icon={Clock} label="Trong hôm nay" value={String(todayFeedbacks.length)} />
      </div>

      <Panel
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#073b7a]"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        }
        title="Phản hồi chuyến xe từ khách hàng"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {feedbacks.length ? (
            feedbacks.map((feedback) => (
              <article className="rounded-lg border border-gray-200 bg-white p-4" key={feedback.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-950">{feedback.route}</h3>
                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-[#075bbf]">
                        {feedback.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {feedback.customerName} · {feedback.customerPhone} · {feedback.bookingId}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {feedback.rating}/5
                  </span>
                </div>
                <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-600">
                  {feedback.message}
                </p>
                <p className="mt-3 text-xs font-medium text-gray-500">{formatDateTime(feedback.createdAt)}</p>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center xl:col-span-2">
              <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-600">
                Chưa có phản hồi từ khách. User gửi tại mục Phản hồi chuyến thì admin sẽ thấy ngay ở đây.
              </p>
            </div>
          )}
        </div>
      </Panel>
    </motion.section>
  );
}

function RevenueAdminPage({
  bookings,
  coupons,
  onCouponSaved,
  payments
}: {
  bookings: CustomerBooking[];
  coupons: Coupon[];
  onCouponSaved: () => void;
  payments: PaymentTransaction[];
}) {
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discount: "20.000đ",
    title: ""
  });
  const todayKey = getLocalDateKey();
  const todayPayments = payments.filter((payment) => payment.balanceDate === todayKey);
  const todayBalance = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const qrRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const bookingRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0);
  const pendingAmount = bookings
    .filter((booking) => booking.paymentStatus !== "Đã ghi nhận demo")
    .reduce((sum, booking) => sum + booking.price, 0);
  const chartDays = getLastSevenDateKeys();
  const chartData = chartDays.map((day) => ({
    label: formatRevenueDayLabel(day),
    value: payments
      .filter((payment) => payment.balanceDate === day)
      .reduce((sum, payment) => sum + payment.amount, 0)
  }));
  const chartMax = Math.max(...chartData.map((day) => day.value), 1);

  return (
    <motion.section
      animate="animate"
      className="space-y-5"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat icon={DollarSign} label="Số dư hôm nay" value={formatCurrency(todayBalance)} />
        <MiniStat icon={QrCode} label="QR demo hôm nay" value={String(todayPayments.length)} />
        <MiniStat icon={CreditCard} label="Doanh thu QR demo" value={formatCurrency(qrRevenue)} />
        <MiniStat icon={Ticket} label="Doanh thu đặt vé" value={formatCurrency(bookingRevenue)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Số dư QR demo 7 ngày">
          <div className="flex h-[300px] items-end gap-3 rounded-3xl bg-[#f8fbff] p-4 ring-1 ring-[#e6eef8]">
            {chartData.map((day) => (
              <div className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2" key={day.label}>
                <div className="flex h-[220px] w-full items-end">
                  <div
                    className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#0a67d8,#073b7a)] shadow-[0_8px_20px_rgba(10,103,216,0.22)]"
                    style={{ height: `${Math.max((day.value / chartMax) * 100, day.value ? 10 : 2)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500">{day.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Tổng quan thanh toán">
          <div className="space-y-3">
            {[
              ["Số dư trong ngày", formatCurrency(todayBalance), "bg-emerald-50 text-emerald-700"],
              ["Đã ghi nhận QR", `${payments.length} giao dịch`, "bg-blue-50 text-blue-700"],
              ["Chờ đối soát", formatCurrency(pendingAmount), "bg-amber-50 text-amber-700"],
              ["Kênh demo", "QR demo Thành Trung", "bg-violet-50 text-violet-700"]
            ].map(([label, value, tone]) => (
              <div className="flex items-center justify-between rounded-2xl border border-[#e6eef8] p-3" key={label}>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className={cn("rounded-full px-3 py-1 text-sm font-bold", tone)}>{value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Giao dịch QR demo gửi về admin">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                <tr>
                  {["Mã giao dịch", "Mã vé", "Khách hàng", "Tuyến", "Số tiền", "Ngày số dư", "Trạng thái"].map((column) => (
                    <th className="px-4 py-3" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.length ? (
                  payments.map((payment) => (
                    <tr className="transition hover:bg-gray-50" key={payment.id}>
                      <td className="px-4 py-3 font-semibold text-gray-950">{payment.reference}</td>
                      <td className="px-4 py-3">{payment.bookingId}</td>
                      <td className="px-4 py-3">{payment.customerName}</td>
                      <td className="px-4 py-3">{payment.route}</td>
                      <td className="px-4 py-3 font-semibold text-[#075bbf]">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3">{formatShortDate(payment.balanceDate)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={7}>
                      Chưa có giao dịch QR demo. Khách chọn phương thức QR demo khi đặt vé thì giao dịch sẽ xuất hiện tại đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <Panel title="Tạo mã giảm giá">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const code = couponForm.code.trim().toUpperCase();
              if (!code) {
                return;
              }
              upsertCoupon({
                active: true,
                code,
                description: couponForm.description.trim() || "Ưu đãi do admin tạo.",
                discount: couponForm.discount.trim() || "Ưu đãi",
                title: couponForm.title.trim() || `Mã ${code}`
              });
              setCouponForm({ code: "", description: "", discount: "20.000đ", title: "" });
              onCouponSaved();
            }}
          >
            <input
              className="h-11 rounded-2xl border-gray-300 text-sm uppercase focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="Mã coupon"
              value={couponForm.code}
            />
            <input
              className="h-11 rounded-2xl border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => setCouponForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Tên ưu đãi"
              value={couponForm.title}
            />
            <input
              className="h-11 rounded-2xl border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => setCouponForm((current) => ({ ...current, discount: event.target.value }))}
              placeholder="Mức giảm"
              value={couponForm.discount}
            />
            <textarea
              className="min-h-24 rounded-2xl border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) => setCouponForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Điều kiện áp dụng"
              value={couponForm.description}
            />
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#073b7a] px-4 text-sm font-black text-white hover:bg-[#075bbf]" type="submit">
              <Plus className="h-4 w-4" />
              Lưu coupon
            </button>
          </form>
        </Panel>

        <Panel title="Coupon đang hiển thị sang user">
          <div className="grid gap-3 md:grid-cols-2">
            {coupons.length ? coupons.map((coupon) => (
              <article className="rounded-2xl border border-[#e6eef8] p-4" key={coupon.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-950">{coupon.title}</p>
                    <p className="mt-1 text-xs font-semibold text-[#075bbf]">{coupon.code} · {coupon.discount}</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    coupon.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {coupon.active ? "Đang bật" : "Đã tắt"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">{coupon.description}</p>
                <button
                  className="mt-3 rounded-2xl border border-[#dbe7f3] px-3 py-2 text-xs font-bold text-gray-600 hover:bg-[#f8fbff]"
                  onClick={() => {
                    upsertCoupon({ ...coupon, active: !coupon.active });
                    onCouponSaved();
                  }}
                  type="button"
                >
                  {coupon.active ? "Tắt mã" : "Bật mã"}
                </button>
              </article>
            )) : (
              <div className="rounded-3xl border border-dashed border-[#bad7f5] bg-[#f8fbff] p-8 text-center md:col-span-2">
                <Gift className="mx-auto h-8 w-8 text-[#075bbf]" />
                <p className="mt-3 text-sm font-semibold text-gray-600">
                  Chưa có coupon. Tạo mã ở form bên trái để hiển thị sang trang user.
                </p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </motion.section>
  );
}

function BookingAdminPage({
  bookings,
  customerNotifications,
  driverNotifications,
  onConfirm,
  onNotifyDriver,
  onOpenReject
}: {
  bookings: CustomerBooking[];
  customerNotifications: CustomerNotification[];
  driverNotifications: DriverNotification[];
  onConfirm: (booking: CustomerBooking) => void;
  onNotifyDriver: (booking: CustomerBooking) => void;
  onOpenReject: (booking: CustomerBooking) => void;
}) {
  const pendingCount = bookings.filter((booking) => booking.status === "Chờ xác nhận").length;
  const confirmedCount = bookings.filter((booking) => booking.status === "Đã xác nhận").length;
  const changeRequestCount = bookings.filter((booking) => booking.status === "Yêu cầu hủy/đổi").length;
  const revenue = bookings.reduce((sum, booking) => sum + booking.price, 0);

  return (
    <motion.section
      animate="animate"
      className="space-y-5"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <div className="grid gap-4 md:grid-cols-5">
        <MiniStat icon={Ticket} label="Đơn từ website" value={String(bookings.length)} />
        <MiniStat icon={Clock} label="Chờ xác nhận" value={String(pendingCount)} />
        <MiniStat icon={CheckCircle2} label="Đã xác nhận" value={String(confirmedCount)} />
        <MiniStat icon={RefreshCw} label="Yêu cầu đổi/hủy" value={String(changeRequestCount)} />
        <MiniStat icon={CreditCard} label="Tổng tiền" value={formatCurrency(revenue)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Xác nhận vé xe">
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-500 focus-within:border-[#075bbf] focus-within:ring-4 focus-within:ring-blue-50">
              <Search className="h-4 w-4" />
              <input
                className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                placeholder="Tìm mã vé, khách hàng, tuyến..."
              />
            </label>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              type="button"
            >
              <Filter className="h-4 w-4" />
              Lọc trạng thái
            </button>
          </div>

          {bookings.length ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <article className="rounded-lg border border-gray-200 bg-white p-4" key={booking.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-950">{booking.route}</h3>
                        <span className={cn("rounded-lg px-2 py-1 text-xs font-semibold", bookingStatusTone(booking.status))}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {booking.id} · {booking.customerName} · {booking.customerPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-[#075bbf]">{formatCurrency(booking.price)}</p>
                      <p className="mt-1 text-xs font-medium text-gray-500">{booking.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <BookingInfoBlock
                      icon={Clock}
                      label="Ngày đi"
                      value={`${formatShortDate(booking.travelDate)} · ${booking.seats} ghế`}
                    />
                    <BookingInfoBlock
                      icon={Ticket}
                      label="Ghế"
                      value={booking.seatCodes?.join(", ") || `${booking.seats} ghế`}
                    />
                    <BookingInfoBlock
                      icon={CreditCard}
                      label="Thanh toán"
                      value={`${booking.paymentMethod} · ${booking.paymentStatus || "Chờ thanh toán"}`}
                    />
                    <BookingInfoBlock
                      icon={QrCode}
                      label="Mã QR demo"
                      value={booking.paymentReference || "Chưa ghi nhận QR"}
                    />
                    <BookingInfoBlock
                      icon={MapPin}
                      label="Điểm đón"
                      value={booking.pickupPoint || booking.from}
                    />
                    <BookingInfoBlock
                      icon={Route}
                      label="Điểm trả"
                      value={booking.dropoffPoint || booking.to}
                    />
                    <BookingInfoBlock
                      icon={UserRound}
                      label="Liên hệ"
                      value={booking.customerEmail}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                      disabled={booking.status === "Đã xác nhận" || booking.status === "Từ chối"}
                      onClick={() => onConfirm(booking)}
                      type="button"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Xác nhận vé
                    </button>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                      disabled={booking.status === "Đã xác nhận" || booking.status === "Từ chối"}
                      onClick={() => onOpenReject(booking)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </button>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white transition hover:bg-[#073b7a]"
                      onClick={() => onNotifyDriver(booking)}
                      type="button"
                    >
                      <Send className="h-4 w-4" />
                      Gửi tài xế
                    </button>
                  </div>

                  {booking.rejectionReason ? (
                    <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-700">
                      <span className="font-semibold">Lý do từ chối gửi khách: </span>
                      {booking.rejectionReason}
                    </div>
                  ) : null}
                  {booking.changeRequestReason ? (
                    <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm leading-6 text-amber-700">
                      <span className="font-semibold">Yêu cầu đổi/hủy từ khách: </span>
                      {booking.changeRequestReason}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <Ticket className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-600">
                Chưa có đơn đặt vé từ website. Khi khách chọn ghế và xác nhận, đơn sẽ xuất hiện tại đây.
              </p>
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Thông báo tài xế">
            <div className="space-y-3">
              {driverNotifications.length ? (
                driverNotifications.slice(0, 6).map((item) => (
                  <div className="rounded-lg border border-gray-200 p-3" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-950">{item.driverName}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.route} · {item.vehicle}</p>
                      </div>
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                  Chưa có thông báo nào. Bấm `Gửi tài xế` trên đơn vé để tạo thông báo điều hành.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Thông báo khách hàng">
            <div className="space-y-3">
              {customerNotifications.length ? (
                customerNotifications.slice(0, 5).map((item) => (
                  <div className="rounded-lg border border-gray-200 p-3" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-950">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.bookingId}</p>
                      </div>
                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-[#075bbf]">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                  Khi admin xác nhận hoặc từ chối, thông báo gửi khách sẽ xuất hiện tại đây.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Tiện ích vận hành">
            <div className="grid gap-3">
              {[
                {
                  icon: MapPin,
                  label: "Bảng đón/trả",
                  text: "Kiểm tra nhanh điểm đón, điểm trả và ghi chú khách trước khi gửi tài xế."
                },
                {
                  icon: CreditCard,
                  label: "Đối soát thanh toán",
                  text: "So khớp mã vé với chuyển khoản, ví điện tử hoặc thanh toán sau."
                },
                {
                  icon: UserCheck,
                  label: "Điều phối tài xế",
                  text: "Gửi thông tin khách, ghế, tuyến và giờ đi vào luồng thông báo tài xế."
                },
                {
                  icon: AlertTriangle,
                  label: "Lý do từ chối",
                  text: "Khi từ chối, bắt buộc ghi lý do để khách nhận được thông báo rõ ràng."
                }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div className="flex gap-3 rounded-lg border border-gray-200 p-3" key={item.label}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#075bbf]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-950">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Quy trình xử lý">
            <div className="space-y-3">
              {[
                ["1", "Kiểm tra ghế, điểm đón/trả và thanh toán."],
                ["2", "Xác nhận vé để khách thấy trạng thái mới."],
                ["3", "Gửi tài xế thông tin khách, ghế và điểm đón."],
                ["4", "Theo dõi phản hồi và cập nhật nếu đổi chuyến."]
              ].map(([step, text]) => (
                <div className="flex gap-3 rounded-lg border border-gray-200 p-3" key={step}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-semibold text-[#075bbf]">
                    {step}
                  </span>
                  <p className="text-sm leading-6 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </motion.section>
  );
}

function BookingInfoBlock({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#075bbf]" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function bookingStatusTone(status: CustomerBooking["status"]) {
  if (status === "Đã xác nhận") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Từ chối") {
    return "bg-red-50 text-red-700";
  }

  if (status === "Yêu cầu hủy/đổi") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "Đã hủy") {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

function RejectBookingModal({
  booking,
  onClose,
  onConfirm,
  onReasonChange,
  reason
}: {
  booking: CustomerBooking | null;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (reason: string) => void;
  reason: string;
}) {
  return (
    <AnimatePresence>
      {booking ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 grid place-items-center bg-gray-950/50 px-4"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
            exit={{ opacity: 0, y: 16 }}
            initial={{ opacity: 0, y: 16 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-600">Từ chối đơn đặt vé</p>
                <h3 className="mt-1 text-xl font-semibold text-gray-950">{booking.id}</h3>
                <p className="mt-1 text-sm text-gray-500">{booking.route} · {booking.customerName}</p>
              </div>
              <button
                aria-label="Đóng"
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Lý do gửi cho khách hàng
              </span>
              <textarea
                className="min-h-32 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="VD: Chuyến xe đã hết ghế trống do thay đổi xe vận hành. Nhà xe sẽ hỗ trợ chọn chuyến gần nhất."
                value={reason}
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={onClose}
                type="button"
              >
                Hủy
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                onClick={onConfirm}
                type="button"
              >
                <Send className="h-4 w-4" />
                Từ chối và gửi khách
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function WorkspacePage({
  bookingRows,
  pageKey
}: {
  bookingRows: string[][];
  pageKey: Exclude<PageKey, "overview" | "trips" | "settings">;
}) {
  const config = workspaceConfigs[pageKey];
  const Icon = config.icon;
  const tableRows = pageKey === "booking" ? bookingRows : config.rows;

  return (
    <motion.section
      animate="animate"
      className="space-y-5"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {config.metrics.map((metric) => (
          <MiniStat key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          action={
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#073b7a]"
              type="button"
            >
              <Plus className="h-4 w-4" />
              {config.action}
            </button>
          }
          title={config.title}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-500 focus-within:border-[#075bbf] focus-within:ring-4 focus-within:ring-blue-50">
              <Search className="h-4 w-4" />
              <input
                className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                placeholder="Tìm trong danh sách..."
              />
            </label>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              type="button"
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column} className="px-4 py-3">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {tableRows.map((row) => (
                    <tr key={row.join("-")} className="transition hover:bg-gray-50">
                      {row.map((cell, index) => (
                        <td
                          key={`${cell}-${index}`}
                          className={cn("px-4 py-3", index === 0 && "font-semibold text-gray-950")}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>

        <Panel title="Trạng thái nhanh">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-lg bg-blue-50 text-[#075bbf]">
            <Icon className="h-7 w-7" />
          </div>
          <div className="space-y-3">
            {config.focus.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className={cn("rounded-lg px-2 py-1 text-sm font-semibold", item.tone)}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {pageKey === "notifications" ? <NotificationComposer /> : null}
    </motion.section>
  );
}

function NotificationComposer() {
  const [targetCustomerId, setTargetCustomerId] = useState("all");
  const [title, setTitle] = useState("Thông báo từ Thành Trung");
  const [message, setMessage] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const customerOptions = listCustomers();

  return (
    <Panel title="Soạn thông báo">
      <form
        className="grid gap-3 lg:grid-cols-[220px_240px_minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmedMessage = message.trim();
          if (!trimmedMessage) {
            return;
          }
          const targets =
            targetCustomerId === "all"
              ? customerOptions
              : customerOptions.filter((customer) => customer.id === targetCustomerId);

          targets.forEach((customer) => {
            addCustomerNotification({
              bookingId: "SYSTEM",
              customerId: customer.id,
              message: trimmedMessage,
              title: title.trim() || "Thông báo từ Thành Trung"
            });
          });
          setSentMessage(`Đã gửi ${targets.length} thông báo tới khách hàng.`);
          setMessage("");
        }}
      >
        <select
          className="h-10 rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
          onChange={(event) => setTargetCustomerId(event.target.value)}
          value={targetCustomerId}
        >
          <option value="all">Tất cả khách hàng</option>
          {customerOptions.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        <input
          className="h-10 rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Tiêu đề"
          value={title}
        />
        <input
          className="h-10 rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Nội dung thông báo xuống user..."
          value={message}
        />
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white hover:bg-[#073b7a]"
          type="submit"
        >
          <Send className="h-4 w-4" />
          Gửi
        </button>
      </form>
      {sentMessage ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{sentMessage}</p> : null}
    </Panel>
  );
}

function apiTripToDashboardTrip(trip: ApiTrip): Trip {
  return {
    code: trip.code,
    driver: trip.driver,
    id: trip.id,
    platform: trip.platform,
    price: trip.price,
    route: trip.route,
    sold: trip.sold,
    status: normalizeTripStatus(trip.status),
    time: trip.time,
    total: trip.total,
    vehicle: trip.vehicle
  };
}

function normalizeTripStatus(status: string): TripStatus {
  if (statusOptions.includes(status as TripStatus)) {
    return status as TripStatus;
  }

  const normalized = status.trim().toUpperCase();

  if (normalized === "RUNNING" || normalized === "IN_PROGRESS") {
    return "Đang chạy";
  }

  if (normalized === "COMPLETED" || normalized === "DONE") {
    return "Hoàn thành";
  }

  if (normalized === "CANCELLED" || normalized === "CANCELED") {
    return "Đã hủy";
  }

  return "Sắp chạy";
}

function apiBookingToCustomerBooking(booking: ApiBooking): CustomerBooking {
  return {
    createdAt: booking.createdAt,
    customerEmail: booking.customerEmail,
    customerId: booking.customerId,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    dropoffPoint: booking.dropoffPoint,
    from: booking.from,
    id: booking.code,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus === "Chờ thanh toán" ? "Chờ thanh toán" : "Đã ghi nhận demo",
    pickupPoint: booking.pickupPoint,
    price: booking.price,
    route: booking.route,
    seatCodes: booking.seatCodes,
    seats: booking.seats,
    status: apiBookingStatusToUi(booking.status),
    to: booking.to,
    travelDate: booking.travelDate
  };
}

function apiBookingStatusToUi(status: ApiBooking["status"]): CustomerBooking["status"] {
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return "Đã xác nhận";
  }

  if (status === "REJECTED") {
    return "Từ chối";
  }

  if (status === "CANCELLED") {
    return "Đã hủy";
  }

  if (status === "CHANGE_REQUESTED") {
    return "Yêu cầu hủy/đổi";
  }

  return "Chờ xác nhận";
}

function makeAdminBookingRows(customerBookings: CustomerBooking[]) {
  const rowsFromCustomers = customerBookings.map((booking) => [
    booking.id,
    booking.customerName,
    booking.route,
    booking.paymentMethod,
    booking.status
  ]);

  return [...rowsFromCustomers, ...bookings];
}

function SettingsPage() {
  const [searchConfig, setSearchConfig] = useState<SearchConfig>(() => listSearchConfig());
  const [configSaved, setConfigSaved] = useState("");
  const locationsText = searchConfig.locations.join(", ");
  const pickupPointsText = searchConfig.pickupPoints.join(", ");

  function saveUserSearchConfig() {
    const saved = saveSearchConfig(searchConfig);
    setSearchConfig(saved);
    setConfigSaved("Đã lưu địa điểm tìm kiếm cho trang user.");
  }

  return (
    <motion.section
      animate="animate"
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
      exit="exit"
      initial="initial"
      transition={{ duration: 0.22, ease: "easeOut" }}
      variants={pageMotion}
    >
      <Panel
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white hover:bg-[#073b7a]"
            type="button"
          >
            <Save className="h-4 w-4" />
            Lưu cấu hình
          </button>
        }
        title="Hồ sơ doanh nghiệp"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Tên doanh nghiệp">
            <input
              className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              defaultValue="Công ty vận tải Thành Trung"
            />
          </FormField>
          <FormField label="Hotline">
            <input
              className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              defaultValue="1900 2026"
            />
          </FormField>
          <FormField label="Email vận hành">
            <input
              className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              defaultValue="ops@thanhtrung.vn"
            />
          </FormField>
          <FormField label="Chi nhánh mặc định">
            <select className="h-10 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]">
              <option>Vinh</option>
              <option>Hoàng Mai</option>
              <option>Diễn Châu</option>
            </select>
          </FormField>
        </div>
      </Panel>

      <Panel
        action={
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#075bbf] px-4 text-sm font-semibold text-white hover:bg-[#073b7a]"
            onClick={saveUserSearchConfig}
            type="button"
          >
            <Save className="h-4 w-4" />
            Lưu điểm tìm kiếm
          </button>
        }
        title="Cấu hình điểm đi/điểm đến cho user"
      >
        <div className="grid gap-4">
          <FormField label="Địa điểm hiển thị trong ô tìm kiếm">
            <textarea
              className="min-h-24 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) =>
                setSearchConfig((current) => ({
                  ...current,
                  locations: event.target.value.split(",").map((item) => item.trim())
                }))
              }
              value={locationsText}
            />
          </FormField>
          <FormField label="Điểm đón gợi ý">
            <textarea
              className="min-h-24 w-full rounded-lg border-gray-300 text-sm focus:border-[#075bbf] focus:ring-[#075bbf]"
              onChange={(event) =>
                setSearchConfig((current) => ({
                  ...current,
                  pickupPoints: event.target.value.split(",").map((item) => item.trim())
                }))
              }
              value={pickupPointsText}
            />
          </FormField>
          {configSaved ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{configSaved}</p> : null}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel title="Quyền thao tác">
          <div className="space-y-3">
            {[
              ["Admin", "Toàn quyền hệ thống"],
              ["Điều hành", "Quản lý chuyến và tài xế"],
              ["CSKH", "Đặt vé và phản hồi khách"]
            ].map(([role, text]) => (
              <div key={role} className="flex gap-3 rounded-lg border border-gray-200 p-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-950">{role}</p>
                  <p className="mt-1 text-sm text-gray-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Khu vực khai thác">
          <div className="space-y-3">
            {["Vinh", "Hoàng Mai", "Diễn Châu", "Quỳnh Lưu"].map((location) => (
              <div key={location} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <MapPin className="h-4 w-4 text-[#075bbf]" />
                <span className="text-sm font-medium text-gray-700">{location}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </motion.section>
  );
}

function Panel({
  action,
  children,
  title
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#e6eef8] bg-white shadow-[0_14px_44px_rgba(16,24,40,0.06)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] bg-[#fbfdff] px-5 py-4">
        <h2 className="text-base font-black text-gray-950">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
