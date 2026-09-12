import { getMapNode } from "../game/content/map.js";
import { AbyssFront } from "../game/encounters/battlefield.js";
import { getNodeEntry, getRun, requireCampaignNode } from "../game/session.js";
import { element, icon, renderRunStatus, sceneArt } from "./journey-ui.js";

const params = new URLSearchParams(location.search);
const nodeId = params.get("node") ?? getRun().progress.current;
if (getMapNode(nodeId) && !getMapNode(nodeId).story) {
  location.replace(getNodeEntry(nodeId));
} else if (requireCampaignNode(nodeId)) {
  const node = getMapNode(nodeId);
  const run = getRun();
  const root = document.querySelector("#story-passages");
  const back = document.querySelector("#story-back");
  const next = document.querySelector("#story-next");
  const enter = document.querySelector("#story-enter");
  const progress = document.querySelector("#story-progress");
  const meter = document.querySelector("#story-meter");
  const encounter = new AbyssFront(run.seed, { nodeId, choices: run.choices });
  const destination = `./battle.html?node=${encodeURIComponent(node.id)}`;
  document.title = `Grey Knight · ${node.label}`;
  document.querySelector("#story-topline-label").textContent = node.chapter
    ? `第 ${node.chapter} 章 · ${node.label}`
    : node.label;
  document.querySelector("#story-eyebrow").textContent =
    node.subtitle ??
    (node.kind === "elite" ? "精英遭遇 · 战具奖励" : "沿途遭遇 · 构筑你的队伍");
  document.querySelector(".story-scene").prepend(sceneArt(node.kind));
  document.querySelector("#story-location").textContent =
    node.location ?? node.label;
  renderRunStatus(document.querySelector("#story-run-status"), run);
  document.querySelector("#story-brief-icon").append(icon(node.kind));
  document.querySelector("#story-brief-title").textContent =
    encounter.hero.name;
  document.querySelector("#story-encounter-rule").textContent = encounter.rule;
  const encounterStats = document.querySelector("#story-encounter-stats");
  for (const text of [
    node.kind === "peaceful" ? "非敌对" : `敌方圣焰 ${encounter.maxHealth}`,
    encounter.status,
  ]) {
    encounterStats.append(element("span", "encounter-badge", text));
  }
  const skip = document.querySelector("#story-skip");
  skip.href = destination;
  skip.textContent =
    node.kind === "peaceful"
      ? "直接走进庙宇 →"
      : node.kind === "duel"
        ? "直接开始决斗 →"
        : "直接前往战场 →";
  enter.href = destination;
  enter.textContent =
    node.kind === "peaceful"
      ? "走进庙宇 →"
      : node.kind === "duel"
        ? "开始决斗 →"
        : `迎战${encounter.hero.name} →`;
  document.querySelector("#story-destination").textContent =
    node.kind === "peaceful"
      ? "下一步：走进庙宇。你可以直接拒绝军令，也可以下令进攻。"
      : node.kind === "duel"
        ? "下一步：酒馆决斗。交锋结束后，再决定骑士的命运。"
        : `下一步：${node.label}战场。胜利后处理战利品${node.choices?.length ? "与剧情抉择" : ""}。`;
  for (const [index, text] of node.story.entries()) {
    const section = document.createElement("section");
    section.className = "story-passage";
    const heading = document.createElement("h1");
    heading.className = "site-title";
    heading.tabIndex = -1;
    heading.textContent = index === 0 ? node.title : node.label;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    section.append(heading, paragraph);
    root.append(section);
  }
  let current = 0;
  function show() {
    for (const [index, passage] of [...root.children].entries()) {
      passage.hidden = index !== current;
    }
    back.disabled = current === 0;
    next.hidden = current === root.children.length - 1;
    enter.hidden = !next.hidden;
    progress.textContent = `剧情 ${current + 1} / ${root.children.length}${next.hidden ? " · 已读至末段" : ""}`;
    meter.max = root.children.length;
    meter.value = current + 1;
    next.textContent = `阅读第 ${current + 2} 段 →`;
    root.children[current].querySelector("h1").focus({ preventScroll: true });
  }
  back.addEventListener("click", () => {
    current -= 1;
    show();
  });
  next.addEventListener("click", () => {
    current += 1;
    show();
  });
  show();
}
