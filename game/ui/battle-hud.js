import { $, $$ } from "../../js/dom.js";
import { ENERGY_MAX } from "../game/rules.js";

/** @typedef {import("../types.js").Side} Side */

/**
 * @param {Side} side
 * @param {HTMLElement} stage
 */
const heroElements = (side, stage) => ({
  root: $(`#${side}-hero`, stage),
  fill: $(`#${side}-hp-fill`, stage),
  seal: $(`#${side}-seal`, stage),
  text: $(`#${side}-hp-text`, stage),
  trail: $(`#${side}-hp-trail`, stage),
});

export class BattleHud {
  #player;
  #stage;
  #heroes;
  #candles;
  #maxHp = { enemy: 0, player: 0 };
  #lastHp = { enemy: 0, player: 0 };

  /**
   * @param {HTMLElement} room
   * @param {import("../types.js").PlayerSetup} player
   */
  constructor(room, player) {
    this.#player = player;
    this.#stage = $("#stage", room);
    this.#heroes = {
      enemy: heroElements("enemy", this.#stage),
      player: heroElements("player", this.#stage),
    };
    this.#candles = $$(".candle", this.#stage);
  }

  get heroes() {
    return this.#heroes;
  }

  /** @param {boolean} muted */
  syncMute(muted) {
    const mute = $("#mute-toggle", this.#stage);
    mute.textContent = muted ? "哑" : "音";
    mute.classList.toggle("muted", muted);
    mute.title = muted ? "开启音效（M）" : "关闭音效（M）";
    mute.setAttribute("aria-label", muted ? "开启音效" : "关闭音效");
  }

  /**
   * @param {import("../game/battle.js").Battle} battle
   * @param {boolean} blocked
   */
  sync(battle, blocked) {
    $("#enemy-sub", this.#stage).textContent = battle.encounter.status;
    $("#round-number", this.#stage).textContent = String(battle.round);
    for (const [index, candle] of this.#candles.entries()) {
      candle.classList.toggle("lit", index < battle.energy);
    }
    $("#energy-number", this.#stage).textContent = String(battle.energy);
    $("#energy-max", this.#stage).textContent = ` / ${ENERGY_MAX}`;
    $("#player-sub", this.#stage).textContent =
      `牌库 ${battle.drawCount} · 弃 ${battle.discardCount}`;

    const canAct = !blocked && battle.phase === "player";
    const canDeploy =
      canAct &&
      battle.playerBoard.some((unit) => !unit) &&
      battle.hand.some((card) => card.cost <= battle.energy);
    this.#stage.classList.toggle("can-deploy", canDeploy);
    const endTurn = $("#end-turn", this.#stage);
    endTurn.disabled = !canAct;
    endTurn.classList.toggle("attract", canAct && !canDeploy);
    $("span", endTurn).textContent = canAct
      ? "结束回合"
      : battle.phase === "over"
        ? "战斗结束"
        : battle.phase === "enemy"
          ? "敌方行动"
          : battle.phase === "combat"
            ? "列位交锋"
            : "准备中";
    $("small", endTurn).textContent = canAct ? "结算所有列位 · E" : "";
    this.#stage.dataset.state =
      battle.phase === "over" ? "over" : canAct ? "play" : "busy";
  }

  /** @param {import("../game/battle.js").Battle} battle */
  startBattle(battle) {
    const encounter = battle.encounter;
    const { enemy, player } = this.#heroes;
    enemy.seal.textContent = encounter.hero.glyph;
    $("#enemy-name", this.#stage).textContent =
      `${encounter.hero.name} ${encounter.hero.nameEn}`;
    player.seal.textContent = this.#player.hero.glyph;
    $("#player-name", this.#stage).textContent =
      `${this.#player.hero.name} ${this.#player.hero.nameEn}`;
    this.#maxHp = {
      enemy: encounter.maxHealth,
      player: this.#player.maxHealth,
    };
    this.#lastHp = { enemy: battle.enemyHealth, player: battle.playerHealth };
    this.setHeroHp("player", battle.playerHealth);
    this.setHeroHp("enemy", battle.enemyHealth);
  }

  /**
   * @param {Side} side
   * @param {number} hp
   */
  setHeroHp(side, hp) {
    const maxHp = this.#maxHp[side];
    const previous = this.#lastHp[side];
    const fraction = (hp / maxHp) * 100;
    const { fill, text, trail } = this.#heroes[side];
    text.textContent = `${hp} / ${maxHp}`;
    text.classList.toggle("low", hp / maxHp < 0.3);
    fill.style.width = `${fraction}%`;
    if (hp < previous) {
      const oldFraction = (previous / maxHp) * 100;
      trail.style.width = `${fraction}%`;
      for (const animation of trail.getAnimations()) {
        animation.cancel();
      }
      trail.animate([{ width: `${oldFraction}%` }, { width: `${fraction}%` }], {
        delay: 120,
        duration: 650,
        easing: "cubic-bezier(0.3, 0, 0.5, 1)",
        fill: "backwards",
      });
    } else {
      trail.style.width = `${fraction}%`;
    }
    this.#lastHp[side] = hp;
  }
}
