import { GREY_KNIGHT } from "../content/player.js";
import * as kv from "../kv.js";

/**
 * @typedef {import("../types.js").PlayerSave} PlayerSave
 * @typedef {import("../types.js").PlayerSetup} PlayerSetup
 */

/** @type {PlayerSetup} */
export let player = loadPlayer();

/** @param {PlayerSetup} nextPlayer */
export function savePlayer(nextPlayer) {
  writePlayer(nextPlayer);
  player = nextPlayer;
}

function loadPlayer() {
  const serialized = kv.get("player");
  if (serialized === null) {
    writePlayer(GREY_KNIGHT);

    return GREY_KNIGHT;
  }

  /** @type {PlayerSave} */
  const saved = JSON.parse(serialized);

  return {
    deck: saved.deck.map((id) =>
      GREY_KNIGHT.deck.find((card) => card.id === id),
    ),
    health: saved.health,
    hero: GREY_KNIGHT.hero,
    maxHealth: saved.maxHealth,
  };
}

/** @param {PlayerSetup} currentPlayer */
function writePlayer(currentPlayer) {
  const saved = {
    deck: currentPlayer.deck.map((card) => card.id),
    health: currentPlayer.health,
    maxHealth: currentPlayer.maxHealth,
  };
  kv.set("player", JSON.stringify(saved));
}
