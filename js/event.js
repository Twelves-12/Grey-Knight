import { GREY_KNIGHT } from "../game/content/player.js";
import { ROAD_CHOICES } from "../game/content/road-event.js";
import { Player } from "../game/game/player.js";
import { applyCardSigil } from "../game/ui/card-icons.js";
import { el } from "../game/ui/utils.js";

import "./site.js";

const form = document.querySelector("#event-form");
const choices = document.querySelector("#event-choices");
const outcome = document.querySelector("#event-outcome");
const proceed = document.querySelector("#event-continue");

for (const [index, choice] of ROAD_CHOICES.entries()) {
  const reward = choice.reward;
  const label = el("label", "event-choice sheet");
  const radio = el("input");
  radio.type = "radio";
  radio.name = "choice";
  radio.value = choice.id;
  radio.required = true;
  const body = el("div", "choice-body");
  const emblem = el("div", "choice-emblem");
  if (reward) {
    applyCardSigil(emblem, reward);
  } else {
    emblem.textContent = "路";
  }
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
    el("span", "", reward ? `牌库加入「${reward.name}」× 1` : "牌库不变"),
  );
  body.append(consequence);
  label.append(radio, body);
  choices.append(label);
}

function showChoice() {
  const id = new FormData(form).get("choice");
  outcome.hidden = id === null;
  proceed.disabled = id === null;
  if (id === null) {
    return;
  }
  const choice = ROAD_CHOICES.find((entry) => entry.id === id);
  const player = new Player(GREY_KNIGHT);
  player.takeDamage(choice.healthCost);
  if (choice.reward) {
    player.deck.push(choice.reward);
  }
  document.querySelector("#event-aftermath").textContent = choice.aftermath;
  document.querySelector("#event-health").textContent =
    `${player.health} / ${player.maxHealth}`;
  document.querySelector("#event-deck").textContent =
    `${player.deck.length} 张`;
}

form.addEventListener("change", showChoice);
window.addEventListener("pageshow", showChoice);
