import { createCardWatermark } from "../game/ui/card-icons.js";

export function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;

  return node;
}

const ICONS = {
  health:
    '<path d="M12 21 3.5 12.5A5.2 5.2 0 0 1 12 5a5.2 5.2 0 0 1 8.5 7.5Z"/>',
  ashes:
    '<path d="M13 2c1 6-4 6-2 10 2-1 3-3 3-5 5 4 7 8 3 12-3 3-9 2-11-1C2 12 7 8 8 5c0 4 1 5 2 5"/><path d="M12 14c-3 3-2 6 1 6s4-3-1-6Z"/>',
  cards:
    '<rect x="7" y="3" width="13" height="18" rx="2"/><path d="M4 6H2v14h2m9-12 3 4-3 4-3-4Z"/>',
  relic:
    '<path d="M12 2 20 6v7c0 4-8 9-8 9S4 17 4 13V6Z"/><path d="m12 7 3 5-3 5-3-5Z"/>',
  battle:
    '<path d="m4 20 4-4m-3-3 6 6m-3-4 11-11 1 4L10 18M5 4l15 16M4 4l4 1-3 3Z"/>',
  duel: '<path d="m3 21 5-5m-3-3 6 6m-3-4L19 3l2 2L10 18M3 3l8 8M2 3l1-1 3 1-3 3Z"/>',
  peaceful:
    '<path d="M3 21h18M5 21V10h14v11M3 10l9-7 9 7M10 21v-6h4v6"/><path d="M12 7v3"/>',
  elite: '<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z"/>',
  shop: '<path d="M3 10 5 3h14l2 7M4 10v11h16V10M2 10c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0M9 21v-7h6v7"/>',
  forge: '<path d="m14 3 7 7-4 4-7-7Z M12 9l-9 12M2 17h7M9 4l3-3M20 11l3-3"/>',
  camp: '<path d="m3 18 9-15 9 15H3Zm6 0 3-7 3 7M8 22l8-2m-8 0 8 2"/>',
  event:
    '<path d="M3 10h18v11H3Zm0 0V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v3M8 3v18m8-18v18"/><path d="M10 10h4v5h-4Z"/>',
  choice: '<path d="M12 22V11M12 15 4 7M4 12V4h8M12 15l8-8m-8-3h8v8"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  refresh:
    '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
  route:
    '<path d="M5 21v-6a5 5 0 0 1 5-5h4a5 5 0 0 0 5-5V2m-4 4 4-4 3 4"/><circle cx="5" cy="21" r="2"/>',
  oath: '<path d="M6 3h12v10a6 6 0 0 1-12 0ZM9 21h6M12 19v2M3 4v7h3m15-7v7h-3"/>',
  story:
    '<path d="M12 5C9 2 4 3 2 4v15c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-1-7-2-10 1Zm0 0v14"/>',
};

export function icon(name) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  node.setAttribute("viewBox", "0 0 24 24");
  node.setAttribute("class", "journey-icon");
  node.setAttribute("fill", "none");
  node.setAttribute("stroke", "currentColor");
  node.setAttribute("stroke-width", "1.5");
  node.setAttribute("stroke-linecap", "round");
  node.setAttribute("stroke-linejoin", "round");
  node.setAttribute("aria-hidden", "true");
  node.innerHTML = ICONS[name] ?? ICONS.choice;

  return node;
}

const SCENES = {
  camp: '<path class="scene-solid" d="m68 174 73-114 78 114Z"/><path d="m141 60 3 114m-28 0 28-55 31 55M61 181h167"/><path class="scene-glow" d="M260 184c-35-12-18-36-9-51-1 17 17 18 11 32 10-3 12-14 12-14 18 26 3 36-14 33Z"/><path d="m233 200 52-14m-52 0 52 14"/>',
  event:
    '<path class="scene-solid" d="M83 113c0-32 20-47 47-47h101c28 0 47 15 47 47v83H83Z"/><path d="M83 113h195M115 69v126m133-126v126"/><path class="scene-glow" d="M163 104h34v44h-34Z"/><path d="M180 119v12M73 205h214m-51-157 4-12m-48 9-3-15m-48 20-8-11"/>',
  shop: '<path class="scene-solid" d="M74 90 96 48h166l23 42-13 23v85H88v-86Z"/><path d="M74 90h211M111 90l12-42m29 42 6-42m38 42-6-42m43 42-8-42M89 145h182M129 145v53m96-53v53M76 204h209"/><path class="scene-glow" d="M161 148h36v50h-36Z"/><path d="M102 128h20m23 0h27m23 0h26m12 0h24"/>',
  forge:
    '<path class="scene-solid" d="M79 139h196l-30 29h-48v26h24v12h-90v-12h24v-26h-34Z"/><path d="m151 60 51 40m-69-25 34-43 62 49-35 43Z"/><path class="scene-glow" d="m95 88 9 30m-36-16 24 27m-43-3 32 12"/><path d="M70 216h221"/>',
  peaceful:
    '<path class="scene-solid" d="M76 111 180 43l104 68H76Zm22 0v91h164v-91"/><path d="M122 115v87m116-87v87m-82 0v-59h48v59M68 210h224m-201-9h178"/><path class="scene-glow" d="M176 87h8v25h-8Z"/>',
  battle:
    '<path class="scene-solid" d="m83 73 92-28 92 28v61c0 51-92 82-92 82s-92-31-92-82Z"/><path d="m128 176 100-106m-94 68 33 32m-16-49 63-67 20 6-4 20-64 65"/><path class="scene-glow" d="m187 82 27-28 20 6-4 20-28 29Z"/>',
};

export function sceneArt(kind) {
  const art = element("div", `journey-art art-${kind}`);
  art.setAttribute("aria-hidden", "true");
  const shape = SCENES[kind] ?? SCENES.battle;
  art.innerHTML = `<svg viewBox="0 0 360 250" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><circle class="scene-halo" cx="180" cy="123" r="104"/><path class="scene-ground" d="M20 218h320M34 226h292M47 210h28m210 0h29"/>${shape}<path class="scene-stars" d="M44 53v12m-6-6h12m256-25v12m-6-6h12M304 130v8m-4-4h8"/></svg>`;

  return art;
}

export function renderRunStatus(root, run) {
  root.classList.add("resource-bar");
  root.replaceChildren();
  const health = run.battle?.state.health ?? run.health;
  const stats = [
    ["health", "圣焰", `${health} / ${run.maxHealth}`],
    ["ashes", "灰烬", String(run.ashes)],
    ["cards", "牌组", `${run.deck.length} 张`],
    ["relic", "战具", `${run.relics.length} 件`],
  ];
  for (const [name, label, value] of stats) {
    const item = element("div", `resource-stat resource-${name}`);
    const copy = element("span", "resource-copy");
    copy.append(element("small", "", label), element("strong", "", value));
    item.append(icon(name), copy);
    if (name === "health") {
      const track = element("span", "resource-meter");
      const fill = element("span");
      fill.style.width = `${Math.max(0, (health / run.maxHealth) * 100)}%`;
      track.append(fill);
      item.append(track);
    }
    root.append(item);
  }
}

function effectList(effects) {
  const list = element("span", "decision-effects");
  for (const effect of effects) {
    const row = element(
      "span",
      `decision-effect effect-${effect.tone ?? "neutral"}`,
    );
    row.append(
      element("span", "effect-label", effect.label),
      element("strong", "effect-value", effect.value),
    );
    list.append(row);
  }

  return list;
}

export function choiceCard({
  title,
  description = "",
  eyebrow = "",
  icon: iconName = "choice",
  effects = [],
  action = "选择此项 →",
  disabledReason = "",
  onClick,
  selected = false,
  content,
}) {
  const button = element("button", "decision-card");
  button.type = "button";
  button.disabled = Boolean(disabledReason);
  button.classList.toggle("selected", selected);
  const heading = element("span", "decision-heading");
  const mark = element("span", "decision-icon");
  mark.append(icon(selected ? "check" : iconName));
  const copy = element("span", "decision-copy");
  if (eyebrow) {
    copy.append(element("small", "decision-eyebrow", eyebrow));
  }
  copy.append(element("strong", "decision-title", title));
  heading.append(mark, copy);
  button.append(heading);
  if (description) {
    button.append(element("span", "decision-description", description));
  }
  if (content) {
    button.append(content);
  }
  if (effects.length > 0) {
    button.append(effectList(effects));
  }
  const cta = element("span", "decision-cta");
  cta.append(
    element("span", "", disabledReason || action.replace(/\s*→$/, "")),
    icon(disabledReason ? (selected ? "check" : "lock") : "arrow"),
  );
  button.append(cta);
  if (onClick) {
    button.addEventListener("click", onClick);
  }

  return button;
}

export function resultNotice(
  root,
  { title, text = "", effects = [], tone = "success" },
) {
  root.hidden = false;
  root.dataset.tone = tone;
  root.classList.add("result-notice");
  root.setAttribute("role", "status");
  root.replaceChildren();
  const heading = element("div", "result-heading");
  heading.append(
    icon(tone === "error" ? "lock" : "check"),
    element("strong", "", title),
  );
  root.append(heading);
  if (text) {
    root.append(element("p", "", text));
  }
  if (effects.length > 0) {
    root.append(effectList(effects));
  }
}

export function sectionHeading(title, description = "", step = "") {
  const header = element("header", "action-section-heading");
  if (step) {
    header.append(element("span", "section-step", step));
  }
  const copy = element("div");
  copy.append(element("h2", "", title));
  if (description) {
    copy.append(element("p", "", description));
  }
  header.append(copy);

  return header;
}

export function cardDetails(def) {
  const detail = element("span", "journey-card-detail");
  detail.append(createCardWatermark(def));
  const stats = element("span", "card-facts");
  for (const [label, value] of [
    ["圣力", def.cost],
    ["种属", def.faction ?? "—"],
    ...(def.type === "unit"
      ? [
          ["攻击", def.attack],
          ["生命", def.health],
        ]
      : []),
  ]) {
    const stat = element("span", "card-fact");
    stat.append(element("small", "", label), element("b", "", String(value)));
    stats.append(stat);
  }
  const rules = element("span", "card-rule-copy");
  rules.append(
    element(
      "span",
      "card-rule-label",
      def.type === "unit" ? "单位特质" : "使用效果",
    ),
    element("span", "", def.text),
  );
  detail.append(stats, rules);
  if (def.command) {
    const command = element("span", "card-rule-copy");
    command.append(
      element("span", "card-rule-label", "军令 · 弃牌发动"),
      element("span", "", def.command.text),
    );
    detail.append(command);
  }

  return detail;
}

export function renderSteps(root, labels, currentIndex) {
  root.classList.add("journey-steps");
  root.replaceChildren();
  for (const [index, label] of labels.entries()) {
    const step = element(
      "li",
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "",
    );
    const mark = element("span", "step-marker");
    if (index < currentIndex) {
      mark.append(icon("check"));
    } else {
      mark.textContent = String(index + 1).padStart(2, "0");
    }
    if (index === currentIndex) {
      step.setAttribute("aria-current", "step");
    }
    step.append(mark, element("span", "", label));
    root.append(step);
  }
}
