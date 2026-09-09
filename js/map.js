import { MAP_NODES, getMapNode } from "../game/content/map.js";

const PROGRESS_KEY = "grey-knight:progress:v2";
const board = document.querySelector("#map-board");
const continueBtn = document.querySelector("#map-continue");
const backBtn = document.querySelector("#map-back");

function getProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    return { current: "node-1", unlocked: ["node-1"] };
  }

  try {
    const parsed = JSON.parse(raw);
    const current = getMapNode(parsed.current ?? "node-1").id;
    const currentIndex = MAP_NODES.findIndex((node) => node.id === current);
    return {
      current,
      unlocked: MAP_NODES.slice(0, currentIndex + 1).map((node) => node.id),
    };
  } catch {
    return { current: "node-1", unlocked: ["node-1"] };
  }
}

function renderMap() {
  if (!(board instanceof HTMLElement)) {
    return;
  }

  const progress = getProgress();
  board.innerHTML = "";

  const routes = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  routes.classList.add("map-routes");
  routes.setAttribute("viewBox", "0 0 100 100");
  routes.setAttribute("preserveAspectRatio", "none");
  routes.setAttribute("aria-hidden", "true");

  for (let index = 0; index < MAP_NODES.length - 1; index += 1) {
    const node = MAP_NODES[index];
    const nextNode = MAP_NODES[index + 1];
    const route = document.createElementNS("http://www.w3.org/2000/svg", "line");
    route.classList.add("map-route");
    if (progress.unlocked.includes(nextNode.id)) {
      route.classList.add("active");
    }
    route.setAttribute("x1", String(node.x));
    route.setAttribute("y1", String(node.y));
    route.setAttribute("x2", String(nextNode.x));
    route.setAttribute("y2", String(nextNode.y));
    routes.appendChild(route);
  }

  board.appendChild(routes);

  const currentIndex = MAP_NODES.findIndex((node) => node.id === progress.current);

  for (const [index, node] of MAP_NODES.entries()) {
    const isCurrent = index === currentIndex;
    const isPassed = index < currentIndex;
    const isUnlocked = isPassed || isCurrent;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-node ${isPassed ? "passed" : ""} ${isCurrent ? "current" : ""} ${!isUnlocked ? "locked" : ""}`.trim();
    button.style.left = `${node.x}%`;
    button.style.top = `${node.y}%`;
    button.textContent = node.label;
    button.disabled = !isUnlocked;
    const status = isCurrent ? "当前节点" : isPassed ? "已通过" : "未解锁";
    button.setAttribute("aria-label", `${node.label}，${status}`);

    if (isCurrent) {
      button.title = `${node.title} · 当前节点`;
    } else if (isPassed) {
      button.title = `${node.title} · 已通过`;
    } else {
      button.title = `${node.title} · 未解锁`;
    }

    button.addEventListener("click", () => {
      if (!isUnlocked) {
        return;
      }
      localStorage.setItem("grey-knight:map:current", node.id);
      location.href = `/game/story2.html?node=${encodeURIComponent(node.id)}`;
    });

    board.appendChild(button);
  }

  const currentNode = getMapNode(progress.current);
  if (continueBtn) {
    continueBtn.disabled = !currentNode;
  }
}

backBtn?.addEventListener("click", () => {
  history.back();
});

continueBtn?.addEventListener("click", () => {
  const progress = getProgress();
  const currentNode = getMapNode(progress.current);
  if (!currentNode) {
    return;
  }
  location.href = `/game/story2.html?node=${encodeURIComponent(currentNode.id)}`;
});

renderMap();
