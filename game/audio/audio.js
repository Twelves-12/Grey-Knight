import * as kv from "../kv.js";
import { SoundRecipes } from "./recipes.js";

/**
 * @typedef {{
 *   context: AudioContext;
 *   master: GainNode;
 *   recipes: SoundRecipes;
 * }} AudioGraph
 */

export class GameAudio {
  /** @type {AudioGraph | undefined} */
  #graph;
  #muted = kv.get("muted") === "1";

  get muted() {
    return this.#muted;
  }

  /** 必须在用户手势中调用一次，绕过浏览器的自动播放限制 */
  unlock() {
    if (!this.#graph) {
      const context = new AudioContext();
      const master = context.createGain();

      master.connect(context.destination);
      this.#graph = {
        context,
        master,
        recipes: new SoundRecipes(context, master),
      };
    }

    this.#graph.master.gain.value = this.#muted ? 0 : 0.5;
    this.#graph.context.resume();
  }

  toggleMute() {
    this.#muted = !this.#muted;
    this.unlock();
    kv.set("muted", this.#muted ? "1" : "0");
  }

  /** @param {import("./recipes.js").SoundName} name */
  play(name) {
    const graph = this.#graph;
    if (!graph) {
      return;
    }

    graph.recipes.play(name, graph.context.currentTime);
  }
}
