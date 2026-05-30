// ====== Thiết lập năm ======
document.getElementById("year").textContent = new Date().getFullYear();

// ====== Tài khoản demo (bạn có thể thay sau) ======
const DEMO_ACCOUNT = {
  username: "admin",
  password: "123456",
  displayName: "Admin"
};

// ====== Nếu đã đăng nhập rồi thì vào thẳng dashboard ======
(function autoRedirectIfLoggedIn(){
  const auth = localStorage.getItem("auth_logged_in");
  if (auth === "1") {
    window.location.href = "index.html";
  }
})();

const form = document.getElementById("loginForm");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const rememberEl = document.getElementById("remember");
const userError = document.getElementById("userError");
const passError = document.getElementById("passError");
const toast = document.getElementById("toast");

function showToast(type, msg){
  toast.className = "toast " + type;
  toast.textContent = msg;
}

function clearErrors(){
  userError.textContent = "";
  passError.textContent = "";
  toast.className = "toast";
  toast.textContent = "";
}

document.getElementById("togglePass").addEventListener("click", () => {
  const isPass = passwordEl.type === "password";
  passwordEl.type = isPass ? "text" : "password";
});

// ====== Submit ======
form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearErrors();

  const u = usernameEl.value.trim();
  const p = passwordEl.value;

  let ok = true;
  if (!u) { userError.textContent = "Vui lòng nhập tài khoản"; ok = false; }
  if (!p) { passError.textContent = "Vui lòng nhập mật khẩu"; ok = false; }
  if (!ok) return;

  const isValid = (u === DEMO_ACCOUNT.username && p === DEMO_ACCOUNT.password);

  if (!isValid) {
    showToast("bad", "Sai tài khoản hoặc mật khẩu ❌");
    return;
  }

  // Lưu trạng thái đăng nhập
  if (rememberEl.checked) {
    localStorage.setItem("auth_logged_in", "1");
    localStorage.setItem("auth_name", DEMO_ACCOUNT.displayName);
  } else {
    // Nếu không “nhớ đăng nhập”, vẫn lưu, nhưng bạn có thể đổi sang sessionStorage nếu muốn
    localStorage.setItem("auth_logged_in", "1");
    localStorage.setItem("auth_name", DEMO_ACCOUNT.displayName);
  }

  showToast("ok", "Đăng nhập thành công ✅ Đang chuyển trang...");
  setTimeout(() => window.location.href = "index.html", 700);
});