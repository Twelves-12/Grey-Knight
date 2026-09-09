import * as kv from "./kv.js";

export const GAME_PAGES = {
  "/game/story": "../js/story.js",
  "/game/story2": "../js/story2.js",
  "/game/event": "../js/event.js",
  "/game/event2": "../js/event2.js",
  "/game/battle": "./main.js",
  "/game/map": "../js/map.js",
  "/game/settlement": "../js/settlement.js",
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
