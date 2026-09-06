export class Player {
  #health;

  /** @param {import("../types.js").PlayerDef} def */
  constructor(def) {
    /** @readonly */
    this.hero = def.hero;
    /** @readonly */
    this.maxHealth = def.maxHealth;
    this.#health = def.maxHealth;
    this.deck = [...def.deck];
  }

  get health() {
    return this.#health;
  }

  /** @param {number} amount */
  takeDamage(amount) {
    const taken = Math.min(amount, this.#health);
    this.#health -= taken;

    return taken;
  }

  /** @param {number} amount */
  heal(amount) {
    const restored = Math.min(amount, this.maxHealth - this.#health);
    this.#health += restored;

    return restored;
  }
}
