import { $, $$ } from "../../js/dom.js";
import * as kv from "../kv.js";

/**
 * @typedef {import("../types.js").Page} Page
 * @typedef {import("../types.js").PageFactory} PageFactory
 */

export class GameApp {
  #pages;
  /** @type {AbortController | undefined} */
  #navigation;
  /** @type {Page | undefined} */
  #page;
  #room;
  #chrome;

  /**
   * @param {Readonly<Record<string, PageFactory | undefined>>} pages
   * @param {(room: HTMLElement) => void} [chrome]
   *   站点装饰器：每次房间装载后被调用（如刷新房间内顶栏的登录区）
   */
  constructor(pages, chrome) {
    this.#pages = pages;
    this.#chrome = chrome;
    this.#room = $("[data-room]");
  }

  async start() {
    document.addEventListener("click", this.#onClick);
    window.addEventListener("popstate", this.#onPopState);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        this.#checkLogin();
      }
    });
    await this.#mount(this.#room);
  }

  /** @param {MouseEvent} event */
  #onClick = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link =
      event.target instanceof Element
        ? event.target.closest("a[data-room-link]")
        : null;
    if (
      !(link instanceof HTMLAnchorElement) ||
      link.download ||
      (link.target && link.target !== "_self")
    ) {
      return;
    }

    const url = new URL(link.href);
    if (url.origin !== location.origin) {
      return;
    }

    event.preventDefault();
    this.#navigate(url, true);
  };

  #onPopState = () => {
    this.#navigate(new URL(location.href), false);
  };

  /**
   * @param {URL} url
   * @param {boolean} push
   */
  async #navigate(url, push) {
    this.#navigation?.abort();
    const navigation = new AbortController();
    this.#navigation = navigation;

    try {
      let nextDocument;
      try {
        nextDocument = await this.#fetchRoom(url, navigation.signal);
      } catch {
        if (!navigation.signal.aborted) {
          location.assign(url.href);
        }

        return;
      }
      await this.#adoptStyles(nextDocument.styles, navigation.signal);
      if (navigation.signal.aborted) {
        return;
      }
      if (push) {
        history.pushState(null, "", url);
      }
      this.#page?.destroy();
      this.#page = undefined;
      this.#room.replaceWith(nextDocument.room);
      this.#room = nextDocument.room;
      document.title = nextDocument.title;
      this.#dropStyles(nextDocument.styles);
      await this.#mount(nextDocument.room);
    } finally {
      if (this.#navigation === navigation) {
        this.#navigation = undefined;
      }
    }
  }

  /**
   * @param {URL} url
   * @param {AbortSignal} signal
   */
  async #fetchRoom(url, signal) {
    const response = await fetch(url, {
      headers: { Accept: "text/html" },
      signal,
    });
    if (!response.ok) {
      throw new Error(`Room request failed with ${response.status}`);
    }

    const page = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    const room = document.importNode($("[data-room]", page), true);
    const links = $$('link[rel~="stylesheet"]', page.head);
    const styles = [...links].map((link) => link.href);

    return { room, styles, title: page.title };
  }

  /**
   * 装载尚未存在于当前文档的房间样式表，等它们可用后再切换。
   *
   * @param {readonly string[]} hrefs
   * @param {AbortSignal} signal
   */
  async #adoptStyles(hrefs, signal) {
    const currentLinks = $$('link[rel~="stylesheet"]', document.head);
    const existing = new Set([...currentLinks].map((link) => link.href));

    for (const href of hrefs) {
      if (existing.has(href) || signal.aborted) {
        continue;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      await new Promise((resolve) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", resolve, { once: true });
        document.head.append(link);
      });
    }
  }

  /**
   * 房间切换后移除本房间不再需要的样式表。
   *
   * @param {readonly string[]} hrefs
   */
  #dropStyles(hrefs) {
    const keep = new Set(hrefs);
    const currentLinks = $$('link[rel~="stylesheet"]', document.head);
    for (const link of currentLinks) {
      if (!keep.has(link.href)) {
        link.remove();
      }
    }
  }

  #checkLogin() {
    const game = this.#pages[this.#room.dataset.room];
    if (game && kv.get("session") === null) {
      location.replace("./login.html");

      return false;
    }

    return true;
  }

  /** @param {HTMLElement} room */
  async #mount(room) {
    if (!this.#checkLogin()) {
      return;
    }
    this.#chrome?.(room);

    const factory = this.#pages[room.dataset.room];
    if (!factory) {
      return;
    }

    const page = factory(room);
    this.#page = page;
    await page.enter();
  }
}
