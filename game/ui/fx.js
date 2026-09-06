import { el, finishAnimations } from "./utils.js";

export const FX_COLORS = {
  hurt: "#ff7a5c",
  kill: "#ffd9a0",
  candle: "#ffd98c",
  heal: "#5fbf8f",
  shadow: "#c9b4ee",
};

/**
 * 悬浮文字。用于显示伤害、治疗等数值。
 *
 * @param {HTMLElement} layer
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {{ color: string; size: number }} options
 */
export function floatText(layer, x, y, text, options) {
  const node = el("div", "float-dmg", text);

  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.color = options.color;
  node.style.fontSize = `${options.size}px`;
  layer.append(node);
  setTimeout(() => node.remove(), 1050);
}

/**
 * 从指定位置散射火花
 *
 * @param {HTMLElement} layer
 * @param {number} x
 * @param {number} y
 * @param {number} count
 * @param {readonly string[]} colorList
 */
export function burst(layer, x, y, count, colorList) {
  for (let index = 0; index < count; index += 1) {
    const node = el("div", "spark");
    const angle = Math.random() * Math.PI * 2;
    const distance = 22 + Math.random() * 56;
    const size = 2 + Math.random() * 3;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    const color = colorList[Math.floor(Math.random() * colorList.length)];
    node.style.background = color;
    node.style.color = color;
    node.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    node.style.setProperty("--dy", `${Math.sin(angle) * distance - 18}px`);
    node.style.setProperty("--dur", `${0.45 + Math.random() * 0.35}s`);
    layer.append(node);
    setTimeout(() => node.remove(), 1000);
  }
}

/**
 * 单位死亡时散落余烬
 *
 * @param {HTMLElement} layer
 * @param {number} x
 * @param {number} y
 * @param {boolean} shadow 敌方用影色
 */
export function cinders(layer, x, y, shadow) {
  burst(
    layer,
    x,
    y,
    shadow ? 18 : 14,
    shadow
      ? ["#6a4fa8", "#33205c", "#c9b6f0", "#241b3f"]
      : ["#e6d7b0", "#a08a5c", "#f4e7c4", "#8a5f2c"],
  );
}

/**
 * 在攻击落点闪现冲击印记
 *
 * @param {HTMLElement} layer
 * @param {number} x
 * @param {number} y
 * @param {{ lethal: boolean; shadow: boolean }} options
 */
export function impact(layer, x, y, options) {
  const node = el("div", "impact-mark");

  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.classList.toggle("lethal", options.lethal);
  node.classList.toggle("shadow", options.shadow);
  layer.append(node);
  setTimeout(() => node.remove(), 600);
}

/**
 * 显示单位攻击英雄的飞行轨迹
 *
 * @param {HTMLElement} layer
 * @param {readonly [number, number]} from
 * @param {readonly [number, number]} to
 * @param {boolean} shadow
 * @param {AbortSignal} signal
 */
export async function heroTrail(layer, from, to, shadow, signal) {
  const node = el("div", "hero-strike");
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];

  node.style.left = `${from[0]}px`;
  node.style.top = `${from[1]}px`;
  node.style.setProperty("--angle", `${Math.atan2(dy, dx)}rad`);
  node.classList.toggle("shadow", shadow);
  layer.append(node);
  const animation = node.animate(
    [
      { translate: "0px 0px", opacity: 0 },
      { offset: 0.14, opacity: 1 },
      { translate: `${dx}px ${dy}px`, opacity: 1 },
    ],
    {
      duration: 360,
      easing: "cubic-bezier(0.35, 0, 0.75, 0.7)",
      fill: "forwards",
    },
  );
  try {
    await finishAnimations([animation], signal);
  } finally {
    node.remove();
  }
}

/**
 * 用红色闪光强调英雄受击
 *
 * @param {HTMLElement} layer
 */
export function redFlash(layer) {
  const node = el("div", "flash-red");

  layer.append(node);
  setTimeout(() => node.remove(), 750);
}
