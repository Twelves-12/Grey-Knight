import { el } from "./utils.js";

/**
 * 卡面、战场详情和图鉴使用卡牌定义中的同一份完整规则。
 * @param {import("../types.js").CardDef} def
 * @param {import("../types.js").Side} side
 */
export function createCardRules(def, side) {
  const rules = el("div", "card-rules");
  rules.append(el("p", "card-inscription", def.text));
  if (def.command && side === "player") {
    const command = el("p", "card-rule command-rule");
    command.append(
      el("span", "rule-tag", "军令 · 弃牌 · 每轮一次"),
      el("span", "rule-text", def.command.text),
    );
    rules.append(command);
  }

  return rules;
}
