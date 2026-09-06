import * as kv from "../game/kv.js";
import { GAME_PAGES } from "../game/session.js";

const form = document.forms[0];
const requestedNext = new URLSearchParams(location.search).get("next");
const next =
  requestedNext && Object.hasOwn(GAME_PAGES, requestedNext.split(/[?#]/, 1)[0])
    ? requestedNext
    : null;
if (next) {
  const alternate = document.querySelector(".auth-foot a");
  const url = new URL(alternate.href);
  url.searchParams.set("next", next);
  alternate.href = url.href;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const username = data.get("username").trim();
  const password = data.get("password");

  if (!username || !password.trim()) {
    alert("请输入用户名和密码。");

    return;
  }

  const accountKey = `account:${username}`;
  if (form.dataset.authForm === "register") {
    kv.set(accountKey, password);
    alert("注册成功，请前往登录页面。");

    return;
  }

  if (kv.get(accountKey) !== password) {
    alert("用户名或密码错误。");

    return;
  }

  kv.set("session", username);
  location.replace(next ?? "./index.html");
});
