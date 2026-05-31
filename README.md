# Thành Trung Limousine Booking Platform

Ứng dụng web đặt vé xe khách và quản trị vận hành cho Thành Trung Limousine.

## Loại dự án

Đây là **Next.js web application** gồm:

- Trang user/public: tìm chuyến, chọn ghế, đặt vé, QR demo, theo dõi chuyến, phản hồi.
- Trang admin: quản lý chuyến xe, vé, khách hàng, doanh thu, đánh giá, thông báo.
- Stack hiện tại: Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, ApexCharts.

## Chạy dự án
Yêu cầu Node.js 20.x hoặc mới hơn.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

Các route chính:

- `/`: landing page public.
- `/login`: khách hàng đăng nhập.
- `/register`: khách hàng tạo tài khoản.
- `/admin/login`: admin đăng nhập.
- `/admin`: dashboard admin sau khi đăng nhập.

Tài khoản admin demo:

- User: `admin`
- Password: `123456`

## Trạng thái dữ liệu hiện tại

- Dữ liệu đang lưu trong `localStorage`, phù hợp demo trên một trình duyệt.
- Chưa có database/server thật.
- Chưa nên dùng trực tiếp cho production vì tài khoản, vé, ghế, thanh toán chưa được xử lý ở server.

## Kiểm tra trước deploy

```bash
npm run lint
npm run build
```

## Cấu trúc chính

- `app/`: routes Next.js App Router.
- `components/`: giao diện user/admin.
- `lib/`: dữ liệu demo, i18n, helpers.
- `public/`: ảnh public.
- `legacy/`: file HTML/CSS/JS cũ để đối chiếu, không dùng trong app chính.

## Lộ trình production

1. Đưa code lên GitHub.
2. Tạo database PostgreSQL, khuyến nghị Supabase hoặc Neon.
3. Chuyển `localStorage` sang database thật.
4. Làm auth thật cho user/admin.
5. Tích hợp thanh toán thật hoặc webhook đối soát.
6. Deploy Next.js lên Vercel.
7. Gắn custom domain và SSL.
