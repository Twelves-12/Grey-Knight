export type Side = "player" | "enemy";
export type ResultKind = "victory" | "defeat" | "draw";
export type Winner = Side | "draw";

export type EffectSpec =
  | { kind: "draw"; count: number }
  | { kind: "energy"; count: number }
  | { kind: "damageHero"; count: number }
  | { kind: "healHero"; count: number };

export interface CardDef {
  attack: number;
  cost: number;
  flavor?: string;
  health: number;
  icon: string;
  id: string;
  keyword?: "firstStrike";
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

export interface PlayerSetup {
  deck: readonly CardDef[];
  health: number;
  hero: HeroIdentity;
  maxHealth: number;
}

export interface VictoryCopy {
  flavor: readonly string[];
  title: string;
}

export interface Encounter {
  hero: HeroIdentity;
  maxHealth: number;
  readonly status: string;
  victory: VictoryCopy;
  opening: (battle: EncounterContext) => void;
  plan: (battle: EncounterContext) => EncounterAction[];
}

export type EncounterFactory = (seed: number) => Encounter;

export type EncounterContext = Pick<
  import("./game/battle.js").Battle,
  | "round"
  | "playerBoard"
  | "enemyBoard"
  | "playerHealth"
  | "enemyHealth"
  | "summonEnemy"
  | "damageHero"
>;

export interface EncounterAction {
  intent: EnemyIntent;
  execute: (battle: EncounterContext) => void;
}

export type EnemyIntent =
  | { kind: "summon"; col: number; def: CardDef }
  | { kind: "ability"; name: string; text: string };

export interface Unit {
  def: CardDef;
  hp: number;
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

export interface SummonEvent {
  kind: "summon";
  col: number;
  unit: Unit;
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
  | { kind: "drawCard"; card: CardDef }
  | { kind: "reshuffle" }
  | { kind: "energy" }
  | { kind: "heal"; amount: number; target: Side; targetHp: number }
  | { kind: "phase"; name: "combat" | "enemy" }
  | { kind: "round"; round: number }
  | { kind: ResultKind };

export type PlayResult =
  { ok: true } | { ok: false; reason: "afford" | "occupied" | "phase" };

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
