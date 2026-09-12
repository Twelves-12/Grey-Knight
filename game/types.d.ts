export type Side = "player" | "enemy";
export type ResultKind = "victory" | "defeat" | "draw";
export type Winner = Side | "draw";
export type Faction = "A" | "B" | "C";
export interface CardTarget {
  side: Side;
  col: number;
}

export interface CardAction {
  kind:
    | "damage"
    | "guard"
    | "heal"
    | "wake"
    | "recall"
    | "firstStrike"
    | "mark"
    | "swap"
    | "stun"
    | "redraw"
    | "bloodDraw"
    | "recover"
    | "foresee"
    | "bless"
    | "sharpen"
    | "seal"
    | "dream"
    | "ritual"
    | "honor";
  count?: number;
  nextCardId?: string;
  text?: string;
  draw?: number;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  upgrade: "unit" | "command" | null;
  growth: number;
}

export type EffectSpec =
  | { kind: "draw"; count: number }
  | { kind: "energy"; count: number }
  | { kind: "damageHero"; count: number }
  | { kind: "healHero"; count: number }
  | { kind: "generateCard"; faction: Faction; attack?: number }
  | { kind: "buffTarget"; attack: number; health: number }
  | { kind: "attackPerAlly"; faction: Faction; count: number }
  | { kind: "buffAllies"; faction: Faction; attack?: number; health?: number }
  | {
      kind:
        | "damageAllEnemies"
        | "damageTarget"
        | "damageLane"
        | "fusionDamageLane"
        | "freezeLane";
      count: number;
    };

export interface CardDef {
  type?: "unit" | "tactic" | "ritual" | "enhancement";
  sourceCost?: number;
  instanceId?: string;
  growth?: number;
  command?: CardAction;
  action?: CardAction;
  exhaust?: boolean;
  stage?: boolean;
  sleep?: number;
  armor?: number;
  onWake?: { kind: "draw" | "blast" | "attack"; count: number };
  cycleSleep?: number;
  protectsSleep?: number;
  freeRequisition?: boolean;
  holdDiscount?: boolean;
  onSpellAttack?: number;
  marks?: {
    blessing?: number;
    sharpen?: number;
    sealed?: number;
    dream?: number;
  };
  attack: number;
  cost: number;
  flavor?: string;
  health: number;
  icon: string;
  id: string;
  faction: Faction;
  keyword?: "firstStrike" | "piercing";
  heroDamageBonus?: number;
  aura?: {
    faction: Faction;
    attack?: number;
    health?: number;
    damage?: number;
  };
  healthAttack?: boolean;
  onAllyDamage?: { faction: Faction; attack: number; cap: number };
  onAllyDeploy?: {
    faction: Faction;
    kind: "damageHero" | "damageRandomEnemy";
    count: number;
  };
  onFusionDamage?: number;
  fusionFaction?: Faction;
  name: string;
  nameEn?: string;
  onDeploy?: readonly EffectSpec[];
  text: string;
}

export interface HeroIdentity {
  glyph: string;
  name: string;
  nameEn: string;
}

export interface PlayerDef {
  deck: readonly CardDef[];
  cardPool?: readonly CardDef[];
  hero: HeroIdentity;
  maxHealth: number;
}

export interface VictoryCopy {
  flavor: readonly string[];
  title: string;
}

/** A detached view of this encounter's actual roster and remaining reinforcements. */
export interface EnemyDeck {
  cards: CardDef[];
  planned: { def: CardDef; col: number }[];
  pending: CardDef[];
  waves: { round: number; cards: CardDef[] }[];
  /** Scheduling order and next scheduling round; a full board can delay deployment. */
  recurring: {
    cards: CardDef[];
    interval: number;
    nextRound: number;
  } | null;
}

export interface Encounter {
  hero: HeroIdentity;
  maxHealth: number;
  readonly status: string;
  victory: VictoryCopy;
  mode?: "battle" | "duel" | "peaceful";
  roundLimit?: number;
  rule?: string;
  domain?: string;
  state?: unknown;
  restore: (state: unknown) => void;
  restorePlan: (intents: EnemyIntent[]) => EncounterAction[];
  opening: (battle: EncounterContext) => void;
  plan: (battle: EncounterContext) => EncounterAction[];
  getDeck: (round: number, intents: EnemyIntent[]) => EnemyDeck;
}

export type EncounterContext = Pick<
  import("./game/battle.js").Battle,
  | "round"
  | "playerBoard"
  | "enemyBoard"
  | "enemyHealth"
  | "summonEnemy"
  | "damageHero"
  | "moveEnemy"
  | "empowerEnemy"
  | "rotateEnemy"
>;

export interface EncounterAction {
  intent: EnemyIntent;
  execute: (battle: EncounterContext) => void;
}

export type EnemyIntent =
  | { kind: "summon"; col: number; def: CardDef; op?: string }
  | {
      kind: "ability";
      name: string;
      text: string;
      op?: string;
      col?: number;
      from?: number;
      attack?: number;
      armor?: number;
    };

export interface Unit {
  def: CardDef;
  attack: number;
  hp: number;
  maxHp: number;
  auraHealth: number;
  frozen: number;
  armor: number;
  sleep: number;
  stunned: number;
  marked: number;
  temporaryAttack: number;
  temporaryFirstStrike: boolean;
  honor: number;
  uid: number;
}

export interface Hit {
  amount: number;
  lethal: boolean;
  side: Side;
  /**
   * 受击瞬间的生命快照；负值保留给溢伤结算，显示时截为零。
   */
  targetHp: number;
}

export interface DisplayUnit extends Unit {
  displayAttack: number;
}

export interface BoardState {
  player: (DisplayUnit | null)[];
  enemy: (DisplayUnit | null)[];
}

export interface CardActionEvent {
  kind: "cardAction";
  index: number;
  card: CardDef;
  mode: "order" | "cast";
}

export interface UnitHitEvent {
  kind: "unitHit";
  target: CardTarget;
  origin: { side: Side; col?: number };
  unit: DisplayUnit;
  amount: number;
  blocked: number;
}

export interface UnitEffectEvent {
  kind: "unitEffect";
  target: CardTarget;
  unit: DisplayUnit;
  label: string;
  tone: "benefit" | "harm" | "neutral";
  remove?: boolean;
}

export interface UnitDeathEvent {
  kind: "unitDeath";
  target: CardTarget;
  uid: number;
}

export interface MoveEvent {
  kind: "move";
  side: Side;
  moves: { from: number; to: number; unit: DisplayUnit }[];
}

export interface SummonEvent {
  kind: "summon";
  col: number;
  unit: DisplayUnit;
}

export interface FightEvent {
  kind: "fight";
  col: number;
  hits: readonly Hit[];
  died: readonly Side[];
}

export interface HeroHitEvent {
  kind: "heroHit";
  target: Side;
  amount: number;
  targetHp: number;
  origin: HeroHitOrigin;
}

export type HeroHitOrigin =
  { kind: "deploy" | "lane"; col: number } | { kind: "ability"; name: string };

export type BattleEvent =
  | SummonEvent
  | FightEvent
  | HeroHitEvent
  | CardActionEvent
  | UnitHitEvent
  | UnitEffectEvent
  | UnitDeathEvent
  | MoveEvent
  | { kind: "drawCard"; card: CardDef }
  | { kind: "reshuffle" }
  | { kind: "energy" }
  | { kind: "board"; state: BoardState }
  | { kind: "handSync"; cards: CardDef[] }
  | { kind: "breakthrough"; from: number; to: number; bonus: number }
  | { kind: "heal"; amount: number; target: Side; targetHp: number }
  | { kind: "phase"; name: "combat" | "enemy" }
  | { kind: "round"; round: number }
  | { kind: ResultKind };

export type PlayResult =
  | { ok: true; unit?: DisplayUnit }
  | {
      ok: false;
      reason: "afford" | "occupied" | "phase" | "target" | "used" | "empty";
    };

export interface ResultContent {
  accent: ResultKind;
  flavor: readonly string[];
  title: string;
}

export interface HeroElements {
  fill: HTMLElement;
  root: HTMLElement;
  seal: HTMLElement;
  text: HTMLElement;
  trail: HTMLElement;
}

export type HeroesBySide = Record<Side, HeroElements>;

export interface BattleCells {
  enemy: HTMLElement[];
  player: HTMLElement[];
}
