import { el } from "./utils.js";

/**
 * 卡面和详情共用的规则排
 *
 * @param {import("../types.js").CardDef} def
 * @param {import("../types.js").Side} side
 */
export function createCardRules(def, side) {
  const rules = el("div", "card-rules");

  if (def.keyword === "firstStrike") {
    const rule = el("p", "card-rule");
    rule.append(
      el("span", "rule-tag", "先手"),
      el("span", "rule-text", "对拼先出手，击倒免还击。"),
    );
    rules.append(rule);
  }

  for (const effect of def.onDeploy ?? []) {
    const rule = el("p", "card-rule");
    const text = el("span", "rule-text");
    const count = el("b", "rule-value", String(effect.count));
    switch (effect.kind) {
      case "damageHero": {
        text.append("对敌方英雄造成 ", count, " 点伤害。");

        break;
      }
      case "draw": {
        text.append("抽 ", count, " 张牌。");

        break;
      }
      case "energy": {
        text.append("获得 ", count, " 点圣力。");

        break;
      }
      case "healHero": {
        text.append("己方英雄恢复 ", count, " 点生命。");

        break;
      }
    }
    rule.append(
      el("span", "rule-tag", side === "enemy" ? "降临" : "入场"),
      text,
    );
    rules.append(rule);
  }

  if (!rules.childElementCount) {
    rules.append(el("p", "card-inscription", def.text));
  }

  return rules;
}
