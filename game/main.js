import { GameAudio } from "./audio/audio.js";
import { GREY_KNIGHT } from "./content/player.js";
import { ROAD_CHOICES } from "./content/road-event.js";
import { AbyssFront } from "./encounters/abyss-front.js";
import { Battle } from "./game/battle.js";
import { Player } from "./game/player.js";
import { BattlePage } from "./pages/battle-page.js";

const room = document.querySelector('[data-room="battle"]');
const params = new URLSearchParams(location.search);
const seed = params.get("seed");
const choice = ROAD_CHOICES.find((entry) => entry.id === params.get("choice"));
const page = new BattlePage(room, {
  seed: seed === null ? undefined : Number(seed) >>> 0,
  audio: new GameAudio(),
  createBattle: (seed) => {
    const player = new Player(GREY_KNIGHT);
    if (choice) {
      player.takeDamage(choice.healthCost);
      if (choice.reward) {
        player.deck.push(choice.reward);
      }
    }

    return new Battle(seed, player, new AbyssFront(seed));
  },
});

await page.enter();
