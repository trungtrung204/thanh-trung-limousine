"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Route,
  ShieldCheck,
  UserRound
} from "lucide-react";

const demoAccount = {
  username: "admin",
  password: "123456",
  displayName: "Admin"
};

const adminAuthKeys = {
  loggedIn: "admin_auth_logged_in",
  name: "admin_auth_name"
};

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isLoggedIn =
      window.localStorage.getItem(adminAuthKeys.loggedIn) === "1" ||
      window.sessionStorage.getItem(adminAuthKeys.loggedIn) === "1";

    if (isLoggedIn) {
      router.replace("/admin");
    }
  }, [router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const nextUsername = username.trim();
    if (!nextUsername || !password) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." });
      return;
    }

    if (nextUsername !== demoAccount.username || password !== demoAccount.password) {
      setMessage({ type: "error", text: "Sai tài khoản hoặc mật khẩu." });
      return;
    }

    setIsSubmitting(true);
    window.localStorage.removeItem(adminAuthKeys.loggedIn);
    window.localStorage.removeItem(adminAuthKeys.name);
    window.sessionStorage.removeItem(adminAuthKeys.loggedIn);
    window.sessionStorage.removeItem(adminAuthKeys.name);

    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem(adminAuthKeys.loggedIn, "1");
    storage.setItem(adminAuthKeys.name, demoAccount.displayName);
    setMessage({ type: "success", text: "Đăng nhập thành công. Đang chuyển trang..." });

    window.setTimeout(() => router.replace("/admin"), 520);
  }

  return (
    <main className="grid min-h-screen bg-[#f4f7fb] text-gray-900 lg:grid-cols-[minmax(0,1.02fr)_minmax(460px,0.98fr)]">
      <section className="relative hidden overflow-hidden border-r border-[#dbe7f3] bg-[#073b7a] px-10 py-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#ffd43b,#0a67d8,#ffffff)]" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ffd43b] text-[#111827] shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#bad7f5]">
              Thành Trung
            </p>
            <h1 className="text-xl font-black text-white">Admin Operations</h1>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative max-w-xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-[#ffd43b] backdrop-blur">
            <Route className="h-4 w-4" />
            Điều hành tuyến xe hôm nay
          </div>
          <h2 className="text-5xl font-black leading-[1.05] tracking-normal text-white">
            Quản lý chuyến, vé và doanh thu trong một màn hình.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#d7ebff]">
            Hôm nay có 124 chuyến, 1.256 vé đã bán và các cảnh báo vận hành được cập
            nhật liên tục.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["124", "Chuyến/ngày"],
              ["1.256", "Vé đã bán"],
              ["98%", "Đúng giờ"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-black text-[#ffd43b]">{value}</p>
                <p className="mt-1 text-sm font-semibold text-[#d7ebff]">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative flex items-center gap-2 text-sm font-semibold text-[#d7ebff]">
          <ShieldCheck className="h-4 w-4 text-[#ffd43b]" />
          Khu vực quản trị nội bộ
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 230, damping: 24 }}
          className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#e6eef8] bg-white shadow-[0_24px_80px_rgba(16,24,40,0.12)]"
        >
          <div className="h-1.5 bg-[linear-gradient(90deg,#073b7a,#0a67d8,#ffd43b)]" />
          <div className="p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#073b7a] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Thành Trung
              </p>
              <p className="font-semibold text-gray-950">Admin Operations</p>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-950">Đăng nhập quản trị</h1>
            <p className="mt-2 text-sm text-gray-500">Tài khoản demo: admin / 123456</p>
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
              Đây là khu vực quản trị. Chỉ nhân sự vận hành được phép truy cập.
            </p>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Tài khoản</span>
              <span className="flex h-12 items-center gap-3 rounded-2xl border border-[#d0d5dd] bg-white px-4 transition focus-within:border-[#075bbf] focus-within:ring-4 focus-within:ring-[#e8f3ff]">
                <UserRound className="h-4 w-4 text-[#075bbf]" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-full flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
                  autoComplete="username"
                  placeholder="admin"
                  type="text"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Mật khẩu</span>
              <span className="flex h-12 items-center gap-3 rounded-2xl border border-[#d0d5dd] bg-white px-4 transition focus-within:border-[#075bbf] focus-within:ring-4 focus-within:ring-[#e8f3ff]">
                <Lock className="h-4 w-4 text-[#075bbf]" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="rounded border-gray-300 text-[#075bbf] focus:ring-[#075bbf]"
                  type="checkbox"
                />
                Nhớ đăng nhập
              </label>
              <button className="text-sm font-bold text-[#075bbf] hover:text-[#073b7a]" type="button">
                Quên mật khẩu?
              </button>
            </div>

            <AnimatePresence mode="wait">
              {message ? (
                <motion.div
                  key={message.text}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={
                    message.type === "success"
                      ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                      : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  }
                  role="status"
                >
                  {message.text}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#073b7a] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#075bbf] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
