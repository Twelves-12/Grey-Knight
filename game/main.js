import { GameAudio } from "./audio/audio.js";
import { GREY_KNIGHT } from "./content/player.js";
import { AbyssFront } from "./encounters/abyss-front.js";
import { BattlePage } from "./pages/battle-page.js";
import { requireSession } from "./session.js";

import "../js/site.js";

if (requireSession()) {
  const room = document.querySelector('[data-room="battle"]');
  const seed = new URLSearchParams(location.search).get("seed");
  const page = new BattlePage(room, {
    seed: seed === null ? undefined : Number(seed) >>> 0,
    audio: new GameAudio(),
    createEncounter: (seed) => new AbyssFront(seed),
    player: GREY_KNIGHT,
  });

  await page.enter();
}
