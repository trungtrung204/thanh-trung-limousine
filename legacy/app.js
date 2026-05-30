// ===== Sidebar toggle (desktop + mobile) =====
const sidebar = document.getElementById("sidebar");
const toggleSidebar = document.getElementById("toggleSidebar");
const openSidebar = document.getElementById("openSidebar");

toggleSidebar?.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

openSidebar?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ===== Charts =====
const barCtx = document.getElementById("barChart");
const pieCtx = document.getElementById("pieChart");

function randomSeries(n, min, max){
  return Array.from({length:n}, () => Math.floor(Math.random()*(max-min+1))+min);
}

// Bar: doanh thu 7 ngày
const labels = ["T2","T3","T4","T5","T6","T7","CN"];
let barData = [32, 18, 24, 15, 28, 12, 30]; // đơn vị: triệu (demo)

const barChart = new Chart(barCtx, {
  type: "bar",
  data: {
    labels,
    datasets: [{
      label: "Doanh thu (triệu)",
      data: barData,
      backgroundColor: "rgba(47,111,237,0.75)",
      borderRadius: 10
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "#eef2ff" } },
      x: { grid: { display: false } }
    }
  }
});

// Pie: tỷ lệ chuyến xe
let pieValues = [75, 15, 10];
const pieChart = new Chart(pieCtx, {
  type: "doughnut",
  data: {
    labels: ["Hoàn thành", "Đang chạy", "Đã hủy"],
    datasets: [{
      data: pieValues,
      backgroundColor: ["#2563eb", "#22c55e", "#f59e0b"],
      borderWidth: 0
    }]
  },
  options: {
    cutout: "65%",
    plugins: {
      legend: { display: false }
    }
  }
});

function updateLegend(values){
  document.getElementById("donePct").textContent = values[0] + "%";
  document.getElementById("runPct").textContent = values[1] + "%";
  document.getElementById("cancelPct").textContent = values[2] + "%";
}

updateLegend(pieValues);

// Buttons: làm mới demo
document.getElementById("randomizeBar")?.addEventListener("click", () => {
  barChart.data.datasets[0].data = randomSeries(7, 10, 35);
  barChart.update();
});
// ===== Logout =====
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("auth_logged_in");
  localStorage.removeItem("auth_name");
  window.location.href = "login.html";
});
document.getElementById("randomizePie")?.addEventListener("click", () => {
  const a = Math.floor(Math.random()*81)+10;  // 10..90
  const b = Math.floor(Math.random()*(100-a+1));
  const c = 100 - a - b;
  pieValues = [a, b, c];
  pieChart.data.datasets[0].data = pieValues;
  pieChart.update();
  updateLegend(pieValues);
});
/* =============================
   1) Điều hướng: click menu -> đổi trang
============================= */
const breadcrumbTitle = document.getElementById("breadcrumbTitle");
const menuItems = document.querySelectorAll(".menu-item");

function setActivePage(pageKey){
  // Active menu
  menuItems.forEach(a => a.classList.toggle("active", a.dataset.page === pageKey));

  // Show/Hide pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const pageEl = document.getElementById("page-" + pageKey);
  if (pageEl) pageEl.classList.add("active");

  // Breadcrumb text
  const mapTitle = {
    overview: "TỔNG QUAN",
    trips: "QUẢN LÝ CHUYẾN XE"
  };
  if (breadcrumbTitle) breadcrumbTitle.textContent = mapTitle[pageKey] || "TRANG";
}

menuItems.forEach(a => {
  a.addEventListener("click", (e) => {
    const key = a.dataset.page;
    if (!key) return;
    e.preventDefault();
    setActivePage(key);

    // Mobile: đóng sidebar khi chọn menu
    document.getElementById("sidebar")?.classList.remove("open");
  });
});

// Nếu URL có #trips thì mở trips
if (location.hash === "#trips") setActivePage("trips");

/* =============================
   2) Dữ liệu demo: chuyến xe + render bảng + lọc
============================= */
let trips = [
  { code:"TT240520-001", route:"Vinh - Hoàng Mai", time:"07:30", price:230000, sold:16, total:16, status:"Đang chạy" },
  { code:"TT240520-002", route:"Vinh - Diễn Châu", time:"08:30", price:150000, sold:12, total:40, status:"Sắp chạy" },
  { code:"TT240520-003", route:"Hoàng Mai - Vinh", time:"09:30", price:250000, sold:5,  total:45, status:"Sắp chạy" },
  { code:"TT240520-004", route:"Vinh - Hoàng Mai", time:"10:30", price:230000, sold:20, total:40, status:"Đã hủy" },
  { code:"TT240520-005", route:"Vinh - Quỳnh Lưu", time:"13:00", price:200000, sold:10, total:16, status:"Sắp chạy" }
];

const tbody = document.getElementById("tripTbody");
const filterRoute = document.getElementById("filterRoute");
const filterStatus = document.getElementById("filterStatus");
const filterText = document.getElementById("filterText");

function fmtMoney(v){
  return (v || 0).toLocaleString("vi-VN") + "đ";
}

function statusClass(status){
  if (status === "Đang chạy") return "st-running";
  if (status === "Sắp chạy") return "st-soon";
  if (status === "Đã hủy") return "st-cancel";
  if (status === "Hoàn thành") return "st-done";
  return "st-soon";
}

function uniqueRoutes(){
  return Array.from(new Set(trips.map(t => t.route))).sort();
}

function renderRouteOptions(){
  if (!filterRoute) return;
  const current = filterRoute.value || "all";
  const routes = uniqueRoutes();
  filterRoute.innerHTML = `<option value="all">Tất cả tuyến</option>` +
    routes.map(r => `<option value="${r}">${r}</option>`).join("");
  filterRoute.value = routes.includes(current) ? current : "all";
}

function getFilteredTrips(){
  const r = filterRoute?.value || "all";
  const s = filterStatus?.value || "all";
  const q = (filterText?.value || "").trim().toLowerCase();

  return trips.filter(t => {
    const okRoute = (r === "all") || (t.route === r);
    const okStatus = (s === "all") || (t.status === s);
    const okText = !q || t.code.toLowerCase().includes(q) || t.route.toLowerCase().includes(q);
    return okRoute && okStatus && okText;
  });
}

function renderTrips(){
  if (!tbody) return;
  renderRouteOptions();

  const list = getFilteredTrips();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="padding:16px; color:#64748b;">
          Không có chuyến nào phù hợp bộ lọc.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = list.map(t => `
    <tr>
      <td class="nowrap">${t.code}</td>
      <td><b>${t.route}</b></td>
      <td class="nowrap">${t.time}</td>
      <td class="nowrap" style="color:#1d4ed8; font-weight:900;">${fmtMoney(t.price)}</td>
      <td class="nowrap">${t.sold} / ${t.total}</td>
      <td><span class="badge-status ${statusClass(t.status)}">${t.status}</span></td>
      <td class="right">
        <div class="actions">
          <button class="icon-btn" title="Xem" data-act="view" data-code="${t.code}">
            <i class="fa-regular fa-eye"></i>
          </button>
          <button class="icon-btn" title="Sửa" data-act="edit" data-code="${t.code}">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button class="icon-btn" title="Xóa" data-act="del" data-code="${t.code}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

filterRoute?.addEventListener("change", renderTrips);
filterStatus?.addEventListener("change", renderTrips);
filterText?.addEventListener("input", renderTrips);

/* =============================
   3) Modal Thêm/Sửa
============================= */
const tripModal = document.getElementById("tripModal");
const btnAddTrip = document.getElementById("btnAddTrip");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const btnSaveTrip = document.getElementById("btnSaveTrip");
const modalTitle = document.getElementById("modalTitle");

const mCode = document.getElementById("mCode");
const mRoute = document.getElementById("mRoute");
const mTime = document.getElementById("mTime");
const mPrice = document.getElementById("mPrice");
const mSold = document.getElementById("mSold");
const mTotal = document.getElementById("mTotal");
const mStatus = document.getElementById("mStatus");

let editingCode = null;

function openModal(mode, trip){
  editingCode = (mode === "edit") ? trip.code : null;
  if (modalTitle) modalTitle.textContent = (mode === "edit") ? "Sửa chuyến" : "Thêm chuyến";

  mCode.value = trip?.code || "";
  mRoute.value = trip?.route || "";
  mTime.value = trip?.time || "07:30";
  mPrice.value = trip?.price ?? 0;
  mSold.value = trip?.sold ?? 0;
  mTotal.value = trip?.total ?? 16;
  mStatus.value = trip?.status || "Sắp chạy";

  tripModal?.classList.add("open");
  tripModal?.setAttribute("aria-hidden", "false");
}

function closeModal(){
  tripModal?.classList.remove("open");
  tripModal?.setAttribute("aria-hidden", "true");
}

btnAddTrip?.addEventListener("click", () => openModal("add", null));
btnCloseModal?.addEventListener("click", closeModal);
btnCancelModal?.addEventListener("click", closeModal);

tripModal?.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "1") closeModal();
});

function genCode(){
  // TT + ddmmyy + -xxx
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth()+1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const prefix = `TT${dd}${mm}${yy}`;
  const count = trips.filter(t => t.code.startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(3,"0")}`;
}

btnSaveTrip?.addEventListener("click", () => {
  const code = (mCode.value.trim() || genCode());
  const route = mRoute.value.trim();
  const time = mTime.value || "07:30";
  const price = Number(mPrice.value || 0);
  const sold = Number(mSold.value || 0);
  const total = Number(mTotal.value || 1);
  const status = mStatus.value;

  if (!route) { alert("Vui lòng nhập tuyến đường"); return; }
  if (total <= 0) { alert("Tổng ghế phải lớn hơn 0"); return; }
  if (sold < 0 || sold > total) { alert("Ghế đã bán phải từ 0 đến tổng ghế"); return; }

  // Check trùng mã khi thêm
  if (!editingCode && trips.some(t => t.code === code)) {
    alert("Mã chuyến đã tồn tại. Bạn đổi mã khác nhé.");
    return;
  }

  const payload = { code, route, time, price, sold, total, status };

  if (editingCode) {
    trips = trips.map(t => t.code === editingCode ? payload : t);
  } else {
    trips.unshift(payload);
  }

  closeModal();
  renderTrips();
});

/* =============================
   4) Thao tác bảng: xem / sửa / xóa
============================= */
tbody?.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const act = btn.dataset.act;
  const code = btn.dataset.code;
  const trip = trips.find(t => t.code === code);
  if (!trip) return;

  if (act === "view") {
    alert(
      `Mã chuyến: ${trip.code}\n`+
      `Tuyến: ${trip.route}\n`+
      `Giờ đi: ${trip.time}\n`+
      `Giá vé: ${fmtMoney(trip.price)}\n`+
      `Ghế: ${trip.sold}/${trip.total}\n`+
      `Trạng thái: ${trip.status}`
    );
  }

  if (act === "edit") {
    openModal("edit", trip);
  }

  if (act === "del") {
    const ok = confirm(`Xóa chuyến ${trip.code} ?`);
    if (!ok) return;
    trips = trips.filter(t => t.code !== trip.code);
    renderTrips();
  }
});

// Render lần đầu
renderTrips();