"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from "lucide-react";
import {
  createBookingFromPending,
  getCurrentCustomer,
  loginCustomer,
  registerCustomer
} from "@/lib/local-db";

type AuthMode = "login" | "register";

export default function CustomerAuthScreen({ mode = "login" }: { mode?: AuthMode }) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<AuthMode>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );
  const [form, setForm] = useState({
    emailOrPhone: "",
    email: "",
    name: "",
    password: "",
    phone: ""
  });

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    const customer = getCurrentCustomer();
    if (customer) {
      router.replace("/");
    }
  }, [router]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function completeAuth(customer: NonNullable<ReturnType<typeof getCurrentCustomer>>) {
    let booking = null;
    try {
      booking = createBookingFromPending(customer);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Không thể tạo vé đang chờ. Vui lòng đặt lại.",
        type: "error"
      });
      return;
    }
    setMessage({
      text: booking
        ? "Đăng nhập thành công. Vé đang chờ nhà xe xác nhận."
        : "Đăng nhập thành công.",
      type: "success"
    });
    window.setTimeout(() => router.replace(booking ? "/?booking=created" : "/"), 450);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    if (activeMode === "register") {
      if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
        setMessage({ type: "error", text: "Vui lòng nhập đầy đủ thông tin đăng ký." });
        setIsSubmitting(false);
        return;
      }

      if (form.password.length < 6) {
        setMessage({ type: "error", text: "Mật khẩu cần ít nhất 6 ký tự." });
        setIsSubmitting(false);
        return;
      }

      const result = registerCustomer({
        email: form.email,
        name: form.name,
        password: form.password,
        phone: form.phone
      });

      if (result.error || !result.customer) {
        setMessage({ type: "error", text: result.error || "Không thể tạo tài khoản." });
        setIsSubmitting(false);
        return;
      }

      completeAuth(result.customer);
      return;
    }

    if (!form.emailOrPhone.trim() || !form.password) {
      setMessage({ type: "error", text: "Vui lòng nhập email/số điện thoại và mật khẩu." });
      setIsSubmitting(false);
      return;
    }

    const result = loginCustomer(form.emailOrPhone, form.password);
    if (result.error || !result.customer) {
      setMessage({ type: "error", text: result.error || "Không thể đăng nhập." });
      setIsSubmitting(false);
      return;
    }

    completeAuth(result.customer);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header className="border-b border-[#dbe7f3] bg-white">
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
          <Link className="text-sm font-bold text-[#0a67d8]" href="/">
            Về trang chủ
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,0.95fr)_460px] lg:items-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:block"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#e8f3ff] px-4 py-2 text-sm font-bold text-[#0a67d8]">
              <ShieldCheck className="h-4 w-4" />
              Tài khoản khách hàng
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight">
              Đặt vé nhanh hơn và theo dõi chuyến đi của bạn.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#667085]">
              Sau khi đăng nhập, mọi yêu cầu đặt xe sẽ được lưu vào hệ thống và gửi về nhà xe
              để xác nhận.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["60s", "Tạo đơn"],
                ["24/7", "Hỗ trợ"],
                ["100%", "Lưu lịch sử"]
              ].map(([value, label]) => (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#edf2f7]" key={label}>
                  <p className="text-3xl font-extrabold text-[#0a67d8]">{value}</p>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(16,24,40,0.12)] ring-1 ring-[#edf2f7]"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-[#f2f4f7] p-1">
            <button
              className={
                activeMode === "login"
                  ? "rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#0a67d8] shadow-sm"
                  : "rounded-xl px-4 py-3 text-sm font-bold text-[#667085]"
              }
              onClick={() => {
                setActiveMode("login");
                setMessage(null);
              }}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={
                activeMode === "register"
                  ? "rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#0a67d8] shadow-sm"
                  : "rounded-xl px-4 py-3 text-sm font-bold text-[#667085]"
              }
              onClick={() => {
                setActiveMode("register");
                setMessage(null);
              }}
              type="button"
            >
              Tạo tài khoản
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold">
              {activeMode === "login" ? "Đăng nhập khách hàng" : "Tạo tài khoản khách hàng"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              {activeMode === "login"
                ? "Nhập email hoặc số điện thoại đã đăng ký."
                : "Thông tin này sẽ dùng để nhà xe liên hệ xác nhận vé."}
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {activeMode === "register" ? (
              <>
                <Field icon={UserRound} label="Họ và tên">
                  <input
                    className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                  />
                </Field>
                <Field icon={Mail} label="Email">
                  <input
                    className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="ban@example.com"
                    type="email"
                    value={form.email}
                  />
                </Field>
                <Field icon={Phone} label="Số điện thoại">
                  <input
                    className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="09xxxxxxxx"
                    value={form.phone}
                  />
                </Field>
              </>
            ) : (
              <Field icon={UserRound} label="Email hoặc số điện thoại">
                <input
                  className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                  onChange={(event) => updateField("emailOrPhone", event.target.value)}
                  placeholder="email hoặc số điện thoại"
                  value={form.emailOrPhone}
                />
              </Field>
            )}

            <Field icon={Lock} label="Mật khẩu">
              <input
                className="h-full flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                type={showPassword ? "text" : "password"}
                value={form.password}
              />
              <button
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="rounded-lg p-1 text-[#667085] hover:bg-[#f2f4f7]"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            <AnimatePresence>
              {message ? (
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    message.type === "success"
                      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                      : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  }
                  exit={{ opacity: 0, y: -4 }}
                  initial={{ opacity: 0, y: -4 }}
                  role="status"
                >
                  {message.text}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ffd43b] text-base font-extrabold text-[#111827] transition hover:bg-[#ffcb05] disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              <Bus className="h-5 w-5" />
              {activeMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>
        </motion.div>
      </section>
    </main>
  );
}

function Field({
  children,
  icon: Icon,
  label
}: {
  children: React.ReactNode;
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#344054]">{label}</span>
      <span className="flex h-12 items-center gap-3 rounded-2xl border border-[#d0d5dd] bg-white px-4 transition focus-within:border-[#0a67d8] focus-within:ring-4 focus-within:ring-[#e8f3ff]">
        <Icon className="h-5 w-5 shrink-0 text-[#0a67d8]" />
        {children}
      </span>
    </label>
  );
}
