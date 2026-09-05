import * as kv from "../game/kv.js";
import { $ } from "./dom.js";

import "./components/site-header.js";

/** @param {Document | HTMLElement} root */
export function syncSiteChrome(root = document) {
  $("#start-game", root)?.setAttribute(
    "href",
    kv.get("session") === null ? "./login.html" : "./game.html",
  );

  const back = $("#history-back", root);
  if (back instanceof HTMLButtonElement) {
    back.onclick = () => history.back();
  }
}

document.addEventListener("signout", () => {
  if (document.querySelector('[data-room="battle"]')) {
    location.replace("./login.html");
  } else {
    syncSiteChrome();
  }
});

if (!document.querySelector("[data-room]")) {
  syncSiteChrome();
}
