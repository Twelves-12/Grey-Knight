import { MAP_NODES, getMapNode } from "../game/content/map.js";

const params = new URLSearchParams(location.search);
const openingScene = !params.has("node");
const nodeId = params.get("node") ?? "node-1";
const node = getMapNode(nodeId);

const passagesRoot = document.querySelector("#story-passages");
const progress = document.querySelector("#story-progress");
const back = document.querySelector("#story-back");
const next = document.querySelector("#story-next");
const enter = document.querySelector("#story-enter");
const skip = document.querySelector("#story-skip");
const label = document.querySelector("#story-topline-label");

if (label) {
  label.textContent = openingScene ? "第一章 · 匪寨外围" : node.storyTitle;
}
if (skip) {
  skip.href = `./battle.html?node=${encodeURIComponent(node.id)}`;
}

const passages = openingScene
  ? [
      "行军三日，阿尔德里克率小队抵达匪患最烈的黑石岭。斥候回报：匪众约三四十人，盘踞旧矿洞，粮草不继，士气涣散。",
      "他勒马立于山脊，俯瞰下方寨栅。风吹过枯草，卷起尘土。隐约能听见寨中有人争吵。",
      "“白日列阵，堂堂正正攻进去。我要看看，这帮人凭什么敢劫公爵的粮仓。”",
    ]
  : node.story ?? [
      "节点剧情1：这里还没有写实装内容。",
      "节点剧情2：这里还没有写实装内容。",
      "节点剧情3：这里还没有写实装内容。",
    ];

const fragment = document.createDocumentFragment();
for (const [index, paragraph] of passages.entries()) {
  const section = document.createElement("section");
  section.className = "story-passage";
  if (index !== 0) {
    section.hidden = true;
  }

  const title = document.createElement("h1");
  title.className = "site-title";
  title.tabIndex = -1;
  title.textContent = openingScene
    ? `匪寨外围 · 剧情${index + 1}`
    : `${node.label} · 剧情${index + 1}`;

  const isDialogue = paragraph.trim().startsWith("“");
  const p = document.createElement(isDialogue ? "blockquote" : "p");
  p.textContent = paragraph;

  section.append(title, p);
  fragment.append(section);
}
passagesRoot?.append(fragment);

const storyPassages = [...document.querySelectorAll(".story-passage")];
let current = 0;

function renderPassage() {
  for (const [index, passage] of storyPassages.entries()) {
    passage.hidden = index !== current;
  }

  back.disabled = current === 0;
  next.hidden = current === storyPassages.length - 1;
  enter.hidden = !next.hidden;
  progress.textContent = `${String(current + 1).padStart(2, "0")} / ${String(storyPassages.length).padStart(2, "0")}`;

  const active = storyPassages[current];
  active?.querySelector("h1")?.focus({ preventScroll: true });

  if (enter.hidden === false) {
    enter.textContent = "进入战斗 →";
    enter.href = `./battle.html?node=${encodeURIComponent(node.id)}`;
  }
}

back?.addEventListener("click", () => {
  current -= 1;
  renderPassage();
});

next?.addEventListener("click", () => {
  current += 1;
  renderPassage();
});

renderPassage();
