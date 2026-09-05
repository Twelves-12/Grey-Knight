const UINT32_RANGE = 0x1_00_00_00_00;

export class Random {
  #state;

  /** @param {number} state */
  constructor(state) {
    this.#state = state >>> 0;
  }

  /** @param {number} maxExclusive */
  integer(maxExclusive) {
    return Math.floor(this.next() * maxExclusive);
  }

  fork() {
    return new Random(this.integer(UINT32_RANGE));
  }

  next() {
    this.#state = (this.#state + 0x6d_2b_79_f5) >>> 0;

    let value = this.#state;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  }

  /**
   * @template T
   * @param {readonly T[]} values
   */
  shuffled(values) {
    const result = [...values];

    for (let index = result.length - 1; index > 0; index -= 1) {
      const otherIndex = this.integer(index + 1);
      const value = result[index];

      result[index] = result[otherIndex];
      result[otherIndex] = value;
    }

    return result;
  }
}
