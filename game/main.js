import { syncSiteChrome } from "../js/site.js";
import { GameApp } from "./app/app.js";
import { player, savePlayer } from "./app/sl.js";
import { GameAudio } from "./audio/audio.js";
import { AbyssFront } from "./encounters/abyss-front.js";
import { BattlePage } from "./pages/battle-page.js";

const audio = new GameAudio();

const pages = {
  battle:
    /** @param {HTMLElement} room */
    (room) => {
      const seed = new URLSearchParams(location.search).get("seed");

      return new BattlePage(room, {
        ...(seed === null ? {} : { seed: Number(seed) >>> 0 }),
        audio,
        createEncounter: (seed) => new AbyssFront(seed),
        onVictory: (health) => savePlayer({ ...player, health }),
        player,
      });
    },
};

await new GameApp(pages, syncSiteChrome).start();
