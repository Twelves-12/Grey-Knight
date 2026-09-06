import { HERALD, SHIELDBEARER } from "./cards.js";

export const ROAD_CHOICES = [
  {
    id: "rescue",
    title: "救下守卫",
    description: "翻过碎石，把压在盾下的人拖出来。你得替他挡住暗处的袭击。",
    healthCost: 4,
    reward: SHIELDBEARER,
    aftermath:
      "守卫拾起那面凹陷的盾，站到你身侧。桥后还有很长的路，这次你不必独自走。",
  },
  {
    id: "search",
    title: "寻找号角",
    description:
      "沿着塌陷的桥身下去，找回遗落的军号。附近失散的信使也许还能听见。",
    healthCost: 2,
    reward: HERALD,
    aftermath:
      "号角穿过浓雾，远处传来回应。一名号令者循声赶到，带来了尚未散尽的消息。",
  },
  {
    id: "leave",
    title: "继续前行",
    description: "守住现有的力量。城门后的灯火，还在等你回来。",
    healthCost: 0,
    reward: undefined,
    aftermath: "你将最后一盏路灯扶正，独自越过断桥。圣焰尚在，前路未明。",
  },
];
