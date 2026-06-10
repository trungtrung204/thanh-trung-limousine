"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Bell,
  Bus,
  CalendarDays,
  Clock3,
  CreditCard,
  Gift,
  Headphones,
  History,
  Loader2,
  Luggage,
  MapPin,
  MessageSquare,
  Navigation,
  QrCode,
  RotateCcw,
  Send,
  ShieldCheck,
  Star,
  Ticket,
  UserRound,
  WalletCards,
  X
} from "lucide-react";
import type { ManualPaymentInfo } from "@/lib/manual-payment";
import type { ApiBooking } from "@/lib/transport-api";

type CustomerSession = {
  email: string;
  id: string;
  name: string;
  phone: string | null;
  role: "USER" | "ADMIN" | "DRIVER";
};

type SectionKey =
  | "my-tickets"
  | "cancel"
  | "notifications"
  | "promotions"
  | "payment"
  | "tracking"
  | "feedback"
  | "luggage"
  | "history"
  | "operators"
  | "support";

type FeedbackItem = {
  bookingId: string;
  createdAt: string;
  customerName: string;
  id: string;
  message: string;
  rating: number;
  route: string;
  status: string;
};

const pageAliases: Record<string, SectionKey> = {
  "doi-huy-ve": "cancel",
  "hanh-ly": "luggage",
  "ho-tro": "support",
  "lich-su-chuyen": "history",
  "ma-giam-gia": "promotions",
  "nha-xe": "operators",
  "phan-hoi": "feedback",
  "thong-bao": "notifications",
  "thanh-toan": "payment",
  "theo-doi-chuyen": "tracking",
  "ve-cua-toi": "my-tickets"
};

const navItems: Array<{ href: string; icon: ReactNode; key: SectionKey; label: string }> = [
  { href: "/user/ve-cua-toi", icon: <Ticket className="h-4 w-4" />, key: "my-tickets", label: "Vé của tôi" },
  { href: "/user/thong-bao", icon: <Bell className="h-4 w-4" />, key: "notifications", label: "Thông báo" },
  { href: "/user/thanh-toan", icon: <WalletCards className="h-4 w-4" />, key: "payment", label: "Thanh toán" },
  { href: "/user/doi-huy-ve", icon: <RotateCcw className="h-4 w-4" />, key: "cancel", label: "Đổi/hủy vé" },
  { href: "/user/lich-su-chuyen", icon: <History className="h-4 w-4" />, key: "history", label: "Lịch sử chuyến" },
  { href: "/user/theo-doi-chuyen", icon: <Navigation className="h-4 w-4" />, key: "tracking", label: "Theo dõi chuyến" },
  { href: "/user/phan-hoi", icon: <Star className="h-4 w-4" />, key: "feedback", label: "Phản hồi" },
  { href: "/user/ma-giam-gia", icon: <Gift className="h-4 w-4" />, key: "promotions", label: "Ưu đãi" },
  { href: "/user/hanh-ly", icon: <Luggage className="h-4 w-4" />, key: "luggage", label: "Hành lý" },
  { href: "/user/nha-xe", icon: <Bus className="h-4 w-4" />, key: "operators", label: "Nhà xe" },
  { href: "/user/ho-tro", icon: <Headphones className="h-4 w-4" />, key: "support", label: "Hỗ trợ" }
];

const sectionMeta: Record<SectionKey, { desc: string; title: string }> = {
  cancel: {
    desc: "Gửi yêu cầu đổi hoặc hủy vé theo chính sách nhà xe.",
    title: "Đổi/hủy vé"
  },
  feedback: {
    desc: "Gửi phản hồi để nhà xe cải thiện chất lượng phục vụ.",
    title: "Phản hồi"
  },
  history: {
    desc: "Xem lại các hành trình và mã vé đã đặt.",
    title: "Lịch sử chuyến"
  },
  luggage: {
    desc: "Thông tin hành lý và hỗ trợ gửi hàng theo chuyến.",
    title: "Hành lý"
  },
  "my-tickets": {
    desc: "Theo dõi trạng thái thanh toán và vé điện tử.",
    title: "Vé của tôi"
  },
  notifications: {
    desc: "Cập nhật thanh toán, hủy vé, phản hồi và hỗ trợ từ nhà xe.",
    title: "Thông báo"
  },
  operators: {
    desc: "Thông tin vận hành của Thành Trung Limousine.",
    title: "Nhà xe"
  },
  payment: {
    desc: "Quản lý các đơn chờ thanh toán và nội dung chuyển khoản.",
    title: "Thanh toán"
  },
  promotions: {
    desc: "Ưu đãi hiện hành cho khách hàng đặt vé trực tuyến.",
    title: "Ưu đãi"
  },
  support: {
    desc: "Gửi yêu cầu hỗ trợ để admin nhà xe tiếp nhận và cập nhật trạng thái.",
    title: "Hỗ trợ"
  },
  tracking: {
    desc: "Thông tin giờ đi, điểm đón và trạng thái chuyến.",
    title: "Theo dõi chuyến"
  }
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency"
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function displayBookingStatus(booking: ApiBooking) {
  if (booking.cancellationStatus === "PENDING") {
    return "Chờ duyệt hủy";
  }

  if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
    return "Đã hủy";
  }

  if (booking.paymentStatus === "Thanh toán thành công" || booking.status === "CONFIRMED") {
    return "Đã thanh toán";
  }

  return "Chờ thanh toán";
}

async function readApiJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  await response.text();

  if (response.status === 401) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (response.status === 403) {
    throw new Error("Yêu cầu đang bị lớp bảo mật chặn. Vui lòng tải lại trang rồi thử lại.");
  }

  throw new Error(fallbackMessage);
}

export default function CustomerPortalPage({ section }: { section: string }) {
  const router = useRouter();
  const pageKey = (section in sectionMeta ? section : pageAliases[section] || "my-tickets") as SectionKey;
  const meta = sectionMeta[pageKey];
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [paymentByBooking, setPaymentByBooking] = useState<Record<string, ManualPaymentInfo>>({});
  const [cancelTarget, setCancelTarget] = useState<ApiBooking | null>(null);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);
  const [paymentLoadingId, setPaymentLoadingId] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const paidBookings = useMemo(
    () => bookings.filter((booking) => displayBookingStatus(booking) === "Đã thanh toán"),
    [bookings]
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => displayBookingStatus(booking) === "Chờ thanh toán"),
    [bookings]
  );

  useEffect(() => {
    void refreshPortal();
  }, []);

  useEffect(() => {
    if (!customer) {
      return;
    }

    async function keepSessionAlive() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          setCustomer(null);
        }
      } catch {
        // Keep the current screen during temporary network issues.
      }
    }

    const timer = window.setInterval(() => {
      void keepSessionAlive();
    }, 15 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [customer]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function refreshPortal() {
    setLoading(true);
    try {
      const currentUserResponse = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (currentUserResponse.ok) {
        const data = await readApiJson<{ user?: CustomerSession | null }>(
          currentUserResponse,
          "Không thể kiểm tra phiên đăng nhập."
        );
        setCustomer(data.user?.role === "USER" ? data.user : null);
      } else {
        setCustomer(null);
      }

      const bookingsResponse = await fetch("/api/user/bookings", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (bookingsResponse.ok) {
        const data = await readApiJson<{ bookings?: ApiBooking[] }>(
          bookingsResponse,
          "Không thể tải danh sách vé."
        );
        setBookings(data.bookings || []);
      } else {
        setBookings([]);
      }

      const feedbackResponse = await fetch("/api/feedbacks", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (feedbackResponse.ok) {
        const data = await readApiJson<{ feedbacks?: FeedbackItem[] }>(
          feedbackResponse,
          "Không thể tải phản hồi."
        );
        setFeedbacks(data.feedbacks || []);
      }
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLogoutSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCustomer(null);
      setBookings([]);
      router.push("/");
    } finally {
      setLogoutSubmitting(false);
    }
  }

  async function submitCancelRequest(input: { note: string; phone: string; reason: string }) {
    if (!cancelTarget) {
      return;
    }

    try {
      const response = await fetch(`/api/user/bookings/${cancelTarget.id}/cancel-request`, {
        body: JSON.stringify(input),
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await readApiJson<{ error?: string }>(response, "Không thể gửi yêu cầu hủy vé.");

      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu hủy vé.");
      }

      setCancelTarget(null);
      setToast("Đã gửi yêu cầu hủy vé. Nhà xe sẽ xử lý trong mục quản trị.");
      await refreshPortal();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể gửi yêu cầu hủy vé.");
    }
  }

  async function loadPayment(booking: ApiBooking) {
    setPaymentLoadingId(booking.id);
    try {
      const response = await fetch(`/api/payments/${booking.code}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      const data = await readApiJson<{ error?: string; payment?: ManualPaymentInfo }>(
        response,
        "Không thể tải thông tin thanh toán."
      );
      if (!response.ok || !data.payment) {
        throw new Error(data.error || "Không thể tải thông tin thanh toán.");
      }

      setPaymentByBooking((current) => ({ ...current, [booking.id]: data.payment as ManualPaymentInfo }));
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể tải thông tin thanh toán.");
    } finally {
      setPaymentLoadingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#eef7ff] text-[#101828]">
      <header className="border-b border-[#0f66d7] bg-[#1677e8] text-white shadow-[0_8px_30px_rgba(14,91,180,0.20)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-white shadow-sm ring-2 ring-white/30">
              <Image alt="Logo Thành Trung Limousine" className="object-cover" fill sizes="40px" src="/logoicon.png" />
            </span>
            <span>
              <span className="block text-base font-black text-white">Thành Trung Limousine</span>
              <span className="block text-xs font-semibold text-[#dff2ff]">Cổng khách hàng</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {customer ? (
              <>
                <span className="hidden text-sm font-black text-white sm:inline">{customer.name}</span>
                <button
                  className="rounded-md border border-white/35 px-3 py-2 text-sm font-bold text-white hover:bg-white/10"
                  disabled={logoutSubmitting}
                  onClick={handleLogout}
                  type="button"
                >
                  {logoutSubmitting ? "Đang thoát..." : "Đăng xuất"}
                </button>
              </>
            ) : (
              <Link className="rounded-md bg-[#ffd43b] px-4 py-2 text-sm font-black text-[#082a48]" href="/login">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#cfe7ff] bg-white p-3 shadow-[0_12px_30px_rgba(22,119,232,0.08)] lg:sticky lg:top-20 lg:self-start">
          <Link className="mb-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black text-[#1677e8]" href="/">
            <ArrowLeft className="h-4 w-4" />
            Đặt vé mới
          </Link>
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                className={[
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold",
                  item.key === pageKey ? "bg-[#1677e8] text-white" : "text-[#344054] hover:bg-[#eef7ff]"
                ].join(" ")}
                href={item.href}
                key={item.key}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 overflow-hidden rounded-2xl border border-[#cfe7ff] bg-white shadow-[0_12px_30px_rgba(22,119,232,0.08)]">
            <div className="h-1.5 bg-[linear-gradient(90deg,#1677e8,#22c7ff,#ffd43b,#ff8a00)]" />
            <div className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#1677e8]">Tài khoản khách hàng</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">{meta.title}</h1>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{meta.desc}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Tổng vé" value={String(bookings.length)} />
                <MiniStat label="Đã thanh toán" value={String(paidBookings.length)} />
                <MiniStat label="Chờ thanh toán" value={String(pendingBookings.length)} />
              </div>
            </div>
            </div>
          </div>

          {loading ? (
            <EmptyPanel text="Đang tải dữ liệu..." />
          ) : !customer ? (
            <LoginRequired />
          ) : (
            <PortalContent
              bookings={bookings}
              feedbacks={feedbacks}
              onCancelRequest={setCancelTarget}
              onLoadPayment={loadPayment}
              onRefresh={refreshPortal}
              pageKey={pageKey}
              paymentLoadingId={paymentLoadingId}
              paymentByBooking={paymentByBooking}
              setToast={setToast}
            />
          )}
        </section>
      </div>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs leading-5 text-[#98a2b3] sm:px-6">
        <p className="border-t border-[#d9e2ef] pt-4">
          Đây chỉ là sản phẩm demo web do sinh viên thực hiện, không có mục đích vi phạm quyền sở hữu trí tuệ gì khác.
        </p>
      </footer>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-[#d0d5dd] bg-white px-4 py-3 text-sm font-bold text-[#344054] shadow-lg">
          {toast}
        </div>
      ) : null}

      {cancelTarget ? (
        <CancelRequestModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSubmit={submitCancelRequest}
        />
      ) : null}
    </main>
  );
}

function PortalContent({
  bookings,
  feedbacks,
  onCancelRequest,
  onLoadPayment,
  onRefresh,
  pageKey,
  paymentLoadingId,
  paymentByBooking,
  setToast
}: {
  bookings: ApiBooking[];
  feedbacks: FeedbackItem[];
  onCancelRequest: (booking: ApiBooking) => void;
  onLoadPayment: (booking: ApiBooking) => void;
  onRefresh: () => Promise<void>;
  pageKey: SectionKey;
  paymentLoadingId: string;
  paymentByBooking: Record<string, ManualPaymentInfo>;
  setToast: (message: string) => void;
}) {
  if (pageKey === "my-tickets") {
    return (
      <TicketList
        bookings={bookings}
        onCancelRequest={onCancelRequest}
        onLoadPayment={onLoadPayment}
        paymentLoadingId={paymentLoadingId}
        paymentByBooking={paymentByBooking}
      />
    );
  }

  if (pageKey === "payment") {
    return (
      <TicketList
        bookings={bookings.filter((booking) => displayBookingStatus(booking) === "Chờ thanh toán")}
        emptyText="Không có đơn chờ thanh toán."
        onCancelRequest={onCancelRequest}
        onLoadPayment={onLoadPayment}
        paymentLoadingId={paymentLoadingId}
        paymentByBooking={paymentByBooking}
      />
    );
  }

  if (pageKey === "history") {
    return (
      <TicketList
        bookings={bookings}
        emptyText="Chưa có lịch sử đặt vé."
        onCancelRequest={onCancelRequest}
        onLoadPayment={onLoadPayment}
        paymentLoadingId={paymentLoadingId}
        paymentByBooking={paymentByBooking}
      />
    );
  }

  if (pageKey === "tracking") {
    return <TrackingSection bookings={bookings} />;
  }

  if (pageKey === "notifications") {
    return <NotificationCenter bookings={bookings} feedbacks={feedbacks} />;
  }

  if (pageKey === "feedback") {
    return <FeedbackSection bookings={bookings} feedbacks={feedbacks} onRefresh={onRefresh} setToast={setToast} />;
  }

  if (pageKey === "cancel") {
    return <CancelSection bookings={bookings} onCancelRequest={onCancelRequest} />;
  }

  if (pageKey === "support") {
    return <SupportSection bookings={bookings} onRefresh={onRefresh} setToast={setToast} />;
  }

  return <UtilitySection pageKey={pageKey} />;
}

function TicketList({
  bookings,
  emptyText = "Bạn chưa có vé nào.",
  onCancelRequest,
  onLoadPayment,
  paymentLoadingId,
  paymentByBooking
}: {
  bookings: ApiBooking[];
  emptyText?: string;
  onCancelRequest: (booking: ApiBooking) => void;
  onLoadPayment: (booking: ApiBooking) => void;
  paymentLoadingId: string;
  paymentByBooking: Record<string, ManualPaymentInfo>;
}) {
  if (!bookings.length) {
    return <EmptyPanel text={emptyText} />;
  }

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <TicketCard
          booking={booking}
          key={booking.id}
          onCancelRequest={() => onCancelRequest(booking)}
          onLoadPayment={() => onLoadPayment(booking)}
          payment={paymentByBooking[booking.id]}
          paymentLoading={paymentLoadingId === booking.id}
        />
      ))}
    </div>
  );
}

function TicketCard({
  booking,
  onCancelRequest,
  onLoadPayment,
  payment,
  paymentLoading
}: {
  booking: ApiBooking;
  onCancelRequest: () => void;
  onLoadPayment: () => void;
  payment?: ManualPaymentInfo;
  paymentLoading: boolean;
}) {
  const status = displayBookingStatus(booking);
  const hasTicket = booking.ticketQrCodes.length > 0;
  const canRequestCancel =
    !["Đã hủy", "Chờ duyệt hủy"].includes(status) &&
    booking.status !== "COMPLETED" &&
    booking.cancellationStatus !== "APPROVED";

  return (
    <article className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <span className="rounded-md bg-[#f8fafc] px-2 py-1 text-xs font-black text-[#475467]">
              {booking.code}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-black text-[#101828]">{booking.route}</h2>
          <div className="mt-4 grid gap-3 text-sm text-[#344054] sm:grid-cols-2">
            <InfoLine icon={<CalendarDays className="h-4 w-4" />} label="Ngày đi" value={formatDate(booking.travelDate)} />
            <InfoLine icon={<Clock3 className="h-4 w-4" />} label="Giờ đi" value={new Date(booking.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} />
            <InfoLine icon={<MapPin className="h-4 w-4" />} label="Điểm đón" value={booking.pickupPoint} />
            <InfoLine icon={<MapPin className="h-4 w-4" />} label="Điểm trả" value={booking.dropoffPoint} />
          </div>
        </div>

        <div className="min-w-[230px] rounded-lg border border-[#eaecf0] bg-[#f8fafc] p-4">
          <p className="text-sm font-bold text-[#667085]">Ghế</p>
          <p className="mt-1 text-lg font-black text-[#064e6f]">{booking.seatCodes.join(", ")}</p>
          <p className="mt-3 text-sm font-bold text-[#667085]">Tổng tiền</p>
          <p className="mt-1 text-xl font-black text-[#c2410c]">{formatCurrency(booking.price)}</p>
          {status === "Chờ thanh toán" ? (
            <button
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#064e6f] px-3 text-sm font-black text-white disabled:bg-[#98a2b3]"
              disabled={paymentLoading}
              onClick={onLoadPayment}
              type="button"
            >
              {paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {paymentLoading ? "Đang tải..." : "Xem thanh toán"}
            </button>
          ) : null}
          {canRequestCancel ? (
            <button
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#fecdd3] bg-white px-3 text-sm font-black text-[#be123c]"
              onClick={onCancelRequest}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Yêu cầu hủy vé
            </button>
          ) : null}
        </div>
      </div>

      {payment ? (
        <div className="mt-5 grid gap-4 rounded-lg border border-[#b8d7ff] bg-[#e8f7fb] p-4 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-lg bg-white p-3">
            <Image
              alt={`Mã QR thanh toán cho đơn ${payment.bookingCode}`}
              className="h-full w-full object-contain"
              height={512}
              src="/qr.jpg"
              width={512}
            />
          </div>
          <div>
            <h3 className="font-black text-[#064e6f]">Thanh toán QR</h3>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <PaymentLine label="Số tiền" value={formatCurrency(payment.amount)} />
              <PaymentLine label="Nội dung chuyển khoản" value={payment.reference} />
              <PaymentLine label="Ngân hàng" value={payment.bankName} />
              <PaymentLine label="Trạng thái" value="Chờ xác nhận thanh toán" />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#0b6ea8]">
              Sau khi nhận được thanh toán, nhà xe sẽ xác nhận vé.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[#eaecf0] bg-[#f8fafc] p-4">
        <div className="mb-4 flex items-center gap-2 font-black text-[#064e6f]">
          <Navigation className="h-5 w-5" />
          Hành trình chuyến xe
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <JourneyStep
            label="Điểm đón"
            meta={formatDate(booking.travelDate)}
            value={booking.pickupPoint || booking.from}
          />
          <JourneyStep
            label="Tuyến"
            meta={`Ghế ${booking.seatCodes.join(", ")}`}
            value={booking.route}
          />
          <JourneyStep
            label="Điểm trả"
            meta={status}
            value={booking.dropoffPoint || booking.to}
          />
        </div>
        <JourneyMap booking={booking} />
      </div>

      {hasTicket ? (
        <div className="mt-5 rounded-lg border border-[#d1fadf] bg-[#ecfdf3] p-4">
          <div className="mb-3 flex items-center gap-2 font-black text-[#027a48]">
            <QrCode className="h-5 w-5" />
            Vé điện tử
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {booking.ticketQrCodes.map((qrCode, index) => (
              <div className="rounded-lg bg-white p-3" key={qrCode}>
                <QRCodeSVG className="h-full w-full" value={qrCode} />
                <p className="mt-2 text-center text-xs font-black text-[#344054]">
                  Ghế {booking.tickets[index]?.seatNo || booking.seatCodes[index] || index + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function JourneyStep({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-black uppercase text-[#667085]">{label}</p>
      <p className="mt-1 font-black text-[#101828]">{value || "Chưa cập nhật"}</p>
      <p className="mt-1 text-xs font-bold text-[#0b6ea8]">{meta}</p>
    </div>
  );
}

function getJourneyOrigin(booking: ApiBooking) {
  return booking.pickupPoint || booking.from || booking.route.split("-")[0]?.trim() || "";
}

function getJourneyDestination(booking: ApiBooking) {
  return booking.dropoffPoint || booking.to || booking.route.split("-")[1]?.trim() || "";
}

function getDirectionsUrl(booking: ApiBooking) {
  const params = new URLSearchParams({
    api: "1",
    destination: getJourneyDestination(booking),
    origin: getJourneyOrigin(booking),
    travelmode: "driving"
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getMapEmbedUrl(booking: ApiBooking) {
  const query = `${getJourneyOrigin(booking)} đến ${getJourneyDestination(booking)}`;
  const params = new URLSearchParams({
    output: "embed",
    q: query
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

function JourneyMap({ booking }: { booking: ApiBooking }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#d9e2ef] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#eaecf0] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#064e6f]">Theo dõi trên bản đồ</p>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            {getJourneyOrigin(booking)} → {getJourneyDestination(booking)}
          </p>
        </div>
        <a
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#064e6f] px-3 text-xs font-black text-white"
          href={getDirectionsUrl(booking)}
          rel="noreferrer"
          target="_blank"
        >
          <Navigation className="h-4 w-4" />
          Mở Google Maps
        </a>
      </div>
      <iframe
        className="h-72 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={getMapEmbedUrl(booking)}
        title={`Bản đồ hành trình ${booking.code}`}
      />
    </div>
  );
}

function TrackingSection({ bookings }: { bookings: ApiBooking[] }) {
  const upcoming = bookings.filter((booking) => displayBookingStatus(booking) !== "Đã hủy").slice(0, 5);

  if (!upcoming.length) {
    return <EmptyPanel text="Chưa có chuyến sắp tới để theo dõi." />;
  }

  return (
    <div className="grid gap-4">
      {upcoming.map((booking) => (
        <article className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm" key={booking.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{booking.route}</h2>
              <p className="mt-1 text-sm font-semibold text-[#667085]">
                {formatDate(booking.travelDate)} · Ghế {booking.seatCodes.join(", ")}
              </p>
            </div>
            <StatusBadge status={displayBookingStatus(booking)} />
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InfoLine icon={<MapPin className="h-4 w-4" />} label="Điểm đón" value={booking.pickupPoint} />
            <InfoLine icon={<MapPin className="h-4 w-4" />} label="Điểm trả" value={booking.dropoffPoint} />
          </div>
          <JourneyMap booking={booking} />
        </article>
      ))}
    </div>
  );
}

type NotificationItem = {
  actionHref: string;
  description: string;
  id: string;
  time: string;
  title: string;
  tone: "blue" | "green" | "orange" | "red";
};

function buildUserNotifications(bookings: ApiBooking[], feedbacks: FeedbackItem[]) {
  const items: NotificationItem[] = [];

  bookings.forEach((booking) => {
    const status = displayBookingStatus(booking);
    if (status === "Đã thanh toán") {
      items.push({
        actionHref: "/user/ve-cua-toi",
        description: `Booking ${booking.code} đã được xác nhận. Vé điện tử sẽ hiển thị trong mục Vé của tôi.`,
        id: `paid-${booking.id}`,
        time: booking.paidAt || booking.createdAt,
        title: "Thanh toán đã xác nhận",
        tone: "green"
      });
    } else if (status === "Chờ thanh toán") {
      items.push({
        actionHref: "/user/thanh-toan",
        description: `Booking ${booking.code} đang chờ thanh toán QR với số tiền ${formatCurrency(booking.price)}.`,
        id: `payment-${booking.id}`,
        time: booking.createdAt,
        title: "Hoàn tất thanh toán",
        tone: "orange"
      });
    }

    if (booking.cancellationStatus === "PENDING") {
      items.push({
        actionHref: "/user/doi-huy-ve",
        description: `Yêu cầu hủy vé ${booking.code} đã gửi và đang chờ admin xử lý.`,
        id: `cancel-pending-${booking.id}`,
        time: booking.createdAt,
        title: "Yêu cầu hủy đang chờ duyệt",
        tone: "orange"
      });
    } else if (booking.cancellationStatus === "APPROVED") {
      items.push({
        actionHref: "/user/doi-huy-ve",
        description: `Admin đã duyệt yêu cầu hủy vé ${booking.code}.`,
        id: `cancel-approved-${booking.id}`,
        time: booking.createdAt,
        title: "Yêu cầu hủy đã được duyệt",
        tone: "green"
      });
    } else if (booking.cancellationStatus === "REJECTED") {
      items.push({
        actionHref: "/user/doi-huy-ve",
        description: `Yêu cầu hủy vé ${booking.code} chưa được chấp nhận. Vui lòng liên hệ hỗ trợ nếu cần thêm thông tin.`,
        id: `cancel-rejected-${booking.id}`,
        time: booking.createdAt,
        title: "Yêu cầu hủy bị từ chối",
        tone: "red"
      });
    }
  });

  feedbacks.forEach((feedback) => {
    items.push({
      actionHref: "/user/phan-hoi",
      description: `${feedback.route} · ${feedback.message}`,
      id: `feedback-${feedback.id}`,
      time: feedback.createdAt,
      title: `Phản hồi/hỗ trợ: ${feedback.status}`,
      tone: feedback.status === "Đã xử lý" ? "green" : feedback.status === "Mới" ? "blue" : "orange"
    });
  });

  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 12);
}

function NotificationCenter({ bookings, feedbacks }: { bookings: ApiBooking[]; feedbacks: FeedbackItem[] }) {
  const notifications = buildUserNotifications(bookings, feedbacks);

  if (!notifications.length) {
    return <EmptyPanel text="Chưa có thông báo mới." />;
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Trung tâm thông báo</h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Các cập nhật tại đây được tạo từ trạng thái thanh toán, yêu cầu hủy và phản hồi mà admin xử lý.
        </p>
      </div>
      {notifications.map((item) => (
        <Link
          className="flex flex-col gap-3 rounded-lg border border-[#e4e7ec] bg-white p-4 shadow-sm transition hover:border-[#b8d7ff] sm:flex-row sm:items-start sm:justify-between"
          href={item.actionHref}
          key={item.id}
        >
          <div className="flex gap-3">
            <span
              className={[
                "mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                item.tone === "green"
                  ? "bg-[#ecfdf3] text-[#027a48]"
                  : item.tone === "red"
                    ? "bg-[#fff1f3] text-[#b42318]"
                    : item.tone === "orange"
                      ? "bg-[#fff7ed] text-[#c2410c]"
                      : "bg-[#e8f7fb] text-[#0b6ea8]"
              ].join(" ")}
            >
              <Bell className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-black text-[#101828]">{item.title}</span>
              <span className="mt-1 block text-sm leading-6 text-[#667085]">{item.description}</span>
            </span>
          </div>
          <span className="text-xs font-bold text-[#0b6ea8]">{formatDate(item.time)}</span>
        </Link>
      ))}
    </section>
  );
}

function SupportSection({
  bookings,
  onRefresh,
  setToast
}: {
  bookings: ApiBooking[];
  onRefresh: () => Promise<void>;
  setToast: (message: string) => void;
}) {
  const [bookingCode, setBookingCode] = useState(bookings[0]?.code || "");
  const [topic, setTopic] = useState("Hỗ trợ điểm đón/trả");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBookingCode((current) => current || bookings[0]?.code || "");
  }, [bookings]);

  async function submitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      setToast("Vui lòng nhập nội dung cần hỗ trợ.");
      return;
    }

    const selectedBooking = bookings.find((booking) => booking.code === bookingCode);
    setSubmitting(true);
    try {
      const response = await fetch("/api/feedbacks", {
        body: JSON.stringify({
          bookingId: bookingCode,
          message: `[${topic}] ${message}`,
          rating: 5,
          route: selectedBooking?.route || ""
        }),
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await readApiJson<{ error?: string }>(response, "Không thể gửi yêu cầu hỗ trợ.");
      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu hỗ trợ.");
      }

      setMessage("");
      setToast("Đã gửi yêu cầu hỗ trợ. Admin sẽ tiếp nhận trong mục Phản hồi khách hàng.");
      await onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể gửi yêu cầu hỗ trợ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm" onSubmit={submitSupport}>
        <h2 className="text-xl font-black">Gửi yêu cầu hỗ trợ</h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Yêu cầu sẽ chuyển sang admin để theo dõi và cập nhật trạng thái xử lý.
        </p>
        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Mã vé</span>
            <select
              className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setBookingCode(event.target.value)}
              value={bookingCode}
            >
              <option value="">Không gắn mã vé</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.code}>
                  {booking.code} · {booking.route}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Chủ đề</span>
            <select
              className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setTopic(event.target.value)}
              value={topic}
            >
              <option>Hỗ trợ điểm đón/trả</option>
              <option>Thay đổi thông tin hành khách</option>
              <option>Kiểm tra thanh toán</option>
              <option>Hành lý/gửi hàng</option>
              <option>Hỗ trợ khác</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Nội dung</span>
            <textarea
              className="min-h-36 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Nhập nội dung cần nhà xe hỗ trợ"
              value={message}
            />
          </label>
        </div>
        <button
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-[#064e6f] px-4 text-sm font-black text-white disabled:bg-[#98a2b3]"
          disabled={submitting}
          type="submit"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Đang gửi..." : "Gửi hỗ trợ"}
        </button>
      </form>

      <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Đầu mối tiếp nhận</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <InfoLine icon={<Headphones className="h-4 w-4" />} label="Hotline" value="1900 1000" />
          <InfoLine icon={<MessageSquare className="h-4 w-4" />} label="Admin xử lý" value="Phản hồi khách hàng" />
          <InfoLine icon={<Bell className="h-4 w-4" />} label="Theo dõi" value="Mục Thông báo" />
        </div>
      </section>
    </div>
  );
}

function FeedbackSection({
  bookings,
  feedbacks,
  onRefresh,
  setToast
}: {
  bookings: ApiBooking[];
  feedbacks: FeedbackItem[];
  onRefresh: () => Promise<void>;
  setToast: (message: string) => void;
}) {
  const [bookingId, setBookingId] = useState(bookings[0]?.code || "");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBookingId((current) => current || bookings[0]?.code || "");
  }, [bookings]);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      setToast("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedBooking = bookings.find((booking) => booking.code === bookingId);
      const response = await fetch("/api/feedbacks", {
        body: JSON.stringify({
          bookingId,
          message,
          rating,
          route: selectedBooking?.route || ""
        }),
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await readApiJson<{ error?: string }>(response, "Không thể gửi phản hồi.");
      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi phản hồi.");
      }

      setMessage("");
      setToast("Đã gửi phản hồi.");
      await onRefresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể gửi phản hồi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm" onSubmit={submitFeedback}>
        <h2 className="text-xl font-black">Gửi phản hồi</h2>
        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Mã vé</span>
            <select
              className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setBookingId(event.target.value)}
              value={bookingId}
            >
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.code}>
                  {booking.code} · {booking.route}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Đánh giá</span>
            <select
              className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setRating(Number(event.target.value))}
              value={rating}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} sao
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Nội dung</span>
            <textarea
              className="min-h-32 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Nhập phản hồi của bạn"
              value={message}
            />
          </label>
        </div>
        <button
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-[#064e6f] px-4 text-sm font-black text-white disabled:bg-[#98a2b3]"
          disabled={submitting}
          type="submit"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Đang gửi..." : "Gửi phản hồi"}
        </button>
      </form>

      <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Phản hồi đã gửi</h2>
        <div className="mt-4 grid gap-3">
          {feedbacks.length ? (
            feedbacks.slice(0, 5).map((item) => (
              <div className="rounded-lg bg-[#f8fafc] p-3" key={item.id}>
                <p className="text-sm font-black">{item.route}</p>
                <p className="mt-1 text-sm text-[#667085]">{item.message}</p>
                <p className="mt-2 text-xs font-bold text-[#0b6ea8]">{item.rating} sao · {item.status}</p>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-[#667085]">Chưa có phản hồi.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function CancelSection({
  bookings,
  onCancelRequest
}: {
  bookings: ApiBooking[];
  onCancelRequest: (booking: ApiBooking) => void;
}) {
  const activeBookings = bookings.filter((booking) => {
    const status = displayBookingStatus(booking);
    return status !== "Đã hủy" && status !== "Chờ duyệt hủy" && booking.status !== "COMPLETED";
  });

  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Yêu cầu đổi/hủy vé</h2>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        Vui lòng liên hệ hotline hoặc gửi thông tin mã vé để nhân sự hỗ trợ kiểm tra chính sách đổi/hủy.
      </p>
      <div className="mt-4 grid gap-3">
        {activeBookings.length ? (
          activeBookings.map((booking) => (
            <div className="flex flex-col gap-3 rounded-lg border border-[#eaecf0] p-4 sm:flex-row sm:items-center sm:justify-between" key={booking.id}>
              <div>
                <p className="font-black">{booking.route}</p>
                <p className="mt-1 text-sm font-semibold text-[#667085]">{booking.code} · Ghế {booking.seatCodes.join(", ")}</p>
              </div>
              <button
                className="rounded-md border border-[#d0d5dd] px-3 py-2 text-sm font-bold text-[#344054]"
                onClick={() => onCancelRequest(booking)}
                type="button"
              >
                Yêu cầu hủy vé
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-[#667085]">Không có vé phù hợp để gửi yêu cầu.</p>
        )}
      </div>
    </section>
  );
}

function UtilitySection({ pageKey }: { pageKey: SectionKey }) {
  const content: Record<SectionKey, Array<{ icon: ReactNode; text: string; title: string }>> = {
    cancel: [],
    feedback: [],
    history: [],
    luggage: [
      { icon: <Luggage className="h-5 w-5" />, text: "Hành lý cá nhân được sắp xếp theo khoang xe và điểm trả.", title: "Hành lý đi cùng" },
      { icon: <ShieldCheck className="h-5 w-5" />, text: "Vui lòng báo trước với hotline nếu có kiện hàng lớn.", title: "Kiện hàng lớn" }
    ],
    "my-tickets": [],
    notifications: [],
    operators: [
      { icon: <Bus className="h-5 w-5" />, text: "Thành Trung Limousine vận hành các tuyến liên tỉnh với lịch chạy rõ ràng.", title: "Đội xe" },
      { icon: <UserRound className="h-5 w-5" />, text: "Nhân sự điều hành hỗ trợ kiểm tra vé, điểm đón và thanh toán.", title: "Vận hành" }
    ],
    payment: [],
    promotions: [
      { icon: <Gift className="h-5 w-5" />, text: "Ưu đãi được áp dụng theo từng thời điểm và tuyến xe.", title: "Ưu đãi tuyến" },
      { icon: <Bell className="h-5 w-5" />, text: "Đăng nhập để theo dõi vé và nhận thông báo mới từ nhà xe.", title: "Thông báo" }
    ],
    support: [
      { icon: <Headphones className="h-5 w-5" />, text: "Hotline 1900 1000 hỗ trợ đặt vé, đổi lịch và điểm đón.", title: "Hotline" },
      { icon: <MessageSquare className="h-5 w-5" />, text: "Gửi phản hồi trực tiếp trong cổng khách hàng.", title: "Phản hồi" }
    ],
    tracking: []
  };

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {(content[pageKey] || []).map((item) => (
        <div className="rounded-lg border border-[#e4e7ec] bg-white p-5 shadow-sm" key={item.title}>
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#e8f7fb] text-[#0b6ea8]">
            {item.icon}
          </div>
          <h2 className="font-black">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{item.text}</p>
        </div>
      ))}
    </section>
  );
}

function CancelRequestModal({
  booking,
  onClose,
  onSubmit
}: {
  booking: ApiBooking;
  onClose: () => void;
  onSubmit: (input: { note: string; phone: string; reason: string }) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(booking.customerPhone || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ note, phone, reason });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#101828]/50 px-4 py-6">
      <form
        className="w-full max-w-lg rounded-lg border border-[#e4e7ec] bg-white shadow-[0_24px_80px_rgba(16,24,40,0.24)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#eaecf0] p-5">
          <div>
            <p className="text-sm font-black text-[#0b6ea8]">Yêu cầu hủy vé</p>
            <h2 className="mt-1 text-xl font-black text-[#101828]">{booking.route}</h2>
            <p className="mt-1 text-sm font-semibold text-[#667085]">
              {booking.code} · Ghế {booking.seatCodes.join(", ")} · {formatCurrency(booking.price)}
            </p>
          </div>
          <button className="rounded-md p-2 text-[#667085] hover:bg-[#f2f4f7]" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Lý do hủy vé</span>
            <select
              className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setReason(event.target.value)}
              required
              value={reason}
            >
              <option value="">Chọn lý do</option>
              <option value="Thay đổi lịch trình">Thay đổi lịch trình</option>
              <option value="Đặt nhầm chuyến hoặc ghế">Đặt nhầm chuyến hoặc ghế</option>
              <option value="Không còn nhu cầu di chuyển">Không còn nhu cầu di chuyển</option>
              <option value="Lý do khác">Lý do khác</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Ghi chú thêm</span>
            <textarea
              className="min-h-28 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nhập thêm thông tin để nhà xe hỗ trợ nhanh hơn"
              value={note}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-[#344054]">Số điện thoại liên hệ</span>
            <input
              className="h-11 w-full rounded-md border-[#d0d5dd] text-sm focus:border-[#0b6ea8] focus:ring-[#0b6ea8]"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Số điện thoại"
              value={phone}
            />
          </label>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#eaecf0] p-5 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-md border border-[#d0d5dd] px-4 text-sm font-black text-[#344054]"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
          <button
            className="h-11 rounded-md bg-[#064e6f] px-4 text-sm font-black text-white disabled:bg-[#98a2b3]"
            disabled={!reason.trim() || submitting}
            type="submit"
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LoginRequired() {
  return (
    <section className="rounded-lg border border-[#e4e7ec] bg-white p-8 text-center shadow-sm">
      <ShieldCheck className="mx-auto h-8 w-8 text-[#0b6ea8]" />
      <h2 className="mt-3 text-xl font-black">Vui lòng đăng nhập</h2>
      <p className="mt-2 text-sm text-[#667085]">Đăng nhập để xem vé và trạng thái thanh toán của bạn.</p>
      <Link className="mt-5 inline-flex h-11 items-center rounded-md bg-[#064e6f] px-4 text-sm font-black text-white" href="/login">
        Đăng nhập
      </Link>
    </section>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#b8c4d6] bg-white p-8 text-center text-sm font-bold text-[#667085]">
      {text}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e4e7ec] bg-[#f8fafc] px-3 py-2">
      <p className="text-lg font-black text-[#064e6f]">{value}</p>
      <p className="text-xs font-bold text-[#667085]">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Đã thanh toán"
      ? "bg-[#ecfdf3] text-[#027a48]"
      : status === "Đã hủy"
        ? "bg-[#fff1f3] text-[#b42318]"
        : status === "Chờ duyệt hủy"
          ? "bg-[#fef3c7] text-[#92400e]"
          : "bg-[#fff7ed] text-[#c2410c]";

  return <span className={`rounded-md px-2 py-1 text-xs font-black ${tone}`}>{status}</span>;
}

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="flex items-start gap-2">
      <span className="mt-0.5 text-[#0b6ea8]">{icon}</span>
      <span>
        <b>{label}:</b> {value || "Chưa cập nhật"}
      </span>
    </span>
  );
}

function PaymentLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#667085]">{label}</p>
      <p className="mt-1 break-words font-black text-[#101828]">{value}</p>
    </div>
  );
}
