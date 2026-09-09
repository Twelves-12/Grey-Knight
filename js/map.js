import { MAP_NODES, MAP_ROUTES, getMapNode } from "../game/content/map.js";
import { getProfile, setProfile } from "../game/kv.js";

const board = document.querySelector("#map-board");
const continueBtn = document.querySelector("#map-continue");
const backBtn = document.querySelector("#map-back");

function getNodeEntry(nodeId) {
  return nodeId === "node-1"
    ? "/game/story.html"
    : `/game/story2.html?node=${encodeURIComponent(nodeId)}`;
}

function isSameBranch(nodeBranch, activeBranch) {
  if (!nodeBranch || !activeBranch) {
    return false;
  }
  return activeBranch === "audit"
    ? nodeBranch === "audit" || nodeBranch.startsWith("audit-")
    : nodeBranch === activeBranch;
}

function getProgress() {
  const profile = getProfile();
  if (!profile.progress) {
    return { current: "node-1", unlocked: ["node-1"] };
  }
  const branch = profile.branch;
  const unlocked = (profile.progress.unlocked ?? ["node-1"]).filter((nodeId) => {
    const node = getMapNode(nodeId);
    return !branch || isSameBranch(node.branch, branch) || node.id === "node-1";
  });
  const requestedCurrent = getMapNode(profile.progress.current ?? "node-1").id;
  const current = unlocked.includes(requestedCurrent)
    ? requestedCurrent
    : unlocked.at(-1) ?? "node-1";
  return {
    current,
    unlocked,
  };
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

  for (const [fromId, toId] of MAP_ROUTES) {
    const node = getMapNode(fromId);
    const nextNode = getMapNode(toId);
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

  for (const [index, node] of MAP_NODES.entries()) {
    const isCurrent = node.id === progress.current;
    const isPassed = progress.unlocked.includes(node.id) && !isCurrent;
    const isUnlocked = progress.unlocked.includes(node.id);
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
      const profile = getProfile();
      setProfile({ ...profile, mapCurrent: node.id });
      location.href = getNodeEntry(node.id);
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
  location.href = getNodeEntry(currentNode.id);
});

renderMap();
