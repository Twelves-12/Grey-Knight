import * as kv from "../game/kv.js";

const form = document.forms[0];

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
  location.assign("./index.html");
});
