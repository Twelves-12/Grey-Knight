import { PLAYER_CARDS, applyCardUpgrade } from "../game/content/cards.js";
import { OATHS, RELICS } from "../game/content/equipment.js";
import { ENDINGS, getMapNode } from "../game/content/map.js";
import {
  chooseBattleReward,
  chooseOath,
  getNodeEntry,
  getRun,
  requireCampaignNode,
  rerollBattleReward,
  settleChapter,
  startNewCampaign,
} from "../game/session.js";
import {
  cardDetails,
  choiceCard,
  element,
  renderRunStatus,
  renderSteps,
  resultNotice,
  sectionHeading,
} from "./journey-ui.js";

const nodeId =
  new URLSearchParams(location.search).get("node") ?? getRun().progress.current;
const node = getMapNode(nodeId);
const back = document.querySelector("#settlement-back");
const restart = document.querySelector("#settlement-new");
let receipt = null;
const cardById = (id) => PLAYER_CARDS.find((card) => card.id === id);

function choiceFutureEffects(choice, run) {
  let future = choice.effects.future;
  if (nodeId === "node-6" && choice.id === "rebel") {
    const missing = [
      run.choices.knight === "spare" ? null : "骑士证人（酒馆未放走骑士）",
      run.choices.temple === "protect" ? null : "民众支持（未保护庙宇）",
    ].filter(Boolean);
    future =
      missing.length > 0
        ? [
            `缺少：${missing.join("、")}`,
            "仍可选择反抗；完成战后选牌后进入「孤证难鸣」，无法进入宫殿",
          ]
        : [
            "骑士证人、民众支持均已具备；完成战后选牌后，开放宫殿隐藏终战",
            "还需击败公爵与私人卫队才能达成正义结局；终战失败将进入悲剧结局",
          ];
  }

  return future.map((value) => ({
    label: "后续影响",
    value,
    tone:
      ["destroy", "execute", "expel"].includes(choice.id) ||
      (nodeId === "node-6" && choice.id === "rebel")
        ? "risk"
        : "neutral",
  }));
}

function storyCardName(id, upgrade) {
  const card = cardById(id);

  return upgrade ? applyCardUpgrade(card, upgrade).name : card.name;
}

function choiceEffects(choice, run) {
  const effects = choice.effects.immediate.map((value) => ({
    label: choice.rewardId ? "立即获得" : "当下结果",
    value,
    tone: choice.rewardId ? "gain" : "neutral",
  }));
  if (choice.bonus?.ashes) {
    effects.push({
      label: "立即到账",
      value: `+${choice.bonus.ashes} 灰烬`,
      tone: "gain",
    });
  }
  if (choice.bonus?.heal) {
    const health = Math.min(choice.bonus.heal, run.maxHealth - run.health);
    effects.push({
      label: "本次治疗",
      value:
        health > 0
          ? `恢复 ${health} 圣焰（最多 ${choice.bonus.heal}）`
          : "圣焰已满，本次恢复 0",
      tone: health > 0 ? "gain" : "neutral",
    });
  }

  return [...effects, ...choiceFutureEffects(choice, run)];
}

function storyRewardEffects(record, chosen) {
  const reward = record.storyReward;
  const cardId = reward ? reward.cardId : chosen?.rewardId;
  const effects = [];
  if (cardId) {
    effects.push({
      label: "剧情牌已加入",
      value: storyCardName(cardId, reward?.upgrade),
      tone: "gain",
    });
  }
  if (reward?.ashes > 0) {
    effects.push({
      label: "剧情奖励已到账",
      value: `+${reward.ashes} 灰烬`,
      tone: "gain",
    });
  }
  if (reward && (reward.health > 0 || chosen?.bonus?.heal)) {
    effects.push({
      label: "实际治疗",
      value:
        reward.health > 0
          ? `恢复 ${reward.health} 圣焰`
          : "恢复 0 圣焰（本次未恢复）",
      tone: reward.health > 0 ? "gain" : "neutral",
    });
  }

  return effects;
}

function settlementSteps(record) {
  const steps = [];
  if (record.storyResolved !== undefined) {
    if (node.choices?.length) {
      steps.push({ key: "story", label: "处置抉择" });
    }
    if (node.kind !== "peaceful") {
      steps.push({ key: "reward", label: "战后选牌" });
    }
    if (record.oathOptions.length > 0) {
      steps.push({ key: "oath", label: "立下誓约" });
    }
  }
  steps.push({ key: "continue", label: "继续" });

  return steps;
}

function renderContext(record, chosen, ending, run) {
  const story = document.querySelector("#settlement-story");
  story.replaceChildren();
  if (ending) {
    return;
  }
  const paragraphs = chosen
    ? [
        nodeId === "node-6" &&
        chosen.id === "rebel" &&
        (run.choices.knight !== "spare" || run.choices.temple !== "protect")
          ? "你选择反抗，但证人与民众的支持尚不齐备。完成战后选牌后，本趟旅程将以「孤证难鸣」结束。"
          : chosen.aftermath,
      ]
    : (node.aftermath ?? []);
  if (paragraphs.length > 0) {
    story.append(element("p", "settlement-context-lead", paragraphs.at(-1)));
  }
  if (!chosen && paragraphs.length > 1) {
    const details = element("details", "settlement-context-details");
    details.append(element("summary", "", "查看战后经过"));
    for (const text of paragraphs.slice(0, -1)) {
      details.append(element("p", "", text));
    }
    story.append(details);
  }
  const relic = RELICS.find((entry) => entry.id === record.relicId);
  if (relic) {
    story.append(
      element(
        "p",
        "settlement-found",
        `已获得战具：${relic.name} · ${relic.text}`,
      ),
    );
  }
}

function renderStory(choices, run, pending) {
  const actions = {
    recruit: "接受投降，领取卡牌",
    execute: nodeId === "node-4" ? "处决骑士，领取嘉奖" : "执行军令，领取赏金",
    expel: "驱逐蛮族，领取军需",
    mercy: "放行蛮族，领取卡牌",
    continue: "领取卡牌并继续",
    spare: "放走骑士，领取卡牌",
    destroy: "摧毁庙宇，征用补给",
    protect: "保护庙宇，领取卡牌",
    loyal: "选择普通结局，继续结算",
    rebel: "反抗领主，继续结算",
  };
  for (const choice of node.choices) {
    const disabledReason =
      nodeId === "node-5" &&
      pending.result === "victory" &&
      choice.id === "protect"
        ? "庙宇中的人已被击溃，无法再选择保护。"
        : "";
    const effects = choiceEffects(choice, run);
    choices.append(
      choiceCard({
        title: choice.title,
        description: choice.description,
        eyebrow: choice.rewardId ? "剧情选择 · 获得专属牌" : "剧情选择",
        icon: "choice",
        effects,
        action: `${actions[choice.id]} →`,
        disabledReason,
        onClick() {
          const updated = settleChapter(nodeId, choice.id);
          const record =
            updated.pendingBattle?.nodeId === nodeId
              ? updated.pendingBattle
              : updated.records[nodeId];
          receipt = {
            title: `已选择：${choice.title}`,
            text: "这项处置已记录在本趟冒险中。",
            effects: [
              ...storyRewardEffects(record, choice),
              ...choiceFutureEffects(choice, updated),
            ],
          };
          render();
        },
      }),
    );
  }
}

function renderRewards(rewards, run, pending) {
  const options = element("div", "reward-options");
  for (const id of pending.rewardOptions) {
    const card = cardById(id);
    options.append(
      choiceCard({
        title: card.name,
        eyebrow: "战后奖励 · 免费选 1 张",
        icon: "cards",
        content: cardDetails(card),
        action: `将「${card.name}」加入牌组 →`,
        onClick() {
          chooseBattleReward(id);
          receipt = {
            title: `「${card.name}」已加入牌组`,
            text: `本趟牌组现有 ${getRun().deck.length} 张牌，下场战斗起可以抽到。`,
            effects: [{ label: "本次花费", value: "0 灰烬", tone: "neutral" }],
          };
          render();
        },
      }),
    );
  }
  rewards.append(options);
  const alternatives = element("div", "settlement-alternatives");
  alternatives.append(
    choiceCard({
      title: "换一组奖励",
      description: "重新随机生成 3 张候选牌，随后仍可选择或跳过。",
      icon: "refresh",
      effects: [{ label: "花费", value: "10 灰烬", tone: "cost" }],
      action: "支付 10 灰烬，重掷 →",
      disabledReason:
        run.ashes < 10
          ? `还差 ${10 - run.ashes} 灰烬；当前持有 ${run.ashes}。`
          : "",
      onClick() {
        rerollBattleReward();
        receipt = {
          title: "奖励候选已更换",
          text: "从新的一组奖励中选 1 张，或跳过换取灰烬。",
          effects: [
            { label: "已花费", value: "10 灰烬", tone: "cost" },
            { label: "剩余", value: `${getRun().ashes} 灰烬`, tone: "neutral" },
          ],
        };
        render();
      },
    }),
    choiceCard({
      title: "保持精简，领取灰烬",
      description: "放弃本次战后奖励牌，牌组数量不变。",
      icon: "ashes",
      effects: [{ label: "获得", value: "+12 灰烬", tone: "gain" }],
      action: "跳过选牌，领取 12 灰烬 →",
      onClick() {
        chooseBattleReward(null);
        receipt = {
          title: "已跳过选牌，获得 12 灰烬",
          text: `牌组保持 ${getRun().deck.length} 张；当前持有 ${getRun().ashes} 灰烬。`,
          effects: [{ label: "本次获得", value: "+12 灰烬", tone: "gain" }],
        };
        render();
      },
    }),
  );
  rewards.append(alternatives);
}

function renderOaths(rewards, pending) {
  const options = element("div", "reward-options");
  for (const id of pending.oathOptions) {
    const oath = OATHS.find((entry) => entry.id === id);
    options.append(
      choiceCard({
        title: oath.name,
        eyebrow: "本趟唯一誓约",
        icon: "oath",
        description: oath.text,
        effects: [
          {
            label: "生效时间",
            value: "下一场战斗起，持续至本趟冒险结束",
            tone: "gain",
          },
          {
            label: "选择限制",
            value: "只能持有一个，选定后本趟不可更换",
            tone: "risk",
          },
        ],
        action: `立下「${oath.name}」→`,
        onClick() {
          chooseOath(id);
          receipt = {
            title: `已立下「${oath.name}」`,
            text: oath.text,
            effects: [{ label: "生效", value: "下一场战斗起", tone: "gain" }],
          };
          render();
        },
      }),
    );
  }
  rewards.append(options);
}

function renderSummary(root, record, chosen, run) {
  const effects = [];
  if (record.ashesReward > 0) {
    effects.push({
      label: "战斗报酬已入账",
      value: `+${record.ashesReward} 灰烬`,
      tone: "gain",
    });
  }
  if (chosen) {
    effects.push({ label: "处置", value: chosen.title, tone: "neutral" });
  }
  effects.push(...storyRewardEffects(record, chosen));
  if (record.rewardId) {
    effects.push({
      label: "战后选牌已加入",
      value: cardById(record.rewardId).name,
      tone: "gain",
    });
  }
  if (record.rewardResolved && node.kind !== "peaceful" && !record.rewardId) {
    effects.push({ label: "跳过选牌", value: "+12 灰烬", tone: "gain" });
  }
  if (record.oathOptions?.length && record.oathResolved) {
    effects.push({
      label: "唯一誓约",
      value: OATHS.find((oath) => oath.id === run.oath).name,
      tone: "gain",
    });
  }
  if (effects.length === 0) {
    root.hidden = true;
    root.replaceChildren();

    return;
  }
  resultNotice(root, { title: "已确认的选择与所得", effects });
}

function render() {
  const run = getRun();
  const pending =
    run.pendingBattle?.nodeId === nodeId ? run.pendingBattle : null;
  const record = pending ?? run.records[nodeId];
  if (!record) {
    location.replace(getNodeEntry(run.progress.current));

    return;
  }
  const ending =
    run.ending && run.progress.current === nodeId ? ENDINGS[run.ending] : null;
  const chosen = node.choices?.find((choice) => choice.id === record.choiceId);
  const choices = document.querySelector("#settlement-choices");
  const rewards = document.querySelector("#settlement-rewards");
  choices.replaceChildren();
  rewards.replaceChildren();
  document.querySelector("#settlement-chapter").textContent = node.label;
  document.querySelector("#settlement-title").textContent =
    ending?.title ??
    (node.kind === "duel"
      ? "决斗结束"
      : node.kind === "peaceful"
        ? "庙门前的抉择"
        : "战斗胜利");
  document.querySelector("#settlement-seal").textContent =
    ending?.seal ?? node.seal ?? "胜";
  document.querySelector("#settlement-copy").textContent =
    ending?.text ?? "按下方步骤领取补给，整理队伍后继续前行。";
  renderRunStatus(document.querySelector("#settlement-status"), run);
  renderContext(record, chosen, ending, run);
  const stage = pending
    ? pending.storyResolved
      ? pending.rewardResolved
        ? "oath"
        : "reward"
      : "story"
    : "continue";
  const steps = settlementSteps(record);
  const stepIndex = steps.findIndex((step) => step.key === stage);
  renderSteps(
    document.querySelector("#settlement-steps"),
    steps.map((step) => step.label),
    stepIndex,
  );
  const headings = {
    story: [
      "处置抉择",
      "选择一项。立即获得与后续影响分别列出，确认后本趟不可更改。",
    ],
    reward: [
      "战后选牌 · 三选一",
      "免费选 1 张加入本趟牌组；也可花费灰烬重掷，或跳过领取 12 灰烬。",
    ],
    oath: ["立下本趟唯一誓约", "从 3 种誓约中选 1 种，下一场战斗开始生效。"],
    continue: [
      ending ? "旅程已结束" : "整备完成，可以继续",
      ending
        ? "结局与图鉴会保留。新旅程会重新开始牌组、路线与成长。"
        : "返回地图，选择下一处目的地。",
    ],
  };
  document
    .querySelector("#settlement-step-heading")
    .replaceChildren(
      sectionHeading(
        ...headings[stage],
        String(stepIndex + 1).padStart(2, "0"),
      ),
    );
  if (stage === "story") {
    renderStory(choices, run, pending);
  } else if (stage === "reward") {
    renderRewards(rewards, run, pending);
  } else if (stage === "oath") {
    renderOaths(rewards, pending);
  }
  const receiptRoot = document.querySelector("#settlement-receipt");
  if (receipt) {
    resultNotice(receiptRoot, receipt);
  } else {
    receiptRoot.hidden = true;
    receiptRoot.replaceChildren();
  }
  renderSummary(
    document.querySelector("#settlement-summary"),
    record,
    chosen,
    run,
  );
  const outcome = document.querySelector("#settlement-outcome");
  outcome.textContent = pending
    ? `还需完成「${headings[stage][0]}」后才能继续。每次选择会自动保存，刷新可继续本步骤。`
    : ending
      ? "可以查看冒险地图，或开启一趟新的旅程。"
      : `下一站：${run.progress.available.map((id) => getMapNode(id).label).join(" / ")}。`;
  back.disabled = Boolean(pending);
  back.textContent = pending
    ? `先完成${steps[stepIndex].label}`
    : ending
      ? "查看冒险地图"
      : "返回地图，选择下一站 →";
  back.setAttribute("aria-describedby", "settlement-outcome");
  restart.hidden = !ending;
  if (receipt) {
    const heading = document.querySelector("#settlement-step-heading");
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: "instant" });
  }
}

back.addEventListener("click", () => {
  location.href = "/game/map.html";
});
restart.addEventListener("click", () => {
  startNewCampaign();
  location.href = "/game/map.html";
});
if (requireCampaignNode(nodeId, { allowCompleted: true })) {
  render();
}
