import { $, $$ } from "../../js/dom.js";
import { BattleAnimations } from "./battle-animations.js";
import { BattleBoard } from "./battle-board.js";
import { BattleHand } from "./battle-hand.js";
import { BattleHud } from "./battle-hud.js";
import { BattleInput } from "./battle-input.js";
import { dealCard } from "./card-motion.js";
import { CardTooltip } from "./card-tooltip.js";
import { wait } from "./utils.js";

/** @type {Record<"defeat" | "draw", import("../types.js").ResultContent>} */
const ENDINGS = {
  defeat: {
    accent: "defeat",
    flavor: ["圣焰熄灭，阵地失守。", "灰烬之中，会有人接过这把剑。"],
    title: "骑士陨落",
  },
  draw: {
    accent: "draw",
    flavor: ["火光与影子同时归于寂静。", "仿佛谁也没赢。"],
    title: "同归于寂",
  },
};

export class BattleView {
  #audio;
  #board;
  #hand;
  #hud;
  #input;
  #tooltip;
  #animations;
  #fxLayer;
  #overlayRoot;
  #resultTemplate;
  #restart;

  /**
   * @param {HTMLElement} room
   * @param {{
   *   audio: import("../audio/audio.js").GameAudio;
   *   controls: import("./battle-input.js").BattleControls;
   * }} options
   */
  constructor(room, { audio, controls }) {
    const stage = $("#stage", room);
    const hand = $("#hand", stage);
    const cardTemplate = $("#card-template", room);
    this.#audio = audio;
    this.#restart = controls.restart;
    this.#fxLayer = $("#fx-layer", room);
    this.#overlayRoot = $("#overlay-root", room);
    this.#resultTemplate = $("#result-template", room);
    this.#hud = new BattleHud(room);
    this.#board = new BattleBoard($("#board", stage), cardTemplate);
    this.#hand = new BattleHand(hand, cardTemplate);
    this.#tooltip = new CardTooltip(this.#overlayRoot);
    this.#animations = new BattleAnimations({
      audio,
      cells: this.#board.cells,
      fxLayer: this.#fxLayer,
      heroes: this.#hud.heroes,
      overlayRoot: this.#overlayRoot,
      stage,
    });
    this.#input = new BattleInput(
      {
        audio,
        cardTemplate,
        fxLayer: this.#fxLayer,
        hand,
        stage,
        tooltip: this.#tooltip,
        toggleMute: this.#toggleMute,
      },
      controls,
    );
  }

  attach() {
    this.#input.attach();
    this.#hud.syncMute(this.#audio.muted);
  }

  /** @param {import("../game/battle.js").Battle} battle */
  startBattle(battle) {
    this.#reset();
    this.#hud.startBattle(battle);
  }

  #reset() {
    this.#input.reset();
    this.#animations.reset();
    this.#board.reset();
    this.#hand.reset();
    this.#fxLayer.replaceChildren();
    this.#overlayRoot.replaceChildren();
  }

  /** @param {import("../game/battle.js").Battle} battle */
  lock(battle) {
    this.#input.reset();
    this.#syncHud(battle, true);
  }

  /** @param {import("../game/battle.js").Battle} battle */
  ready(battle) {
    this.#board.renderIntent(battle);
    this.#syncHud(battle, false);
  }

  /**
   * @param {import("../game/battle.js").Battle} battle
   * @param {boolean} blocked
   */
  #syncHud(battle, blocked) {
    this.#hand.sync(battle);
    this.#hud.sync(battle, blocked);
  }

  #toggleMute = () => {
    this.#audio.toggleMute();
    this.#hud.syncMute(this.#audio.muted);
  };

  /**
   * @param {import("../game/battle.js").Battle} battle
   * @param {number} index
   * @param {number} col
   * @param {AbortSignal} signal
   * @param {import("./card-motion.js").DraggedCard} [drag]
   */
  async deploy(battle, index, col, signal, drag) {
    const origin = this.#hand.take(index);
    this.#input.reset();
    this.#syncHud(battle, true);
    const unit = battle.playerBoard[col];
    const card = this.#board.place("player", col, unit);
    if (drag) {
      await drag.land(card, signal);
    } else {
      await dealCard(card, origin, this.#fxLayer, signal);
    }
    if (!signal.aborted) {
      this.#audio.play("place");
    }
  }

  /**
   * @param {import("../types.js").BattleEvent} event
   * @param {import("../game/battle.js").Battle} battle
   * @param {AbortSignal} signal
   */
  async playEvent(event, battle, signal) {
    switch (event.kind) {
      case "victory":
      case "defeat":
      case "draw": {
        await wait(event.kind === "victory" ? 500 : 700, signal);
        if (signal.aborted) {
          return;
        }
        this.#audio.play(event.kind === "draw" ? "doom" : event.kind);
        this.#showResult(battle, event.kind);

        break;
      }
      case "summon": {
        const card = this.#board.place("enemy", event.col, event.unit);
        await dealCard(
          card,
          { bounds: this.#hud.heroes.enemy.seal.getBoundingClientRect() },
          this.#fxLayer,
          signal,
        );
        if (signal.aborted) {
          return;
        }
        await this.#animations.summon(event.col, signal);

        break;
      }
      case "fight": {
        await this.#animations.fight(event, signal);
        if (!signal.aborted) {
          this.#board.render(battle);
          this.#syncHud(battle, true);
        }

        break;
      }
      case "heroHit": {
        await this.#animations.heroHit(event, signal, () => {
          this.#hud.setHeroHp(event.target, event.targetHp);
          this.#syncHud(battle, true);
        });

        break;
      }
      case "heal": {
        this.#hud.setHeroHp(event.target, event.targetHp);
        this.#syncHud(battle, true);
        await this.#animations.heal(event.target, event.amount, signal);

        break;
      }
      case "drawCard": {
        this.#tooltip.hide();
        this.#audio.play("draw");
        const card = this.#hand.add(event.card);
        await dealCard(
          card,
          { bounds: this.#hud.heroes.player.seal.getBoundingClientRect() },
          this.#fxLayer,
          signal,
        );
        if (signal.aborted) {
          return;
        }
        this.#syncHud(battle, true);

        break;
      }
      case "reshuffle": {
        this.#audio.play("reshuffle");
        this.#syncHud(battle, true);

        break;
      }
      case "energy": {
        this.#syncHud(battle, true);
        this.#audio.play("energy");
        await wait(240, signal);

        break;
      }
      case "phase": {
        this.#syncHud(battle, true);
        await wait(260, signal);

        break;
      }
      case "round": {
        this.#board.render(battle);
        this.#syncHud(battle, true);
        this.#audio.play("round");
        await this.#board.showRound(event.round, signal);

        break;
      }
    }
  }

  /**
   * @param {import("../game/battle.js").Battle} battle
   * @param {import("../types.js").ResultKind} kind
   */
  #showResult(battle, kind) {
    const content =
      kind === "victory"
        ? { accent: kind, ...battle.encounter.victory }
        : ENDINGS[kind];
    const stats = battle.stats;
    this.#board.render(battle);
    this.#board.renderIntent(battle);
    this.#overlayRoot.replaceChildren();
    const fragment = this.#resultTemplate.content.cloneNode(true);
    const panel = $("#battle-result", fragment);
    panel.classList.add(content.accent);
    $("#result-title", panel).textContent = content.title;
    const flavorLines = $$(".flavor", panel);
    for (const [index, line] of content.flavor.entries()) {
      flavorLines[index].textContent = line;
    }
    $("#result-rounds", panel).textContent = String(battle.round);
    $("#result-damage-dealt", panel).textContent = String(
      stats.heroDamageDealt,
    );
    $("#result-damage-taken", panel).textContent = String(
      stats.heroDamageTaken,
    );
    $("#result-played", panel).textContent = String(stats.cardsPlayed);
    $("#result-kills", panel).textContent = String(stats.enemyUnitsSlain);
    const again = $("#restart-battle", panel);
    again.classList.add(content.accent === "defeat" ? "danger" : "primary");
    again.textContent = content.accent === "victory" ? "再赴战线" : "重燃圣焰";
    again.addEventListener("click", this.#restart);
    this.#overlayRoot.append(fragment);
  }
}
