import { getMapNode, MAP_NODES } from "../game/content/map.js";
import { Player } from "../game/game/player.js";
import { GREY_KNIGHT } from "../game/content/player.js";
import { applyCardSigil } from "../game/ui/card-icons.js";
import { el } from "../game/ui/utils.js";

const params = new URLSearchParams(location.search);
const nodeId = params.get("node") ?? "node-1";
const node = getMapNode(nodeId);
const form = document.querySelector("#event-form");
const choicesRoot = document.querySelector("#event-choices");
const outcome = document.querySelector("#event-outcome");
const proceed = document.querySelector("#event-continue");
const title = document.querySelector("#event-title");
const description = document.querySelector("#event-description");
const topLabel = document.querySelector("#event-topline-label");

if (title) {
  title.textContent = node.title;
}
if (description) {
  description.textContent = `${node.storyTitle}：这里是节点选项页的占位内容，待你填入真正的选项文本。`;
}
if (topLabel) {
  topLabel.textContent = node.storyTitle;
}

const choices = node.choices ?? [
  {
    id: "node-default-choice-1",
    title: "节点占位选项1",
    description: "这是默认占位选项，后续可替换成真实内容。",
    healthCost: 1,
    reward: "占位牌1",
    aftermath: "默认结局：你完成了一个占位决策。",
  },
  {
    id: "node-default-choice-2",
    title: "节点占位选项2",
    description: "这是默认占位选项，后续可替换成真实内容。",
    healthCost: 2,
    reward: "占位牌2",
    aftermath: "默认结局：你完成了第二个占位决策。",
  },
  {
    id: "node-default-choice-3",
    title: "节点占位选项3",
    description: "这是默认占位选项，后续可替换成真实内容。",
    healthCost: 0,
    reward: "占位牌3",
    aftermath: "默认结局：你保留了所有余力。",
  },
];

for (const [index, choice] of choices.entries()) {
  const labelEl = el("label", "event-choice sheet");
  const radio = el("input");
  radio.type = "radio";
  radio.name = "choice";
  radio.value = choice.id;
  radio.required = true;

  const body = el("div", "choice-body");
  const emblem = el("div", "choice-emblem");
  emblem.textContent = String(index + 1);

  body.append(
    el("span", "choice-number", `0${index + 1}`),
    emblem,
    el("h2", "", choice.title),
    el("p", "choice-description", choice.description),
  );

  const consequence = el("div", "choice-consequence");
  consequence.append(
    el(
      "span",
      choice.healthCost ? "choice-cost" : "",
      choice.healthCost ? `生命 −${choice.healthCost}` : "保留全部生命",
    ),
  );
  consequence.append(
    el("span", "", `${choice.reward ? `牌库加入「${choice.reward}」× 1` : "牌库不变"}`),
  );

  body.append(consequence);
  labelEl.append(radio, body);
  choicesRoot?.append(labelEl);
}

function showChoice() {
  const id = new FormData(form).get("choice");
  outcome.hidden = id === null;
  proceed.disabled = id === null;
  if (id === null) {
    return;
  }

  const choice = choices.find((entry) => entry.id === id) ?? choices[0];
  const player = new Player(GREY_KNIGHT);
  player.takeDamage(choice.healthCost);
  document.querySelector("#event-aftermath").textContent = choice.aftermath;
  document.querySelector("#event-health").textContent = `${player.health} / ${player.maxHealth}`;
  document.querySelector("#event-deck").textContent = `${player.deck.length} 张`;

  const nextLink = `./battle.html?node=${encodeURIComponent(node.id)}&choice=${encodeURIComponent(choice.id)}`;
  form.action = nextLink;
}

form?.addEventListener("change", showChoice);
window.addEventListener("pageshow", showChoice);
