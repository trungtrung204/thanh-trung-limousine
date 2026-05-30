"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Armchair,
  BadgeCheck,
  Bell,
  Bus,
  CalendarDays,
  Car,
  ChevronRight,
  ClipboardList,
  Clock3,
  CreditCard,
  Gift,
  Headphones,
  History,
  Luggage,
  Mail,
  MapPinned,
  MapPin,
  Menu,
  Navigation,
  PackageCheck,
  Phone,
  QrCode,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Ticket,
  UserRound,
  WalletCards,
  Wifi,
  X
} from "lucide-react";
import {
  createBooking,
  getBookedSeatCodes,
  getCurrentCustomer,
  listBookings,
  listCoupons,
  listRouteInventory,
  listSearchConfig,
  logoutCustomer,
  setPendingBooking,
  type Coupon,
  type CustomerBooking,
  type Customer,
  type RouteInventory
} from "@/lib/local-db";
import {
  landingCopy,
  languageOptions,
  readStoredLanguage,
  saveStoredLanguage,
  type Language
} from "@/lib/i18n";

const heroImage =
  "https://images.pexels.com/photos/19092238/pexels-photo-19092238.jpeg?auto=compress&cs=tinysrgb&w=2200";
const vinhCitadelImage =
  "/landmarks/vinh-citadel.jpg";
const cuaLoBeachImage = "/landmarks/nghe-an-coast.jpg";
const hanoiLakeImage = "/landmarks/hanoi-hoan-kiem.jpg";
const dienThanhBeachImage = "/landmarks/dien-thanh-beach.jpg";
const quynhBeachImage = "/landmarks/quynh-beach.jpg";
const northernStationImage = "/landmarks/northern-station.jpg";

const navItems: Array<{ key: keyof typeof landingCopy.vi.nav; href: string }> = [
  { key: "booking", href: "#dat-xe" },
  { key: "tickets", href: "/user/my-tickets" },
  { key: "offers", href: "/user/promotions" },
  { key: "operators", href: "/user/operators" },
  { key: "support", href: "/user/support" }
];

const locationOptions = ["Vinh", "Hoàng Mai", "Diễn Châu", "Quỳnh Lưu", "Hà Nội", "Sài Gòn", "Đà Lạt"];

const serviceTabs: Array<{ label: string; badge?: string; icon: LucideIcon; active?: boolean }> = [
  { label: "Xe khách", icon: Bus, active: true },
  { label: "Thuê xe", badge: "Mới", icon: Car },
  { label: "Gửi hàng", icon: PackageCheck },
  { label: "Vé của tôi", icon: Ticket }
];

const quickBenefits: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Sơ đồ ghế trực quan", icon: Armchair },
  { label: "Đón trả rõ ràng", icon: MapPinned },
  { label: "Đổi huỷ theo chính sách", icon: RotateCcw },
  { label: "Thanh toán đa dạng", icon: WalletCards }
];

type PopularRoute = {
  route: string;
  price: string;
  priceValue: number;
  image: string;
  landmark: string;
  tag: string;
  operator: string;
  busType: string;
  departure: string;
  arrival: string;
  duration: string;
  pickup: string;
  dropoff: string;
  plate: string;
  seatsTotal: number;
  seatsLeft: number;
  unavailableSeats: string[];
  amenities: string[];
};

const popularRoutes: PopularRoute[] = [
  {
    route: "Vinh - Hoàng Mai",
    price: "Từ 230.000đ",
    priceValue: 230000,
    image: vinhCitadelImage,
    landmark: "Thành cổ Vinh",
    tag: "Limousine 16",
    operator: "Thành Trung Limousine",
    busType: "Limousine 16 chỗ",
    departure: "07:30",
    arrival: "09:10",
    duration: "1 giờ 40 phút",
    pickup: "VP Thành Trung, 12 Lê Lợi, TP Vinh",
    dropoff: "Bến xe Hoàng Mai",
    plate: "37B-024.58",
    seatsTotal: 16,
    seatsLeft: 10,
    unavailableSeats: ["A02", "A05", "A09", "A13", "A15", "A16"],
    amenities: ["Nước uống", "Wifi", "Cổng sạc", "Ghế massage"]
  },
  {
    route: "Vinh - Diễn Châu",
    price: "Từ 150.000đ",
    priceValue: 150000,
    image: dienThanhBeachImage,
    landmark: "Biển Diễn Thành",
    tag: "Ghế ngồi 40",
    operator: "TT Express",
    busType: "Ghế ngồi 40 chỗ",
    departure: "08:15",
    arrival: "09:25",
    duration: "1 giờ 10 phút",
    pickup: "Bến xe Bắc Vinh",
    dropoff: "Ngã ba Diễn Châu",
    plate: "37B-118.06",
    seatsTotal: 40,
    seatsLeft: 24,
    unavailableSeats: [
      "A02",
      "A05",
      "A07",
      "A12",
      "A17",
      "A20",
      "B01",
      "B04",
      "B08",
      "B13",
      "B16",
      "B19"
    ],
    amenities: ["Điều hòa", "Nước uống", "Khoang hành lý"]
  },
  {
    route: "Hoàng Mai - Vinh",
    price: "Từ 250.000đ",
    priceValue: 250000,
    image: cuaLoBeachImage,
    landmark: "Cụm biển Bắc Nghệ An",
    tag: "Giường nằm 45",
    operator: "Hoàng Mai Shuttle",
    busType: "Giường nằm 45 chỗ",
    departure: "10:00",
    arrival: "11:45",
    duration: "1 giờ 45 phút",
    pickup: "Bến xe Hoàng Mai",
    dropoff: "Bến xe Vinh",
    plate: "37B-089.72",
    seatsTotal: 45,
    seatsLeft: 31,
    unavailableSeats: [
      "A01",
      "A04",
      "A08",
      "A11",
      "A16",
      "A21",
      "B02",
      "B06",
      "B09",
      "B14",
      "B18",
      "B22"
    ],
    amenities: ["Chăn mỏng", "Wifi", "Nước uống", "Rèm riêng"]
  },
  {
    route: "Vinh - Quỳnh Lưu",
    price: "Từ 200.000đ",
    priceValue: 200000,
    image: quynhBeachImage,
    landmark: "Biển Quỳnh",
    tag: "Chuyến chiều",
    operator: "TT Express",
    busType: "Limousine 16 chỗ",
    departure: "14:20",
    arrival: "15:50",
    duration: "1 giờ 30 phút",
    pickup: "VP Thành Trung, 12 Lê Lợi, TP Vinh",
    dropoff: "Trung tâm Quỳnh Lưu",
    plate: "37B-056.21",
    seatsTotal: 16,
    seatsLeft: 8,
    unavailableSeats: ["A01", "A03", "A07", "A08", "A12", "A14", "A15", "A16"],
    amenities: ["Wifi", "Cổng sạc", "Nước uống"]
  },
  {
    route: "Vinh - Hà Nội",
    price: "Từ 320.000đ",
    priceValue: 320000,
    image: hanoiLakeImage,
    landmark: "Hồ Hoàn Kiếm",
    tag: "Đêm nay",
    operator: "Vinh Premium Bus",
    busType: "Cabin đôi 22 phòng",
    departure: "21:00",
    arrival: "03:45",
    duration: "6 giờ 45 phút",
    pickup: "Bến xe Vinh",
    dropoff: "Bến xe Nước Ngầm",
    plate: "37F-002.94",
    seatsTotal: 22,
    seatsLeft: 13,
    unavailableSeats: ["A02", "A06", "A09", "A11", "B03", "B07", "B10", "B11", "B12"],
    amenities: ["Cabin riêng", "Wifi", "Màn hình", "Chăn mỏng"]
  },
  {
    route: "Hoàng Mai - Hà Nội",
    price: "Từ 300.000đ",
    priceValue: 300000,
    image: northernStationImage,
    landmark: "Bến xe phía Bắc",
    tag: "Còn ghế",
    operator: "Hoàng Mai Shuttle",
    busType: "Giường nằm 34 chỗ",
    departure: "22:15",
    arrival: "04:40",
    duration: "6 giờ 25 phút",
    pickup: "Bến xe Hoàng Mai",
    dropoff: "Bến xe Giáp Bát",
    plate: "37B-177.90",
    seatsTotal: 34,
    seatsLeft: 18,
    unavailableSeats: ["A01", "A05", "A10", "A13", "A16", "B02", "B04", "B08", "B12", "B15"],
    amenities: ["Giường nằm", "Wifi", "Nước uống", "Khoang hành lý"]
  }
];

const routeFilters = [
  { label: "Tất cả", value: "all" },
  { label: "Limousine", value: "Limousine" },
  { label: "Giường nằm", value: "Giường" },
  { label: "Ghế ngồi", value: "Ghế" },
  { label: "Chuyến đêm", value: "Đêm" }
];

const timeFilters = ["Sáng sớm", "Buổi sáng", "Buổi chiều", "Buổi tối"];
const pickupFilters = ["VP Thành Trung", "Bến xe Vinh", "Bến xe Bắc Vinh", "Bến xe Hoàng Mai"];

const bookingSteps = [
  { label: "Chọn chuyến", icon: Search },
  { label: "Chọn ghế", icon: Armchair },
  { label: "Đón trả", icon: MapPinned },
  { label: "Xác nhận", icon: ReceiptText }
];

const paymentMethods = [
  {
    label: "Thanh toán sau",
    desc: "Giữ chỗ trước, thanh toán với nhà xe khi được xác nhận.",
    icon: WalletCards
  },
  {
    label: "Chuyển khoản",
    desc: "Nhận thông tin chuyển khoản trong mã đặt chỗ sau khi admin xác nhận.",
    icon: CreditCard
  },
  {
    label: "QR demo",
    desc: "Quét mã thử nghiệm, giao dịch được ghi nhận vào số dư admin trong ngày.",
    icon: QrCode
  }
];

const userCategories: Array<{ label: string; desc: string; icon: LucideIcon; href: string }> = [
  {
    label: "Vé của tôi",
    desc: "Xem mã đặt chỗ, ghế, trạng thái xác nhận và thông tin lên xe.",
    href: "/user/my-tickets",
    icon: QrCode
  },
  {
    label: "Đổi / hủy vé",
    desc: "Gửi yêu cầu đổi chuyến, đổi ghế hoặc hủy theo chính sách từng nhà xe.",
    href: "/user/cancel",
    icon: RotateCcw
  },
  {
    label: "Mã giảm giá",
    desc: "Lưu ưu đãi tuyến quen thuộc và áp dụng trước khi xác nhận thanh toán.",
    href: "/user/promotions",
    icon: Gift
  },
  {
    label: "Thanh toán",
    desc: "Theo dõi phương thức thanh toán sau, chuyển khoản hoặc QR demo.",
    href: "/user/payment",
    icon: WalletCards
  },
  {
    label: "Theo dõi chuyến",
    desc: "Xem vị trí xe demo trên bản đồ, tiến độ đón khách và hotline tài xế.",
    href: "/user/tracking",
    icon: Navigation
  },
  {
    label: "Phản hồi chuyến",
    desc: "Gửi đánh giá chất lượng xe, tài xế và trải nghiệm sau chuyến đi.",
    href: "/user/feedback",
    icon: Star
  },
  {
    label: "Hành lý",
    desc: "Ghi chú kiện hành lý, gửi hàng kèm xe và chính sách phụ thu.",
    href: "/user/luggage",
    icon: Luggage
  },
  {
    label: "Lịch sử chuyến",
    desc: "Lưu tuyến đã đi, nhà xe yêu thích và điểm đón thường dùng.",
    href: "/user/history",
    icon: History
  }
];

const offers = [
  {
    title: "Giảm 20K tuyến nội tỉnh Nghệ An",
    desc: "Áp dụng khi đặt từ 2 ghế, chọn điểm đón/trả và hoàn tất xác nhận trước 18:00.",
    code: "NGHEAN20",
    color: "bg-[#fff7d6]"
  },
  {
    title: "Ưu đãi ví điện tử",
    desc: "Giữ chỗ trước, thanh toán qua MoMo, ZaloPay hoặc chuyển khoản khi nhà xe xác nhận.",
    code: "PAYNOW",
    color: "bg-[#e8f3ff]"
  },
  {
    title: "Đặt vé nhóm / công ty",
    desc: "Tạo yêu cầu nhiều ghế, lưu người đi và nhận hỗ trợ điều phối chuyến riêng.",
    code: "GROUP",
    color: "bg-[#ecfdf3]"
  }
];

const operators = [
  ["Thành Trung Limousine", "4.9", "124 chuyến/ngày", "Limousine 16, cabin 22"],
  ["TT Express", "4.8", "78 chuyến/ngày", "Ghế ngồi, gửi hàng"],
  ["Hoàng Mai Shuttle", "4.7", "36 chuyến/ngày", "Giường nằm, trung chuyển"],
  ["Vinh Premium Bus", "4.8", "42 chuyến/ngày", "Tuyến đêm Hà Nội"]
];

const supportItems: Array<{ title: string; desc: string; icon: LucideIcon }> = [
  {
    title: "Hướng dẫn lên xe",
    desc: "Có mặt sớm 30 phút, giữ điện thoại mở và xuất trình mã đặt chỗ khi nhân viên kiểm tra.",
    icon: Navigation
  },
  {
    title: "Chính sách đổi / hủy",
    desc: "Yêu cầu đổi chuyến được ghi nhận trước giờ chạy; phí hủy phụ thuộc chính sách nhà xe.",
    icon: RotateCcw
  },
  {
    title: "Bảo vệ đặt chỗ",
    desc: "Nếu phát sinh lỗi vận hành, bộ phận hỗ trợ sẽ tìm chuyến thay thế hoặc hoàn tiền theo quy định.",
    icon: ShieldCheck
  },
  {
    title: "Hotline hỗ trợ",
    desc: "Gọi 1900 2026 hoặc 0238 888 888 khi cần hỗ trợ điểm đón, thanh toán hoặc đổi vé.",
    icon: Headphones
  }
];

const footerGroups = [
  {
    title: "Tuyến đường",
    links: ["Vinh đi Hoàng Mai", "Vinh đi Diễn Châu", "Hoàng Mai đi Vinh", "Vinh đi Hà Nội"]
  },
  {
    title: "Loại xe",
    links: ["Limousine", "Ghế ngồi", "Giường nằm", "Cabin đôi"]
  },
  {
    title: "Hỗ trợ",
    links: ["Hướng dẫn thanh toán", "Chính sách hoàn vé", "Vé của tôi", "Liên hệ hotline"]
  },
  {
    title: "Người dùng",
    links: ["Mã giảm giá", "Lịch sử chuyến", "Điểm đón thường dùng", "Đặt vé nhóm"]
  }
];

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<Omit<Customer, "password" | "createdAt"> | null>(null);
  const [toast, setToast] = useState("");
  const [bookingTrip, setBookingTrip] = useState<PopularRoute | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingPickup, setBookingPickup] = useState("");
  const [bookingDropoff, setBookingDropoff] = useState("");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("Thanh toán sau");
  const [routeFilter, setRouteFilter] = useState("all");
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [routeInventory, setRouteInventory] = useState<RouteInventory[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<Coupon[]>([]);
  const [searchLocations, setSearchLocations] = useState(locationOptions);
  const [language, setLanguage] = useState<Language>("vi");
  const [searchFrom, setSearchFrom] = useState("Vinh");
  const [searchTo, setSearchTo] = useState("Hoàng Mai");
  const [searchDate, setSearchDate] = useState("");
  const [activeSearchPicker, setActiveSearchPicker] = useState<"from" | "to" | "date" | null>(null);

  const userRoutes = useMemo(
    () =>
      buildUserRoutesFromAdminConfig(
        popularRoutes,
        routeInventory,
        customerBookings,
        searchDate || getDefaultTravelDate()
      ),
    [customerBookings, routeInventory, searchDate]
  );

  const filteredRoutes = useMemo(() => {
    if (routeFilter === "all") {
      return userRoutes;
    }

    return userRoutes.filter(
      (trip) => trip.busType.includes(routeFilter) || trip.tag.includes(routeFilter)
    );
  }, [routeFilter, userRoutes]);

  const copy = landingCopy[language];
  const languageLabel = languageOptions.find((option) => option.code === language)?.short || "VI";

  useEffect(() => {
    const currentCustomer = getCurrentCustomer();
    const storedLanguage = readStoredLanguage();
    setLanguage(storedLanguage);
    setCustomer(currentCustomer);
    setCustomerBookings(listBookings());
    setRouteInventory(listRouteInventory());
    setSearchLocations(listSearchConfig().locations);
    setAdminCoupons(listCoupons().filter((coupon) => coupon.active));
    setSearchDate(getDefaultTravelDate());

    if (window.location.search.includes("booking=created")) {
      setToast("Đơn đặt vé đã được gửi đến nhà xe. Vui lòng chờ xác nhận.");
      window.history.replaceState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    function refreshLocalData() {
      setCustomerBookings(listBookings());
      setRouteInventory(listRouteInventory());
      setSearchLocations(listSearchConfig().locations);
      setAdminCoupons(listCoupons().filter((coupon) => coupon.active));
    }

    window.addEventListener("storage", refreshLocalData);
    return () => window.removeEventListener("storage", refreshLocalData);
  }, []);

  function handleLanguageChange(value: string) {
    const nextLanguage = languageOptions.some((option) => option.code === value)
      ? (value as Language)
      : "vi";
    setLanguage(nextLanguage);
    saveStoredLanguage(nextLanguage);
  }

  function handleLogout() {
    logoutCustomer();
    setCustomer(null);
    setToast("Bạn đã đăng xuất tài khoản khách hàng.");
  }

  function openBookingDialog(trip: PopularRoute, travelDate = getDefaultTravelDate()) {
    const occupiedSeats = getBookedSeatCodes(trip.route, travelDate);
    setBookingTrip({
      ...trip,
      seatsLeft: Math.max(trip.seatsTotal - new Set([...trip.unavailableSeats, ...occupiedSeats]).size, 0),
      unavailableSeats: Array.from(new Set([...trip.unavailableSeats, ...occupiedSeats]))
    });
    setBookingDate(travelDate);
    setBookingPickup(trip.pickup);
    setBookingDropoff(trip.dropoff);
    setBookingPaymentMethod("Thanh toán sau");
    setSelectedSeats([]);
  }

  function toggleSeat(seatCode: string) {
    if (!bookingTrip || bookingTrip.unavailableSeats.includes(seatCode)) {
      return;
    }

    setSelectedSeats((current) => {
      if (current.includes(seatCode)) {
        return current.filter((item) => item !== seatCode);
      }

      if (current.length >= 6) {
        setToast("Mỗi đơn đặt tối đa 6 ghế. Vui lòng tạo đơn nhóm nếu cần nhiều hơn.");
        return current;
      }

      return [...current, seatCode];
    });
  }

  function handleConfirmBooking() {
    if (!bookingTrip || selectedSeats.length === 0) {
      return;
    }

    const travelDate = bookingDate || getDefaultTravelDate();
    const totalPrice = bookingTrip.priceValue * selectedSeats.length;
    const occupiedSeats = getBookedSeatCodes(bookingTrip.route, travelDate);
    const duplicatedSeat = selectedSeats.find((seat) => occupiedSeats.includes(seat));

    if (duplicatedSeat) {
      setToast(`Ghế ${duplicatedSeat} vừa được người khác giữ. Vui lòng chọn ghế khác.`);
      setBookingTrip({
        ...bookingTrip,
        unavailableSeats: Array.from(new Set([...bookingTrip.unavailableSeats, ...occupiedSeats]))
      });
      setSelectedSeats((current) => current.filter((seat) => seat !== duplicatedSeat));
      return;
    }

    if (!customer) {
      const [from = "Vinh", to = "Hoàng Mai"] = bookingTrip.route.split("-").map((part) => part.trim());
      setPendingBooking({
        dropoffPoint: bookingDropoff,
        from,
        paymentMethod: bookingPaymentMethod,
        pickupPoint: bookingPickup,
        price: totalPrice,
        route: bookingTrip.route,
        seats: selectedSeats.length,
        seatCodes: selectedSeats,
        to,
        travelDate
      });
      router.push("/login");
      return;
    }

    let booking: CustomerBooking;
    try {
      booking = createBooking({
        customer,
        dropoffPoint: bookingDropoff,
        paymentMethod: bookingPaymentMethod,
        pickupPoint: bookingPickup,
        price: totalPrice,
        route: bookingTrip.route,
        seatCodes: selectedSeats,
        seats: selectedSeats.length,
        travelDate
      });
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể giữ ghế. Vui lòng thử lại.");
      setCustomerBookings(listBookings());
      return;
    }

    setBookingTrip(null);
    setSelectedSeats([]);
    setCustomerBookings(listBookings());
    setToast(
      `Đã gửi đơn ${booking.id} cho tuyến ${booking.route}, ghế ${selectedSeats.join(", ")}. Nhà xe sẽ xác nhận sớm.`
    );
  }

  function handleSearchTrips() {
    const exactRoute = `${searchFrom} - ${searchTo}`;
    const matchedTrip =
      userRoutes.find((trip) => trip.route === exactRoute) ||
      userRoutes.find((trip) => trip.route.includes(searchFrom) && trip.route.includes(searchTo)) ||
      userRoutes[0];

    openBookingDialog(matchedTrip, searchDate || getDefaultTravelDate());
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-[#dbe7f3] bg-white">
        <div className="bg-[#0a67d8] text-white">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs font-medium md:px-6">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#ffd43b]" />
              Cam kết giữ chỗ và hỗ trợ đổi chuyến khi phát sinh sự cố vận hành
            </span>
            <div className="hidden items-center gap-5 md:flex">
              <Link href="/login">Đơn hàng của tôi</Link>
              <span className="flex items-center gap-1">
                <Headphones className="h-4 w-4" />
                Hotline 24/7
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0a67d8] text-base font-black text-white">
              TT
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-5 text-[#0a67d8]">
                Thành Trung
              </span>
              <span className="block text-xs font-semibold text-[#667085]">Vé xe khách</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[#344054] lg:flex">
            {navItems.map((item) => (
              <a className="transition hover:text-[#0a67d8]" href={item.href} key={item.href}>
                {copy.nav[item.key]}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {customer ? (
              <>
                <span className="rounded-full bg-[#e8f3ff] px-4 py-2 text-sm font-bold text-[#0a67d8]">
                  {customer.name}
                </span>
                <button
                  className="rounded-full border border-[#0a67d8] px-4 py-2 text-sm font-bold text-[#0a67d8] transition hover:bg-[#e8f3ff]"
                  onClick={handleLogout}
                  type="button"
                >
                  {copy.auth.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="rounded-full border border-[#0a67d8] px-4 py-2 text-sm font-bold text-[#0a67d8] transition hover:bg-[#e8f3ff]"
                  href="/login"
                >
                  {copy.auth.login}
                </Link>
                <Link
                  className="rounded-full bg-[#ffd43b] px-5 py-2 text-sm font-extrabold text-[#111827] transition hover:bg-[#ffcb05]"
                  href="/register"
                >
                  {copy.auth.register}
                </Link>
              </>
            )}
            <label className="flex h-11 items-center gap-2 rounded-full border border-[#d0d5dd] bg-white px-3 text-sm font-extrabold text-[#344054]">
              <span>{languageLabel}</span>
              <select
                aria-label="Chuyển đổi ngôn ngữ"
                className="border-0 bg-transparent p-0 text-sm font-extrabold text-[#0a67d8] focus:ring-0"
                onChange={(event) => handleLanguageChange(event.target.value)}
                value={language}
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            aria-label="Mở menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#d0d5dd] text-[#344054] md:hidden"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <MobileMenu authCopy={copy.auth} navCopy={copy.nav} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <AnimatePresence>
        {bookingTrip ? (
          <BookingModal
            dropoffPoint={bookingDropoff}
            onClose={() => setBookingTrip(null)}
            onConfirm={handleConfirmBooking}
            onDropoffChange={setBookingDropoff}
            onPaymentMethodChange={setBookingPaymentMethod}
            onPickupChange={setBookingPickup}
            onToggleSeat={toggleSeat}
            pickupPoint={bookingPickup}
            paymentMethod={bookingPaymentMethod}
            selectedSeats={selectedSeats}
            travelDate={bookingDate || getDefaultTravelDate()}
            trip={bookingTrip}
          />
        ) : null}
      </AnimatePresence>

      <section className="relative overflow-hidden bg-[#0a67d8] px-0 py-8 md:py-12">
        <div className="absolute inset-0">
          <Image
            alt="Bến xe đô thị"
            className="h-full w-full object-cover opacity-20"
            fill
            priority
            sizes="100vw"
            src={heroImage}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,103,216,0.72),rgba(10,103,216,0.96))]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center text-white"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="mx-auto mb-4 flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-black text-[#0a67d8] shadow-[0_12px_34px_rgba(16,24,40,0.16)]">
              <span className="rounded-full bg-[#ffd43b] px-3 py-1 text-[#111827]">Thứ 3 · 12h-14h</span>
              <span>Ngày săn hạ giá vé</span>
              <span className="rounded-full bg-[#ff7a00] px-3 py-1 text-white">Đến 50%</span>
            </div>
            <p className="text-sm font-semibold text-[#ffe58f]">
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-[1.15] md:text-4xl lg:text-5xl">
              {copy.hero.title}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#e8f3ff]">
              {copy.hero.desc}
            </p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-6xl rounded-3xl bg-white p-3 shadow-[0_18px_60px_rgba(10,50,120,0.22)]"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
          >
            <div className="flex flex-wrap gap-2 border-b border-[#edf2f7] pb-3">
              {serviceTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    className={
                      tab.active
                        ? "flex h-10 items-center gap-2 rounded-full bg-[#e8f3ff] px-4 text-sm font-bold text-[#0a67d8]"
                        : "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#667085] hover:bg-[#f2f4f7]"
                    }
                    key={tab.label}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.badge ? (
                      <span className="rounded-full bg-[#ffd43b] px-2 py-0.5 text-[10px] font-black text-[#111827]">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 pt-4 lg:grid-cols-[1fr_auto_1fr_180px_180px]">
              <LocationSearchPicker
                active={activeSearchPicker === "from"}
                label={copy.search.from}
                onSelect={(value) => {
                  setSearchFrom(value);
                  setActiveSearchPicker(null);
                }}
                onToggle={() => setActiveSearchPicker((current) => (current === "from" ? null : "from"))}
                options={searchLocations}
                value={searchFrom}
              />
              <button
                aria-label="Đổi điểm đi và điểm đến"
                className="hidden h-12 w-12 self-end rounded-full border border-[#d0d5dd] bg-white text-[#0a67d8] shadow-sm lg:grid lg:place-items-center"
                onClick={() => {
                  setSearchFrom(searchTo);
                  setSearchTo(searchFrom);
                }}
                type="button"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>
              <LocationSearchPicker
                active={activeSearchPicker === "to"}
                label={copy.search.to}
                onSelect={(value) => {
                  setSearchTo(value);
                  setActiveSearchPicker(null);
                }}
                onToggle={() => setActiveSearchPicker((current) => (current === "to" ? null : "to"))}
                options={searchLocations}
                value={searchTo}
              />
              <DateSearchPicker
                active={activeSearchPicker === "date"}
                label={copy.search.date}
                onSelect={(value) => {
                  setSearchDate(value);
                  setActiveSearchPicker(null);
                }}
                onToggle={() => setActiveSearchPicker((current) => (current === "date" ? null : "date"))}
                value={searchDate || getDefaultTravelDate()}
              />
              <button
                className="flex h-[58px] items-center justify-center gap-2 rounded-2xl bg-[#ffd43b] px-5 text-base font-extrabold text-[#111827] transition hover:bg-[#ffcb05]"
                onClick={handleSearchTrips}
                type="button"
              >
                <Search className="h-5 w-5" />
                {copy.search.search}
              </button>
            </div>
          </motion.div>

          <div className="mx-auto mt-5 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 text-sm font-semibold text-white backdrop-blur"
                  key={benefit.label}
                >
                  <Icon className="h-5 w-5 text-[#ffd43b]" />
                  {benefit.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {toast ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-32px)] max-w-xl -translate-x-1/2 rounded-2xl border border-[#b7e4c7] bg-[#ecfdf3] px-4 py-3 text-sm font-bold text-[#027a48] shadow-lg"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            role="status"
          >
            <div className="flex items-center justify-between gap-3">
              <span>{toast}</span>
              <button className="text-[#027a48]" onClick={() => setToast("")} type="button">
                Đóng
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(16,24,40,0.08)] md:grid-cols-4">
          {[
            ["124", "Chuyến hôm nay"],
            ["3.000+", "Nhà xe kết nối"],
            ["5.000+", "Tuyến đường"],
            ["24/7", "Hỗ trợ hành khách"]
          ].map(([value, label]) => (
            <div className="rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-4" key={label}>
              <p className="text-2xl font-extrabold text-[#0a67d8]">{value}</p>
              <p className="mt-1 text-sm font-semibold text-[#667085]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12" id="dat-xe">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#0a67d8]">
              Danh sách chuyến
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#111827] md:text-3xl">
              {copy.sections.trips}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {routeFilters.map((filter) => (
              <button
                className={
                  routeFilter === filter.value
                    ? "rounded-full bg-[#0a67d8] px-4 py-2 text-sm font-extrabold text-white"
                    : "rounded-full border border-[#d0d5dd] bg-white px-4 py-2 text-sm font-bold text-[#475467] hover:border-[#0a67d8] hover:text-[#0a67d8]"
                }
                key={filter.value}
                onClick={() => setRouteFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf2f7]">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-[#111827]">
                <SlidersHorizontal className="h-5 w-5 text-[#0a67d8]" />
                Bộ lọc
              </h3>
              <span className="text-xs font-bold text-[#0a67d8]">{filteredRoutes.length} chuyến</span>
            </div>

            <FilterGroup icon={Clock3} title="Giờ đi" values={timeFilters} />
            <FilterGroup icon={MapPin} title="Điểm đón" values={pickupFilters} />
            <FilterGroup icon={Bus} title="Loại xe" values={["Limousine", "Ghế ngồi", "Giường nằm", "Cabin"]} />

            <div className="rounded-xl bg-[#e8f3ff] p-4">
              <p className="text-sm font-extrabold text-[#0a67d8]">Gợi ý chọn ghế</p>
              <p className="mt-2 text-sm leading-6 text-[#475467]">
                Đi xe giường nằm nên ưu tiên tầng dưới hoặc khu vực giữa thân xe để ít rung lắc.
              </p>
            </div>
          </aside>

          <div className="space-y-4">
            {filteredRoutes.map((trip, index) => (
              <TripResultCard
                index={index}
                key={trip.route}
                onBook={() => openBookingDialog(trip)}
                trip={trip}
              />
            ))}
          </div>
        </div>
      </section>

      <Section title={copy.sections.customer} id="ve-cua-toi">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userCategories.map((item) => (
              <CategoryCard item={item} key={item.label} />
            ))}
          </div>
          <UserBookingPanel bookings={customerBookings} customer={customer} />
        </div>
      </Section>

      <Section title={copy.sections.offers} id="uu-dai">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 md:grid-cols-3">
            {(adminCoupons.length ? adminCoupons.map(couponToOffer) : offers).map((offer) => (
              <article className={`rounded-2xl ${offer.color} p-5 ring-1 ring-black/5`} key={offer.title}>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#0a67d8]">
                  {offer.code}
                </span>
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-[#111827]">{offer.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#475467]">{offer.desc}</p>
              </article>
            ))}
          </div>
          <PaymentFlow />
        </div>
      </Section>

      <Section title={copy.sections.operators} id="nha-xe">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.55fr)]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [Bus, "Đội xe chất lượng", "Limousine, ghế ngồi, giường nằm và cabin cho tuyến nội tỉnh/liên tỉnh."],
              [Armchair, "Chọn ghế trực quan", "Sơ đồ ghế thể hiện ghế trống, ghế đã bán và ghế đang chọn."],
              [MapPinned, "Điểm đón/trả rõ ràng", "Mỗi chuyến có điểm đón, điểm trả và ghi chú trung chuyển trước khi đặt."],
              [Bell, "Thông báo vận hành", "Cập nhật trạng thái xác nhận, biển số, tài xế và thay đổi chuyến khi phát sinh."]
            ].map(([Icon, title, desc]) => {
              const FeatureIcon = Icon as LucideIcon;
              return (
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]" key={title as string}>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ff] text-[#0a67d8]">
                    <FeatureIcon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{desc as string}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Nhà xe nổi bật</h3>
              <span className="rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-bold text-[#0a67d8]">
                Đang mở bán
              </span>
            </div>
            <div className="space-y-3">
              {operators.map(([name, rating, trips, fleet]) => (
                <div className="rounded-xl border border-[#edf2f7] p-4" key={name}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-[#111827]">{name}</p>
                      <p className="mt-1 text-sm text-[#667085]">{fleet}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-[#fff7d6] px-3 py-1 text-sm font-black text-[#a15c00]">
                      <Star className="h-4 w-4 fill-[#fdb022] text-[#fdb022]" />
                      {rating}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-bold text-[#0a67d8]">{trips}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <section className="bg-[#e8f3ff]" id="ho-tro">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="mb-6">
            <p className="text-sm font-extrabold uppercase tracking-wide text-[#0a67d8]">
              Hỗ trợ hành khách
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#111827] md:text-3xl">
              {copy.sections.support}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {supportItems.map((item) => (
              <SupportCard item={item} key={item.title} />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dbe7f3] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_2fr] md:px-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0a67d8] font-black text-white">
                TT
              </span>
              <div>
                <p className="text-lg font-extrabold text-[#0a67d8]">Thành Trung</p>
                <p className="text-sm text-[#667085]">Nền tảng vé xe khách</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#667085]">
              Giao diện đặt xe public theo luồng tìm chuyến, chọn ghế, chọn điểm đón/trả,
              xác nhận thông tin và theo dõi vé của hành khách.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="font-extrabold text-[#111827]">{group.title}</h3>
                <div className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <a
                      className="block text-sm text-[#667085] transition hover:text-[#0a67d8]"
                      href="#"
                      key={link}
                      onClick={(event) => event.preventDefault()}
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

function buildUserRoutesFromAdminConfig(
  baseRoutes: PopularRoute[],
  inventory: RouteInventory[],
  bookings: CustomerBooking[],
  travelDate: string
) {
  const activeInventory = inventory.filter((item) => item.status !== "Đã hủy");
  const configuredRoutes = activeInventory.length
    ? activeInventory.map((item) => {
        const base = baseRoutes.find((route) => route.route === item.route) || baseRoutes[0];
        const bookedSeats = bookings
          .filter(
            (booking) =>
              booking.route === item.route &&
              booking.travelDate === travelDate &&
              booking.status !== "Từ chối" &&
              booking.status !== "Đã hủy"
          )
          .flatMap((booking) => booking.seatCodes || []);
        const adminSoldSeats = makeSoldSeatCodes(item.sold, item.total);
        const unavailableSeats = Array.from(new Set([...adminSoldSeats, ...bookedSeats]));
        const [from = "Vinh", to = "Hoàng Mai"] = item.route.split("-").map((part) => part.trim());
        const duration = estimateDuration(item.time);

        return {
          ...base,
          arrival: duration.arrival,
          busType: item.total <= 18 ? "Limousine 16 chỗ" : item.total <= 34 ? "Giường nằm 34 chỗ" : "Ghế ngồi 40 chỗ",
          departure: item.time,
          dropoff: item.dropoff || `Bến xe ${to}`,
          duration: duration.label,
          operator: "Thành Trung Limousine",
          pickup: item.pickup || `Bến xe ${from}`,
          plate: item.vehicle,
          price: `Từ ${formatMoney(item.price)}`,
          priceValue: item.price,
          route: item.route,
          seatsLeft: Math.max(item.total - unavailableSeats.length, 0),
          seatsTotal: item.total,
          tag: item.status === "Đang chạy" ? "Đang chạy" : item.total <= 18 ? "Limousine 16" : "Còn ghế",
          unavailableSeats
        } satisfies PopularRoute;
      })
    : baseRoutes;

  return configuredRoutes;
}

function makeSoldSeatCodes(sold: number, total: number) {
  return Array.from({ length: Math.min(sold, total) }, (_, index) => `A${String(index + 1).padStart(2, "0")}`);
}

function estimateDuration(departure: string) {
  const [hourText = "7", minuteText = "30"] = departure.split(":");
  const hour = Number(hourText) || 7;
  const minute = Number(minuteText) || 30;
  const arrivalHour = (hour + 2) % 24;

  return {
    arrival: `${String(arrivalHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    label: "2 giờ"
  };
}

function couponToOffer(coupon: Coupon) {
  return {
    code: coupon.code,
    color: "bg-[#e8f3ff]",
    desc: coupon.description,
    title: `${coupon.title} · ${coupon.discount}`
  };
}

function FilterGroup({
  icon: Icon,
  title,
  values
}: {
  icon: LucideIcon;
  title: string;
  values: string[];
}) {
  return (
    <div className="border-t border-[#edf2f7] pt-4">
      <p className="flex items-center gap-2 text-sm font-extrabold text-[#111827]">
        <Icon className="h-4 w-4 text-[#0a67d8]" />
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {values.map((value) => (
          <label className="flex items-center gap-2 text-sm font-semibold text-[#475467]" key={value}>
            <input
              className="rounded border-[#d0d5dd] text-[#0a67d8] focus:ring-[#0a67d8]"
              type="checkbox"
            />
            {value}
          </label>
        ))}
      </div>
    </div>
  );
}

function TripResultCard({
  index,
  onBook,
  trip
}: {
  index: number;
  onBook: () => void;
  trip: PopularRoute;
}) {
  const availableSeats = trip.seatsTotal - trip.unavailableSeats.length;

  return (
    <motion.article
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#edf2f7]"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.03, duration: 0.25, ease: "easeOut" }}
      viewport={{ once: true, margin: "-40px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="grid lg:grid-cols-[210px_minmax(0,1fr)_190px]">
        <div className="relative min-h-44">
          <Image
            alt={trip.route}
            className="object-cover"
            fill
            priority={index < 2}
            sizes="(min-width: 1024px) 210px, 100vw"
            src={trip.image}
          />
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#0a67d8] shadow-sm">
            {trip.tag}
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {trip.landmark}
          </span>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-extrabold text-[#111827]">{trip.operator}</h3>
                <span className="flex items-center gap-1 rounded-full bg-[#fff7d6] px-2.5 py-1 text-xs font-black text-[#a15c00]">
                  <Star className="h-3.5 w-3.5 fill-[#fdb022] text-[#fdb022]" />
                  4.8
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#667085]">{trip.busType}</p>
            </div>
            <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-extrabold text-[#027a48]">
              Còn {availableSeats} ghế
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)_120px] sm:items-center">
            <div>
              <p className="text-2xl font-black text-[#111827]">{trip.departure}</p>
              <p className="mt-1 text-xs font-bold text-[#667085]">{trip.pickup}</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#98a2b3]">
              <span className="h-2 w-2 rounded-full bg-[#0a67d8]" />
              <span className="h-px flex-1 border-t border-dashed border-[#98a2b3]" />
              <Clock3 className="h-4 w-4" />
              <span>{trip.duration}</span>
              <span className="h-px flex-1 border-t border-dashed border-[#98a2b3]" />
              <span className="h-2 w-2 rounded-full bg-[#12b76a]" />
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-black text-[#111827]">{trip.arrival}</p>
              <p className="mt-1 text-xs font-bold text-[#667085]">{trip.dropoff}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[Wifi, CreditCard, ShieldCheck].map((Icon, iconIndex) => {
              const label = ["Wifi", "Thanh toán sau", "Có hỗ trợ đổi chuyến"][iconIndex];
              return (
                <span
                  className="flex items-center gap-1 rounded-full bg-[#f2f4f7] px-3 py-1 text-xs font-bold text-[#475467]"
                  key={label}
                >
                  <Icon className="h-3.5 w-3.5 text-[#0a67d8]" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-[#edf2f7] p-5 lg:border-l lg:border-t-0">
          <div className="lg:text-right">
            <p className="text-sm font-bold text-[#667085]">Giá từ</p>
            <p className="mt-1 text-2xl font-black text-[#0a67d8]">{formatMoney(trip.priceValue)}</p>
            <p className="mt-2 text-xs font-bold text-[#027a48]">Không cần thanh toán trước</p>
          </div>
          <button
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a67d8] text-sm font-extrabold text-white transition hover:bg-[#075bbf]"
            onClick={onBook}
            type="button"
          >
            Chọn chỗ
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function CategoryCard({
  item
}: {
  item: { label: string; desc: string; icon: LucideIcon; href: string };
}) {
  const Icon = item.icon;

  return (
    <Link
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7] transition hover:-translate-y-0.5 hover:ring-[#0a67d8]"
      href={item.href}
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ff] text-[#0a67d8]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-[#111827]">{item.label}</h3>
      <p className="mt-2 text-sm leading-6 text-[#667085]">{item.desc}</p>
    </Link>
  );
}

function UserBookingPanel({
  bookings,
  customer
}: {
  bookings: CustomerBooking[];
  customer: Omit<Customer, "password" | "createdAt"> | null;
}) {
  const visibleBookings = customer
    ? bookings.filter((booking) => booking.customerId === customer.id).slice(0, 3)
    : [];

  return (
    <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold text-[#111827]">Vé của tôi</h3>
        <span className="rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-bold text-[#0a67d8]">
          {customer ? `${visibleBookings.length} vé` : "Đăng nhập"}
        </span>
      </div>

      {customer ? (
        visibleBookings.length ? (
          <div className="mt-4 space-y-3">
            {visibleBookings.map((booking) => (
              <div className="rounded-xl border border-[#edf2f7] p-4" key={booking.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-[#111827]">{booking.route}</p>
                    <p className="mt-1 text-xs font-bold text-[#667085]">
                      {formatDisplayDate(booking.travelDate)} · {booking.seats} ghế
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#475467]">
                  <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1">{booking.id}</span>
                  {booking.seatCodes?.length ? (
                    <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[#027a48]">
                      {booking.seatCodes.join(", ")}
                    </span>
                  ) : null}
                </div>
                {booking.rejectionReason ? (
                  <p className="mt-3 rounded-xl bg-[#fef3f2] px-3 py-2 text-xs font-bold leading-5 text-[#b42318]">
                    Lý do từ chối: {booking.rejectionReason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-[#f8fafc] p-4">
            <p className="text-sm font-semibold leading-6 text-[#667085]">
              Bạn chưa có vé nào. Chọn một chuyến ở danh sách phía trên để tạo đơn giữ chỗ.
            </p>
          </div>
        )
      ) : (
        <div className="mt-4 rounded-xl bg-[#f8fafc] p-4">
          <p className="text-sm font-semibold leading-6 text-[#667085]">
            Đăng nhập để xem mã đặt chỗ, ghế đã chọn, điểm đón/trả và trạng thái xác nhận.
          </p>
          <Link
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#0a67d8] px-5 text-sm font-extrabold text-white"
            href="/login"
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </aside>
  );
}

function BookingStatusBadge({ status }: { status: CustomerBooking["status"] }) {
  const className =
    status === "Đã xác nhận"
      ? "bg-[#ecfdf3] text-[#027a48]"
      : status === "Từ chối"
        ? "bg-[#fef3f2] text-[#b42318]"
      : status === "Đã hủy"
        ? "bg-[#fef3f2] text-[#b42318]"
        : "bg-[#fff7d6] text-[#a15c00]";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function PaymentFlow() {
  return (
    <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]" id="thanh-toan">
      <h3 className="text-lg font-extrabold text-[#111827]">Luồng thanh toán</h3>
      <div className="mt-4 space-y-3">
        {[
          [ClipboardList, "Xác nhận thông tin", "Tuyến, ngày đi, ghế, điểm đón/trả và liên hệ."],
          [Gift, "Áp dụng ưu đãi", "Chọn mã giảm giá hoặc ưu đãi tuyến quen thuộc."],
          [WalletCards, "Chọn phương thức", "Thanh toán sau, chuyển khoản hoặc QR demo."],
          [BadgeCheck, "Nhận mã vé", "Theo dõi mã đặt chỗ và trạng thái trong Vé của tôi."]
        ].map(([Icon, title, desc]) => {
          const StepIcon = Icon as LucideIcon;
          return (
            <div className="flex gap-3" key={title as string}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f3ff] text-[#0a67d8]">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#111827]">{title as string}</p>
                <p className="mt-1 text-sm leading-5 text-[#667085]">{desc as string}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function DemoQrPanel({
  amount,
  reference,
  route
}: {
  amount: number;
  reference: string;
  route: string;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-[#bad7f5] bg-[#f8fbff] p-3">
      <div className="flex gap-3">
        <DemoQrCode />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-[#111827]">QR thanh toán demo</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
            Quét thử mã này để mô phỏng thanh toán. Khi bấm tiếp tục, giao dịch được ghi nhận
            vào số dư admin trong ngày.
          </p>
          <div className="mt-2 space-y-1 text-xs font-bold text-[#475467]">
            <DetailRow label="Nội dung" value={reference} />
            <DetailRow label="Tuyến" value={route} />
            <DetailRow label="Số tiền" value={formatMoney(amount)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoQrCode() {
  const activeCells = new Set([
    0, 1, 2, 3, 5, 6, 7, 8, 10, 12, 15, 16, 18, 20, 24, 25, 26, 28, 30, 31, 32, 34,
    36, 38, 39, 42, 44, 45, 48, 50, 52, 54, 56, 57, 58, 60, 63, 64, 66, 68, 70, 72,
    74, 76, 78, 80
  ]);

  return (
    <div className="grid h-24 w-24 shrink-0 grid-cols-9 gap-0.5 rounded-xl border border-[#d7ebff] bg-white p-2">
      {Array.from({ length: 81 }, (_, index) => (
        <span
          className={activeCells.has(index) ? "rounded-[2px] bg-[#0a67d8]" : "rounded-[2px] bg-[#e8f3ff]"}
          key={index}
        />
      ))}
    </div>
  );
}

function SupportCard({
  item
}: {
  item: { title: string; desc: string; icon: LucideIcon };
}) {
  const Icon = item.icon;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#d7ebff]">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f3ff] text-[#0a67d8]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-[#111827]">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#667085]">{item.desc}</p>
    </article>
  );
}

function LocationSearchPicker({
  active,
  label,
  onSelect,
  onToggle,
  options,
  value
}: {
  active: boolean;
  label: string;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: string[];
  value: string;
}) {
  return (
    <div className="relative">
      <button
        className="flex min-h-[58px] w-full items-center gap-3 rounded-2xl border border-[#d0d5dd] bg-white px-4 text-left transition hover:border-[#0a67d8]"
        onClick={onToggle}
        type="button"
      >
        <MapPin className="h-5 w-5 shrink-0 text-[#0a67d8]" />
        <span>
          <span className="block text-xs font-semibold text-[#667085]">{label}</span>
          <span className="mt-0.5 block text-base font-extrabold text-[#111827]">{value}</span>
        </span>
      </button>

      {active ? (
        <div className="absolute left-0 right-0 top-[66px] z-30 rounded-2xl border border-[#d7ebff] bg-white p-2 shadow-[0_16px_50px_rgba(16,24,40,0.18)]">
          {options.map((option) => (
            <button
              className={
                value === option
                  ? "flex w-full items-center justify-between rounded-xl bg-[#e8f3ff] px-3 py-3 text-left text-sm font-extrabold text-[#0a67d8]"
                  : "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#475467] hover:bg-[#f2f4f7]"
              }
              key={option}
              onClick={() => onSelect(option)}
              type="button"
            >
              {option}
              {value === option ? <ChevronRight className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DateSearchPicker({
  active,
  label,
  onSelect,
  onToggle,
  value
}: {
  active: boolean;
  label: string;
  onSelect: (value: string) => void;
  onToggle: () => void;
  value: string;
}) {
  const selectedDate = parseIsoDate(value);
  const months = [selectedDate, addMonths(selectedDate, 1)];

  return (
    <div className="relative">
      <button
        className="flex min-h-[58px] w-full items-center gap-3 rounded-2xl border border-[#d0d5dd] bg-white px-4 text-left transition hover:border-[#0a67d8]"
        onClick={onToggle}
        type="button"
      >
        <CalendarDays className="h-5 w-5 shrink-0 text-[#0a67d8]" />
        <span>
          <span className="block text-xs font-semibold text-[#667085]">{label}</span>
          <span className="mt-0.5 block text-base font-extrabold text-[#111827]">
            {formatDisplayDate(value)}
          </span>
        </span>
      </button>

      {active ? (
        <div className="absolute right-0 top-[66px] z-30 w-[min(680px,calc(100vw-32px))] rounded-2xl border border-[#d7ebff] bg-white p-4 shadow-[0_16px_50px_rgba(16,24,40,0.18)]">
          <div className="grid gap-5 md:grid-cols-2">
            {months.map((month) => (
              <CalendarMonth
                key={`${month.getFullYear()}-${month.getMonth()}`}
                month={month}
                onSelect={onSelect}
                selectedValue={value}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CalendarMonth({
  month,
  onSelect,
  selectedValue
}: {
  month: Date;
  onSelect: (value: string) => void;
  selectedValue: string;
}) {
  const days = getCalendarDays(month);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[#111827]">{formatMonthLabel(month)}</h3>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#667085]">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <span className={day === "T7" || day === "CN" ? "py-1 text-[#f04438]" : "py-1"} key={day}>
            {day}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = formatIsoDate(day.date);
          const isSelected = iso === selectedValue;
          const isMuted = day.date.getMonth() !== month.getMonth();

          return (
            <button
              className={
                isSelected
                  ? "h-9 rounded-lg bg-[#0a67d8] text-sm font-extrabold text-white"
                  : isMuted
                    ? "h-9 rounded-lg text-sm font-semibold text-[#c0c6d0] hover:bg-[#f2f4f7]"
                    : "h-9 rounded-lg text-sm font-semibold text-[#344054] hover:bg-[#e8f3ff] hover:text-[#0a67d8]"
              }
              key={iso}
              onClick={() => onSelect(iso)}
              type="button"
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BookingModal({
  dropoffPoint,
  onClose,
  onConfirm,
  onDropoffChange,
  onPaymentMethodChange,
  onPickupChange,
  onToggleSeat,
  paymentMethod,
  pickupPoint,
  selectedSeats,
  travelDate,
  trip
}: {
  dropoffPoint: string;
  onClose: () => void;
  onConfirm: () => void;
  onDropoffChange: (point: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onPickupChange: (point: string) => void;
  onToggleSeat: (seatCode: string) => void;
  paymentMethod: string;
  pickupPoint: string;
  selectedSeats: string[];
  travelDate: string;
  trip: PopularRoute;
}) {
  const seatDecks = getSeatDecks(trip);
  const availableSeats = trip.seatsTotal - trip.unavailableSeats.length;
  const pickupOptions = getPickupOptions(trip);
  const dropoffOptions = getDropoffOptions(trip);
  const totalPrice = selectedSeats.length * trip.priceValue;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-modal="true"
      className="fixed inset-0 z-[70] overflow-y-auto bg-[#101828]/60 px-4 py-4 backdrop-blur-sm md:py-8"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
    >
      <div className="flex min-h-full items-start justify-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(16,24,40,0.35)]"
          exit={{ opacity: 0, y: 18 }}
          initial={{ opacity: 0, y: 18 }}
          onClick={(event) => event.stopPropagation()}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#edf2f7] p-5">
            <div>
              <p className="text-sm font-extrabold text-[#0a67d8]">{trip.operator}</p>
              <h2 className="mt-1 text-2xl font-extrabold leading-tight text-[#111827]">
                {trip.route}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#667085]">
                {formatDisplayDate(travelDate)} · {trip.departure} - {trip.arrival} · {trip.duration}
              </p>
            </div>
            <button
              aria-label="Đóng chọn ghế"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d0d5dd] text-[#475467] transition hover:border-[#0a67d8] hover:text-[#0a67d8]"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="border-b border-[#edf2f7] p-5 lg:border-b-0 lg:border-r">
              <div className="grid grid-cols-2 rounded-2xl bg-[#f2f4f7] p-1 text-center text-xs font-extrabold text-[#667085] sm:grid-cols-4">
                {bookingSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                  <span
                    className={
                      index === 1
                        ? "flex items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-[#0a67d8] shadow-sm"
                        : "flex items-center justify-center gap-1 px-3 py-2"
                    }
                    key={step.label}
                  >
                    <StepIcon className="h-3.5 w-3.5" />
                    {step.label}
                  </span>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-[#111827]">Chọn ghế</h3>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">
                    {availableSeats} ghế còn trống · tối đa 6 ghế mỗi đơn
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-bold text-[#667085]">
                  <SeatLegend color="border-[#bad7f5] bg-white" label="Còn trống" />
                  <SeatLegend color="border-[#12b76a] bg-[#d1fadf]" label="Đang chọn" />
                  <SeatLegend color="border-[#e4e7ec] bg-[#f2f4f7]" label="Đã bán" />
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {seatDecks.map((deck) => {
                  const availableInDeck = deck.seats.filter(
                    (seat) => !trip.unavailableSeats.includes(seat)
                  ).length;

                  return (
                    <section
                      className="overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white"
                      key={deck.label}
                    >
                      <div className="flex items-center justify-between border-b border-[#edf2f7] px-4 py-3">
                        <p className="text-sm font-extrabold text-[#111827]">{deck.label}</p>
                        <span className="rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-bold text-[#0a67d8]">
                          {availableInDeck} trống
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="mb-4 flex h-10 items-center justify-between rounded-xl bg-[#f2f4f7] px-3 text-xs font-extrabold text-[#667085]">
                          <span>Đầu xe</span>
                          <Bus className="h-4 w-4 text-[#0a67d8]" />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {deck.seats.map((seat) => {
                            const isUnavailable = trip.unavailableSeats.includes(seat);
                            const isSelected = selectedSeats.includes(seat);

                            return (
                              <button
                                aria-pressed={isSelected}
                                className={
                                  "h-11 rounded-xl border text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[#0a67d8] " +
                                  (isUnavailable
                                    ? "cursor-not-allowed border-[#e4e7ec] bg-[#f2f4f7] text-[#98a2b3]"
                                    : isSelected
                                      ? "border-[#12b76a] bg-[#d1fadf] text-[#027a48] shadow-sm"
                                      : "border-[#bad7f5] bg-white text-[#0a67d8] hover:border-[#0a67d8] hover:bg-[#e8f3ff]")
                                }
                                disabled={isUnavailable}
                                key={seat}
                                onClick={() => onToggleSeat(seat)}
                                type="button"
                              >
                                {seat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <PointSelector
                  icon={MapPinned}
                  label="Chọn điểm đón"
                  onChange={onPickupChange}
                  options={pickupOptions}
                  value={pickupPoint}
                />
                <PointSelector
                  icon={Navigation}
                  label="Chọn điểm trả"
                  onChange={onDropoffChange}
                  options={dropoffOptions}
                  value={dropoffPoint}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-[#d7ebff] bg-[#f8fbff] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#111827]">Xác nhận vé xe</h3>
                    <p className="mt-1 text-sm font-semibold text-[#667085]">
                      Kiểm tra ghế, đón/trả và chọn phương thức thanh toán.
                    </p>
                  </div>
                  <ReceiptText className="h-5 w-5 text-[#0a67d8]" />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white p-4 ring-1 ring-[#edf2f7]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">Tóm tắt vé</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <DetailRow label="Tuyến" value={trip.route} />
                      <DetailRow label="Ngày đi" value={formatDisplayDate(travelDate)} />
                      <DetailRow
                        label="Ghế"
                        value={selectedSeats.length ? selectedSeats.join(", ") : "Chưa chọn"}
                      />
                      <DetailRow label="Tổng tiền" value={formatMoney(totalPrice)} />
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-4 ring-1 ring-[#edf2f7]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
                      Thông tin thanh toán
                    </p>
                    <div className="mt-3 space-y-2">
                      {paymentMethods.map((method) => {
                        const MethodIcon = method.icon;
                        const isSelected = paymentMethod === method.label;

                        return (
                          <button
                            className={
                              isSelected
                                ? "flex w-full gap-3 rounded-xl border border-[#0a67d8] bg-[#e8f3ff] p-3 text-left"
                                : "flex w-full gap-3 rounded-xl border border-[#edf2f7] bg-white p-3 text-left hover:border-[#0a67d8]"
                            }
                            key={method.label}
                            onClick={() => onPaymentMethodChange(method.label)}
                            type="button"
                          >
                            <MethodIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0a67d8]" />
                            <span>
                              <span className="block text-sm font-extrabold text-[#111827]">
                                {method.label}
                              </span>
                              <span className="mt-1 block text-xs font-semibold leading-5 text-[#667085]">
                                {method.desc}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {paymentMethod === "QR demo" ? (
                      <DemoQrPanel
                        amount={totalPrice}
                        reference={`TT-DEMO-${travelDate.replaceAll("-", "")}`}
                        route={trip.route}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <aside className="bg-[#f8fbff] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#0a67d8] ring-1 ring-[#d7ebff]">
                  {trip.busType}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#fff7d6] px-3 py-1 text-xs font-black text-[#a15c00]">
                  <Star className="h-3.5 w-3.5 fill-[#fdb022] text-[#fdb022]" />
                  4.8
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#edf2f7]">
                <TimelinePoint label="Điểm đón" time={trip.departure} title={pickupPoint} />
                <div className="ml-[35px] my-2 h-8 border-l border-dashed border-[#98a2b3]" />
                <TimelinePoint label="Điểm trả" time={trip.arrival} title={dropoffPoint} />
              </div>

              <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 ring-1 ring-[#edf2f7]">
                <DetailRow label="Nhà xe" value={trip.operator} />
                <DetailRow label="Biển số" value={trip.plate} />
                <DetailRow label="Thời gian" value={trip.duration} />
                <DetailRow label="Giá vé" value={`${formatMoney(trip.priceValue)} / ghế`} />
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#edf2f7]">
                <p className="text-sm font-extrabold text-[#111827]">Thông tin hành khách</p>
                <div className="mt-3 space-y-2 text-sm font-semibold text-[#667085]">
                  <span className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-[#0a67d8]" />
                    Lấy từ tài khoản sau khi đăng nhập
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#0a67d8]" />
                    Nhà xe gọi xác nhận trước giờ đi
                  </span>
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#0a67d8]" />
                    Gửi mã đặt chỗ khi đơn được tạo
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-extrabold text-[#111827]">Tiện ích</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trip.amenities.map((amenity) => (
                    <span
                      className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#475467] ring-1 ring-[#edf2f7]"
                      key={amenity}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#d7ebff] bg-white p-4">
                <p className="text-sm font-extrabold text-[#111827]">Ghế đã chọn</p>
                <div className="mt-3 min-h-10">
                  {selectedSeats.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <span
                          className="rounded-full bg-[#d1fadf] px-3 py-1 text-xs font-extrabold text-[#027a48]"
                          key={seat}
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-[#98a2b3]">Chưa chọn ghế</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#edf2f7] pt-4">
                  <span className="text-sm font-bold text-[#667085]">Tổng tiền</span>
                  <span className="text-xl font-black text-[#0a67d8]">
                    {formatMoney(totalPrice)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2">
                  <span className="text-sm font-bold text-[#667085]">Thanh toán</span>
                  <span className="text-sm font-extrabold text-[#111827]">{paymentMethod}</span>
                </div>
              </div>

              <button
                className={
                  "mt-4 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-extrabold transition " +
                  (selectedSeats.length
                    ? "bg-[#0a67d8] text-white hover:bg-[#075bbf]"
                    : "cursor-not-allowed bg-[#e4e7ec] text-[#98a2b3]")
                }
                disabled={!selectedSeats.length}
                onClick={onConfirm}
                type="button"
              >
                Tiếp tục đặt vé
              </button>
            </aside>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PointSelector({
  icon: Icon,
  label,
  onChange,
  options,
  value
}: {
  icon: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <section className="rounded-2xl border border-[#e4e7ec] bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-extrabold text-[#111827]">
        <Icon className="h-4 w-4 text-[#0a67d8]" />
        {label}
      </p>
      <div className="mt-3 space-y-2">
        {options.map((option) => (
          <button
            className={
              value === option
                ? "w-full rounded-xl border border-[#0a67d8] bg-[#e8f3ff] px-3 py-2 text-left text-sm font-extrabold text-[#0a67d8]"
                : "w-full rounded-xl border border-[#edf2f7] bg-white px-3 py-2 text-left text-sm font-semibold text-[#475467] hover:border-[#0a67d8]"
            }
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

function SeatLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm border ${color}`} />
      {label}
    </span>
  );
}

function TimelinePoint({ label, time, title }: { label: string; time: string; title: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f3ff] text-xs font-black text-[#0a67d8]">
        {time}
      </div>
      <div>
        <p className="text-xs font-bold text-[#667085]">{label}</p>
        <p className="mt-1 text-sm font-extrabold leading-snug text-[#111827]">{title}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-semibold text-[#667085]">{label}</span>
      <span className="text-right font-extrabold text-[#111827]">{value}</span>
    </div>
  );
}

function getPickupOptions(trip: PopularRoute) {
  const [from = "Vinh"] = trip.route.split("-").map((part) => part.trim());
  return Array.from(new Set([trip.pickup, `Bến xe ${from}`, `Trung tâm ${from}`]));
}

function getDropoffOptions(trip: PopularRoute) {
  const [, to = "Hoàng Mai"] = trip.route.split("-").map((part) => part.trim());
  return Array.from(new Set([trip.dropoff, `Bến xe ${to}`, `Trung tâm ${to}`]));
}

function getSeatDecks(trip: PopularRoute) {
  if (trip.seatsTotal <= 16) {
    return [{ label: "Sơ đồ ghế", seats: makeSeatCodes("A", trip.seatsTotal) }];
  }

  const lowerDeckCount = Math.ceil(trip.seatsTotal / 2);
  return [
    { label: "Tầng dưới", seats: makeSeatCodes("A", lowerDeckCount) },
    { label: "Tầng trên", seats: makeSeatCodes("B", trip.seatsTotal - lowerDeckCount) }
  ];
}

function makeSeatCodes(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(2, "0")}`);
}

function getDefaultTravelDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayBasedOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date };
  });
}

function formatDisplayDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatMoney(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function Section({
  children,
  id,
  title
}: {
  children: React.ReactNode;
  id?: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16" id={id}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-[#111827] md:text-3xl">{title}</h2>
        <button className="hidden items-center gap-1 text-sm font-bold text-[#0a67d8] sm:flex" type="button">
          Xem tất cả <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {children}
    </section>
  );
}

function MobileMenu({
  authCopy,
  navCopy,
  onClose,
  open
}: {
  authCopy: Record<keyof typeof landingCopy.vi.auth, string>;
  navCopy: Record<keyof typeof landingCopy.vi.nav, string>;
  onClose: () => void;
  open: boolean;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-white text-[#111827] md:hidden"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <div className="flex h-16 items-center justify-between border-b border-[#dbe7f3] px-4">
            <span className="text-lg font-extrabold text-[#0a67d8]">Thành Trung</span>
            <button
              aria-label="Đóng menu"
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#d0d5dd]"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="grid gap-1 p-4">
            {navItems.map((item) => (
              <a
                className="rounded-2xl px-4 py-4 text-base font-extrabold hover:bg-[#e8f3ff] hover:text-[#0a67d8]"
                href={item.href}
                key={item.href}
                onClick={onClose}
              >
                {navCopy[item.key]}
              </a>
            ))}
          </nav>
          <div className="absolute inset-x-4 bottom-6 grid gap-3">
            <Link
              className="flex h-12 items-center justify-center rounded-2xl bg-[#ffd43b] px-6 text-sm font-extrabold text-[#111827]"
              href="/login"
              onClick={onClose}
            >
              {authCopy.login}
            </Link>
            <Link
              className="flex h-12 items-center justify-center rounded-2xl border border-[#0a67d8] px-6 text-sm font-extrabold text-[#0a67d8]"
              href="/register"
              onClick={onClose}
            >
              {authCopy.register}
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
