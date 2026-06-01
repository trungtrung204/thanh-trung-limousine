"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LogIn, Route, ShieldCheck, UserRound } from "lucide-react";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as { user?: { role?: string } | null };
        if (data.user?.role === "ADMIN") {
          router.replace("/admin");
        }
      } catch {
        // Keep the operator on the login form when the session check is unavailable.
      }
    }

    void checkAdminSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const nextUsername = username.trim();
    if (!nextUsername || !password) {
      setMessage({ text: "Vui lòng nhập đầy đủ tài khoản và mật khẩu.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({
          identifier: nextUsername,
          password,
          remember,
          role: "ADMIN"
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage({ text: data.error || "Không thể đăng nhập.", type: "error" });
        setIsSubmitting(false);
        return;
      }

      setMessage({ text: "Đăng nhập thành công. Đang chuyển trang...", type: "success" });
      window.setTimeout(() => router.replace("/admin"), 450);
    } catch {
      setMessage({ text: "Không thể đăng nhập. Vui lòng thử lại.", type: "error" });
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f5f7fb] text-[#101828] lg:grid-cols-[minmax(0,1fr)_460px]">
      <section className="relative hidden overflow-hidden bg-[#073b7a] px-10 py-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-white shadow-sm">
            <Image alt="Logo Thành Trung Limousine" className="object-cover" fill sizes="44px" src="/logo.jpg" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#d7ebff]">Thành Trung Limousine</p>
            <h1 className="text-xl font-black">Admin Operations</h1>
          </div>
        </div>

        <div className="relative max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-[#ffd166]">
            <Route className="h-4 w-4" />
            Khu vực quản trị nội bộ
          </div>
          <h2 className="text-5xl font-black leading-tight">
            Điều hành chuyến xe, vé và thanh toán trong một màn hình.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#d7ebff]">
            Dành cho nhân sự vận hành Thành Trung Limousine xử lý lịch chạy, booking, khách hàng và phản hồi.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-sm font-semibold text-[#d7ebff]">
          <ShieldCheck className="h-4 w-4 text-[#ffd166]" />
          Truy cập bảo vệ bằng tài khoản quản trị
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8">
        <div className="w-full max-w-md rounded-lg border border-[#e4e7ec] bg-white shadow-[0_24px_80px_rgba(16,24,40,0.10)]">
          <div className="border-b border-[#eaecf0] p-6">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#d9e2ef]">
                <Image alt="Logo Thành Trung Limousine" className="object-cover" fill sizes="40px" src="/logo.jpg" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#667085]">Thành Trung Limousine</p>
                <p className="font-black text-[#101828]">Admin Operations</p>
              </div>
            </div>
            <h1 className="text-2xl font-black text-[#101828]">Đăng nhập quản trị</h1>
            <p className="mt-2 text-sm leading-6 text-[#667085]">Khu vực quản trị nội bộ.</p>
          </div>

          <form className="space-y-5 p-6" noValidate onSubmit={handleSubmit}>
            <Field label="Tài khoản" icon={<UserRound className="h-4 w-4" />}>
              <input
                autoComplete="username"
                className="h-full flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Email hoặc tài khoản"
                type="text"
                value={username}
              />
            </Field>

            <Field label="Mật khẩu" icon={<Lock className="h-4 w-4" />}>
              <input
                autoComplete="current-password"
                className="h-full flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                type={showPassword ? "text" : "password"}
                value={password}
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

            <label className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
              <input
                checked={remember}
                className="rounded border-[#d0d5dd] text-[#075bbf] focus:ring-[#075bbf]"
                onChange={(event) => setRemember(event.target.checked)}
                type="checkbox"
              />
              Duy trì phiên đăng nhập
            </label>

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
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#073b7a] px-4 text-sm font-black text-white hover:bg-[#052f61] disabled:bg-[#98a2b3]"
              disabled={isSubmitting}
              type="submit"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
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
