import { GAME_PAGES, requireSession } from "./session.js";

import "../js/site.js";

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    requireSession();
  }
});
document.addEventListener("signout", requireSession);
window.addEventListener("storage", (event) => {
  if (
    event.storageArea === localStorage &&
    (event.key === "grey-knight:session" || event.key === null)
  ) {
    requireSession();
  }
});

if (requireSession()) {
  const path = location.pathname.replace(/\.html$/, "");
  const entry = GAME_PAGES[path];
  if (entry !== null) {
    await import(entry);
  }
}
