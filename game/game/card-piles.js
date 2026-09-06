import { HAND_CAP } from "./rules.js";

/**
 * @typedef {import("../types.js").CardDef} CardDef
 * @typedef {import("./random.js").Random} Random
 */

export class CardPiles {
  /** @type {CardDef[]} */
  #discard = [];
  /** @type {CardDef[]} */
  #draw;
  /** @type {CardDef[]} */
  #hand = [];
  #random;

  /**
   * @param {readonly CardDef[]} cards
   * @param {Random} random
   */
  constructor(cards, random) {
    this.#draw = random.shuffled(cards);
    this.#random = random;
  }

  get discardCount() {
    return this.#discard.length;
  }

  get drawCount() {
    return this.#draw.length;
  }

  get hand() {
    return this.#hand;
  }

  /** @param {CardDef} card */
  discard(card) {
    this.#discard.push(card);
  }

  drawCard() {
    if (this.#hand.length >= HAND_CAP) {
      return { card: undefined, reshuffled: false };
    }
    let reshuffled = false;
    // 如果抽牌堆空了就把弃牌堆洗回去
    if (this.#draw.length === 0 && this.#discard.length > 0) {
      reshuffled = true;
      this.#draw = this.#random.shuffled(this.#discard);
      this.#discard.length = 0;
    }
    const card = this.#draw.pop();

    // 这里可能没有牌
    // 1. 开局牌库本来就是空的
    // 2. 抽完了牌库，弃牌堆也为空
    // 3. 卡牌仍在手牌或战场上，尚未进入弃牌堆
    if (card) {
      this.#hand.push(card);
    }

    return { card, reshuffled };
  }

  /** @param {number} index */
  removeFromHand(index) {
    this.#hand.splice(index, 1);
  }
}
