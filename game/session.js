import * as kv from "./kv.js";

export const GAME_PAGES = {
  "/story.html": "../js/story.js",
  "/event.html": "../js/event.js",
  "/game.html": "./main.js",
  "/cards.html": "../js/cards.js",
  "/rules.html": null,
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
