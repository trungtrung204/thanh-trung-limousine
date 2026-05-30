"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Armchair,
  Bell,
  Bus,
  Clock3,
  ClipboardList,
  CreditCard,
  Gift,
  Headphones,
  History,
  Luggage,
  MapPinned,
  PackageCheck,
  Phone,
  QrCode,
  ReceiptText,
  Route,
  Navigation,
  RotateCcw,
  Send,
  ShieldCheck,
  Star,
  Ticket,
  UserCheck,
  WalletCards
} from "lucide-react";
import {
  addCustomerFeedback,
  getCurrentCustomer,
  listBookings,
  listCustomerNotifications,
  listCustomerFeedbacks,
  listRouteInventory,
  logoutCustomer,
  requestBookingChange,
  type Customer,
  type CustomerBooking,
  type CustomerFeedback,
  type CustomerNotification,
  type RouteInventory
} from "@/lib/local-db";
import {
  languageOptions,
  portalCopy,
  readStoredLanguage,
  saveStoredLanguage,
  type Language
} from "@/lib/i18n";

const pageConfig = {
  "my-tickets": {
    icon: QrCode
  },
  cancel: {
    icon: RotateCcw
  },
  promotions: {
    icon: Gift
  },
  payment: {
    icon: WalletCards
  },
  tracking: {
    icon: Navigation
  },
  feedback: {
    icon: Star
  },
  luggage: {
    icon: Luggage
  },
  history: {
    icon: History
  },
  operators: {
    icon: Bus
  },
  support: {
    icon: ShieldCheck
  }
} as const;

type SectionKey = keyof typeof pageConfig;

export default function CustomerPortalPage({ section }: { section: string }) {
  const pageKey = (section in pageConfig ? section : "my-tickets") as SectionKey;
  const config = pageConfig[pageKey];
  const Icon = config.icon;
  const [customer, setCustomer] = useState<Omit<Customer, "password" | "createdAt"> | null>(null);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [routeInventory, setRouteInventory] = useState<RouteInventory[]>([]);
  const [language, setLanguage] = useState<Language>("vi");

  useEffect(() => {
    setLanguage(readStoredLanguage());
    const currentCustomer = getCurrentCustomer();
    setCustomer(currentCustomer);
    setBookings(listBookings());
    setNotifications(listCustomerNotifications());
    setRouteInventory(listRouteInventory());
  }, []);

  function handleLanguageChange(value: string) {
    const nextLanguage = languageOptions.some((option) => option.code === value)
      ? (value as Language)
      : "vi";
    setLanguage(nextLanguage);
    saveStoredLanguage(nextLanguage);
  }

  const visibleBookings = customer
    ? bookings.filter((booking) => booking.customerId === customer.id)
    : [];
  const visibleNotifications = customer
    ? notifications.filter((notification) => notification.customerId === customer.id)
    : [];
  const copy = portalCopy[language];
  const [title, desc] = copy.sections[pageKey];
  const languageLabel = languageOptions.find((option) => option.code === language)?.short || "VI";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header className="border-b border-[#dbe7f3] bg-white">
        <div className="bg-[#0a67d8] text-white">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs font-medium md:px-6">
            <span>{copy.assurance}</span>
            <span className="hidden md:inline">{copy.hotline}</span>
          </div>
        </div>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0a67d8] font-black text-white">
              TT
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-5 text-[#0a67d8]">Thành Trung</span>
              <span className="block text-xs font-semibold text-[#667085]">Vé xe khách</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <label className="flex h-10 items-center gap-2 rounded-full border border-[#d0d5dd] px-3 text-sm font-extrabold text-[#344054]">
              {languageLabel}
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
            {customer ? (
              <button
                className="rounded-full border border-[#0a67d8] px-4 py-2 text-sm font-bold text-[#0a67d8]"
                onClick={() => {
                  logoutCustomer();
                  setCustomer(null);
                }}
                type="button"
              >
                {copy.auth.logout}
              </button>
            ) : (
              <Link className="rounded-full bg-[#0a67d8] px-4 py-2 text-sm font-bold text-white" href="/login">
                {copy.auth.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <Link className="inline-flex items-center gap-2 text-sm font-extrabold text-[#0a67d8]" href="/">
          <ArrowLeft className="h-4 w-4" />
          {copy.back}
        </Link>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#edf2f7]">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e8f3ff] text-[#0a67d8]">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">{title}</h1>
              <p className="mt-2 max-w-2xl leading-7 text-[#667085]">{desc}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <PortalMainContent
            bookings={visibleBookings}
            copy={copy}
            customer={customer}
            language={language}
            pageKey={pageKey}
            routeInventory={routeInventory}
          />

          <aside className="space-y-5">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Bell className="h-5 w-5 text-[#0a67d8]" />
                {copy.customerNotifications}
              </h2>
              <div className="mt-4 space-y-3">
                {visibleNotifications.length ? (
                  visibleNotifications.slice(0, 6).map((notification) => (
                    <div className="rounded-xl border border-[#edf2f7] p-3" key={notification.id}>
                      <p className="text-sm font-extrabold text-[#111827]">{notification.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#667085]">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#f8fafc] p-4 text-sm leading-6 text-[#667085]">
                    {copy.noNotifications}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
              <h2 className="text-lg font-extrabold">{copy.quickActions}</h2>
              <div className="mt-4 grid gap-2">
                {[
                  [copy.actions[0], "/"],
                  [copy.actions[1], "/user/promotions"],
                  [copy.actions[2], "/user/support"]
                ].map(([labelText, href]) => (
                  <Link
                    className="rounded-xl border border-[#edf2f7] px-4 py-3 text-sm font-extrabold text-[#0a67d8] hover:bg-[#e8f3ff]"
                    href={href}
                    key={labelText}
                  >
                    {labelText}
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

type TicketCopy = {
  ticketList: string;
  loginRequired: string;
  noTickets: string;
  ticketFields: {
    code: string;
    seats: string;
    pickup: string;
    dropoff: string;
    payment: string;
    total: string;
    seatUnit: string;
    rejectionReason: string;
  };
  statuses: {
    pending: string;
    confirmed: string;
    changeRequested: string;
    rejected: string;
    canceled: string;
  };
};

type CustomerSession = Omit<Customer, "password" | "createdAt"> | null;

type UtilityItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
  meta: string;
};

type PortalUtilityPageKey = Exclude<SectionKey, "my-tickets" | "cancel" | "history" | "tracking" | "feedback">;

function PortalMainContent({
  bookings,
  copy,
  customer,
  language,
  pageKey,
  routeInventory
}: {
  bookings: CustomerBooking[];
  copy: TicketCopy;
  customer: CustomerSession;
  language: Language;
  pageKey: SectionKey;
  routeInventory: RouteInventory[];
}) {
  if (pageKey === "my-tickets") {
    return <TicketListSection bookings={bookings} copy={copy} customer={customer} language={language} />;
  }

  if (pageKey === "cancel") {
    return <CancelSection bookings={bookings} copy={copy} customer={customer} language={language} />;
  }

  if (pageKey === "history") {
    return <HistorySection bookings={bookings} copy={copy} customer={customer} language={language} />;
  }

  if (pageKey === "tracking") {
    return <TrackingSection bookings={bookings} copy={copy} customer={customer} language={language} routeInventory={routeInventory} />;
  }

  if (pageKey === "feedback") {
    return <FeedbackSection bookings={bookings} copy={copy} customer={customer} language={language} />;
  }

  const content = getUtilityContent(language)[pageKey];
  return <UtilitySection content={content} />;
}

function TicketListSection({
  bookings,
  copy,
  customer,
  language
}: {
  bookings: CustomerBooking[];
  copy: TicketCopy;
  customer: CustomerSession;
  language: Language;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
      <h2 className="text-xl font-extrabold">{copy.ticketList}</h2>
      <div className="mt-4 space-y-4">
        {customer ? (
          bookings.length ? (
            bookings.map((booking) => (
              <TicketCard booking={booking} copy={copy} key={booking.id} language={language} />
            ))
          ) : (
            <EmptyState text={copy.noTickets} />
          )
        ) : (
          <EmptyState text={copy.loginRequired} />
        )}
      </div>
    </section>
  );
}

function CancelSection({
  bookings,
  copy,
  customer,
  language
}: {
  bookings: CustomerBooking[];
  copy: TicketCopy;
  customer: CustomerSession;
  language: Language;
}) {
  const content = getCancelContent(language);
  const rejectedBookings = bookings.filter((booking) => booking.status === "Từ chối");
  const requestableBookings = bookings.filter(
    (booking) => booking.status === "Chờ xác nhận" || booking.status === "Đã xác nhận"
  );
  const [requestReason, setRequestReason] = useState("");
  const [requestBookingId, setRequestBookingId] = useState("");
  const [requestStatus, setRequestStatus] = useState("");

  useEffect(() => {
    setRequestBookingId((current) => current || requestableBookings[0]?.id || "");
  }, [requestableBookings]);

  function handleChangeRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bookingId = requestBookingId || requestableBookings[0]?.id;
    if (!bookingId) {
      setRequestStatus(content.noRequestable);
      return;
    }

    const updated = requestBookingChange(bookingId, requestReason || content.defaultReason);
    setRequestStatus(updated ? content.requestSent : content.noRequestable);
    setRequestReason("");
  }

  return (
    <section className="space-y-5">
      <UtilitySection content={content} />
      <form className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]" onSubmit={handleChangeRequest}>
        <h2 className="text-xl font-extrabold">{content.requestTitle}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <select
            className="h-12 rounded-2xl border-[#d0d5dd] text-sm font-semibold focus:border-[#0a67d8] focus:ring-[#0a67d8]"
            onChange={(event) => setRequestBookingId(event.target.value)}
            value={requestBookingId}
          >
            {requestableBookings.length ? (
              requestableBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.route} · {booking.id}
                </option>
              ))
            ) : (
              <option value="">{content.noRequestable}</option>
            )}
          </select>
          <input
            className="h-12 rounded-2xl border-[#d0d5dd] text-sm focus:border-[#0a67d8] focus:ring-[#0a67d8]"
            onChange={(event) => setRequestReason(event.target.value)}
            placeholder={content.requestPlaceholder}
            value={requestReason}
          />
        </div>
        <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0a67d8] px-4 text-sm font-extrabold text-white" type="submit">
          <Send className="h-4 w-4" />
          {content.requestSubmit}
        </button>
        {requestStatus ? <p className="mt-3 rounded-2xl bg-[#ecfdf3] p-3 text-sm font-bold text-[#027a48]">{requestStatus}</p> : null}
      </form>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
        <h2 className="text-xl font-extrabold">{content.rejectedTitle}</h2>
        <div className="mt-4 space-y-4">
          {!customer ? (
            <EmptyState text={copy.loginRequired} />
          ) : rejectedBookings.length ? (
            rejectedBookings.map((booking) => (
              <TicketCard booking={booking} copy={copy} key={booking.id} language={language} />
            ))
          ) : (
            <EmptyState text={content.noRejected} />
          )}
        </div>
      </section>
    </section>
  );
}

function HistorySection({
  bookings,
  copy,
  customer,
  language
}: {
  bookings: CustomerBooking[];
  copy: TicketCopy;
  customer: CustomerSession;
  language: Language;
}) {
  const content = getHistoryContent(language);

  if (!customer) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
        <EmptyState text={copy.loginRequired} />
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">{content.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{content.desc}</p>
        </div>
        <span className="rounded-full bg-[#e8f3ff] px-3 py-1 text-sm font-black text-[#0a67d8]">
          {bookings.length} {content.countLabel}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {bookings.length ? (
          bookings.map((booking) => (
            <div className="rounded-2xl border border-[#edf2f7] p-4" key={booking.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold">{booking.route}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">
                    {formatDisplayDate(booking.travelDate, language)} · {booking.pickupPoint || booking.from}
                  </p>
                </div>
                <StatusBadge copy={copy} status={booking.status} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Info label={copy.ticketFields.code} value={booking.id} />
                <Info label={copy.ticketFields.seats} value={booking.seatCodes?.join(", ") || `${booking.seats}`} />
                <Info label={copy.ticketFields.total} value={formatCurrency(booking.price, language)} />
              </div>
            </div>
          ))
        ) : (
          <EmptyState text={content.empty} />
        )}
      </div>
    </section>
  );
}

function TrackingSection({
  bookings,
  copy,
  customer,
  language,
  routeInventory
}: {
  bookings: CustomerBooking[];
  copy: TicketCopy;
  customer: CustomerSession;
  language: Language;
  routeInventory: RouteInventory[];
}) {
  const progress = useLiveTrackingProgress();
  const activeBooking =
    bookings.find((booking) => booking.status === "Đã xác nhận") ||
    bookings.find((booking) => booking.status === "Chờ xác nhận") ||
    bookings[0];
  const activeTrip = routeInventory.find((trip) => trip.route === activeBooking?.route);
  const content = getTrackingContent(language);

  if (!customer) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
        <EmptyState text={copy.loginRequired} />
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold">{content.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">{content.desc}</p>
        </div>
        <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-sm font-black text-[#027a48]">
          {content.live}
        </span>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[#d7ebff] bg-[#e8f3ff]">
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(#bad7f5_1px,transparent_1px),linear-gradient(90deg,#bad7f5_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="absolute left-[10%] right-[10%] top-[48%] h-2 rounded-full bg-white shadow-inner">
            <div className="h-full rounded-full bg-[#0a67d8]" style={{ width: `${progress}%` }} />
          </div>
          <div className="absolute left-[8%] top-[42%] rounded-2xl bg-white px-3 py-2 text-sm font-black text-[#0a67d8] shadow">
            {activeBooking?.pickupPoint || content.pickup}
          </div>
          <div className="absolute right-[8%] top-[42%] rounded-2xl bg-white px-3 py-2 text-sm font-black text-[#0a67d8] shadow">
            {activeBooking?.dropoffPoint || content.dropoff}
          </div>
          <div
            className="absolute top-[calc(48%-20px)] grid h-11 w-11 place-items-center rounded-full bg-[#ffd43b] text-[#111827] shadow-[0_10px_30px_rgba(16,24,40,0.22)] transition-[left] duration-700"
            style={{ left: `calc(10% + ${progress * 0.8}% - 22px)` }}
          >
            <Bus className="h-5 w-5" />
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#667085]">{content.currentTrip}</p>
                <p className="mt-1 text-lg font-extrabold text-[#111827]">
                  {activeBooking?.route || content.demoRoute}
                </p>
              </div>
              <span className="rounded-full bg-[#e8f3ff] px-3 py-1 text-sm font-black text-[#0a67d8]">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          {[
            [Route, content.route, activeBooking?.route || content.demoRoute],
            [Bus, content.tripStatus, activeTrip?.status || content.live],
            [Clock3, content.eta, content.etaValue],
            [MapPinned, content.pickupLabel, activeBooking?.pickupPoint || activeBooking?.from || content.pickup],
            [Navigation, content.dropoffLabel, activeBooking?.dropoffPoint || activeBooking?.to || content.dropoff],
            [UserCheck, content.driver, activeTrip?.driver || content.driverPending],
            [Phone, content.driverPhone, activeTrip?.vehicle || "0238 888 888"]
          ].map(([Icon, label, value]) => {
            const InfoIcon = Icon as LucideIcon;
            return (
              <div className="flex gap-3 rounded-2xl border border-[#edf2f7] p-4" key={label as string}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f3ff] text-[#0a67d8]">
                  <InfoIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">{label as string}</p>
                  <p className="mt-1 text-sm font-extrabold text-[#111827]">{value as string}</p>
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </section>
  );
}

function FeedbackSection({
  bookings,
  copy,
  customer,
  language
}: {
  bookings: CustomerBooking[];
  copy: TicketCopy;
  customer: CustomerSession;
  language: Language;
}) {
  const content = getFeedbackContent(language);
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!customer) {
      return;
    }

    setFeedbacks(listCustomerFeedbacks().filter((feedback) => feedback.customerId === customer.id));
    setSelectedBookingId((current) => current || bookings[0]?.id || "");
  }, [bookings, customer]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!customer) {
      setStatus(copy.loginRequired);
      return;
    }

    if (!trimmedMessage) {
      setStatus(content.required);
      return;
    }

    const booking = bookings.find((item) => item.id === selectedBookingId) || bookings[0];
    const feedback = addCustomerFeedback({
      bookingId: booking?.id || "Không có vé",
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      message: trimmedMessage,
      rating,
      route: booking?.route || content.noTrip
    });

    setFeedbacks([feedback, ...listCustomerFeedbacks().filter((item) => item.customerId === customer.id && item.id !== feedback.id)]);
    setMessage("");
    setStatus(content.success);
  }

  if (!customer) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
        <EmptyState text={copy.loginRequired} />
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.55fr)]">
      <form className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]" onSubmit={handleSubmit}>
        <h2 className="text-xl font-extrabold">{content.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">{content.desc}</p>

        <label className="mt-5 block">
          <span className="text-sm font-extrabold text-[#344054]">{content.tripLabel}</span>
          <select
            className="mt-2 h-12 w-full rounded-2xl border-[#d0d5dd] text-sm font-semibold text-[#111827] focus:border-[#0a67d8] focus:ring-[#0a67d8]"
            onChange={(event) => setSelectedBookingId(event.target.value)}
            value={selectedBookingId}
          >
            {bookings.length ? (
              bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.route} · {formatDisplayDate(booking.travelDate, language)} · {booking.id}
                </option>
              ))
            ) : (
              <option value="">{content.noTrip}</option>
            )}
          </select>
        </label>

        <div className="mt-5">
          <p className="text-sm font-extrabold text-[#344054]">{content.ratingLabel}</p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-label={`${value} sao`}
                className={
                  value <= rating
                    ? "grid h-11 w-11 place-items-center rounded-xl bg-[#fff7d6] text-[#f79009] ring-1 ring-[#fedf89]"
                    : "grid h-11 w-11 place-items-center rounded-xl bg-[#f2f4f7] text-[#98a2b3] ring-1 ring-[#edf2f7]"
                }
                key={value}
                onClick={() => setRating(value)}
                type="button"
              >
                <Star className={value <= rating ? "h-5 w-5 fill-[#fdb022]" : "h-5 w-5"} />
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-extrabold text-[#344054]">{content.messageLabel}</span>
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border-[#d0d5dd] text-sm leading-6 focus:border-[#0a67d8] focus:ring-[#0a67d8]"
            onChange={(event) => setMessage(event.target.value)}
            placeholder={content.placeholder}
            value={message}
          />
        </label>

        {status ? (
          <p className="mt-4 rounded-2xl bg-[#ecfdf3] px-4 py-3 text-sm font-bold text-[#027a48]">{status}</p>
        ) : null}

        <button className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0a67d8] px-5 text-sm font-extrabold text-white hover:bg-[#075bbf]" type="submit">
          <Send className="h-4 w-4" />
          {content.submit}
        </button>
      </form>

      <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
        <h2 className="text-lg font-extrabold">{content.sentTitle}</h2>
        <div className="mt-4 space-y-3">
          {feedbacks.length ? (
            feedbacks.slice(0, 5).map((feedback) => (
              <article className="rounded-2xl border border-[#edf2f7] p-4" key={feedback.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">{feedback.route}</p>
                    <p className="mt-1 text-xs font-semibold text-[#667085]">{feedback.bookingId}</p>
                  </div>
                  <span className="rounded-full bg-[#fff7d6] px-2.5 py-1 text-xs font-black text-[#a15c00]">
                    {feedback.rating}/5
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#667085]">{feedback.message}</p>
              </article>
            ))
          ) : (
            <p className="rounded-2xl bg-[#f8fafc] p-4 text-sm leading-6 text-[#667085]">
              {content.empty}
            </p>
          )}
        </div>
      </aside>
    </section>
  );
}

function UtilitySection({
  content
}: {
  content: {
    title: string;
    desc: string;
    items: UtilityItem[];
    highlight: string;
  };
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold">{content.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">{content.desc}</p>
        </div>
        <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-sm font-black text-[#027a48]">
          {content.highlight}
        </span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {content.items.map((item) => {
          const Icon = item.icon;
          return (
            <article className="rounded-2xl border border-[#edf2f7] p-4" key={item.title}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3ff] text-[#0a67d8]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{item.desc}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#0a67d8]">{item.meta}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function useLiveTrackingProgress() {
  const [progress, setProgress] = useState(36);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 88 ? 34 : current + 2));
    }, 1600);

    return () => window.clearInterval(timer);
  }, []);

  return progress;
}

function getTrackingContent(language: Language) {
  if (language === "en") {
    return {
      currentTrip: "Current trip",
      demoRoute: "Vinh - Hoang Mai",
      desc: "Demo live map for pickup/dropoff progress. The bus marker updates automatically.",
      driver: "Driver",
      driverPhone: "Driver hotline",
      driverPending: "Pending assignment",
      dropoff: "Hoang Mai station",
      dropoffLabel: "Dropoff",
      eta: "ETA",
      etaValue: "22 minutes",
      live: "Live demo",
      pickup: "Thanh Trung office",
      pickupLabel: "Pickup",
      route: "Route",
      title: "Live trip tracking",
      tripStatus: "Trip status"
    };
  }

  if (language === "zh") {
    return {
      currentTrip: "当前行程",
      demoRoute: "荣市 - 黄梅",
      desc: "演示车辆实时地图，自动显示上下车进度。",
      driver: "司机",
      driverPhone: "司机热线",
      driverPending: "待分配",
      dropoff: "黄梅车站",
      dropoffLabel: "下车点",
      eta: "预计到达",
      etaValue: "22分钟",
      live: "实时演示",
      pickup: "Thanh Trung 办公室",
      pickupLabel: "上车点",
      route: "路线",
      title: "行程实时跟踪",
      tripStatus: "行程状态"
    };
  }

  return {
    currentTrip: "Chuyến đang theo dõi",
    demoRoute: "Vinh - Hoàng Mai",
    desc: "Bản đồ demo theo dõi tiến độ đón/trả. Vị trí xe tự cập nhật để mô phỏng chuyến đang chạy.",
    driver: "Tài xế",
    driverPhone: "Hotline tài xế",
    driverPending: "Chưa phân công",
    dropoff: "Bến xe Hoàng Mai",
    dropoffLabel: "Điểm trả",
    eta: "Dự kiến đến",
    etaValue: "22 phút",
    live: "Đang chạy demo",
    pickup: "VP Thành Trung",
    pickupLabel: "Điểm đón",
    route: "Tuyến",
    title: "Theo dõi chuyến trực tiếp",
    tripStatus: "Trạng thái chuyến"
  };
}

function getFeedbackContent(language: Language) {
  if (language === "en") {
    return {
      desc: "Rate a completed or booked trip. Admin will see the feedback in the Reviews area.",
      empty: "No feedback has been sent yet.",
      messageLabel: "Feedback detail",
      noTrip: "No booking selected",
      placeholder: "Share vehicle quality, driver attitude, pickup timing, or payment experience...",
      ratingLabel: "Rating",
      required: "Please enter your feedback before sending.",
      sentTitle: "Sent feedback",
      submit: "Send feedback",
      success: "Feedback sent to admin.",
      title: "Send trip feedback",
      tripLabel: "Select trip"
    };
  }

  if (language === "zh") {
    return {
      desc: "评价已订或已完成的行程，后台会在评价页看到反馈。",
      empty: "暂无已发送反馈。",
      messageLabel: "反馈内容",
      noTrip: "未选择订单",
      placeholder: "请填写车辆质量、司机服务、上车时间或支付体验...",
      ratingLabel: "评分",
      required: "发送前请输入反馈内容。",
      sentTitle: "已发送反馈",
      submit: "发送反馈",
      success: "反馈已发送到后台。",
      title: "发送行程反馈",
      tripLabel: "选择行程"
    };
  }

  return {
    desc: "Đánh giá chuyến đã đặt hoặc đã đi. Admin sẽ thấy phản hồi này trong mục Đánh giá.",
    empty: "Bạn chưa gửi phản hồi nào.",
    messageLabel: "Nội dung phản hồi",
    noTrip: "Chưa có vé để chọn",
    placeholder: "Nhập chất lượng xe, thái độ tài xế, thời gian đón, thanh toán hoặc góp ý khác...",
    ratingLabel: "Điểm đánh giá",
    required: "Vui lòng nhập nội dung phản hồi trước khi gửi.",
    sentTitle: "Phản hồi đã gửi",
    submit: "Gửi phản hồi",
    success: "Đã gửi phản hồi về admin.",
    title: "Gửi phản hồi chuyến xe",
    tripLabel: "Chọn chuyến"
  };
}

function getUtilityContent(language: Language): Record<
  PortalUtilityPageKey,
  { title: string; desc: string; highlight: string; items: UtilityItem[] }
> {
  if (language === "en") {
    return {
      promotions: {
        title: "Useful deals",
        desc: "Store route discounts, payment offers, and group-trip vouchers before checkout.",
        highlight: "Apply before payment",
        items: [
          { icon: Gift, title: "Route voucher", desc: "Suggested code for frequent Vinh, Hoang Mai, and Hanoi trips.", meta: "NGHEAN20" },
          { icon: WalletCards, title: "Pay-later support", desc: "Keep the seat and pay after the operator confirms pickup details.", meta: "Flexible payment" },
          { icon: UserCheck, title: "Group discount", desc: "Prioritize reservations with 3 or more seats and shared pickup notes.", meta: "Group trip" }
        ]
      },
      payment: {
        title: "Payment center",
        desc: "Follow payment status, method, and invoice notes in one place.",
        highlight: "Transparent checkout",
        items: [
          { icon: CreditCard, title: "Bank transfer", desc: "Show booking code in transfer content so the admin can match payment.", meta: "Manual reconciliation" },
          { icon: QrCode, title: "QR demo", desc: "Demo QR payments are recorded into the admin daily balance.", meta: "Demo only" },
          { icon: ReceiptText, title: "Payment receipt", desc: "Keep invoice notes, surcharge, and total fare per booking.", meta: "Receipt ready" }
        ]
      },
      luggage: {
        title: "Luggage and parcel",
        desc: "Record luggage, parcel requests, and surcharge notes before boarding.",
        highlight: "Clear policy",
        items: [
          { icon: Luggage, title: "20 kg luggage", desc: "Standard checked luggage is shown with each ticket note.", meta: "Included" },
          { icon: PackageCheck, title: "Parcel with bus", desc: "Send parcels with receiver name, phone, and dropoff point.", meta: "Driver manifest" },
          { icon: ClipboardList, title: "Surcharge note", desc: "Oversized luggage can be marked for admin confirmation.", meta: "Before boarding" }
        ]
      },
      operators: {
        title: "Operator information",
        desc: "Compare bus type, license plate, amenities, and route coverage.",
        highlight: "Verified trips",
        items: [
          { icon: Bus, title: "Thanh Trung Limousine", desc: "16-seat limousine with clear pickup and operator confirmation.", meta: "Vinh - Hoang Mai" },
          { icon: Armchair, title: "Premium seats", desc: "Show available seats, sold seats, and selected seats before checkout.", meta: "Seat map" },
          { icon: ShieldCheck, title: "Operator guarantee", desc: "Admin can confirm, reject, and notify customers with a reason.", meta: "Controlled by admin" }
        ]
      },
      support: {
        title: "Support hub",
        desc: "Customer help for boarding, changes, payment, and operator contact.",
        highlight: "24/7 support",
        items: [
          { icon: Phone, title: "Hotline", desc: "Call 1900 2026 or 0238 888 888 for pickup, payment, and ticket changes.", meta: "Immediate help" },
          { icon: Headphones, title: "Change request", desc: "Send change or cancellation requests with booking code.", meta: "Policy based" },
          { icon: MapPinned, title: "Pickup guide", desc: "Review pickup/dropoff points before departure.", meta: "Before trip" }
        ]
      }
    };
  }

  if (language === "zh") {
    return {
      promotions: {
        title: "常用优惠",
        desc: "在付款前保存路线优惠、支付优惠和多人出行优惠。",
        highlight: "付款前使用",
        items: [
          { icon: Gift, title: "路线优惠码", desc: "为荣市、黄梅、河内等常用路线推荐优惠。", meta: "NGHEAN20" },
          { icon: WalletCards, title: "确认后付款", desc: "车公司确认上下车点后再完成付款。", meta: "灵活支付" },
          { icon: UserCheck, title: "多人优惠", desc: "3个座位以上的订单可记录同一上车点备注。", meta: "团体出行" }
        ]
      },
      payment: {
        title: "支付中心",
        desc: "集中查看支付状态、支付方式和发票备注。",
        highlight: "费用清楚",
        items: [
          { icon: CreditCard, title: "银行转账", desc: "转账备注填写订单号，方便管理员核对。", meta: "人工核对" },
          { icon: QrCode, title: "QR演示", desc: "二维码演示支付会记录到后台当日余额。", meta: "仅演示" },
          { icon: ReceiptText, title: "付款凭证", desc: "保存发票备注、附加费和订单总额。", meta: "凭证记录" }
        ]
      },
      luggage: {
        title: "行李与寄件",
        desc: "上车前记录行李、随车寄件和附加费说明。",
        highlight: "规则明确",
        items: [
          { icon: Luggage, title: "20公斤行李", desc: "每张车票显示标准托运行李说明。", meta: "已包含" },
          { icon: PackageCheck, title: "随车寄件", desc: "记录收件人、电话和下车点。", meta: "司机清单" },
          { icon: ClipboardList, title: "附加费备注", desc: "超大行李可提交给管理员确认。", meta: "上车前" }
        ]
      },
      operators: {
        title: "车公司信息",
        desc: "查看车型、车牌、服务和运营路线。",
        highlight: "已核实班次",
        items: [
          { icon: Bus, title: "Thanh Trung Limousine", desc: "16座商务车，显示清楚上下车点和确认状态。", meta: "荣市 - 黄梅" },
          { icon: Armchair, title: "座位图", desc: "付款前查看空座、已售座和已选座。", meta: "选座" },
          { icon: ShieldCheck, title: "车公司确认", desc: "管理员可确认、拒绝，并向乘客发送原因。", meta: "后台处理" }
        ]
      },
      support: {
        title: "客服中心",
        desc: "提供上车、改签、支付和联系车公司的帮助。",
        highlight: "24小时支持",
        items: [
          { icon: Phone, title: "热线", desc: "上车、支付或改签问题可拨打 1900 2026 或 0238 888 888。", meta: "快速处理" },
          { icon: Headphones, title: "改签请求", desc: "使用订单号提交改签或退票请求。", meta: "按政策处理" },
          { icon: MapPinned, title: "上车指南", desc: "出发前再次查看上下车点。", meta: "行前确认" }
        ]
      }
    };
  }

  return {
    promotions: {
      title: "Ưu đãi hữu ích",
      desc: "Lưu mã tuyến quen thuộc, ưu đãi thanh toán và voucher đi nhóm trước bước xác nhận.",
      highlight: "Áp dụng trước thanh toán",
      items: [
        { icon: Gift, title: "Mã tuyến quen", desc: "Gợi ý mã cho các tuyến Vinh, Hoàng Mai, Hà Nội hay đặt.", meta: "NGHEAN20" },
        { icon: WalletCards, title: "Thanh toán sau", desc: "Giữ chỗ trước, thanh toán sau khi nhà xe xác nhận điểm đón.", meta: "Linh hoạt" },
        { icon: UserCheck, title: "Ưu đãi đi nhóm", desc: "Ưu tiên đơn từ 3 ghế trở lên và cùng ghi chú điểm đón.", meta: "Theo nhóm" }
      ]
    },
    payment: {
      title: "Trung tâm thanh toán",
      desc: "Theo dõi trạng thái, phương thức thanh toán và ghi chú hóa đơn của từng vé.",
      highlight: "Minh bạch chi phí",
      items: [
        { icon: CreditCard, title: "Chuyển khoản", desc: "Hiển thị mã đặt chỗ trong nội dung để admin đối soát.", meta: "Đối soát thủ công" },
        { icon: QrCode, title: "QR demo", desc: "Thanh toán QR demo được ghi nhận vào số dư trong ngày của admin.", meta: "Chỉ mô phỏng" },
        { icon: ReceiptText, title: "Biên nhận", desc: "Lưu ghi chú hóa đơn, phụ thu và tổng tiền theo từng đơn.", meta: "Sẵn sàng xuất" }
      ]
    },
    luggage: {
      title: "Hành lý và gửi hàng",
      desc: "Ghi nhận hành lý, yêu cầu gửi hàng kèm xe và phụ thu trước khi lên xe.",
      highlight: "Chính sách rõ ràng",
      items: [
        { icon: Luggage, title: "Hành lý 20kg", desc: "Hành lý tiêu chuẩn được hiển thị cùng ghi chú vé.", meta: "Đã gồm" },
        { icon: PackageCheck, title: "Gửi hàng kèm xe", desc: "Ghi người nhận, số điện thoại và điểm trả hàng.", meta: "Gửi tài xế" },
        { icon: ClipboardList, title: "Phụ thu", desc: "Hành lý quá khổ được đánh dấu để admin xác nhận.", meta: "Trước giờ đi" }
      ]
    },
    operators: {
      title: "Thông tin nhà xe",
      desc: "So sánh loại xe, biển số, tiện ích và tuyến đang khai thác.",
      highlight: "Chuyến đã kiểm tra",
      items: [
        { icon: Bus, title: "Thành Trung Limousine", desc: "Limousine 16 chỗ, điểm đón rõ ràng và có xác nhận từ nhà xe.", meta: "Vinh - Hoàng Mai" },
        { icon: Armchair, title: "Ghế cao cấp", desc: "Hiển thị ghế trống, đã bán và đang chọn trước khi thanh toán.", meta: "Sơ đồ ghế" },
        { icon: ShieldCheck, title: "Cam kết nhà xe", desc: "Admin có thể xác nhận, từ chối và gửi lý do cho khách.", meta: "Quản trị kiểm soát" }
      ]
    },
    support: {
      title: "Trung tâm hỗ trợ",
      desc: "Hỗ trợ khách lên xe, đổi/hủy, thanh toán và liên hệ nhà xe.",
      highlight: "Hỗ trợ 24/7",
      items: [
        { icon: Phone, title: "Hotline", desc: "Gọi 1900 2026 hoặc 0238 888 888 khi cần hỗ trợ đón/trả, thanh toán hoặc đổi vé.", meta: "Khẩn cấp" },
        { icon: Headphones, title: "Yêu cầu đổi vé", desc: "Gửi yêu cầu đổi/hủy kèm mã đặt chỗ.", meta: "Theo chính sách" },
        { icon: MapPinned, title: "Hướng dẫn lên xe", desc: "Xem lại điểm đón/trả trước giờ xuất phát.", meta: "Trước chuyến" }
      ]
    }
  };
}

function getCancelContent(language: Language) {
  if (language === "en") {
    return {
      title: "Change and cancellation tools",
      desc: "Submit a request, track operator rejection reasons, and keep customer messages visible.",
      highlight: "Customer informed",
      rejectedTitle: "Rejected bookings",
      noRejected: "No rejected bookings. Confirmed and pending bookings remain in My tickets.",
      defaultReason: "Customer requests trip change or cancellation.",
      noRequestable: "No booking can be changed or cancelled right now.",
      requestPlaceholder: "Reason or preferred new trip...",
      requestSent: "Request sent to admin.",
      requestSubmit: "Send request",
      requestTitle: "Request change / cancellation",
      items: [
        { icon: RotateCcw, title: "Change trip", desc: "Send a request to change date, time, or seat.", meta: "Before departure" },
        { icon: Send, title: "Customer message", desc: "The rejection reason is stored and shown to the customer.", meta: "Automatic notice" },
        { icon: ShieldCheck, title: "Policy check", desc: "Show refund or surcharge notes before cancellation.", meta: "Operator policy" }
      ]
    };
  }

  if (language === "zh") {
    return {
      title: "改签与退票工具",
      desc: "提交请求、查看车公司拒绝原因，并保留乘客通知。",
      highlight: "乘客已通知",
      rejectedTitle: "被拒绝的订单",
      noRejected: "暂无被拒绝订单。已确认和待确认订单仍在我的车票中。",
      defaultReason: "乘客请求改签或退票。",
      noRequestable: "暂无可改签或退票的订单。",
      requestPlaceholder: "原因或希望更改的班次...",
      requestSent: "请求已发送到后台。",
      requestSubmit: "发送请求",
      requestTitle: "申请改签 / 退票",
      items: [
        { icon: RotateCcw, title: "改签", desc: "提交日期、时间或座位变更请求。", meta: "出发前" },
        { icon: Send, title: "乘客通知", desc: "拒绝原因会保存并显示给乘客。", meta: "自动通知" },
        { icon: ShieldCheck, title: "政策检查", desc: "退票前显示退款或附加费说明。", meta: "车公司政策" }
      ]
    };
  }

  return {
    title: "Công cụ đổi và hủy vé",
    desc: "Gửi yêu cầu đổi chuyến, theo dõi lý do nhà xe từ chối và giữ thông báo rõ ràng cho khách.",
    highlight: "Khách được thông báo",
    rejectedTitle: "Đơn bị từ chối",
    noRejected: "Chưa có đơn bị từ chối. Vé đã xác nhận và đang chờ vẫn nằm trong Vé của tôi.",
    defaultReason: "Khách yêu cầu đổi hoặc hủy vé.",
    noRequestable: "Chưa có vé có thể đổi hoặc hủy.",
    requestPlaceholder: "Nhập lý do hoặc chuyến muốn đổi...",
    requestSent: "Đã gửi yêu cầu đổi/hủy về admin.",
    requestSubmit: "Gửi yêu cầu",
    requestTitle: "Yêu cầu đổi / hủy vé",
    items: [
      { icon: RotateCcw, title: "Đổi chuyến", desc: "Gửi yêu cầu đổi ngày, giờ đi hoặc vị trí ghế.", meta: "Trước giờ khởi hành" },
      { icon: Send, title: "Thông báo khách", desc: "Lý do từ chối được lưu và hiển thị cho khách hàng.", meta: "Tự động gửi" },
      { icon: ShieldCheck, title: "Kiểm tra chính sách", desc: "Hiển thị ghi chú hoàn tiền hoặc phụ thu trước khi hủy.", meta: "Theo nhà xe" }
    ]
  };
}

function getHistoryContent(language: Language) {
  if (language === "en") {
    return {
      title: "Recent trips",
      desc: "Review routes, pickup points, seat codes, and previous payment totals.",
      empty: "No completed or saved trips yet.",
      countLabel: "ticket(s)"
    };
  }

  if (language === "zh") {
    return {
      title: "最近行程",
      desc: "查看路线、上车点、座位号和历史付款金额。",
      empty: "暂无已保存或已完成行程。",
      countLabel: "张票"
    };
  }

  return {
    title: "Chuyến gần đây",
    desc: "Xem lại tuyến, điểm đón, mã ghế và tổng tiền các lần đặt trước.",
    empty: "Chưa có chuyến đã lưu hoặc đã đi.",
    countLabel: "vé"
  };
}

function TicketCard({
  booking,
  copy,
  language
}: {
  booking: CustomerBooking;
  copy: TicketCopy;
  language: Language;
}) {
  return (
    <article className="rounded-2xl border border-[#edf2f7] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">{booking.route}</h3>
          <p className="mt-1 text-sm font-bold text-[#667085]">
            {formatDisplayDate(booking.travelDate, language)} · {booking.seats} {copy.ticketFields.seatUnit}
          </p>
        </div>
        <StatusBadge copy={copy} status={booking.status} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label={copy.ticketFields.code} value={booking.id} />
        <Info
          label={copy.ticketFields.seats}
          value={booking.seatCodes?.join(", ") || `${booking.seats} ${copy.ticketFields.seatUnit}`}
        />
        <Info label={copy.ticketFields.pickup} value={booking.pickupPoint || booking.from} />
        <Info label={copy.ticketFields.dropoff} value={booking.dropoffPoint || booking.to} />
        <Info label={copy.ticketFields.payment} value={booking.paymentMethod} />
        <Info label={copy.ticketFields.total} value={formatCurrency(booking.price, language)} />
      </div>
      {booking.rejectionReason ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-700">
          <span className="font-extrabold">{copy.ticketFields.rejectionReason}: </span>
          {booking.rejectionReason}
        </div>
      ) : null}
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8fafc] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[#111827]">{value}</p>
    </div>
  );
}

function StatusBadge({ copy, status }: { copy: TicketCopy; status: CustomerBooking["status"] }) {
  const className =
    status === "Đã xác nhận"
      ? "bg-[#ecfdf3] text-[#027a48]"
      : status === "Từ chối"
        ? "bg-[#fef3f2] text-[#b42318]"
        : status === "Đã hủy"
          ? "bg-[#fef3f2] text-[#b42318]"
          : "bg-[#fff7d6] text-[#a15c00]";

  return <span className={`rounded-full px-3 py-1 text-sm font-black ${className}`}>{getStatusText(status, copy)}</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#f8fafc] p-8 text-center">
      <Ticket className="mx-auto h-8 w-8 text-[#98a2b3]" />
      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-[#667085]">{text}</p>
    </div>
  );
}

function getStatusText(status: CustomerBooking["status"], copy: TicketCopy) {
  if (status === "Đã xác nhận") {
    return copy.statuses.confirmed;
  }

  if (status === "Từ chối") {
    return copy.statuses.rejected;
  }

  if (status === "Yêu cầu hủy/đổi") {
    return copy.statuses.changeRequested;
  }

  if (status === "Đã hủy") {
    return copy.statuses.canceled;
  }

  return copy.statuses.pending;
}

function formatCurrency(value: number, language: Language) {
  const locale = language === "en" ? "en-US" : language === "zh" ? "zh-CN" : "vi-VN";
  return `${value.toLocaleString(locale)}đ`;
}

function formatDisplayDate(date: string, language: Language) {
  const locale = language === "en" ? "en-US" : language === "zh" ? "zh-CN" : "vi-VN";
  const value = new Date(`${date}T00:00:00`);

  if (Number.isNaN(value.getTime())) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(value);
}
