import { CHAPTER_ENEMY_CARDS } from "../content/cards.js";
import { Random } from "../game/random.js";
import { LANE_COUNT } from "../game/rules.js";

/**
 * @typedef {import("../types.js").EncounterContext} EncounterContext
 * @typedef {import("../types.js").EncounterAction} EncounterAction
 * @typedef {import("../types.js").CardDef} CardDef
 */

const CHAPTERS = {
  "node-1": {
    hero: { glyph: "匪", name: "匪首头目", nameEn: "Bandit Chief" },
    maxHealth: 10,
    opening: ["bandit-grunt"],
    waves: [["raiding-party"], ["bandit-deputy", "bandit-grunt"]],
    rule: "教程：援军有限。选择推进方向，利用军令与破阵击败匪首。",
    victory: {
      title: "东部暂宁",
      flavor: [
        "盗匪放下武器，匪首请求饶命。",
        "如何处置降者，将在日后留下回响。",
      ],
    },
  },
  "node-2": {
    hero: { glyph: "蛮", name: "蛮族战团", nameEn: "Barbarian Warband" },
    maxHealth: 16,
    opening: ["barbarian-scout"],
    waves: [["barbarian-warrior"], [], ["barbarian-warband"]],
    reinforcements: ["barbarian-scout", "barbarian-warrior"],
    interval: 2,
    rule: "边境侵扰：第三轮后每两轮有一名蛮族增援，空隙可用来完成准备。",
    victory: {
      title: "边境止戈",
      flavor: ["蛮族并非天生的入侵者。", "失去故土的人，正在寻找一线生机。"],
    },
  },
  "node-3": {
    hero: { glyph: "海", name: "深海海怪", nameEn: "Deep Sea Horror" },
    maxHealth: 24,
    opening: ["sea-claw"],
    waves: [["deep-sea-monster"], ["sea-claw"]],
    reinforcements: ["sea-claw"],
    interval: 2,
    rule: "海怪入场会伤害全体玩家单位；之后每两轮召来爪兵。",
    victory: {
      title: "潮声平息",
      flavor: ["海怪沉入暗潮，海岸重归平静。", "它的头颅将见证这场鏖战。"],
    },
  },
  "node-4": {
    hero: { glyph: "誓", name: "叛逃骑士", nameEn: "Renegade Knight" },
    maxHealth: 18,
    opening: ["renegade-knight"],
    waves: [],
    mode: "duel",
    roundLimit: 6,
    rule: "剧情决斗：骑士依次蓄力、重击、跳跃，动作提前公开。双方英雄不会被杀死，最迟第六轮结束后进入抉择。",
    victory: {
      title: "剑刃上的真相",
      flavor: [
        "叛逃骑士收起武器，说出领主掩盖的真相。",
        "忠诚与正义，第一次不再指向同一个人。",
      ],
    },
  },
  "node-5": {
    hero: { glyph: "民", name: "流民庙宇", nameEn: "Refugee Sanctuary" },
    maxHealth: 10,
    opening: ["refugee-elder", "refugee", "refugee"],
    waves: [],
    mode: "peaceful",
    rule: "这里没有真正的敌人。流民不会主动攻击，也不会还击；你可以直接拒绝命令。",
    victory: {
      title: "无声的庙宇",
      flavor: ["庙宇里只有饥饿的乡民。", "守护弱者，还是继续服从命令？"],
    },
  },
  "node-6": {
    hero: { glyph: "契", name: "老管家", nameEn: "The Old Butler" },
    maxHealth: 20,
    opening: ["bandit-grunt"],
    waves: [["old-butler"], ["bandit-deputy"]],
    reinforcements: ["bandit-grunt"],
    interval: 3,
    rule: "你的三次处置改变匪帮兵力；老管家会融合受操控的人类并攻击对应战线。",
    victory: {
      title: "东部真相",
      flavor: [
        "供词指向宫殿，匪患的幕后推手终于现身。",
        "灰骑士必须决定自己的誓言究竟属于谁。",
      ],
    },
  },
  "node-7": {
    hero: { glyph: "王", name: "暴君领主", nameEn: "The Tyrant Lord" },
    maxHealth: 32,
    opening: ["private-guard"],
    waves: [["tyrant-lord"], ["private-guard"]],
    reinforcements: ["private-guard"],
    interval: 3,
    rule: "暴君入场伤害全体玩家单位；私人卫队每三轮增援。",
    victory: {
      title: "新的守护者",
      flavor: [
        "旧王座倾覆，宫殿之门向人民敞开。",
        "灰骑士舍弃暴君的誓约，成为这片土地新的守护者。",
      ],
    },
  },
  "road-1": {
    hero: { glyph: "骨", name: "骸骨军团", nameEn: "Bone Legion" },
    maxHealth: 13,
    opening: ["reborn-soldier", "reborn-soldier"],
    waves: [[], ["reborn-soldier", "bandit-deputy"], [], ["reborn-soldier"]],
    rule: "骸骨复生：第二、四轮有有限复生援军，间隙可调整牌序。",
    victory: { title: "旧骨归尘", flavor: ["最后一具骸骨化作灰烬。"] },
  },
  "road-2": {
    hero: { glyph: "炮", name: "雾中炮兽", nameEn: "Cannon in the Mist" },
    maxHealth: 17,
    opening: ["abyss-cannon"],
    waves: [["barbarian-scout"], [], ["barbarian-scout"]],
    rule: "蓄势窗口：炮兽沉睡两轮，苏醒时伤害英雄；提前击杀可阻止炮击。",
    victory: { title: "雾散炮熄", flavor: ["炮兽倒下，穿越浓雾的道路显现。"] },
  },
  "road-3": {
    hero: { glyph: "梦", name: "深渊仪式团", nameEn: "Abyssal Ritualists" },
    maxHealth: 20,
    opening: ["nightmare-priest", "sea-claw"],
    waves: [[], ["nightmare-priest"], [], ["sea-claw"]],
    rule: "错开的祭祀倒计时：祭司沉睡两轮后攻击大增；按威胁顺序打断仪式。",
    victory: {
      title: "梦魇消退",
      flavor: ["仪式被打断，梦中的呼唤逐渐消散。"],
    },
  },
  "elite-1": {
    hero: { glyph: "钟", name: "无面钟庭", nameEn: "The Faceless Court" },
    maxHealth: 23,
    opening: ["faceless-bell", "private-guard"],
    waves: [[], ["faceless-bell"]],
    domain: "rotation",
    rule: "领域·轮转钟庭：每两轮，敌方全体单位向右轮转一格。轮转意图预先公开。",
    victory: {
      title: "钟庭失声",
      flavor: ["轮转停止，钟庭留下了一件古老战具。"],
    },
  },
  "elite-2": {
    hero: { glyph: "壁", name: "沉梦堡垒", nameEn: "Dream Bastion" },
    maxHealth: 26,
    opening: ["nightmare-priest", "sea-claw"],
    waves: [[], ["abyss-cannon"], [], ["sea-claw"]],
    domain: "armor",
    rule: "领域·梦中壁垒：每两轮，敌方沉睡单位获得 2 护甲。趁它们苏醒时集中破阵。",
    victory: {
      title: "梦壁崩落",
      flavor: ["守梦壁垒崩塌，古老遗物重见天日。"],
    },
  },
};

/** @implements {import("../types.js").Encounter} */
export class AbyssFront {
  #random;
  #config;
  #cards;
  #waves;
  #reinforcements;
  #pending = [];
  #reinforcementIndex = 0;

  /** @param {number} seed @param {{nodeId?:string, choices?:Record<string,string>}} [options] */
  constructor(seed, { nodeId = "node-1", choices = {} } = {}) {
    const config = CHAPTERS[nodeId];
    if (!config) {
      throw new RangeError(`未知遭遇：${nodeId}`);
    }
    this.#random = new Random(seed ^ 0x51_ab_3d_77);
    this.#config = config;
    this.#cards = CHAPTER_ENEMY_CARDS[nodeId];
    this.#waves = config.waves.map((wave) => [...wave]);
    this.#reinforcements = [...(config.reinforcements ?? [])];
    this.nodeId = nodeId;
    this.hero = config.hero;
    this.maxHealth = config.maxHealth;
    this.mode = config.mode ?? "battle";
    this.roundLimit = config.roundLimit;
    this.rule = config.rule;
    this.domain = config.domain;
    this.victory = config.victory;
    this.reinforcementInterval = config.interval;
    this.openingCards = [...config.opening];

    if (nodeId === "node-6") {
      const harshness =
        Number(choices.bandit !== "recruit") +
        Number(choices.barbarians !== "mercy") +
        Number(choices.temple !== "protect");
      this.maxHealth += harshness * 4;
      if (choices.bandit !== "recruit") {
        this.openingCards.push("bandit-grunt");
        this.#waves[1].push("raiding-party");
      }
      if (choices.barbarians !== "mercy") {
        this.#waves[1].push("barbarian-warrior");
        this.#reinforcements.push("barbarian-scout", "barbarian-warrior");
      }
      if (choices.temple !== "protect") {
        this.#waves.push(["bandit-deputy", "raiding-party"]);
      }
      this.reinforcementInterval = harshness >= 2 ? 1 : harshness === 1 ? 2 : 3;
      this.rule += ` 当前残酷处置 ${harshness}/3：英雄生命 ${this.maxHealth}，每 ${this.reinforcementInterval} 轮增援。`;
    }
    this.#cards = [
      ...new Set([
        ...this.openingCards,
        ...this.#waves.flat(),
        ...this.#reinforcements,
      ]),
    ].map((id) => this.#definition(id));
  }

  get status() {
    if (this.mode === "peaceful") {
      return "非敌对 · 可直接离开";
    }
    if (this.mode === "duel") {
      return `剧情决斗 · ${this.roundLimit} 轮后对话`;
    }
    if (this.#reinforcements.length > 0) {
      return `每 ${this.reinforcementInterval} 轮增援`;
    }

    return `剩余援军 ${this.#waves.flat().length + this.#pending.length}`;
  }

  get state() {
    return {
      waves: this.#waves.map((wave) => [...wave]),
      pending: [...this.#pending],
      reinforcementIndex: this.#reinforcementIndex,
      random: this.#random.state,
    };
  }

  /** @param {number} round @param {import("../types.js").EnemyIntent[]} intents @returns {import("../types.js").EnemyDeck} */
  getDeck(round, intents) {
    const interval = this.reinforcementInterval;
    const recurring =
      this.#reinforcements.length > 0
        ? {
            cards: this.#reinforcements.map((_, index) =>
              this.#definition(
                this.#reinforcements[
                  (this.#reinforcementIndex + index) %
                    this.#reinforcements.length
                ],
              ),
            ),
            interval,
            nextRound: Math.ceil(Math.max(3, round + 1) / interval) * interval,
          }
        : null;

    return structuredClone({
      cards: this.#cards,
      planned: intents.flatMap((intent) =>
        intent.kind === "summon" ? [{ def: intent.def, col: intent.col }] : [],
      ),
      pending: this.#pending.map((id) => this.#definition(id)),
      waves: this.#waves.flatMap((wave, index) =>
        wave.length > 0
          ? [
              {
                round: index + 1,
                cards: wave.map((id) => this.#definition(id)),
              },
            ]
          : [],
      ),
      recurring,
    });
  }

  restore(state) {
    this.#waves = state.waves.map((wave) => [...wave]);
    this.#pending = [...state.pending];
    this.#reinforcementIndex = state.reinforcementIndex;
    this.#random.state = state.random;
  }

  /** @param {EncounterContext} battle */
  opening(battle) {
    for (const id of this.openingCards) {
      const col = this.#pickCol(battle);
      if (col !== undefined) {
        battle.summonEnemy(this.#definition(id), col);
      }
    }
  }

  /** @param {EncounterContext} battle @returns {EncounterAction[]} */
  plan(battle) {
    if (this.mode === "duel") {
      return this.#duelPlan(battle);
    }
    const scheduled = this.#waves[battle.round - 1] ?? [];
    this.#waves[battle.round - 1] = [];
    this.#pending.push(...scheduled);
    if (
      this.#reinforcements.length > 0 &&
      battle.round > 2 &&
      battle.round % this.reinforcementInterval === 0
    ) {
      this.#pending.push(
        this.#reinforcements[
          this.#reinforcementIndex % this.#reinforcements.length
        ],
      );
      this.#reinforcementIndex += 1;
    }
    /** @type {EncounterAction[]} */
    const actions = [];
    const reserved = [];
    while (this.#pending.length > 0) {
      const id = this.#pending[0];
      const def = this.#definition(id);
      const fusionCol = def.fusionFaction
        ? battle.enemyBoard.findIndex(
            (unit, col) =>
              unit?.def.faction === def.fusionFaction &&
              !reserved.includes(col),
          )
        : -1;
      const col = fusionCol >= 0 ? fusionCol : this.#pickCol(battle, reserved);
      if (col === undefined) {
        break;
      }
      reserved.push(col);
      this.#pending.shift();
      actions.push(
        ...this.restorePlan([
          { kind: "summon", op: "summon", col, def, cardId: def.id },
        ]),
      );
    }
    if (this.domain === "rotation" && battle.round % 2 === 0) {
      actions.push(
        ...this.restorePlan([
          {
            kind: "ability",
            op: "rotation",
            name: "轮转钟庭",
            text: "敌方全体单位向右轮转一格。",
          },
        ]),
      );
    }
    if (this.domain === "armor" && battle.round % 2 === 0) {
      actions.push(
        ...this.restorePlan([
          {
            kind: "ability",
            op: "sleepArmor",
            name: "梦中壁垒",
            text: "敌方沉睡单位获得 2 护甲。",
          },
        ]),
      );
    }

    return actions;
  }

  restorePlan(intents) {
    return intents.map((intent) => ({
      intent,
      execute: (battle) => {
        switch (intent.op) {
          case "summon": {
            battle.summonEnemy(this.#definition(intent.cardId), intent.col);

            break;
          }
          case "move": {
            battle.moveEnemy(intent.from, intent.col);

            break;
          }
          case "empower": {
            battle.empowerEnemy(intent.col, {
              attack: intent.attack,
              armor: intent.armor,
            });

            break;
          }
          case "rotation": {
            battle.rotateEnemy();

            break;
          }
          case "sleepArmor": {
            for (let col = 0; col < LANE_COUNT; col += 1) {
              if (battle.enemyBoard[col]?.sleep > 0) {
                battle.empowerEnemy(col, { armor: 2 });
              }
            }

            break;
          }
        }
      },
    }));
  }

  /** @param {EncounterContext} battle @returns {EncounterAction[]} */
  #duelPlan(battle) {
    const col = battle.enemyBoard.findIndex(
      (unit) => unit?.def.id === "renegade-knight",
    );
    if (col === -1) {
      return [];
    }
    if (battle.round % 3 === 1) {
      return this.restorePlan([
        {
          kind: "ability",
          op: "empower",
          name: "蓄力",
          col,
          attack: 2,
          armor: 1,
          text: `骑士本轮结束蓄力：第 ${col + 1} 路获得 2 攻击与 1 护甲，下一轮发动重击。`,
        },
      ]);
    }
    if (battle.round % 3 === 2) {
      return this.restorePlan([
        {
          kind: "ability",
          op: "empower",
          name: "重击",
          col,
          attack: -2,
          armor: 0,
          text: `第 ${col + 1} 路骑士本轮以蓄力后的攻击出手；本轮结束消耗蓄力并恢复原攻击。`,
        },
      ]);
    }
    const destinations = Array.from(
      { length: LANE_COUNT },
      (_, index) => index,
    ).filter((index) => !battle.enemyBoard[index]);
    const destination = destinations[this.#random.integer(destinations.length)];

    return this.restorePlan([
      {
        kind: "ability",
        op: "move",
        name: "跳跃",
        from: col,
        col: destination,
        text: `本轮结束，骑士从第 ${col + 1} 路跳到第 ${destination + 1} 路；可以提前调整站位。`,
      },
    ]);
  }

  /** @param {string} id @returns {CardDef} */
  #definition(id) {
    const def = this.#cards.find((candidate) => candidate.id === id);
    if (!def) {
      throw new Error(`遭遇 ${this.nodeId} 缺少卡牌 ${id}`);
    }

    return def;
  }

  /** @param {EncounterContext} battle @param {number[]} [reserved] */
  #pickCol(battle, reserved = []) {
    const cols = Array.from({ length: LANE_COUNT }, (_, col) => col).filter(
      (col) => !battle.enemyBoard[col] && !reserved.includes(col),
    );
    if (cols.length === 0) {
      return undefined;
    }
    const contested = cols.filter((col) => battle.playerBoard[col]);
    const candidates =
      contested.length > 0 && this.#random.next() < 0.65 ? contested : cols;

    return candidates[this.#random.integer(candidates.length)];
  }
}
