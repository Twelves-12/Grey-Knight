import { el } from "./utils.js";

/**
 * 卡面、战场详情和图鉴使用卡牌定义中的同一份完整规则。
 * @param {import("../types.js").CardDef} def
 * @param {import("../types.js").Side} side
 */
export function createCardRules(def, side) {
  const rules = el("div", "card-rules");
  // 已保存的战斗快照可能仍包含旧占位正文。
  const text = def.text.replace(/^无额外特质。/, "");
  if (text) {
    rules.append(el("p", "card-inscription", text));
  }
  if (def.command && side === "player") {
    const command = el("p", "card-rule command-rule");
    command.append(
      el("span", "rule-tag", "军令 · 弃牌 · 每轮一次"),
      el("span", "rule-text", def.command.text),
    );
    rules.append(command);
  }

  return rules.hasChildNodes() ? rules : document.createDocumentFragment();
}
