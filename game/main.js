import { GameAudio } from "./audio/audio.js";
import { GREY_KNIGHT } from "./content/player.js";
import { PLAYER_CARDS } from "./content/cards.js";
import { ROAD_CHOICES } from "./content/road-event.js";
import { AbyssFront } from "./encounters/battle 1.js";
import { Battle } from "./game/battle.js";
import { Player } from "./game/player.js";
import { BattlePage } from "./pages/battle-page.js";
import { getProfile } from "./kv.js";

const room = document.querySelector('[data-room="battle"]');
const params = new URLSearchParams(location.search);
const seed = params.get("seed");
const nodeId = params.get("node") ?? "node-1";
const choice = ROAD_CHOICES.find((entry) => entry.id === params.get("choice"));

const page = new BattlePage(room, {
  seed: seed === null ? undefined : Number(seed) >>> 0,
  audio: new GameAudio(),
  createBattle: (seed) => {
    const player = new Player(GREY_KNIGHT);
    const profile = getProfile();
    for (let index = 1; index <= 6; index += 1) {
      const rewardId = profile.rewards[`node-${index}`];
      const reward = PLAYER_CARDS.find((card) => card.id === rewardId);
      if (reward && !player.deck.some((card) => card.id === reward.id)) {
        player.deck.push(reward);
      }
    }
    if (choice) {
      player.takeDamage(choice.healthCost);
      if (choice.reward) {
        player.deck.push(choice.reward);
      }
    }

    return new Battle(
      seed,
      player,
      new AbyssFront(seed, {
        firstChapter: nodeId === "node-1",
        secondChapter: nodeId === "node-2",
        thirdChapter: nodeId === "node-3",
        fourthChapter: nodeId === "node-4",
        sixthChapter: nodeId === "node-6",
        rebelSecondChapter: nodeId === "rebel-2",
      }),
    );
  },
  nodeId,
});

await page.enter();
