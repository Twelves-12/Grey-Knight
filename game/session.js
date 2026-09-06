import * as kv from "./kv.js";

export function requireSession() {
  if (kv.get("session") !== null) {
    return true;
  }
  const next = encodeURIComponent(location.pathname + location.search);
  location.replace(`./login.html?next=${next}`);

  return false;
}

// 后退恢复页面时、退出账号时都得重新检查
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    requireSession();
  }
});
document.addEventListener("signout", requireSession);
