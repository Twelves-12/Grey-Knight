/**
 * @typedef {"defeat"
 *   | "deny"
 *   | "doom"
 *   | "draw"
 *   | "energy"
 *   | "fight"
 *   | "heal"
 *   | "heroHit"
 *   | "kill"
 *   | "place"
 *   | "reshuffle"
 *   | "round"
 *   | "select"
 *   | "summon"
 *   | "victory"} SoundName
 * @typedef {(when: number) => void} SoundRecipe
 */

export class SoundRecipes {
  #context;
  #out;
  /** @type {AudioBuffer | undefined} */
  #noiseBuffer;

  /**
   * @param {AudioContext} context
   * @param {AudioNode} out
   */
  constructor(context, out) {
    this.#context = context;
    this.#out = out;
  }

  /**
   * @param {SoundName} name
   * @param {number} when
   */
  play(name, when) {
    this.#recipes[name](when);
  }

  /**
   * 让AI生成了一些简单的音效，虽然不一定好听，但是省事
   *
   * @type {Record<SoundName, SoundRecipe>}
   */
  #recipes = {
    select: (when) => {
      this.#tone(when, 420, 640, 0.06, "triangle", 0.1);
    },
    place: (when) => {
      this.#tone(when, 300, 180, 0.08, "triangle", 0.16);
      this.#tone(when + 0.02, 920, 1300, 0.09, "sine", 0.05);
    },
    deny: (when) => {
      this.#tone(when, 170, 120, 0.12, "sawtooth", 0.08);
    },
    draw: (when) => {
      this.#noiseBurst(when, 0.07, 0.06, "highpass", 1600);
    },
    reshuffle: (when) => {
      this.#noiseBurst(when, 0.2, 0.08, "bandpass", 900);
      this.#tone(when + 0.08, 300, 480, 0.05, "square", 0.03);
    },
    energy: (when) => {
      this.#tone(when, 660, 980, 0.1, "sine", 0.09);
      this.#tone(when + 0.05, 1320, 1480, 0.06, "sine", 0.05);
    },
    fight: (when) => {
      const pitch = 150 + Math.random() * 60;

      this.#noiseBurst(when, 0.05, 0.12, "lowpass", 2400);
      this.#tone(when, pitch, pitch * 0.72, 0.09, "square", 0.07);
    },
    kill: (when) => {
      this.#noiseBurst(when, 0.09, 0.1, "lowpass", 1200);
      this.#tone(when, 340, 90, 0.14, "sawtooth", 0.07);
    },
    heroHit: (when) => {
      this.#noiseBurst(when, 0.16, 0.16, "lowpass", 900);
      this.#tone(when, 110, 45, 0.3, "sine", 0.24);
    },
    heal: (when) => {
      this.#tone(when, 520, 780, 0.12, "sine", 0.07);
      this.#tone(when + 0.09, 780, 1040, 0.16, "sine", 0.06);
    },
    summon: (when) => {
      this.#tone(when, 196, 185, 0.2, "sawtooth", 0.06);
      this.#tone(when + 0.1, 294, 330, 0.22, "sawtooth", 0.04);
      this.#tone(when, 55, 38, 0.3, "sine", 0.1);
    },
    doom: (when) => {
      this.#tone(when, 92, 60, 0.8, "sine", 0.22);
      this.#tone(when, 233, 220, 0.5, "sawtooth", 0.045);
      this.#tone(when + 0.02, 247, 233, 0.5, "sawtooth", 0.045);
    },
    round: (when) => {
      this.#tone(when, 520, 500, 0.08, "sine", 0.07);
      this.#tone(when + 0.1, 660, 640, 0.1, "sine", 0.07);
    },
    victory: (when) => {
      const notes = [523.25, 659.25, 783.99, 1046.5];

      for (const [index, frequency] of notes.entries()) {
        this.#tone(
          when + index * 0.11,
          frequency,
          frequency,
          0.3,
          "triangle",
          0.09,
        );
      }
    },
    defeat: (when) => {
      const notes = [392, 311, 233];

      for (const [index, frequency] of notes.entries()) {
        this.#tone(
          when + index * 0.2,
          frequency,
          frequency * 0.96,
          0.4,
          "sine",
          0.09,
        );
      }
      this.#noiseBurst(when + 0.62, 0.5, 0.05, "lowpass", 700);
    },
  };

  #noise() {
    if (this.#noiseBuffer) {
      return this.#noiseBuffer;
    }

    const buffer = this.#context.createBuffer(
      1,
      this.#context.sampleRate * 0.5,
      this.#context.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    this.#noiseBuffer = buffer;

    return buffer;
  }

  /**
   * @param {number} when
   * @param {number} from
   * @param {number} to
   * @param {number} duration
   * @param {OscillatorType} type
   * @param {number} volume
   */
  #tone(when, from, to, duration, type, volume) {
    const oscillator = this.#context.createOscillator();
    const gain = this.#context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, when);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, to),
      when + duration,
    );
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(gain);
    gain.connect(this.#out);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
  }

  /**
   * @param {number} when
   * @param {number} duration
   * @param {number} volume
   * @param {BiquadFilterType} filterType
   * @param {number} cutoff
   */
  #noiseBurst(when, duration, volume, filterType, cutoff) {
    const source = this.#context.createBufferSource();
    const filter = this.#context.createBiquadFilter();
    const gain = this.#context.createGain();

    source.buffer = this.#noise();
    filter.type = filterType;
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.#out);
    source.start(when, Math.random() * 0.2);
    source.stop(when + duration + 0.02);
  }
}
