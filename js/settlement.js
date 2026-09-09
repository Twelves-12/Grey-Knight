import { getMapNode } from "../game/content/map.js";

const params = new URLSearchParams(location.search);
const nodeId = params.get("node") ?? "node-1";
const result = params.get("result") ?? "victory";
const skipped = params.get("skip") === "1";

const title = document.querySelector("#settlement-title");
const copy = document.querySelector("#settlement-copy");
const backBtn = document.querySelector("#settlement-back");

const node = getMapNode(nodeId);
const currentIndex = Number(nodeId.replace("node-", "")) || 1;

if (title) {
  title.textContent = result === "victory" ? "战斗胜利" : "战斗结束";
}

if (copy) {
  copy.textContent = skipped
    ? "你跳过了这场苦战，前方的路仍在继续。"
    : "你已完成这一场战斗，下一段路正在等待你踏入。";
}

backBtn?.addEventListener("click", () => {
  location.href = "/game/map.html";
});
