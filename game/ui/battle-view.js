import { $, $$ } from "../../js/dom.js";
import { BattleAnimations } from "./battle-animations.js";
import { BattleBoard } from "./battle-board.js";
import { BattleHand } from "./battle-hand.js";
import { BattleHud } from "./battle-hud.js";
import { BattleInput } from "./battle-input.js";
import { CardTooltip } from "./card-tooltip.js";
import { wait } from "./utils.js";

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
  #lifetime = new AbortController();

  /**
   * @param {HTMLElement} room
   * @param {{
   *   player: import("../types.js").PlayerSetup;
   *   audio: import("../audio/audio.js").GameAudio;
   *   controls: import("./battle-input.js").BattleControls;
   * }} options
   */
  constructor(room, { player, audio, controls }) {
    const stage = $("#stage", room);
    const hand = $("#hand", stage);
    const cardTemplate = $("#card-template", room);
    this.#audio = audio;
    this.#restart = controls.restart;
    this.#fxLayer = $("#fx-layer", room);
    this.#overlayRoot = $("#overlay-root", room);
    this.#resultTemplate = $("#result-template", room);
    this.#hud = new BattleHud(room, player);
    this.#board = new BattleBoard(
      $("#board", stage),
      cardTemplate,
      this.#fxLayer,
    );
    this.#hand = new BattleHand(
      hand,
      cardTemplate,
      this.#hud.heroes.player.seal,
      this.#fxLayer,
    );
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
        notify: (text, seconds) => this.#hud.say(text, seconds),
        stage,
        tooltip: this.#tooltip,
        toggleMute: this.#toggleMute,
      },
      controls,
    );
  }

  attach() {
    this.#input.attach(this.#lifetime.signal);
    this.#hud.syncMute(this.#audio.muted);
  }

  destroy() {
    this.#lifetime.abort();
    this.#reset();
    this.#hud.destroy();
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

  /**
   * @param {string} text
   * @param {number} [seconds]
   */
  say(text, seconds) {
    this.#hud.say(text, seconds);
  }

  #toggleMute = () => {
    this.#audio.toggleMute();
    this.#hud.syncMute(this.#audio.muted);
    this.#hud.say(this.#audio.muted ? "音效已关闭" : "音效已开启", 1.4);
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
    await this.#board.deal("player", col, unit, drag ?? origin, signal);
    if (!signal.aborted) {
      this.#audio.play("place");
    }
  }

  /**
   * @param {Exclude<
   *   import("../types.js").BattleEvent,
   *   { kind: import("../types.js").ResultKind }
   * >} event
   * @param {import("../game/battle.js").Battle} battle
   * @param {AbortSignal} signal
   */
  async playEvent(event, battle, signal) {
    switch (event.kind) {
      case "summon": {
        await this.#board.deal(
          "enemy",
          event.col,
          event.unit,
          this.#hud.heroes.enemy.seal,
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
        if (event.origin.kind === "ability") {
          this.#hud.say(event.origin.name, 1.8);
        }
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
        await this.#hand.deal(event.card, signal);
        if (signal.aborted) {
          return;
        }
        this.#syncHud(battle, true);

        break;
      }
      case "reshuffle": {
        this.#audio.play("reshuffle");
        this.#hud.say("弃牌已洗回牌库", 1.5);

        break;
      }
      case "energy": {
        this.#syncHud(battle, true);
        this.#audio.play("energy");
        await wait(240, signal);

        break;
      }
      case "phase": {
        this.#hud.say(
          event.name === "enemy" ? "敌方行动…" : "列位结算…",
          event.name === "enemy" ? 1.2 : 1,
        );
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
   * @param {import("../types.js").BattleResult} content
   */
  showResult(battle, content) {
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
    $("#result-rounds", panel).textContent = String(content.stats.rounds);
    $("#result-damage-dealt", panel).textContent = String(
      content.stats.damageDealt,
    );
    $("#result-damage-taken", panel).textContent = String(
      content.stats.damageTaken,
    );
    $("#result-played", panel).textContent = String(content.stats.played);
    $("#result-kills", panel).textContent = String(content.stats.kills);
    const again = $("#restart-battle", panel);
    again.classList.add(content.accent === "defeat" ? "danger" : "primary");
    again.textContent = content.accent === "victory" ? "再赴战线" : "重燃圣焰";
    again.addEventListener("click", this.#restart);
    this.#overlayRoot.append(fragment);
  }
}
