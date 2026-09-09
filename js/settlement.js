import { getMapNode } from "../game/content/map.js";
import { PLAYER_CARDS } from "../game/content/cards.js";
import { getProfile, setProfile } from "../game/kv.js";

const params = new URLSearchParams(location.search);
const nodeId = params.get("node") ?? "node-1";
const result = params.get("result") ?? "victory";
const skipped = params.get("skip") === "1";

const title = document.querySelector("#settlement-title");
const copy = document.querySelector("#settlement-copy");
const backBtn = document.querySelector("#settlement-back");
const choiceButtons = [...document.querySelectorAll(".settlement-choice")];

const node = getMapNode(nodeId);
const currentIndex = Number(nodeId.replace("node-", "")) || 1;
const chapterEnemyCards = {
  "node-1": ["bandit-grunt", "bandit-deputy"],
  "node-2": ["duke-private", "private-captain"],
  "node-3": ["guard", "northern-commander"],
  "node-4": ["guard-escort", "old-butler"],
  "node-6": ["bandit-grunt", "old-butler"],
  "rebel-2": ["barbarian-bear", "barbarian-warrior"],
};

if (nodeId === "node-2") {
  document.querySelector("#settlement-story").innerHTML =
    `<p>阿尔德里克击退私兵，肋下挨了一记钝击，盔甲凹了一块。他一手按住伤处，一手将账册揣入怀中。</p><p>巷口转角处，那名商人早已不见踪影，只留一串急促向外的脚印。更远处，城门方向传来马嘶与喝令——私兵在封锁出口。</p><blockquote>“买劫自扰，再亲自平乱……十一年，我竟像个瞎子。”</blockquote><p>副官赶来，脸色紧张：“城里都在传您窝藏匪徒、私通外敌。公爵府已在调兵封城。咱们得走了。”</p>`;
  choiceButtons[0].dataset.reward = "ledger-guard";
  choiceButtons[0].querySelector("strong").textContent = "护住账册，强行突围";
  choiceButtons[0].querySelector("small").textContent = "获得卡牌：账册护卫";
  choiceButtons[1].dataset.reward = "light-scout";
  choiceButtons[1].querySelector("strong").textContent = "放弃账册，保全自身";
  choiceButtons[1].querySelector("small").textContent = "获得卡牌：轻装斥候";
}

if (nodeId === "rebel-2") {
  document.querySelector("#settlement-story").innerHTML =
    `<p>阿尔德里克击退蛮族，村中余火未熄。战熊的尸体横卧街心，蛮族残部跪地请降。</p><p>小头目科尔上前，低声说这些蛮族战士若收为己用，将来必有大用。此时斥候来报：叛徒骑士已至滨海领，再追三日可及。但边境蛮族蠢蠢欲动，若放任不管恐成大患。</p>`;
  choiceButtons[0].dataset.reward = "barbarian-axe-thrower";
  choiceButtons[0].querySelector("strong").textContent = "降服蛮族战团，询问详情，带其随行";
  choiceButtons[0].querySelector("small").textContent = "获得卡牌：蛮族投斧手，解锁第五章民间结社支线";
  choiceButtons[1].dataset.reward = "border-cavalry";
  choiceButtons[1].querySelector("strong").textContent = "驱散即可，继续追杀任务";
  choiceButtons[1].querySelector("small").textContent = "获得卡牌：边境骑兵";
}

if (nodeId === "node-1") {
  choiceButtons[0].dataset.reward = "castle-arbalist";
  choiceButtons[0].dataset.branch = "audit";
  choiceButtons[0].querySelector("strong").textContent = "押回城堡，听候公爵发落";
  choiceButtons[0].querySelector("small").textContent = "获得卡牌：城堡弩手，进入查账线";
  choiceButtons[1].dataset.reward = "kol-first-bandit";
  choiceButtons[1].dataset.branch = "traitor";
  choiceButtons[1].querySelector("strong").textContent = "收编此人，令其戴罪立功";
  choiceButtons[1].querySelector("small").textContent = "获得卡牌：前匪首·科尔，进入叛徒线";
}

if (nodeId === "node-3") {
  document.querySelector("#settlement-story").innerHTML =
    `<p>阿尔德里克跪在坟前，将那枚纹章握在掌心。无需再查，他已明白一切——当年追查账目的佩特里，早已被灭口埋于此地。</p>`;
  choiceButtons[0].dataset.reward = "knights-legacy";
  choiceButtons[0].querySelector("strong").textContent = "挖掘坟墓，确认身份";
  choiceButtons[0].querySelector("small").textContent = "获得卡牌：骑士遗志";
  choiceButtons[1].dataset.reward = "northern-scout";
  choiceButtons[1].querySelector("strong").textContent = "默立凭吊，记下位置";
  choiceButtons[1].querySelector("small").textContent = "获得卡牌：北境斥候";
}

if (nodeId === "node-4") {
  document.querySelector("#settlement-story").innerHTML =
    `<p>阿尔德里克破门而入时，老管家仍坐在桌边，铁匣已空。他掌心摊着一封展开的信，冲阿尔德里克微微一笑，将信推过桌面。</p><blockquote>“不用搜了。你要的东西，就在这里。”</blockquote><p>信上字迹阿尔德里克一眼便认出——雷纳德公爵亲笔。授意雇匪、制造祸乱、借平乱之名私建军队、侵占边境土地，字字清晰。落款日期、火漆、印鉴俱全。</p>`;
  choiceButtons[0].dataset.reward = "secret-letter";
  choiceButtons[0].querySelector("strong").textContent = "仔细阅读密信，牢记每一个字";
  choiceButtons[0].querySelector("small").textContent = "获得卡牌：密信文书";
  choiceButtons[1].dataset.reward = "none";
  choiceButtons[1].querySelector("strong").textContent = "将密信藏于斗篷夹层";
  choiceButtons[1].querySelector("small").textContent = "无新卡牌，证据隐藏";
}

if (nodeId === "node-6") {
  document.querySelector("#settlement-story").innerHTML =
    `<p>阿尔德里克击溃伏兵，剑锋抵住老管家咽喉。对方不躲不避，冷笑一声。</p><blockquote>老管家：“你查了这么久，不就是要一个答案？是，一切都是公爵授意。三年前逼税绝粮逼民为匪，两年前雇我统领匪众供他剿杀，一年前伪造边境争端挑起战争——佩特里知道太多，我亲手埋的。如今你也有了答案。然后呢？”</blockquote>`;
  choiceButtons[0].dataset.reward = "none";
  choiceButtons[0].querySelector("strong").textContent = "继续效忠，置若罔闻";
  choiceButtons[0].querySelector("small").textContent = "无新卡牌，路线锁定·愚忠结局";
  choiceButtons[1].dataset.reward = "butler-testimony";
  choiceButtons[1].querySelector("strong").textContent = "携证据归返，大殿对峙";
  choiceButtons[1].querySelector("small").textContent = "获得卡牌：老管家口供，路线锁定·真相结局";
  choiceButtons[2]?.remove();
  const thirdChoice = document.createElement("button");
  thirdChoice.className = "settlement-choice sheet";
  thirdChoice.type = "button";
  thirdChoice.dataset.reward = "none";
  thirdChoice.innerHTML = '<span class="choice-number">03</span><span class="choice-body"><strong>销毁所有证据，远走他乡</strong><small>无新卡牌，路线锁定·归隐结局</small></span>';
  document.querySelector("#settlement-choices").append(thirdChoice);
  choiceButtons.push(thirdChoice);
}

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

for (const button of choiceButtons) {
  button.addEventListener("click", () => {
    const rewardId = button.dataset.reward;
    const reward = PLAYER_CARDS.find((card) => card.id === rewardId);
    if (!reward && rewardId !== "none") {
      return;
    }

    const profile = getProfile();
    const codex = new Set(profile.codex);
    for (const cardId of chapterEnemyCards[nodeId] ?? []) {
      codex.add(`enemy:${cardId}`);
    }
    if (reward) {
      codex.add(`player:${reward.id}`);
    }
    const branch = button.dataset.branch ?? profile.branch;
    const nextNode = nodeId === "node-1"
      ? branch === "traitor" ? "rebel-2" : "node-2"
      : profile.progress?.current;
    const branchStart = nodeId === "node-1"
      ? nextNode
      : profile.progress?.current;
    const unlocked = nodeId === "node-1"
      ? ["node-1", branchStart]
      : [
          ...(profile.progress?.unlocked ?? ["node-1"]),
          ...(branchStart ? [branchStart] : []),
        ];
    setProfile({
      ...profile,
      branch,
      progress: branchStart
        ? { current: branchStart, unlocked: [...new Set(unlocked)] }
        : profile.progress,
      codex: [...codex],
      rewards: { ...profile.rewards, [nodeId]: reward?.id ?? null },
      evidenceHidden: {
        ...(profile.evidenceHidden ?? {}),
        [nodeId]: rewardId === "none",
      },
    });
    for (const choice of choiceButtons) {
      choice.classList.toggle("selected", choice === button);
    }
    if (backBtn) {
      backBtn.disabled = false;
    }
  });
}
