# Kế Hoạch Chi Tiết Triển Khai: Khắc Phục Toàn Diện "AI Slop UI" (KOL Manager)

## I. Mục Tiêu & Tiêu Chuẩn Thẩm Mỹ (Design North Star)

Dự án **KOL Manager** chuyển mình từ giao diện mang tính chất **"AI-generated SaaS Template"** (bảng màu cầu vồng pastel ngẫu hứng, card rập khuôn, hiệu ứng chuyển động lòe loẹt vô nghĩa) sang phong cách **"Modern High-Density Workstation"** (Lấy cảm hứng từ *Linear, Raycast, Attio, Vercel Dashboard*).

### Các nguyên tắc thiết kế cốt lõi:
1. **Bảng màu có kỷ luật (60-30-10 & Neutral Dominance):**
   - Loại bỏ toàn bộ "hội chứng cầu vồng" pastel (mỗi card/button một màu riêng).
   - Nền & Bề mặt (Surfaces): Sử dụng bảng màu than chì / zinc sâu có chiều sâu quang học (Layer 0, Layer 1, Layer 2), border tinh xảo (`white/[0.08]` trên dark mode và `black/[0.06]` trên light mode) với inner highlight viền trên (`box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.06)`).
   - 1 Màu Accent duy nhất: Deep Electric Indigo/Violet (`#6366f1` / `#4f46e5`) cho các tương tác trọng tâm (CTA chính, focus ring, active status).
   - Semantic Status: Xanh ngọc (Hoàn tất/Tiền về), Vàng hổ phách (Đến hạn), Đỏ Ruby (Quá hạn) sử dụng tiết chế, thanh mảnh, không gây nhiễu thị giác.
2. **Typography & Tabular Numbers:**
   - Kích hoạt `font-feature-settings: "tnum"` cho toàn bộ số liệu tiền tệ (VND), số follower, deadline và mã booking để loại bỏ hiện tượng giật chữ số khi cập nhật.
   - Phân cấp kiểu chữ (Type scale): Giảm bớt sự lạm dụng `font-extrabold` / `font-black`, kết hợp `font-medium` với `tracking-tight` cho tiêu đề và `tracking-wider text-[11px] font-semibold uppercase` cho các nhãn phân loại (labels).
3. **Mật độ thông tin cao & Bố cục tinh gọn (High Data Density & Ergonomics):**
   - Giảm các khoảng trống vô nghĩa, tối ưu không gian hiển thị cho bảng biểu, Kanban và các bộ lọc.
   - Dashboard có nhịp điệu (Visual Hierarchy): Nhóm rõ ràng **Cần xử lý khẩn cấp** &rarr; **Tiến độ phễu hợp tác** &rarr; **Chỉ số tổng hợp**.
4. **Loại bỏ triệt để Gimmicky Micro-interactions:**
   - Xóa bỏ thanh loading gradient 3 màu tím-hồng-xanh `animate-pulse` trên navbar.
   - Xóa bỏ các chấm tròn `animate-ping` lòe loẹt.
   - Thay thế bằng micro-interactions mượt mà, tinh tế (subtle hover lift, smooth background transitions, crisp focus rings).

---

## II. Lộ Trình Triển Khai 5 Giai Đoạn (Execution Roadmap)

### Phase 1: Design Tokens & Foundations (CSS & Typography)
- **Tập tin:** `app/globals.css`, `app/layout.tsx`
- **Hành động cụ thể:**
  1. Tái cấu trúc bộ CSS Variables trong `app/globals.css`:
     - Định nghĩa hệ thống màu bề mặt: `--surface-0`, `--surface-1`, `--surface-2`, `--surface-elevated`.
     - Định nghĩa token border vi mô: `--border-subtle`, `--border-default`, `--border-strong`.
     - Chuẩn hóa màu chữ: `--text-primary`, `--text-secondary`, `--text-muted`.
  2. Bổ sung utility classes cho `tabular-nums` và subtle surface inner bevels.
  3. Dọn dẹp các selector CSS dư thừa, chuẩn hóa thanh cuộn siêu mỏng đồng bộ light/dark.

### Phase 2: Global Shell & Core UI Controls (Navbar, Buttons & Form Elements)
- **Tập tin:**
  - `components/navbar.tsx`
  - `components/ui/date-picker.tsx`
  - `components/ui/custom-select.tsx`
  - `components/ui/floating-action-bar.tsx`
- **Hành động cụ thể:**
  1. **Navbar Redesign:**
     - Thay thế logo ô vuông đen chữ K bằng Monogram Icon vector thương hiệu sắc nét, hiện đại.
     - Bỏ dải gradient loading bar 3 màu lòe loẹt, thay bằng slim neutral accent progress bar tinh tế.
     - Tút lại Nav Links: Bỏ chấm `animate-ping`, làm hiệu ứng segment navigation hiện đại.
     - Profile badge & nút đăng xuất gọn gàng, thanh lịch.
  2. **DatePicker & CustomSelect:**
     - Thu nhỏ góc bo từ `rounded-2xl` quá khổ về `rounded-xl` chuẩn mực.
     - Popover lịch: Thiết kế lại header tháng/năm, weekday header tối giản, ngày được chọn sắc sảo với focus ring mảnh.
     - Dropdown select: Tối ưu thanh tìm kiếm, hover state dịu mắt, hỗ trợ hiển thị icon/badge phân loại sắc nét.
  3. **Floating Action Bar:**
     - Thiết kế lại thanh pill nổi: Tinh tế hơn, dùng glassmorphism chuẩn (`backdrop-blur-xl bg-zinc-950/80 border border-white/10`), bỏ gradient nút bấm chói lọi, phím tắt (shortcuts Kbd) hiển thị gọn gàng.

### Phase 3: Dashboard Re-architecture (Tổng Quan Sắc Bén)
- **Tập tin:** `app/(protected)/dashboard/page.tsx`
- **Hành động cụ thể:**
  1. **Header & Thao tác nhanh:**
     - Nhóm Quick Actions thành Action Strip thanh lịch, bỏ 5 màu border cầu vồng, dùng style monochrome tinh tế với icon sắc sảo.
     - Badge "Supabase Live" chuyển thành status dot nhỏ giọt dịu dàng, chuyên nghiệp.
  2. **Khối chỉ số KPI (Key Metrics Group):**
     - Tổ chức lại 6 cards rập khuôn thành một khối thống kê có cấu trúc chính - phụ rõ rệt:
       - Cặp chỉ số cốt lõi: *Tổng KOLs* & *Tổng Hợp tác*.
       - Cụm trạng thái vận hành: *Đang thực hiện*, *Video đã lên*, *Sắp đến hạn*, *Task chờ*.
     - Sử dụng font `tabular-nums`, icon tone-on-tone tinh tế, không còn 6 màu pastel đối chọi nhau.
  3. **Action Center (Hợp tác Quá hạn & Deadline sắp tới):**
     - Đặt tab chuyển đổi thông minh hoặc 2 cột đối xứng với visual hierarchy rõ rệt: Badge mức độ khẩn cấp (Hôm nay, Ngày mai, Quá hạn X ngày) có tông màu chuẩn mực.
     - Format ngày tháng, username KOL `@username`, mã booking hiển thị sạch sẽ, dễ quét mắt.
  4. **Pipeline Trạng thái Booking (Status Distribution):**
     - Thanh tiến độ segmented thanh mảnh, các bước trạng thái được bố trí thành phễu mini có số lượng và tỷ lệ % sắc nét, không bị cồng kềnh.
  5. **Đầu việc vận hành & Video mới đăng:**
     - Danh sách video gần đây có thumbnail/icon trang trọng, link xem video mở ngoài tinh gọn.

### Phase 4: High-Density Data Views (KOLs, Bookings, Tasks, Products)
- **Tập tin:**
  - `app/(protected)/kols/kols-client.tsx`
  - `app/(protected)/bookings/bookings-client.tsx`
  - `app/(protected)/bookings/components/bookings-roi-dashboard.tsx`
  - `app/(protected)/tasks/tasks-client.tsx`
- **Hành động cụ thể:**
  1. **KOLs Management:**
     - Tinh chỉnh filter bar theo nền tảng: Bỏ màu riêng biệt lòe loẹt của từng tab nền tảng, đưa về bộ lọc có logo platform sắc nét và số lượng đếm tinh gọn.
     - Table rows: Padding thanh thoát, avatar gọn gàng, format follower có chữ viết tắt (K, M) rõ ràng, action menu tinh chỉnh.
  2. **Bookings Kanban & Table:**
     - ROI Mini Dashboard: Tối ưu các chỉ số tài chính (Tổng ngân sách, Đã thanh toán, Còn lại, CPV) hiển thị sắc gọn dạng financial stats.
     - Kanban columns: Thẻ booking có header gọn, trạng thái thanh toán và deadline thể hiện bằng dot tinh tế.
  3. **Tasks:**
     - Chuẩn hóa lại bảng màu của 7 loại công việc (`TYPE_BADGE_STYLES`) về bảng màu trung tính kết hợp status dot tối giản.

### Phase 5: Auth Page & Visual Polish Hoàn Thiện
- **Tập tin:** `app/login/login-form.tsx`
- **Hành động cụ thể:**
  1. Nâng cấp trang Login: Background gradient lưới tinh tế (subtle dark mesh grid), logo mark đồng bộ với Navbar, form card kính mờ sắc nét.
  2. Kiểm tra tính nhất quán toàn bộ theme (Light Mode / Dark Mode), độ tương phản đạt chuẩn WCAG AA.
  3. Kiểm tra zero layout shifts và responsiveness mượt mà trên mobile, tablet, desktop.
