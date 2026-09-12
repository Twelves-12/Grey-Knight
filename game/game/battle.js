import { CardPiles } from "./card-piles.js";
import { resolveDuel } from "./duel.js";
import { Random } from "./random.js";
import { ENERGY_MAX, HAND_CAP, LANE_COUNT, START_HAND } from "./rules.js";

const opposite = (side) => (side === "player" ? "enemy" : "player");

export class Battle {
  #encounter;
  #piles;
  #player;
  #random;
  #enemyBoard = Array.from({ length: LANE_COUNT });
  #playerBoard = Array.from({ length: LANE_COUNT });
  #cardsPlayed = 0;
  #combatCol = 0;
  #enemyActions = [];
  #enemyHealth;
  #enemyUnitsSlain = 0;
  #energy = ENERGY_MAX;
  #heroDamageDealt = 0;
  #heroDamageTaken = 0;
  #nextUid = 1;
  #phase = "intro";
  #queue = [];
  #round = 1;
  #winner;
  #direction = "left";
  #commandUsed = false;
  #recruited = false;
  #moved = false;
  #oathUsed = false;
  #relics;
  #oath;
  #relicUsed = [];
  #ritualDamage = 0;
  #growth = {};
  #chain = 0;

  constructor(
    seed,
    player,
    encounter,
    { state, relics = [], oath = null } = {},
  ) {
    this.#encounter = encounter;
    this.#player = player;
    this.#relics = relics;
    this.#oath = oath;
    this.#random = new Random(seed);
    this.#piles = new CardPiles(player.deck, this.#random.fork(), state?.piles);
    this.#enemyHealth = encounter.maxHealth;
    if (state) {
      this.#random.state = state.random;
      this.#enemyBoard = state.enemyBoard;
      this.#playerBoard = state.playerBoard;
      this.#enemyHealth = state.enemyHealth;
      player.takeDamage(player.health - state.health);
      this.#energy = state.energy;
      this.#round = state.round;
      this.#direction = state.direction;
      this.#commandUsed = state.commandUsed;
      this.#recruited = state.recruited;
      this.#moved = state.moved;
      this.#oathUsed = state.oathUsed;
      this.#relicUsed = state.relicUsed;
      this.#ritualDamage = state.ritualDamage;
      this.#growth = state.growth;
      this.#nextUid = state.nextUid;
      this.#cardsPlayed = state.stats.cardsPlayed;
      this.#enemyUnitsSlain = state.stats.enemyUnitsSlain;
      this.#heroDamageDealt = state.stats.heroDamageDealt;
      this.#heroDamageTaken = state.stats.heroDamageTaken;
      encounter.restore(state.encounter);
      this.#enemyActions = encounter.restorePlan(state.intents);
      for (const [col, unit] of this.#enemyBoard.entries()) {
        if (unit) {
          this.#queue.push({
            kind: "summon",
            col,
            unit: this.#displayUnit(unit, "enemy"),
          });
        }
      }
      for (const card of this.hand) {
        this.#queue.push({ kind: "drawCard", card });
      }
      this.#queueBoard();
      this.#queue.push({ kind: "round", round: this.#round });

      return;
    }
    encounter.opening(this);
    if (this.#finishIfOver()) {
      return;
    }
    while (this.hand.length < START_HAND) {
      if (!this.#drawNext()) {
        break;
      }
    }
    this.#enemyActions = encounter.plan(this);
    this.#queue.push({ kind: "round", round: 1 });
  }

  get encounter() {
    return this.#encounter;
  }

  get enemyIntents() {
    return this.#enemyActions.map((action) => action.intent);
  }

  /** @returns {import("../types.js").EnemyDeck} */
  get enemyDeck() {
    return this.#encounter.getDeck(this.#round, this.enemyIntents);
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

  get maxEnergy() {
    return ENERGY_MAX;
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

  /** @returns {import("../types.js").BoardState} */
  get boardState() {
    return {
      player: this.#playerBoard.map((unit) =>
        unit ? this.#displayUnit(unit, "player") : null,
      ),
      enemy: this.#enemyBoard.map((unit) =>
        unit ? this.#displayUnit(unit, "enemy") : null,
      ),
    };
  }

  get player() {
    return this.#player;
  }

  get round() {
    return this.#round;
  }

  get winner() {
    return this.#winner;
  }

  get drawCount() {
    return this.#piles.drawCount;
  }

  get discardCount() {
    return this.#piles.discard.length;
  }

  get drawPile() {
    return this.#piles.drawPile;
  }

  get discardPile() {
    return this.#piles.discard;
  }

  get direction() {
    return this.#direction;
  }

  get commandUsed() {
    return this.#commandUsed;
  }

  get recruited() {
    return this.#recruited;
  }

  get requisitionCost() {
    return this.#playerBoard.some(
      (unit) => this.#active(unit) && unit.def.freeRequisition,
    ) ||
      (this.#relics.includes("recruitment") &&
        !this.#relicUsed.includes("recruitment"))
      ? 0
      : 1;
  }

  get moved() {
    return this.#moved;
  }

  get oathUsed() {
    return this.#oathUsed;
  }

  get oath() {
    return this.#oath;
  }

  get ritualDamage() {
    return this.#ritualDamage;
  }

  get growth() {
    return { ...this.#growth };
  }

  get stats() {
    return {
      cardsPlayed: this.#cardsPlayed,
      enemyUnitsSlain: this.#enemyUnitsSlain,
      heroDamageDealt: this.#heroDamageDealt,
      heroDamageTaken: this.#heroDamageTaken,
    };
  }

  get snapshot() {
    if (this.#phase !== "player") {
      return null;
    }

    return structuredClone({
      piles: this.#piles.state,
      random: this.#random.state,
      enemyBoard: this.#enemyBoard,
      playerBoard: this.#playerBoard,
      enemyHealth: this.#enemyHealth,
      health: this.#player.health,
      energy: this.#energy,
      round: this.#round,
      direction: this.#direction,
      commandUsed: this.#commandUsed,
      recruited: this.#recruited,
      moved: this.#moved,
      oathUsed: this.#oathUsed,
      relicUsed: this.#relicUsed,
      ritualDamage: this.#ritualDamage,
      growth: this.#growth,
      nextUid: this.#nextUid,
      stats: this.stats,
      encounter: this.#encounter.state,
      intents: this.enemyIntents,
    });
  }

  #board(side) {
    return side === "player" ? this.#playerBoard : this.#enemyBoard;
  }

  #displayUnit(unit, side) {
    return structuredClone({
      ...unit,
      displayAttack: this.attackOf(unit, side),
    });
  }

  #queueBoard() {
    this.#queue.push({ kind: "board", state: this.boardState });
  }

  #unitEffect(side, col, label, tone = "benefit", remove = false) {
    const unit = this.#board(side)[col];
    if (unit) {
      this.#queue.push({
        kind: "unitEffect",
        target: { side, col },
        unit: this.#displayUnit(unit, side),
        label,
        tone,
        remove,
      });
    }
  }

  #moveUnits(side, moves) {
    const board = this.#board(side);
    const units = moves.map(({ from, to }) => ({
      from,
      to,
      unit: board[from],
    }));
    for (const { from } of units) {
      board[from] = undefined;
    }
    for (const { to, unit } of units) {
      board[to] = unit;
    }
    this.#refreshAuras();
    this.#queue.push({
      kind: "move",
      side,
      moves: units.map(({ from, to, unit }) => ({
        from,
        to,
        unit: this.#displayUnit(unit, side),
      })),
    });
  }

  #active(unit) {
    return unit && unit.hp > 0 && unit.sleep === 0;
  }

  attackOf(unit, side) {
    if (
      [...this.#playerBoard, ...this.#enemyBoard].some(
        (ally) => this.#active(ally) && ally.def.healthAttack,
      )
    ) {
      return Math.max(0, unit.hp + unit.temporaryAttack);
    }

    return Math.max(
      0,
      unit.attack +
        unit.temporaryAttack +
        this.#board(side).reduce(
          (total, ally) =>
            total +
            (this.#active(ally) && ally.def.aura?.faction === unit.def.faction
              ? (ally.def.aura.attack ?? 0)
              : 0),
          0,
        ),
    );
  }

  advance() {
    while (true) {
      const event = this.#queue.shift();
      if (event) {
        if (event.kind === "round" && this.#phase !== "over") {
          this.#phase = "player";
        }

        return event;
      }
      if (this.#phase === "over" || this.#phase === "player") {
        return undefined;
      }
      if (this.#phase === "combat") {
        if (this.#combatCol < LANE_COUNT) {
          const col =
            this.#direction === "left"
              ? this.#combatCol
              : LANE_COUNT - 1 - this.#combatCol;
          this.#combatCol++;
          this.#resolveCol(col);
          this.#finishIfOver();

          continue;
        }
        if (this.#ritualDamage) {
          this.damageHero("enemy", this.#ritualDamage, {
            kind: "ability",
            name: "圣印审判",
          });
        }
        if (this.#finishIfOver()) {
          continue;
        }
        if (
          this.#encounter.mode === "duel" &&
          this.#round >= this.#encounter.roundLimit
        ) {
          this.#finish("draw");

          continue;
        }
        for (const unit of [...this.#playerBoard, ...this.#enemyBoard]) {
          if (unit) {
            unit.temporaryAttack = 0;
            unit.temporaryFirstStrike = false;
            unit.honor = 0;
          }
        }
        this.#phase = "enemy";
        this.#queue.push({ kind: "phase", name: "enemy" });

        continue;
      }
      const action = this.#enemyActions.shift();
      if (action) {
        action.execute(this);
        this.#finishIfOver();

        continue;
      }
      this.#round++;
      this.#energy = ENERGY_MAX;
      this.#commandUsed = false;
      this.#recruited = false;
      this.#moved = false;
      this.#oathUsed = false;
      for (const card of this.hand) {
        if (card.holdDiscount) {
          card.cost = Math.max(0, card.cost - 1);
        }
      }
      for (const side of ["player", "enemy"]) {
        for (const [col, unit] of this.#board(side).entries()) {
          if (unit?.sleep > 0 && --unit.sleep === 0) {
            this.#wake(unit, side, col);
          }
        }
      }
      this.#refreshAuras();
      if (this.#finishIfOver()) {
        continue;
      }
      this.#queue.push({ kind: "energy" });
      this.#drawNext();
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
    this.#chain = 0;
    this.#queue.push({ kind: "phase", name: "combat" });

    return true;
  }

  canDeploy(index, col) {
    return (
      Number.isInteger(col) &&
      col >= 0 &&
      col < LANE_COUNT &&
      Boolean(this.hand[index]) &&
      (!this.hand[index].type || this.hand[index].type === "unit")
    );
  }

  getPlayTargets(index, col) {
    const card = this.hand[index];

    return card ? this.#deployTargets(card, "player", col) : [];
  }

  #deployTargets(card, side, col) {
    const effect = card.onDeploy?.find((entry) =>
      ["buffTarget", "damageTarget"].includes(entry.kind),
    );
    if (!effect) {
      return [];
    }
    const targetSide = effect.kind === "buffTarget" ? side : opposite(side);

    return this.#board(targetSide).flatMap((unit, targetCol) =>
      unit && (targetSide !== side || targetCol !== col)
        ? [{ side: targetSide, col: targetCol }]
        : [],
    );
  }

  cardCost(card) {
    return Math.max(0, card.cost - (card.marks?.blessing ?? 0));
  }

  playCard(index, col, target) {
    if (this.#phase !== "player") {
      return { ok: false, reason: "phase" };
    }
    if (!this.canDeploy(index, col)) {
      return { ok: false, reason: "occupied" };
    }
    const card = this.hand[index];
    if (this.cardCost(card) > this.#energy) {
      return { ok: false, reason: "afford" };
    }
    const targets = this.getPlayTargets(index, col);
    if (
      (targets.length > 0 || target) &&
      !targets.some(
        (entry) => entry.side === target?.side && entry.col === target?.col,
      )
    ) {
      return { ok: false, reason: "target" };
    }
    this.#piles.removeFromHand(index);
    this.#energy -= this.cardCost(card);
    if (card.marks) {
      card.marks.blessing = 0;
    }
    this.#cardsPlayed++;
    const unit = this.#deploy(card, "player", col, true, target);
    this.#finishIfOver();

    return { ok: true, unit };
  }

  summonEnemy(def, col, triggerEffects = true) {
    if (!Number.isInteger(col) || col < 0 || col >= LANE_COUNT) {
      return false;
    }
    const existing = this.#enemyBoard[col];
    if (existing && def.fusionFaction !== existing.def.faction) {
      return false;
    }
    const targets = this.#deployTargets(def, "enemy", col);
    const target =
      targets.length > 0
        ? targets[this.#random.integer(targets.length)]
        : undefined;
    this.#deploy(structuredClone(def), "enemy", col, triggerEffects, target);

    return true;
  }

  #deploy(def, side, col, triggerEffects, target) {
    const board = this.#board(side);
    const material = board[col];
    if (material && side === "player") {
      this.#piles.discardCard(material.def);
      if (
        this.#relics.includes("salvage") &&
        !this.#relicUsed.includes("salvage")
      ) {
        this.#relicUsed.push("salvage");
        this.#drawNext();
      }
    }
    const unit = {
      def,
      attack: def.attack + (def.marks?.sharpen ?? 0),
      hp: def.health,
      maxHp: def.health,
      auraHealth: 0,
      armor: def.armor ?? 0,
      frozen: 0,
      stunned: 0,
      marked: 0,
      sleep: (def.sleep ?? 0) + (def.marks?.dream ?? 0),
      temporaryAttack: 0,
      temporaryFirstStrike: false,
      honor: 0,
      uid: this.#nextUid++,
    };
    if (def.marks) {
      def.marks.dream = 0;
    }
    board[col] = unit;
    if (side === "enemy") {
      this.#queue.push({
        col,
        kind: "summon",
        unit: this.#displayUnit(unit, side),
      });
    }
    this.#refreshAuras();
    const initial = this.#displayUnit(unit, side);
    if (triggerEffects) {
      if (material?.def.onFusionDamage) {
        this.#damageUnit(
          opposite(side),
          col,
          material.def.onFusionDamage,
          unit,
          side,
        );
      }
      for (const effect of def.onDeploy ?? []) {
        this.#applyEffect(effect, unit, side, col, target, material);
      }
      for (const ally of board) {
        const trigger = ally?.def.onAllyDeploy;
        if (
          ally === unit ||
          !this.#active(ally) ||
          !trigger ||
          trigger.faction !== def.faction
        ) {
          continue;
        }
        if (trigger.kind === "damageHero") {
          this.#unitDamageHero(ally, side, trigger.count, {
            kind: "deploy",
            col: board.indexOf(ally),
          });
        } else {
          const cols = this.#board(opposite(side)).flatMap((enemy, enemyCol) =>
            enemy ? [enemyCol] : [],
          );
          if (cols.length > 0) {
            this.#damageUnit(
              opposite(side),
              cols[this.#random.integer(cols.length)],
              trigger.count,
              ally,
              side,
            );
          }
        }
      }
    }
    this.#refreshAuras();
    this.#queueBoard();

    return initial;
  }

  #applyEffect(effect, unit, side, col, target, material) {
    const other = opposite(side);
    switch (effect.kind) {
      case "draw": {
        if (side === "player") {
          for (let n = 0; n < effect.count; n++) {
            this.#drawNext();
          }
        }

        break;
      }
      case "energy": {
        if (side === "player") {
          this.#energy = Math.min(ENERGY_MAX, this.#energy + effect.count);
          this.#queue.push({ kind: "energy" });
        }

        break;
      }
      case "damageHero": {
        this.#unitDamageHero(unit, side, effect.count, { kind: "deploy", col });

        break;
      }
      case "healHero": {
        this.#healHero(side, effect.count);

        break;
      }
      case "generateCard": {
        if (side !== "player") {
          break;
        }
        const pool = this.#player.cardPool.filter(
          (card) => card.faction === effect.faction && !card.stage,
        );
        if (pool.length === 0) {
          throw new Error(`种属 ${effect.faction} 的生成牌池为空`);
        }
        const original = pool[this.#random.integer(pool.length)];
        const card = {
          ...structuredClone(original),
          attack: original.attack + (effect.attack ?? 0),
        };
        if (this.#piles.addToHand(card)) {
          this.#queue.push({ kind: "drawCard", card });
        }

        break;
      }
      case "buffTarget": {
        if (target) {
          this.#buff(
            this.#board(target.side)[target.col],
            effect.attack,
            effect.health,
            target.side,
          );
        }

        break;
      }
      case "attackPerAlly": {
        const gained =
          this.#board(side).filter(
            (ally) => ally?.def.faction === effect.faction,
          ).length * effect.count;
        unit.attack += gained;
        if (gained) {
          this.#unitEffect(side, col, `攻击 +${gained}`);
        }

        break;
      }
      case "buffAllies": {
        for (const ally of this.#board(side)) {
          if (ally?.def.faction === effect.faction) {
            this.#buff(ally, effect.attack ?? 0, effect.health ?? 0, side);
          }
        }

        break;
      }
      case "damageAllEnemies": {
        for (let lane = 0; lane < LANE_COUNT; lane++) {
          this.#damageUnit(other, lane, effect.count, unit, side);
        }

        break;
      }
      case "damageTarget": {
        if (target) {
          this.#damageUnit(target.side, target.col, effect.count, unit, side);
        }

        break;
      }
      case "damageLane": {
        this.#damageUnit(other, col, effect.count, unit, side);

        break;
      }
      case "fusionDamageLane": {
        if (material?.def.faction === unit.def.fusionFaction) {
          this.#damageUnit(other, col, effect.count, unit, side);
        }

        break;
      }
      case "freezeLane": {
        const enemy = this.#board(other)[col];
        if (enemy) {
          enemy.frozen = Math.max(enemy.frozen, effect.count);
          this.#unitEffect(other, col, "冰冻", "harm");
        }

        break;
      }
      default: {
        throw new Error(`未知卡牌效果：${effect.kind}`);
      }
    }
  }

  #healHero(side, count) {
    const amount =
      side === "player"
        ? this.#player.heal(count)
        : Math.min(count, this.#encounter.maxHealth - this.#enemyHealth);
    if (side === "enemy") {
      this.#enemyHealth += amount;
    }
    if (amount > 0) {
      this.#queue.push({
        kind: "heal",
        amount,
        target: side,
        targetHp: side === "player" ? this.#player.health : this.#enemyHealth,
      });
    }
  }

  #buff(unit, attack, health, side) {
    unit.attack += attack;
    unit.maxHp += health;
    unit.hp += health;
    const label = [
      attack ? `攻击 +${attack}` : "",
      health ? `生命 +${health}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    if (label) {
      this.#unitEffect(side, this.#board(side).indexOf(unit), label);
    }
  }

  #damageAmount(unit, side, amount) {
    if (amount <= 0) {
      return 0;
    }

    return (
      amount +
      this.#board(side).reduce(
        (sum, ally) =>
          sum +
          (this.#active(ally) && ally.def.aura?.faction === unit.def.faction
            ? (ally.def.aura.damage ?? 0)
            : 0),
        0,
      )
    );
  }

  #notifyDamage(unit, side) {
    for (const ally of this.#board(side)) {
      const trigger = ally?.def.onAllyDamage;
      if (
        ally !== unit &&
        this.#active(ally) &&
        trigger?.faction === unit.def.faction &&
        ally.attack < trigger.cap
      ) {
        const before = ally.attack;
        ally.attack = Math.min(trigger.cap, ally.attack + trigger.attack);
        this.#unitEffect(
          side,
          this.#board(side).indexOf(ally),
          `攻击 +${ally.attack - before}`,
        );
      }
    }
  }

  #absorb(unit, amount, side, col) {
    if (amount <= 0) {
      return 0;
    }
    if (unit.marked) {
      amount += unit.marked;
      unit.marked = 0;
    }
    if (unit.sleep) {
      for (const lane of [col - 1, col + 1]) {
        const ally = this.#board(side)[lane];
        if (this.#active(ally)) {
          amount = Math.max(0, amount - (ally.def.protectsSleep ?? 0));
        }
      }
    }
    const blocked = Math.min(unit.armor, amount);
    unit.armor -= blocked;

    return amount - blocked;
  }

  #damageUnit(target, col, amount, source, side) {
    const unit = this.#board(target)[col];
    if (!unit || amount <= 0) {
      return;
    }
    const armor = unit.armor;
    const originCol = source ? this.#board(side).indexOf(source) : -1;
    amount = source ? this.#damageAmount(source, side, amount) : amount;
    amount = this.#absorb(unit, amount, target, col);
    unit.hp -= amount;
    this.#queue.push({
      kind: "unitHit",
      target: { side: target, col },
      origin: originCol >= 0 ? { side, col: originCol } : { side },
      unit: this.#displayUnit(unit, target),
      amount,
      blocked: armor - unit.armor,
    });
    if (amount <= 0) {
      return;
    }
    if (source) {
      this.#notifyDamage(source, side);
    }
    this.#refreshAuras();
    if (source && unit.hp <= 0) {
      this.#rewardKill(source, side);
    }
  }

  #unitDamageHero(unit, side, amount, origin) {
    const dealt = this.damageHero(
      opposite(side),
      this.#damageAmount(unit, side, amount),
      origin,
    );
    if (dealt > 0) {
      this.#notifyDamage(unit, side);
    }
  }

  damageHero(target, amount, origin) {
    const floor = this.#encounter.mode === "duel" ? 1 : 0;
    const health =
      target === "player" ? this.#player.health : this.#enemyHealth;
    amount = Math.max(0, Math.min(amount, health - floor));
    if (target === "player") {
      amount = this.#player.takeDamage(amount);
      this.#heroDamageTaken += amount;
    } else {
      this.#enemyHealth -= amount;
      this.#heroDamageDealt += amount;
    }
    if (amount > 0) {
      this.#queue.push({
        amount,
        kind: "heroHit",
        origin,
        target,
        targetHp: target === "player" ? this.#player.health : this.#enemyHealth,
      });
    }

    return amount;
  }

  #drawNext() {
    const { card, reshuffled } = this.#piles.drawCard();
    if (reshuffled) {
      this.#queue.push({ kind: "reshuffle" });
    }
    if (!card) {
      return false;
    }
    this.#queue.push({ card, kind: "drawCard" });

    return true;
  }

  #refreshAuras() {
    let removed;
    do {
      removed = false;
      for (const side of ["player", "enemy"]) {
        const board = this.#board(side);
        for (let col = 0; col < LANE_COUNT; col++) {
          if (board[col]?.hp <= 0) {
            if (side === "player") {
              this.#piles.discardCard(board[col].def);
            } else {
              this.#enemyUnitsSlain++;
            }
            board[col] = undefined;
            removed = true;
          }
        }
        for (const [col, unit] of board.entries()) {
          if (!unit) {
            continue;
          }
          const health = board.reduce(
            (sum, ally) =>
              sum +
              (this.#active(ally) && ally.def.aura?.faction === unit.def.faction
                ? (ally.def.aura.health ?? 0)
                : 0),
            0,
          );
          const change = health - unit.auraHealth;
          unit.maxHp += change;
          unit.hp += change;
          unit.auraHealth = health;
          if (unit.hp <= 0) {
            this.#queue.push({
              kind: "unitDeath",
              target: { side, col },
              uid: unit.uid,
            });
            removed = true;
          }
        }
      }
    } while (removed);
  }

  #resolveCol(col) {
    const player = this.#playerBoard[col];
    const enemy = this.#enemyBoard[col];
    const playerCanAttack =
      this.#active(player) && !player.frozen && !player.stunned;
    const enemyCanAttack =
      this.#active(enemy) &&
      !enemy.frozen &&
      !enemy.stunned &&
      this.#encounter.mode !== "peaceful";
    for (const unit of [player, enemy]) {
      if (this.#active(unit)) {
        if (unit.frozen) {
          unit.frozen--;
        }
        if (unit.stunned) {
          unit.stunned--;
        }
      }
    }
    if (this.#chain && playerCanAttack) {
      player.temporaryAttack += this.#chain;
    }
    this.#chain = 0;
    if (player && enemy) {
      const playerAttack = this.#damageAmount(
        player,
        "player",
        this.attackOf(player, "player"),
      );
      const enemyAttack = this.#damageAmount(
        enemy,
        "enemy",
        this.attackOf(enemy, "enemy"),
      );
      const { hits, playerOverflow, enemyOverflow } = resolveDuel(
        player,
        enemy,
        {
          playerAttack,
          enemyAttack,
          playerCanAttack,
          enemyCanAttack,
          absorb: (unit, amount, side) => this.#absorb(unit, amount, side, col),
        },
      );
      const died = [];
      this.#queue.push({ col, died, hits, kind: "fight" });
      for (const hit of hits) {
        if (hit.amount > 0) {
          this.#notifyDamage(hit.side === "player" ? player : enemy, hit.side);
        }
      }
      for (const [unit, side, overflow] of [
        [player, "player", playerOverflow],
        [enemy, "enemy", enemyOverflow],
      ]) {
        const attacked = hits.some((hit) => hit.side === side);
        if (attacked && unit.def.keyword === "piercing") {
          const base =
            (side === "player" ? playerAttack : enemyAttack) +
            (unit.def.heroDamageBonus ?? 0);
          const dealt = this.damageHero(opposite(side), base, {
            kind: "lane",
            col,
          });
          if (dealt) {
            this.#notifyDamage(unit, side);
          }
        } else if (overflow > 0) {
          const dealt = this.damageHero(
            opposite(side),
            overflow + (unit.def.heroDamageBonus ?? 0),
            { kind: "lane", col },
          );
          if (dealt) {
            this.#notifyDamage(unit, side);
          }
        }
        if (attacked && unit.def.cycleSleep) {
          unit.sleep = unit.def.cycleSleep;
        }
      }
      if (player.hp <= 0) {
        died.push("player");
      }
      if (enemy.hp <= 0) {
        died.push("enemy");
      }
      if (enemy.hp <= 0 && player.hp > 0 && playerCanAttack) {
        this.#chain =
          1 +
          (this.#relics.includes("edge") &&
          (col === 0 || col === LANE_COUNT - 1)
            ? 1
            : 0);
        const next = col + (this.#direction === "left" ? 1 : -1);
        const receiving = this.#playerBoard[next];
        if (
          this.#active(receiving) &&
          !receiving.frozen &&
          !receiving.stunned
        ) {
          this.#queue.push({
            kind: "breakthrough",
            from: col,
            to: next,
            bonus: this.#chain,
          });
        } else {
          this.#chain = 0;
        }
        this.#rewardKill(player, "player");
      }
      this.#refreshAuras();
    } else if (playerCanAttack) {
      this.#unitDamageHero(
        player,
        "player",
        this.attackOf(player, "player") + (player.def.heroDamageBonus ?? 0),
        { kind: "lane", col },
      );
      if (player.def.cycleSleep) {
        player.sleep = player.def.cycleSleep;
      }
    } else if (enemyCanAttack) {
      this.#unitDamageHero(
        enemy,
        "enemy",
        this.attackOf(enemy, "enemy") + (enemy.def.heroDamageBonus ?? 0),
        { kind: "lane", col },
      );
      if (enemy.def.cycleSleep) {
        enemy.sleep = enemy.def.cycleSleep;
      }
    }
    this.#queueBoard();
  }

  #wake(unit, side, col) {
    this.#unitEffect(side, col, "苏醒");
    const effect = unit.def.onWake;
    if (effect?.kind === "draw" && side === "player") {
      for (let n = 0; n < effect.count; n++) {
        this.#drawNext();
      }
    }
    if (effect?.kind === "attack") {
      unit.attack += effect.count;
      this.#unitEffect(side, col, `攻击 +${effect.count}`);
    }
    if (effect?.kind === "blast") {
      this.#unitDamageHero(unit, side, effect.count, { kind: "deploy", col });
    }
    if (side === "player" && this.#relics.includes("dream")) {
      unit.armor += 2;
      this.#unitEffect(side, col, "护甲 +2");
    }
    if (side === "player" && this.#oath === "dawn" && !this.#oathUsed) {
      this.#oathUsed = true;
      this.#immediateAttack(unit, side, col);
    }
    this.#queueBoard();
  }

  #rewardKill(unit, side) {
    if (
      side !== "player" ||
      unit.hp <= 0 ||
      !unit.honor ||
      !unit.def.instanceId
    ) {
      return;
    }
    this.#growth[unit.def.instanceId] =
      (this.#growth[unit.def.instanceId] ?? 0) + unit.honor;
    unit.def.attack += unit.honor;
    unit.def.growth = (unit.def.growth ?? 0) + unit.honor;
    unit.attack += unit.honor;
    const gained = unit.honor;
    unit.honor = 0;
    this.#unitEffect(side, this.#board(side).indexOf(unit), `成长 +${gained}`);
  }

  #immediateAttack(unit, side, col) {
    if (unit.frozen || unit.stunned) {
      if (unit.frozen) {
        unit.frozen--;
      }
      if (unit.stunned) {
        unit.stunned--;
      }

      return;
    }
    const attack = this.attackOf(unit, side);
    const target = opposite(side);
    const enemy = this.#board(target)[col];
    if (enemy) {
      this.#damageUnit(target, col, attack, unit, side);
    }
    if (!enemy || unit.def.keyword === "piercing") {
      this.#unitDamageHero(
        unit,
        side,
        attack + (unit.def.heroDamageBonus ?? 0),
        { kind: "lane", col },
      );
    } else if (enemy.hp < 0 && unit.hp > 0) {
      this.damageHero(target, -enemy.hp + (unit.def.heroDamageBonus ?? 0), {
        kind: "lane",
        col,
      });
    }
    if (unit.def.cycleSleep) {
      unit.sleep = unit.def.cycleSleep;
    }
    this.#refreshAuras();
  }

  getActionTargets(index, mode) {
    const card = this.hand[index];
    const effect = mode === "order" ? card?.command : card?.action;
    if (!effect) {
      return [];
    }
    const side = ["damage", "mark", "stun"].includes(effect.kind)
      ? "enemy"
      : "player";
    if (
      ![
        "damage",
        "firstStrike",
        "guard",
        "heal",
        "honor",
        "mark",
        "recall",
        "stun",
        "swap",
        "wake",
      ].includes(effect.kind)
    ) {
      return [];
    }

    return this.#board(side).flatMap((unit, col) =>
      unit && (effect.kind !== "honor" || unit.def.instanceId)
        ? [{ side, col }]
        : [],
    );
  }

  getActionChoices(index, mode) {
    const card = this.hand[index];
    const effect = mode === "order" ? card?.command : card?.action;
    let choices = [];
    if (effect?.kind === "foresee") {
      choices = this.drawPile
        .slice(-3)
        .reverse()
        .map((entry, n) => ({ index: n, name: entry.name }));
    }
    if (effect?.kind === "recover") {
      choices = this.discardPile.map((entry, n) => ({
        index: n,
        name: entry.name,
      }));
    }
    if (["bless", "dream", "seal", "sharpen"].includes(effect?.kind)) {
      choices = this.hand.flatMap((entry, n) =>
        n !== index &&
        (effect.kind === "bless" || !entry.type || entry.type === "unit")
          ? [{ index: n, name: entry.name }]
          : [],
      );
    }

    return { kind: effect?.kind ?? null, choices };
  }

  act(action, options = {}) {
    if (this.#phase !== "player") {
      return { ok: false, reason: "phase" };
    }
    if (action === "direction") {
      if (!["left", "right"].includes(options.direction)) {
        return { ok: false, reason: "target" };
      }
      this.#direction = options.direction;
    } else if (action === "recruit") {
      if (this.#recruited) {
        return { ok: false, reason: "used" };
      }
      if (
        this.hand.length >= HAND_CAP ||
        (!this.drawCount && !this.discardCount)
      ) {
        return { ok: false, reason: "empty" };
      }
      const free = this.requisitionCost === 0;
      if (!free && this.#energy < 1) {
        return { ok: false, reason: "afford" };
      }
      this.#energy -= free ? 0 : 1;
      this.#recruited = true;
      if (free) {
        this.#relicUsed.push("recruitment");
      }
      this.#drawNext();
    } else if (action === "move") {
      if (this.#moved) {
        return { ok: false, reason: "used" };
      }
      const { from, to } = options;
      if (
        !Number.isInteger(from) ||
        !Number.isInteger(to) ||
        Math.abs(from - to) !== 1 ||
        !this.#playerBoard[from] ||
        to < 0 ||
        to >= LANE_COUNT ||
        this.#playerBoard[to]
      ) {
        return { ok: false, reason: "target" };
      }
      if (this.#energy < 1) {
        return { ok: false, reason: "afford" };
      }
      this.#energy--;
      this.#moved = true;
      this.#moveUnits("player", [{ from, to }]);
    } else if (action === "oath") {
      if (this.#oath === "immolation") {
        if (this.#energy !== 0 || this.#player.health <= 2) {
          return { ok: false, reason: "afford" };
        }
        this.damageHero("player", 2, { kind: "ability", name: "焚身誓约" });
        this.#energy++;
      } else if (this.#oath === "fate" && !this.#oathUsed) {
        const a = this.#enemyActions.find(
          (entry) => entry.intent.col === options.from,
        );
        const b = this.#enemyActions.find(
          (entry) => entry.intent.col === options.to,
        );
        if (!a || !b || a === b) {
          return { ok: false, reason: "target" };
        }
        const from = a.intent.col;
        const to = b.intent.col;
        [a.intent.col, b.intent.col] = [to, from];
        if (a.intent.text) {
          a.intent.text = a.intent.text.replace(
            `第 ${from + 1} 路`,
            `第 ${to + 1} 路`,
          );
        }
        if (b.intent.text) {
          b.intent.text = b.intent.text.replace(
            `第 ${to + 1} 路`,
            `第 ${from + 1} 路`,
          );
        }
        this.#oathUsed = true;
      } else {
        return { ok: false, reason: "used" };
      }
    } else if (action === "order" || action === "cast") {
      const result = this.#useCard(action, options);
      if (!result.ok) {
        return result;
      }
    } else {
      throw new Error(`未知战斗行动：${action}`);
    }
    this.#refreshAuras();
    this.#queueBoard();
    this.#finishIfOver();

    return { ok: true };
  }

  #useCard(mode, options) {
    const card = this.hand[options.index];
    const effect = mode === "order" ? card?.command : card?.action;
    if (!effect) {
      return { ok: false, reason: "target" };
    }
    if (mode === "order" && (this.#commandUsed || card.marks?.sealed)) {
      return { ok: false, reason: "used" };
    }
    if (mode === "cast" && this.cardCost(card) > this.#energy) {
      return { ok: false, reason: "afford" };
    }
    const targets = this.getActionTargets(options.index, mode);
    const needsUnit = [
      "damage",
      "firstStrike",
      "guard",
      "heal",
      "honor",
      "mark",
      "recall",
      "stun",
      "swap",
      "wake",
    ].includes(effect.kind);
    if (
      needsUnit &&
      !targets.some(
        (target) =>
          target.side === options.target?.side &&
          target.col === options.target?.col,
      )
    ) {
      return { ok: false, reason: "target" };
    }
    const selection = this.getActionChoices(options.index, mode);
    const needsCard = ["bless", "dream", "recover", "seal", "sharpen"].includes(
      effect.kind,
    );
    if (
      needsCard &&
      !selection.choices.some((entry) => entry.index === options.cardIndex)
    ) {
      return { ok: false, reason: "target" };
    }
    if (
      effect.kind === "foresee" &&
      (!options.cards ||
        options.cards.length !== selection.choices.length ||
        new Set(options.cards).size !== options.cards.length ||
        options.cards.some(
          (n) => !selection.choices.some((entry) => entry.index === n),
        ))
    ) {
      return { ok: false, reason: "target" };
    }
    if (
      effect.kind === "swap" &&
      (!this.#playerBoard[options.to] || options.to === options.target.col)
    ) {
      return { ok: false, reason: "target" };
    }
    if (effect.kind === "bloodDraw" && this.#player.health <= 2) {
      return { ok: false, reason: "afford" };
    }
    const markedCard =
      needsCard && effect.kind !== "recover"
        ? this.hand[options.cardIndex]
        : null;
    this.#queue.push({
      kind: "cardAction",
      index: options.index,
      card: structuredClone(card),
      mode,
    });
    this.#piles.removeFromHand(options.index);
    if (mode === "order") {
      this.#commandUsed = true;
    } else {
      this.#energy -= this.cardCost(card);
      if (card.marks) {
        card.marks.blessing = 0;
      }
    }
    this.#queue.push({ kind: "handSync", cards: [...this.hand] });
    const target = options.target;
    const unit = target ? this.#board(target.side)[target.col] : null;
    const count = effect.count ?? 1;
    switch (effect.kind) {
      case "damage": {
        this.#damageUnit(target.side, target.col, count, null, "player");
        if (
          mode === "order" &&
          !this.#enemyBoard[target.col] &&
          this.#relics.includes("command")
        ) {
          for (const lane of [target.col - 1, target.col + 1]) {
            if (this.#enemyBoard[lane]) {
              this.#enemyBoard[lane].armor = 0;
              this.#unitEffect("enemy", lane, "破甲", "harm");
            }
          }
        }

        break;
      }
      case "guard": {
        unit.armor += count;
        this.#unitEffect(target.side, target.col, `护甲 +${count}`);

        break;
      }
      case "heal": {
        const before = unit.hp;
        unit.hp = Math.min(unit.maxHp, unit.hp + count);
        this.#unitEffect(
          target.side,
          target.col,
          `恢复 ${unit.hp - before} 生命`,
        );

        break;
      }
      case "mark": {
        unit.marked += count;
        this.#unitEffect(target.side, target.col, `标记 +${count}`, "harm");

        break;
      }
      case "stun": {
        unit.stunned = Math.max(unit.stunned, count);
        this.#unitEffect(target.side, target.col, "眩晕", "harm");

        break;
      }
      case "wake": {
        const sleeping = unit.sleep > 0;
        unit.sleep = Math.max(0, unit.sleep - count);
        if (sleeping && !unit.sleep) {
          this.#wake(unit, target.side, target.col);
        } else {
          this.#unitEffect(
            target.side,
            target.col,
            sleeping ? `沉睡 -${count}` : "已清醒",
          );
        }

        break;
      }
      case "firstStrike": {
        unit.temporaryFirstStrike = true;
        this.#unitEffect(target.side, target.col, "获得先手");

        break;
      }
      case "honor": {
        unit.honor += count;
        this.#unitEffect(target.side, target.col, `授勋 +${count}`);

        break;
      }
      case "recall": {
        this.#unitEffect(target.side, target.col, "撤回", "neutral", true);
        this.#playerBoard[target.col] = undefined;
        this.#piles.discardCard(unit.def);
        this.#drawNext();

        break;
      }
      case "swap": {
        this.#moveUnits("player", [
          { from: target.col, to: options.to },
          { from: options.to, to: target.col },
        ]);

        break;
      }
      case "redraw": {
        for (const entry of this.hand) {
          this.#piles.discardCard(entry);
        }
        while (this.hand.length > 0) {
          this.#piles.removeFromHand(0);
        }
        this.#queue.push({ kind: "handSync", cards: [...this.hand] });
        for (let n = 0; n < count; n++) {
          this.#drawNext();
        }

        break;
      }
      case "bloodDraw": {
        this.damageHero("player", 2, { kind: "ability", name: card.name });
        for (let n = 0; n < count; n++) {
          this.#drawNext();
        }

        break;
      }
      case "recover": {
        this.#piles.recover(options.cardIndex);

        break;
      }
      case "foresee": {
        this.#piles.reorder(options.cards);

        break;
      }
      case "bless":
      case "sharpen":
      case "seal":
      case "dream": {
        const key = {
          bless: "blessing",
          sharpen: "sharpen",
          seal: "sealed",
          dream: "dream",
        }[effect.kind];
        markedCard.marks ??= {};
        markedCard.marks[key] = (markedCard.marks[key] ?? 0) + count;
        if (effect.kind === "seal" || effect.kind === "dream") {
          markedCard.marks.sharpen =
            (markedCard.marks.sharpen ?? 0) +
            count * (effect.kind === "dream" ? 2 : 1);
        }
        this.#queue.push({ kind: "handSync", cards: [...this.hand] });

        break;
      }
      case "ritual": {
        if (effect.nextCardId) {
          const next = this.#player.cardPool.find(
            (entry) => entry.id === effect.nextCardId,
          );
          if (!next) {
            throw new Error(`缺少仪式阶段 ${effect.nextCardId}`);
          }
          this.#piles.addToDraw(structuredClone(next));
        } else {
          this.#ritualDamage += count;
        }
        if (
          this.#relics.includes("ritual") &&
          !this.#relicUsed.includes("ritual")
        ) {
          this.#relicUsed.push("ritual");
          this.#drawNext();
        }

        break;
      }
      default: {
        throw new Error(`未知行动牌效果：${effect.kind}`);
      }
    }
    if (mode === "order" || !card.exhaust) {
      this.#piles.discardCard(card);
    }
    if (effect.draw) {
      for (let n = 0; n < effect.draw; n++) {
        this.#drawNext();
      }
    }
    if (mode === "cast") {
      for (const ally of this.#playerBoard) {
        if (this.#active(ally) && ally.def.onSpellAttack) {
          ally.attack += ally.def.onSpellAttack;
          this.#unitEffect(
            "player",
            this.#playerBoard.indexOf(ally),
            `攻击 +${ally.def.onSpellAttack}`,
          );
        }
      }
    }
    this.#cardsPlayed++;

    return { ok: true };
  }

  #finish(winner) {
    if (this.#phase === "over") {
      return;
    }
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
  }

  moveEnemy(from, to) {
    if (
      !this.#enemyBoard[from] ||
      this.#enemyBoard[to] ||
      to < 0 ||
      to >= LANE_COUNT
    ) {
      return false;
    }
    this.#moveUnits("enemy", [{ from, to }]);
    this.#queueBoard();

    return true;
  }

  empowerEnemy(col, { attack = 0, armor = 0, sleep = 0, stun = 0 }) {
    const unit = this.#enemyBoard[col];
    if (!unit) {
      return;
    }
    unit.attack += attack;
    unit.armor += armor;
    unit.sleep = Math.max(unit.sleep, sleep);
    unit.stunned = Math.max(unit.stunned, stun);
    this.#refreshAuras();
    const label = [
      attack ? `攻击 ${attack > 0 ? "+" : ""}${attack}` : "",
      armor ? `护甲 +${armor}` : "",
      sleep ? `沉睡 ${unit.sleep}` : "",
      stun ? "眩晕" : "",
    ]
      .filter(Boolean)
      .join(" · ");
    if (label) {
      this.#unitEffect("enemy", col, label, "neutral");
    }
    this.#queueBoard();
  }

  rotateEnemy() {
    this.#moveUnits(
      "enemy",
      this.#enemyBoard.flatMap((unit, from) =>
        unit ? [{ from, to: (from + 1) % LANE_COUNT }] : [],
      ),
    );
    this.#queueBoard();
  }

  #finishIfOver() {
    if (this.#phase === "over") {
      return true;
    }
    if (
      this.#encounter.mode === "duel" &&
      (this.#player.health <= 1 ||
        this.#enemyHealth <= 1 ||
        !this.#enemyBoard.some(Boolean))
    ) {
      this.#finish("draw");

      return true;
    }
    const playerDown = this.#player.health === 0;
    const enemyDown = this.#enemyHealth === 0;
    if (!playerDown && !enemyDown) {
      return false;
    }
    this.#finish(playerDown ? (enemyDown ? "draw" : "enemy") : "player");

    return true;
  }
}
