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
  hero = { glyph: "匪", name: "匪首头目", nameEn: "Bandit Chief" };
  victory = {
    flavor: [
      "深渊领主溃散于裂隙之间，战线归于沉寂。",
      "灰骑士之名，今夜依旧闪亮。",
    ],
    title: "深渊已封",
  };

  #random;
  #deck;
  #firstChapter;
  #secondChapter;
  #thirdChapter;
  #fourthChapter;
  #sixthChapter;
  #rebelSecondChapter;

  /**
   * @param {number} seed
  * @param {{ firstChapter?: boolean; secondChapter?: boolean; thirdChapter?: boolean; fourthChapter?: boolean; sixthChapter?: boolean; rebelSecondChapter?: boolean; maxHealth?: number }} [options]
   */
  constructor(seed, { firstChapter = false, secondChapter = false, thirdChapter = false, fourthChapter = false, sixthChapter = false, rebelSecondChapter = false, maxHealth = 24 } = {}) {
    this.#random = new Random(seed ^ 0x51_ab_3d_77);
    this.#firstChapter = firstChapter;
    this.#secondChapter = secondChapter;
    this.#thirdChapter = thirdChapter;
    this.#fourthChapter = fourthChapter;
    this.#sixthChapter = sixthChapter;
    this.#rebelSecondChapter = rebelSecondChapter;
    if (thirdChapter) {
      this.hero = { glyph: "军", name: "北疆军营", nameEn: "Northern Garrison" };
    }
    if (fourthChapter) {
      this.hero = { glyph: "护", name: "护卫团", nameEn: "Manor Guard" };
    }
    if (sixthChapter) {
      this.hero = { glyph: "匪", name: "匪团", nameEn: "Bandit Host" };
    }
    if (secondChapter) {
      this.hero = { glyph: "兵", name: "私兵团", nameEn: "Private Guard Corps" };
    }
    if (rebelSecondChapter) {
      this.hero = { glyph: "蛮", name: "蛮族战团", nameEn: "Barbarian Warband" };
    }
    if (firstChapter) {
      const bandit = ABYSS_FRONT_ENEMIES.find(
        (card) => card.id === "bandit-grunt",
      );
      const deputy = ABYSS_FRONT_ENEMIES.find(
        (card) => card.id === "bandit-deputy",
      );
      if (!bandit || !deputy) {
        throw new Error("第一章敌方卡牌配置缺失");
      }
      this.#deck = [bandit, bandit, bandit, deputy];
    } else if (rebelSecondChapter) {
      const bear = ABYSS_FRONT_ENEMIES.find((card) => card.id === "barbarian-bear");
      const warrior = ABYSS_FRONT_ENEMIES.find((card) => card.id === "barbarian-warrior");
      if (!bear || !warrior) {
        throw new Error("叛徒线第二章敌方卡牌配置缺失");
      }
      this.#deck = [bear, warrior, warrior];
    } else if (secondChapter) {
      const privateSoldier = ABYSS_FRONT_ENEMIES.find((card) => card.id === "duke-private");
      const captain = ABYSS_FRONT_ENEMIES.find((card) => card.id === "private-captain");
      if (!privateSoldier || !captain) {
        throw new Error("第二章敌方卡牌配置缺失");
      }
      this.#deck = [privateSoldier, privateSoldier, captain];
    } else if (thirdChapter) {
      const guard = ABYSS_FRONT_ENEMIES.find((card) => card.id === "guard");
      const commander = ABYSS_FRONT_ENEMIES.find((card) => card.id === "northern-commander");
      if (!guard || !commander) {
        throw new Error("第三章敌方卡牌配置缺失");
      }
      this.#deck = [guard, guard, guard, guard, commander];
    } else if (fourthChapter) {
      const guard = ABYSS_FRONT_ENEMIES.find((card) => card.id === "guard-escort");
      const butler = ABYSS_FRONT_ENEMIES.find((card) => card.id === "old-butler");
      if (!guard || !butler) {
        throw new Error("第四章敌方卡牌配置缺失");
      }
      this.#deck = [guard, guard, guard, guard, butler];
    } else if (sixthChapter) {
      const bandit = ABYSS_FRONT_ENEMIES.find((card) => card.id === "bandit-grunt");
      const butler = ABYSS_FRONT_ENEMIES.find((card) => card.id === "old-butler");
      if (!bandit || !butler) {
        throw new Error("第六章敌方卡牌配置缺失");
      }
      this.#deck = [bandit, bandit, bandit, bandit, bandit, bandit, butler];
    } else {
      this.#deck = this.#random.shuffled(ABYSS_FRONT_ENEMIES);
    }
    this.maxHealth = firstChapter ? 10 : rebelSecondChapter ? 15 : secondChapter ? 15 : thirdChapter ? 20 : fourthChapter ? 20 : sixthChapter ? 25 : maxHealth;
  }

  get status() {
    return `敌方 ${this.#deck.length}`;
  }

  /** @param {EncounterContext} battle */
  opening(battle) {
    if (this.#firstChapter) {
      const col = this.#pickSummonCol(battle);
      if (col !== undefined) {
        const def = this.#deck.shift();
        battle.summonEnemy(def, col, false);
      }
      return;
    }
    if (this.#rebelSecondChapter) {
      const col = this.#pickSummonCol(battle);
      if (col !== undefined) {
        battle.summonEnemy(this.#deck.shift(), col, false);
      }
      return;
    }
    if (this.#secondChapter) {
      const lanes = this.#random.shuffled(Array.from({ length: LANE_COUNT }, (_, col) => col));
      for (let index = 0; index < 2; index += 1) {
        battle.summonEnemy(this.#deck.shift(), lanes[index], false);
      }
      return;
    }
    if (this.#thirdChapter) {
      const lanes = this.#random.shuffled(Array.from({ length: LANE_COUNT }, (_, col) => col));
      for (let index = 0; index < 2; index += 1) {
        battle.summonEnemy(this.#deck.shift(), lanes[index], false);
      }
      return;
    }
    if (this.#fourthChapter) {
      const lanes = this.#random.shuffled(Array.from({ length: LANE_COUNT }, (_, col) => col));
      for (let index = 0; index < 4; index += 1) {
        battle.summonEnemy(this.#deck.shift(), lanes[index], false);
      }
      return;
    }
    if (this.#sixthChapter) {
      const lanes = this.#random.shuffled(Array.from({ length: LANE_COUNT }, (_, col) => col));
      for (let index = 0; index < 3; index += 1) {
        battle.summonEnemy(this.#deck.shift(), lanes[index], false);
      }
      return;
    }
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
    const summonCount = this.#firstChapter
      ? battle.round === 1
        ? 2
        : battle.round === 2
          ? 1
          : 0
      : this.#rebelSecondChapter && battle.round === 1
        ? 2
        : this.#secondChapter && battle.round === 1
        ? 1
        : this.#thirdChapter
          ? battle.round === 1
            ? 2
            : battle.round === 2
              ? 1
              : 0
          : this.#fourthChapter && battle.round === 1
            ? 1
            : this.#sixthChapter
              ? battle.round === 1
                ? 3
                : battle.round === 2
                  ? 1
                  : 0
              : 0;
    const reserved = [];
    for (let index = 0; index < summonCount; index += 1) {
      const col = this.#deck.length > 0 ? this.#pickSummonCol(battle, reserved) : undefined;
      if (col === undefined) {
        break;
      }
      reserved.push(col);
      const def = this.#deck[index];
      actions.push({
        intent: { kind: "summon", col, def },
        execute: (battle) => {
          this.#deck.shift();
          battle.summonEnemy(def, col);
        },
      });
    }

    return actions;
  }

  /** @param {EncounterContext} battle @param {number[]} reserved */
  #pickSummonCol(battle, reserved = []) {
    const emptyCols = [];
    for (let col = 0; col < LANE_COUNT; col += 1) {
      if (!battle.enemyBoard[col] && !reserved.includes(col)) {
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
