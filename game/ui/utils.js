/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {string} [className]
 * @param {string} [text]
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

/**
 * 基于Promise的sleep。加入了abortsignal，因为卡牌游戏里很多动画需要被打断
 *
 * @param {number} ms
 * @param {AbortSignal} signal
 */
export const wait = (ms, signal) =>
  new Promise((resolve) => {
    if (signal.aborted) {
      resolve(undefined);

      return;
    }
    let timer;
    function finish() {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve(undefined);
    }
    timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 *  等待所有动画完成，或者被signal中断
 *
 * @param {Animation[]} animations
 * @param {AbortSignal} signal
 */
export async function finishAnimations(animations, signal) {
  const finished = Promise.all(
    animations.map((animation) => animation.finished),
  );
  function cancel() {
    for (const animation of animations) {
      animation.cancel();
    }
  }
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) {
    cancel();
  }
  try {
    await finished;
  } catch (error) {
    if (!signal.aborted) {
      throw error;
    }
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}
