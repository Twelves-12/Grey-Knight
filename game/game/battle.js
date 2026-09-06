/**
 * @typedef {import("../types.js").BattleEvent} BattleEvent
 * @typedef {import("../types.js").CardDef} CardDef
 * @typedef {import("../types.js").PlayResult} PlayResult
 * @typedef {import("./player.js").Player} Player
 * @typedef {import("../types.js").Side} Side
 * @typedef {import("../types.js").Unit} Unit
 * @typedef {import("../types.js").Winner} Winner
 */
import { CardPiles } from "./card-piles.js";
import { resolveDuel } from "./duel.js";
import { Random } from "./random.js";
import {
  ENERGY_MAX,
  HAND_CAP,
  LANE_COUNT,
  START_ENERGY,
  START_HAND,
} from "./rules.js";

export class Battle {
  #encounter;
  #piles;
  #player;
  /** @type {(Unit | undefined)[]} */
  #enemyBoard = Array.from({
    length: LANE_COUNT,
  });

  /** @type {(Unit | undefined)[]} */
  #playerBoard = Array.from({
    length: LANE_COUNT,
  });

  #cardsPlayed = 0;
  #combatCol = 0;
  /** @type {import("../types.js").EncounterAction[]} */
  #enemyActions = [];
  #enemyHealth;
  #enemyUnitsSlain = 0;
  #energy;
  #heroDamageDealt = 0;
  #heroDamageTaken = 0;
  #nextUid = 1;
  #phase = "intro";
  /** @type {BattleEvent[]} */
  #queue = [];
  #round = 1;
  /** @type {Winner | undefined} */
  #winner;
  /**
   * @param {number} seed
   * @param {Player} player
   * @param {import("../types.js").Encounter} encounter
   */
  constructor(seed, player, encounter) {
    this.#encounter = encounter;
    this.#player = player;
    const random = new Random(seed);
    this.#piles = new CardPiles(player.deck, random.fork());
    this.#enemyHealth = encounter.maxHealth;
    this.#energy = START_ENERGY;
    this.#encounter.opening(this);
    if (this.#finishIfOver()) {
      return;
    }
    while (this.#piles.hand.length < START_HAND) {
      if (!this.#drawNext()) {
        break;
      }
    }
    this.#enemyActions = this.#encounter.plan(this);
    this.#queue.push({ kind: "round", round: 1 });
  }

  get encounter() {
    return this.#encounter;
  }

  get enemyIntents() {
    return this.#enemyActions.map((action) => action.intent);
  }

  get enemyBoard() {
    return this.#enemyBoard;
  }

  get enemyHealth() {
    return this.#enemyHealth;
  }

  get energy() {
    return this.#energy;
  }

  get hand() {
    return this.#piles.hand;
  }

  get phase() {
    return this.#phase;
  }

  get playerBoard() {
    return this.#playerBoard;
  }

  get player() {
    return this.#player;
  }

  get round() {
    return this.#round;
  }

  get stats() {
    return {
      cardsPlayed: this.#cardsPlayed,
      enemyUnitsSlain: this.#enemyUnitsSlain,
      heroDamageDealt: this.#heroDamageDealt,
      heroDamageTaken: this.#heroDamageTaken,
    };
  }

  get winner() {
    return this.#winner;
  }

  get drawCount() {
    return this.#piles.drawCount;
  }

  get discardCount() {
    return this.#piles.discardCount;
  }

  advance() {
    while (true) {
      const event = this.#queue.shift();
      if (event) {
        if (event.kind === "round") {
          this.#phase = "player";
        }

        return event;
      }
      if (this.#phase === "over" || this.#phase === "player") {
        return undefined;
      }
      if (this.#phase === "combat") {
        if (this.#combatCol < LANE_COUNT) {
          const col = this.#combatCol;
          this.#combatCol += 1;
          this.#resolveCol(col);

          continue;
        }
        if (!this.#finishIfOver()) {
          this.#phase = "enemy";
          this.#queue.push({ kind: "phase", name: "enemy" });
        }

        continue;
      }
      const action = this.#enemyActions.shift();
      if (action) {
        action.execute(this);
        this.#finishIfOver();

        continue;
      }
      this.#round += 1;
      this.#energy = ENERGY_MAX;
      this.#queue.push({
        kind: "energy",
      });
      while (this.#piles.hand.length < HAND_CAP) {
        if (!this.#drawNext()) {
          break;
        }
      }
      this.#enemyActions = this.#encounter.plan(this);
      this.#queue.push({ kind: "round", round: this.#round });
    }
  }

  endTurn() {
    if (this.#phase !== "player") {
      return false;
    }
    this.#phase = "combat";
    this.#combatCol = 0;
    this.#queue.push({ kind: "phase", name: "combat" });

    return true;
  }

  /**
   * @param {number} handIndex
   * @param {number} col
   * @returns {PlayResult}
   */
  playCard(handIndex, col) {
    if (this.#phase !== "player") {
      return { ok: false, reason: "phase" };
    }
    if (this.#playerBoard[col]) {
      return { ok: false, reason: "occupied" };
    }
    const card = this.#piles.hand[handIndex];
    if (!card) {
      throw new RangeError(`不存在第 ${handIndex} 张手牌`);
    }
    if (card.cost > this.#energy) {
      return { ok: false, reason: "afford" };
    }
    this.#piles.removeFromHand(handIndex);
    this.#energy -= card.cost;
    this.#cardsPlayed += 1;
    const uid = this.#nextUid;
    this.#nextUid += 1;
    const unit = {
      def: card,
      hp: card.health,
      uid,
    };
    this.#playerBoard[col] = unit;
    this.#applyEffects(card, "player", col);
    this.#finishIfOver();

    return { ok: true };
  }

  /**
   * @param {CardDef} def
   * @param {Side} side
   * @param {number} col
   */
  #applyEffects(def, side, col) {
    for (const effect of def.onDeploy ?? []) {
      switch (effect.kind) {
        case "draw": {
          for (let index = 0; index < effect.count; index += 1) {
            this.#drawNext();
          }

          break;
        }
        case "energy": {
          this.#energy = Math.min(ENERGY_MAX, this.#energy + effect.count);
          this.#queue.push({ kind: "energy" });

          break;
        }
        case "damageHero": {
          this.damageHero(
            side === "player" ? "enemy" : "player",
            effect.count,
            { kind: "deploy", col },
          );

          break;
        }
        case "healHero": {
          const health =
            side === "player" ? this.#player.health : this.#enemyHealth;
          let amount;
          if (side === "player") {
            amount = this.#player.heal(effect.count);
          } else {
            amount = Math.min(effect.count, this.#encounter.maxHealth - health);
            this.#enemyHealth += amount;
          }
          if (amount > 0) {
            this.#queue.push({
              amount,
              kind: "heal",
              target: side,
              targetHp: health + amount,
            });
          }

          break;
        }
      }
    }
  }

  /**
   * @param {Side} target
   * @param {number} amount
   * @param {import("../types.js").HeroHitOrigin} origin
   */
  damageHero(target, amount, origin) {
    if (target === "player") {
      amount = this.#player.takeDamage(amount);
      this.#heroDamageTaken += amount;
    } else {
      amount = Math.min(amount, this.#enemyHealth);
      this.#enemyHealth -= amount;
      this.#heroDamageDealt += amount;
    }
    if (amount === 0) {
      return;
    }
    this.#queue.push({
      amount,
      kind: "heroHit",
      origin,
      target,
      targetHp: target === "player" ? this.#player.health : this.#enemyHealth,
    });
  }

  #drawNext() {
    const { card, reshuffled } = this.#piles.drawCard();
    if (reshuffled) {
      this.#queue.push({ kind: "reshuffle" });
    }
    if (!card) {
      return false;
    }
    this.#queue.push({
      card,
      kind: "drawCard",
    });

    return true;
  }

  /**
   * @param {CardDef} def
   * @param {number} col
   * @param {boolean} [triggerEffects]
   */
  summonEnemy(def, col, triggerEffects = true) {
    const uid = this.#nextUid;
    this.#nextUid += 1;
    const unit = { def, hp: def.health, uid };
    this.#enemyBoard[col] = unit;
    this.#queue.push({ col, kind: "summon", unit });
    if (triggerEffects) {
      this.#applyEffects(def, "enemy", col);
    }
  }

  /**
   * @param {number} col
   * @param {Side[]} died
   * @param {Side} side
   * @param {Unit} unit
   */
  #removeDead(col, died, side, unit) {
    if (unit.hp > 0) {
      return;
    }
    if (side === "enemy") {
      this.#enemyBoard[col] = undefined;
      this.#enemyUnitsSlain += 1;
    } else {
      this.#playerBoard[col] = undefined;
      this.#piles.discard(unit.def);
    }
    died.push(side);
  }

  /** @param {number} col */
  #resolveCol(col) {
    const playerUnit = this.#playerBoard[col];
    const enemyUnit = this.#enemyBoard[col];
    if (playerUnit && enemyUnit) {
      const { hits, playerOverflow, enemyOverflow } = resolveDuel(
        playerUnit,
        enemyUnit,
      );
      /** @type {Side[]} */
      const died = [];
      this.#queue.push({ col, died, hits, kind: "fight" });
      if (playerOverflow > 0) {
        this.damageHero("enemy", playerOverflow, { kind: "lane", col });
      }
      if (enemyOverflow > 0) {
        this.damageHero("player", enemyOverflow, { kind: "lane", col });
      }
      this.#removeDead(col, died, "enemy", enemyUnit);
      this.#removeDead(col, died, "player", playerUnit);

      return;
    }
    if (playerUnit) {
      const amount = playerUnit.def.attack;
      this.damageHero("enemy", amount, { kind: "lane", col });

      return;
    }
    if (enemyUnit) {
      const amount = enemyUnit.def.attack;
      this.damageHero("player", amount, { kind: "lane", col });
    }
  }

  #finishIfOver() {
    const playerDown = this.#player.health === 0;
    const enemyDown = this.#enemyHealth === 0;
    if (!playerDown && !enemyDown) {
      return false;
    }
    const winner = playerDown ? (enemyDown ? "draw" : "enemy") : "player";
    this.#winner = winner;
    this.#phase = "over";
    this.#queue.push({
      kind:
        winner === "player"
          ? "victory"
          : winner === "enemy"
            ? "defeat"
            : "draw",
    });

    return true;
  }
}
