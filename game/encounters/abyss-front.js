import { ABYSS_FRONT_ENEMIES } from "../content/cards.js";
import { Random } from "../game/random.js";
import { LANE_COUNT } from "../game/rules.js";

/**
 * @typedef {import("../types.js").Encounter} Encounter
 * @typedef {import("../types.js").EncounterContext} EncounterContext
 * @typedef {import("../types.js").EncounterAction} EncounterAction
 */

/** @implements {Encounter} */
export class AbyssFront {
  hero = { glyph: "渊", name: "深渊领主", nameEn: "Abyss Lord" };
  victory = {
    flavor: [
      "深渊领主溃散于裂隙之间，战线归于沉寂。",
      "灰骑士之名，今夜依旧闪亮。",
    ],
    title: "深渊已封",
  };

  #random;
  #deck;
  #breathStartRound;

  /**
   * @param {number} seed
   * @param {{ breathStartRound?: number; maxHealth?: number }} [options]
   */
  constructor(seed, { breathStartRound = 10, maxHealth = 24 } = {}) {
    this.#random = new Random(seed ^ 0x51_ab_3d_77);
    this.#deck = this.#random.shuffled(ABYSS_FRONT_ENEMIES);
    this.#breathStartRound = breathStartRound;
    this.maxHealth = maxHealth;
  }

  get status() {
    return `深渊 ${this.#deck.length}`;
  }

  /** @param {EncounterContext} battle */
  opening(battle) {
    const lanes = this.#random.shuffled(
      Array.from({ length: LANE_COUNT }, (_, col) => col),
    );
    for (let index = 0; index < 2; index += 1) {
      const def = this.#deck.shift();
      battle.summonEnemy(def, lanes[index], false);
    }
  }

  /**
   * @param {EncounterContext} battle
   * @returns {EncounterAction[]}
   */
  plan(battle) {
    /** @type {EncounterAction[]} */
    const actions = [];
    const col = this.#deck.length > 0 ? this.#pickSummonCol(battle) : undefined;
    if (col !== undefined) {
      const def = this.#deck[0];
      actions.push({
        intent: { kind: "summon", col, def },
        execute: (battle) => {
          this.#deck.shift();
          battle.summonEnemy(def, col);
        },
      });
    }
    if (battle.round >= this.#breathStartRound) {
      const amount = battle.round - this.#breathStartRound + 1;
      const name = "深渊吐息";
      actions.push({
        intent: {
          kind: "ability",
          name,
          text: `${name}将至 · ${amount} 点伤害`,
        },
        execute: (battle) => {
          battle.damageHero("player", amount, { kind: "ability", name });
        },
      });
    }

    return actions;
  }

  /** @param {EncounterContext} battle */
  #pickSummonCol(battle) {
    const emptyCols = [];
    for (let col = 0; col < LANE_COUNT; col += 1) {
      if (!battle.enemyBoard[col]) {
        emptyCols.push(col);
      }
    }
    if (emptyCols.length === 0) {
      return undefined;
    }
    if (this.#random.next() < 0.75) {
      const threatened = emptyCols.filter((col) => battle.playerBoard[col]);
      if (threatened.length > 0) {
        return threatened[this.#random.integer(threatened.length)];
      }
    }

    return emptyCols[this.#random.integer(emptyCols.length)];
  }
}
