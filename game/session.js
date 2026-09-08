import * as kv from "./kv.js";

export const GAME_PAGES = {
  "/game/story": "../js/story.js",
  "/game/event": "../js/event.js",
  "/game/battle": "./main.js",
  "/game/cards": "../js/cards.js",
  "/game/rules": null,
};

export function requireSession() {
  const loggedIn = kv.get("session") !== null;
  document.body.hidden = !loggedIn;
  if (loggedIn) {
    return true;
  }
  const next = encodeURIComponent(
    location.pathname + location.search + location.hash,
  );
  location.replace(`/login.html?next=${next}`);

  return false;
}
