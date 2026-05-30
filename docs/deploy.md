# Deploy chính thức

Tài liệu này dùng cho dự án Thành Trung Limousine. Dự án hiện là web Next.js có giao diện user/admin, nhưng dữ liệu vẫn đang là demo `localStorage`, nên cần làm thêm database và auth thật trước khi nhận khách thật.

## Tóm tắt hướng đi khuyến nghị

- Code: GitHub.
- Hosting frontend/server Next.js: Vercel.
- Database: Supabase hoặc Neon PostgreSQL.
- Domain: mua ở nhà cung cấp tên miền bất kỳ, sau đó trỏ DNS về Vercel.
- Thanh toán: hiện đang QR demo; khi chạy thật cần webhook hoặc đối soát từ cổng thanh toán/ngân hàng.

## 1. Kiểm tra dự án local

```bash
npm install
npm run lint
npm run build
```

Nếu hai lệnh `lint` và `build` đều chạy thành công thì mới deploy.

## 2. Đưa code lên GitHub

Trong dự án này mình đã tạo Git commit đầu tiên. Khi bạn có repository GitHub, chỉ cần thêm remote và push:

```bash
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

Không commit các file sau:

- `.env`
- `.env.local`
- `.next/`
- `node_modules/`
- `.tools/`
- file nén như `.rar`, `.zip`

Nếu Git báo remote đã tồn tại, dùng:

```bash
git remote set-url origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

## 3. Tạo database production

Khuyến nghị dùng PostgreSQL qua Supabase hoặc Neon.

Các bảng tối thiểu cần có trước khi chạy thật:

- `users`: tài khoản khách hàng.
- `admins`: tài khoản quản trị.
- `routes`: tuyến xe, điểm đi, điểm đến, giá cơ bản.
- `trips`: chuyến xe cụ thể theo ngày/giờ.
- `seats`: sơ đồ ghế và trạng thái ghế.
- `bookings`: vé khách đặt, trạng thái xác nhận/từ chối/hủy.
- `payments`: giao dịch thanh toán.
- `reviews`: phản hồi chuyến xe.
- `notifications`: thông báo gửi khách/tài xế.

Sau khi tạo database, lấy `DATABASE_URL` và thêm vào:

- Local: `.env.local`
- Vercel: Project Settings -> Environment Variables

Mẫu biến môi trường đã có trong `.env.example`.

## 4. Chuyển dữ liệu demo sang database

Hiện tại nhiều dữ liệu đang lưu trong `lib/local-db.ts` bằng `localStorage`. Trước production cần thay bằng API/database để:

- Không mất dữ liệu khi đổi trình duyệt/máy.
- Tránh đặt trùng ghế khi nhiều khách đặt cùng lúc.
- Admin và user nhìn cùng một dữ liệu thật.
- Lưu lịch sử thanh toán, phản hồi, thông báo.

Thứ tự làm hợp lý:

1. Tạo schema database.
2. Viết API routes cho booking, trips, customers, payments, reviews.
3. Đổi user/admin UI từ `localStorage` sang gọi API.
4. Thêm kiểm tra giữ ghế và thanh toán ở server.

## 5. Deploy Vercel

1. Đăng nhập Vercel.
2. Import GitHub repository.
3. Framework Preset: `Next.js`.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Thêm Environment Variables.
7. Deploy.

Sau khi deploy, Vercel sẽ cấp domain tạm dạng:

```text
https://<project-name>.vercel.app
```

## 6. Gắn tên miền

Trong Vercel:

1. Project -> Settings -> Domains.
2. Add domain, ví dụ `thanhtrunglimousine.vn`.
3. Làm theo DNS record Vercel yêu cầu.
4. Với domain gốc thường là `A record`.
5. Với `www` thường là `CNAME`.
6. Chờ DNS verify và SSL tự cấp.

Ví dụ cấu hình thường gặp:

```text
@      A      76.76.21.21
www    CNAME  cname.vercel-dns.com
```

Lưu ý: hãy làm theo record Vercel hiển thị trong project của bạn, vì giá trị có thể thay đổi theo thời điểm/cấu hình.

## 7. Kiểm tra sau deploy

- Mở trang chủ.
- Đăng ký tài khoản khách.
- Đặt vé thử.
- Đăng nhập admin.
- Kiểm tra vé mới xuất hiện trong admin.
- Duyệt/từ chối vé thử.
- Kiểm tra thông báo phía user.
- Chạy thử QR demo và doanh thu demo.
- Kiểm tra giao diện mobile.

## 8. Việc bắt buộc trước khi nhận khách thật

- Thay `localStorage` bằng database.
- Hash mật khẩu, không lưu plaintext.
- Phân quyền admin/user bằng session/token.
- Kiểm tra trùng ghế ở server.
- Tích hợp thanh toán thật hoặc webhook đối soát.
- Thêm backup database.
- Thêm điều khoản, chính sách hoàn/hủy, hotline thật.

## 9. Thông tin cần chuẩn bị

Bạn cần có:

- Tài khoản GitHub.
- Tài khoản Vercel.
- Tài khoản Supabase hoặc Neon.
- Tên miền đã mua.
- Email/số điện thoại hotline chính thức.
- Chính sách hoàn/hủy vé.
- Tài khoản ngân hàng hoặc cổng thanh toán nếu bỏ QR demo.
