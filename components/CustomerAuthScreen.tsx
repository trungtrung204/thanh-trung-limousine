"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bus, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

type AuthMode = "login" | "register";
type AuthApiUser = {
  email: string;
  id: string;
  name: string;
  phone: string | null;
  role: "USER" | "ADMIN" | "DRIVER";
};

export default function CustomerAuthScreen({ mode = "login" }: { mode?: AuthMode }) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<AuthMode>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [form, setForm] = useState({
    email: "",
    emailOrPhone: "",
    name: "",
    password: "",
    phone: ""
  });

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function checkCurrentSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as { user?: AuthApiUser | null };
        if (data.user?.role === "USER") {
          router.replace("/");
        }
      } catch {
        // Keep the customer on the form when the session check is unavailable.
      }
    }

    void checkCurrentSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAuth(endpoint: "/api/auth/login" | "/api/auth/register", payload: object) {
    const response = await fetch(endpoint, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const data = (await response.json()) as { error?: string; user?: AuthApiUser };

    if (!response.ok || !data.user) {
      throw new Error(data.error || "Không thể xác thực tài khoản.");
    }

    return data.user;
  }

  function completeAuth(user: AuthApiUser) {
    if (user.role !== "USER") {
      setMessage({ text: "Tài khoản này không thuộc khu vực khách hàng.", type: "error" });
      setIsSubmitting(false);
      return;
    }

    setMessage({ text: "Đăng nhập thành công.", type: "success" });
    window.setTimeout(() => router.replace("/"), 450);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (activeMode === "register") {
        if (!form.name.trim() || !form.email.trim() || !form.password) {
          setMessage({ text: "Vui lòng nhập đầy đủ thông tin đăng ký.", type: "error" });
          setIsSubmitting(false);
          return;
        }

        if (form.password.length < 6) {
          setMessage({ text: "Mật khẩu cần ít nhất 6 ký tự.", type: "error" });
          setIsSubmitting(false);
          return;
        }

        const user = await submitAuth("/api/auth/register", {
          email: form.email,
          name: form.name,
          password: form.password,
          phone: form.phone
        });
        completeAuth(user);
        return;
      }

      if (!form.emailOrPhone.trim() || !form.password) {
        setMessage({ text: "Vui lòng nhập email/số điện thoại và mật khẩu.", type: "error" });
        setIsSubmitting(false);
        return;
      }

      const user = await submitAuth("/api/auth/login", {
        identifier: form.emailOrPhone,
        password: form.password,
        role: "USER"
      });
      completeAuth(user);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Không thể đăng nhập.",
        type: "error"
      });
      setIsSubmitting(false);
    }
  }

  const isRegister = activeMode === "register";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#101828]">
      <header className="border-b border-[#d9e2ef] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative h-10 w-10 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#d9e2ef]">
              <Image alt="Logo Thành Trung Limousine" className="object-cover" fill sizes="40px" src="/logoicon.png" />
            </span>
            <span>
              <span className="block text-base font-black text-[#073b7a]">Thành Trung Limousine</span>
              <span className="block text-xs font-semibold text-[#667085]">Đặt vé xe khách</span>
            </span>
          </Link>
          <Link className="text-sm font-bold text-[#075bbf]" href="/">
            Trang chủ
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-64px)] lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-[#eff8ff] px-3 py-2 text-sm font-bold text-[#075bbf]">
              <ShieldCheck className="h-4 w-4" />
              Tài khoản khách hàng
            </div>
            <h1 className="mt-5 text-5xl font-black leading-tight text-[#073b7a]">
              Quản lý vé, thanh toán và hành trình trong một nơi.
            </h1>
            <p className="mt-5 text-base leading-8 text-[#667085]">
              Đăng nhập để giữ ghế, xem trạng thái thanh toán và nhận vé điện tử sau khi nhà xe xác nhận.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["60 giây", "Tạo đơn"],
                ["QR", "Thanh toán"],
                ["24/7", "Hỗ trợ"]
              ].map(([value, label]) => (
                <div className="rounded-lg border border-[#e4e7ec] bg-white p-4 shadow-sm" key={label}>
                  <p className="text-2xl font-black text-[#075bbf]">{value}</p>
                  <p className="mt-1 text-sm font-semibold text-[#667085]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#e4e7ec] bg-white shadow-[0_24px_80px_rgba(16,24,40,0.10)]">
          <div className="border-b border-[#eaecf0] p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eff8ff] text-[#075bbf]">
                <Bus className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black">{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h1>
                <p className="mt-1 text-sm text-[#667085]">
                  {isRegister ? "Thông tin ngắn gọn để đặt vé nhanh hơn." : "Tiếp tục đặt vé và xem vé của bạn."}
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-4 p-6" noValidate onSubmit={handleSubmit}>
            {isRegister ? (
              <Field label="Họ và tên" icon={<UserRound className="h-4 w-4" />}>
                <input
                  autoComplete="name"
                  className="h-full flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                />
              </Field>
            ) : null}

            <Field label={isRegister ? "Email" : "Email hoặc số điện thoại"} icon={<Mail className="h-4 w-4" />}>
              <input
                autoComplete={isRegister ? "email" : "username"}
                className="h-full flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
                onChange={(event) => updateField(isRegister ? "email" : "emailOrPhone", event.target.value)}
                placeholder={isRegister ? "email@example.com" : "email hoặc số điện thoại"}
                type={isRegister ? "email" : "text"}
                value={isRegister ? form.email : form.emailOrPhone}
              />
            </Field>

            {isRegister ? (
              <Field label="Số điện thoại" icon={<Phone className="h-4 w-4" />}>
                <input
                  autoComplete="tel"
                  className="h-full flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="09xxxxxxxx"
                  value={form.phone}
                />
              </Field>
            ) : null}

            <Field label="Mật khẩu" icon={<Lock className="h-4 w-4" />}>
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="h-full flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Nhập mật khẩu"
                type={showPassword ? "text" : "password"}
                value={form.password}
              />
              <button
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="rounded-md p-1 text-[#667085] hover:bg-[#f2f4f7]"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            {message ? (
              <p
                className={[
                  "rounded-lg px-3 py-2 text-sm font-bold",
                  message.type === "success" ? "bg-[#ecfdf3] text-[#027a48]" : "bg-[#fff1f3] text-[#b42318]"
                ].join(" ")}
              >
                {message.text}
              </p>
            ) : null}

            <button
              className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#073b7a] px-4 text-sm font-black text-white hover:bg-[#052f61] disabled:bg-[#98a2b3]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
            </button>

            <p className="text-center text-sm text-[#667085]">
              {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
              <Link className="font-black text-[#075bbf]" href={isRegister ? "/login" : "/register"}>
                {isRegister ? "Đăng nhập" : "Đăng ký"}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({ children, icon, label }: { children: ReactNode; icon: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-[#344054]">{label}</span>
      <span className="flex h-12 items-center gap-3 rounded-md border border-[#d0d5dd] bg-white px-3 text-[#075bbf] focus-within:border-[#075bbf] focus-within:ring-4 focus-within:ring-[#eff8ff]">
        {icon}
        {children}
      </span>
    </label>
  );
}
