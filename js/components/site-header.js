import * as kv from "../../game/kv.js";
import { $ } from "../dom.js";

const pages = [
  { id: "index", href: "/index.html", label: "首页" },
  { id: "game", href: "/game/story.html", label: "游戏" },
  { id: "cards", href: "/game/cards.html", label: "图鉴" },
  { id: "rules", href: "/game/rules.html", label: "操作说明" },
  { id: "team", href: "/team/", label: "团队介绍" },
];

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute("active");
    this.innerHTML = `
      <header class="site-nav">
        <a class="site-brand" href="/index.html">
          <span class="site-brand-seal">灰</span>
          <b class="site-brand-text">Grey Knight</b>
        </a>
        <nav id="site-links" class="site-links"></nav>
        <div id="site-account" class="site-account"></div>
      </header>`;
    const navigation = $("#site-links", this);
    for (const { id, href, label } of pages) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      link.classList.toggle("active", active === id);
      navigation.append(link);
    }
    this.#renderAccount();
  }

  #renderAccount() {
    const account = $("#site-account", this);
    const user = kv.get("session");
    if (user === null) {
      account.innerHTML = `
        <a class="btn primary" href="/login.html">登录</a>
        <a class="btn ghost" href="/register.html">注册</a>`;

      return;
    }
    account.innerHTML = `
      <span class="site-user"><span class="hello">你好，</span><span id="account-name" class="name"></span></span>
      <button id="signout" class="btn ghost" type="button">退出</button>`;
    $("#account-name", account).textContent = user;
    $("#signout", account).onclick = () => {
      kv.remove("session");
      this.#renderAccount();
      this.dispatchEvent(new CustomEvent("signout", { bubbles: true }));
    };
  }
}

customElements.define("site-header", SiteHeader);
