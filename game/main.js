import { GameAudio } from "./audio/audio.js";
import {
  CARD_LIBRARY,
  GENERATABLE_CARDS,
  RITUAL_STAGES,
  applyCardUpgrade,
} from "./content/cards.js";
import { GREY_KNIGHT } from "./content/player.js";
import { AbyssFront } from "./encounters/battlefield.js";
import { Battle } from "./game/battle.js";
import { Player } from "./game/player.js";
import { BattlePage } from "./pages/battle-page.js";
import { getRun, requireCampaignNode } from "./session.js";

const room = document.querySelector('[data-room="battle"]');
const params = new URLSearchParams(location.search);
const nodeId = params.get("node") ?? "node-1";

if (requireCampaignNode(nodeId)) {
  const run = getRun();
  const page = new BattlePage(room, {
    seed: params.has("seed") ? Number(params.get("seed")) >>> 0 : run.seed,
    audio: new GameAudio(),
    createBattle: (seed) => {
      const current = getRun();
      const deck = current.deck.map((instance) => {
        const template = CARD_LIBRARY.find(
          (card) => card.id === instance.cardId,
        );
        if (!template) {
          throw new Error(`冒险牌组包含未知卡牌：${instance.cardId}`);
        }
        const card = instance.upgrade
          ? applyCardUpgrade(template, instance.upgrade)
          : { ...template };

        return {
          ...card,
          instanceId: instance.instanceId,
          growth: instance.growth,
          attack: card.attack + (instance.growth ?? 0),
        };
      });
      const player = new Player({
        ...GREY_KNIGHT,
        deck,
        cardPool: [...GENERATABLE_CARDS, ...RITUAL_STAGES],
      });
      player.takeDamage(player.maxHealth - current.health);

      return new Battle(
        seed,
        player,
        new AbyssFront(seed, { nodeId, choices: current.choices }),
        {
          state:
            current.battle?.nodeId === nodeId
              ? current.battle.state
              : undefined,
          relics: current.relics,
          oath: current.oath,
        },
      );
    },
    nodeId,
  });
  await page.enter();
}
