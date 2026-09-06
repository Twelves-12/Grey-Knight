import * as kv from "./kv.js";

export const GAME_PAGES = {
  "/game/story.html": "../js/story.js",
  "/game/event.html": "../js/event.js",
  "/game/battle.html": "./main.js",
  "/game/cards.html": "../js/cards.js",
  "/game/rules.html": null,
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
