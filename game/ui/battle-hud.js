import { $, $$ } from "../../js/dom.js";
import { getMapNode } from "../content/map.js";

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
  #stage;
  #heroes;
  #candles;
  #maxHp = { enemy: 0, player: 0 };
  #lastHp = { enemy: 0, player: 0 };

  /** @param {HTMLElement} room */
  constructor(room) {
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
    const deck = battle.enemyDeck;
    const remaining =
      deck.planned.length +
      deck.pending.length +
      deck.waves.reduce((count, wave) => count + wave.cards.length, 0);
    $("#enemy-sub", this.#stage).textContent =
      battle.encounter.mode === "battle" && !deck.recurring
        ? `待出增援 ${remaining}`
        : battle.encounter.status;
    $("#enemy-deck-summary", this.#stage).textContent =
      `${deck.cards.length} 种 · ${deck.recurring ? "持续增援" : `待出 ${remaining} 张`}`;
    $("#encounter-rule", this.#stage).textContent = battle.encounter.rule;
    $("#round-number", this.#stage).textContent = String(battle.round);
    for (const [index, candle] of this.#candles.entries()) {
      candle.classList.toggle("lit", index < battle.energy);
      candle.classList.toggle("locked", index >= battle.maxEnergy);
    }
    $("#energy-number", this.#stage).textContent = String(battle.energy);
    $("#energy-max", this.#stage).textContent = ` / ${battle.maxEnergy}`;
    $("#player-sub", this.#stage).textContent =
      `牌库 ${battle.drawCount} · 弃牌 ${battle.discardCount}`;

    const canAct = !blocked && battle.phase === "player";
    $("#enemy-deck-toggle", this.#stage).disabled = !canAct;
    const leave = $("#skip-battle", this.#stage);
    leave.disabled = !canAct;
    leave.textContent =
      new URLSearchParams(location.search).get("node") === "node-5"
        ? "离开战场，作出抉择"
        : "返回冒险地图";
    const canDeploy =
      canAct &&
      battle.hand.some(
        (card, index) =>
          battle.cardCost(card) <= battle.energy &&
          battle.playerBoard.some((_, col) => battle.canDeploy(index, col)),
      );
    this.#stage.classList.toggle("can-deploy", canDeploy);
    const recruit = $("#recruit", this.#stage);
    recruit.disabled = !canAct || battle.recruited || battle.hand.length >= 7;
    recruit.textContent = battle.recruited
      ? "征调 · 本轮已用"
      : battle.requisitionCost === 0
        ? "征调 · 免费"
        : `征调 · ${battle.requisitionCost} 圣力`;
    for (const button of $$("[data-direction]", this.#stage)) {
      button.disabled = !canAct;
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.direction === battle.direction),
      );
    }
    const oath = $("#invoke-oath", this.#stage);
    oath.hidden = !["fate", "immolation"].includes(battle.oath);
    oath.disabled = !canAct || (battle.oath === "fate" && battle.oathUsed);
    oath.textContent =
      battle.oath === "fate" ? "篡命誓约 · 交换意图" : "焚身誓约 · 生命换圣力";
    $("#battle-status", this.#stage).textContent =
      `军令：${battle.commandUsed ? "本轮已用" : "可用"} · 移动：${battle.moved ? "本轮已用" : "可用"}\n${battle.ritualDamage ? `圣印仪式：每轮 ${battle.ritualDamage} 伤害\n` : ""}${battle.oath ? `誓约：${{ immolation: "焚身", dawn: "晨钟", fate: "篡命" }[battle.oath]}` : "击杀且存活：下一列本轮 +1 攻击"}`;
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
    const nodeId = new URLSearchParams(location.search).get("node") ?? "node-1";
    $("#battle-node-banner", this.#stage).textContent =
      getMapNode(nodeId)?.title ?? "章节战斗";
    enemy.seal.textContent = encounter.hero.glyph;
    $("#enemy-name", this.#stage).textContent =
      `${encounter.hero.name} ${encounter.hero.nameEn}`;
    player.seal.textContent = battle.player.hero.glyph;
    $("#player-name", this.#stage).textContent =
      `${battle.player.hero.name} ${battle.player.hero.nameEn}`;
    this.#maxHp = {
      enemy: encounter.maxHealth,
      player: battle.player.maxHealth,
    };
    this.#lastHp = { enemy: battle.enemyHealth, player: battle.player.health };
    this.setHeroHp("player", battle.player.health);
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
