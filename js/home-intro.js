// 让AI做了一个比较酷炫的开场动画
const introMotion = matchMedia("(prefers-reduced-motion: reduce)");
const introKey = "grey-knight:intro";
const introRoot = document.documentElement;

if (!introMotion.matches && sessionStorage.getItem(introKey) === null) {
  introRoot.setAttribute("data-intro", "pending");
}

document.addEventListener("DOMContentLoaded", async () => {
  const { $ } = await import("./dom.js");
  const control = $(".home-intro-control");
  const actions = $(".home-actions");
  const navigation = $(".site-nav");
  const embers = $(".home-embers");

  for (let index = 0; index < 28; index++) {
    const ember = document.createElement("i");
    const angle = (index * 2.4) % (Math.PI * 2);
    const distance = 100 + ((index * 79) % 280);
    ember.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    ember.style.setProperty("--y", `${Math.sin(angle) * distance * 0.55}px`);
    ember.style.setProperty("--size", `${1 + (index % 3) * 0.5}px`);
    ember.style.setProperty("--alpha", `${0.35 + (index % 5) * 0.1}`);
    ember.style.setProperty("--delay", `${0.58 + (index % 7) * 0.04}s`);
    embers.append(ember);
  }

  /** @param {boolean} playing */
  function setPlaying(playing) {
    navigation.inert = playing;
    actions.inert = playing;
    control.textContent = playing ? "跳过" : "重播开场";
    if (playing) {
      introRoot.setAttribute("data-intro", "playing");
      sessionStorage.setItem(introKey, "seen");
    } else {
      introRoot.removeAttribute("data-intro");
      if (document.activeElement === control) {
        actions.querySelector("a")?.focus({ preventScroll: true });
      }
    }
  }

  control.hidden = introMotion.matches;
  setPlaying(!introMotion.matches && introRoot.hasAttribute("data-intro"));

  control.addEventListener("click", () => {
    setPlaying(!introRoot.hasAttribute("data-intro"));
  });
  actions.addEventListener("animationend", (event) => {
    if (event.target === actions) {
      setPlaying(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && introRoot.hasAttribute("data-intro")) {
      setPlaying(false);
    }
  });
  window.addEventListener("pagehide", () => setPlaying(false));
  introMotion.addEventListener("change", () => {
    setPlaying(false);
    control.hidden = introMotion.matches;
  });
});
