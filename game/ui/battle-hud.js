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
  /** @type {number | undefined} */
  #statusTimer;

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
  }

  /**
   * @param {import("../game/battle.js").Battle} battle
   * @param {boolean} blocked
   */
  sync(battle, blocked) {
    const hasPlayed = battle.stats.cardsPlayed > 0;
    const abilities = battle.enemyIntents.filter(
      (intent) => intent.kind === "ability",
    );
    const enemySub = $("#enemy-sub", this.#stage);
    enemySub.textContent = [
      battle.encounter.status,
      ...abilities.map((intent) => intent.text),
    ].join(" · ");
    enemySub.classList.toggle("warn", abilities.length > 0);
    const roundSeal = $("#round-seal", this.#stage);
    $("#round-number", this.#stage).textContent = String(battle.round);
    roundSeal.classList.toggle("warn", abilities.length > 0);
    for (const [index, candle] of this.#candles.entries()) {
      candle.classList.toggle("lit", index < battle.energy);
    }
    $("#energy-number", this.#stage).textContent = String(battle.energy);
    $("#energy-max", this.#stage).textContent = ` / ${ENERGY_MAX}`;
    $("#player-sub", this.#stage).textContent =
      `牌库 ${battle.drawCount} · 弃 ${battle.discardCount}`;

    const canAct = !blocked && battle.phase === "player";
    const endTurn = $("#end-turn", this.#stage);
    endTurn.disabled = !canAct;
    endTurn.classList.toggle("attract", canAct && !hasPlayed);
    this.#stage.dataset.state =
      battle.phase === "over" ? "over" : canAct ? "play" : "busy";
    $("#turn-state", this.#stage).textContent =
      battle.phase === "over" ? "战斗结束" : canAct ? "你的回合" : "交锋中";
  }

  /**
   * @param {string} text
   * @param {number} [seconds]
   */
  say(text, seconds = 3) {
    const status = $("#battle-status", this.#stage);
    status.textContent = text;
    window.clearTimeout(this.#statusTimer);
    this.#statusTimer = window.setTimeout(() => {
      status.textContent = "";
    }, seconds * 1000);
  }

  /** @param {import("../game/battle.js").Battle} battle */
  startBattle(battle) {
    window.clearTimeout(this.#statusTimer);
    $("#battle-status", this.#stage).textContent = "";
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
