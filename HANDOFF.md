# Grey Knight 交接说明

这是一份给后续开发者（包括 Trae）的项目交接文档。项目是一个原生静态网页卡牌 RPG，不使用 React、Vue 或打包构建工具。

## 1. 项目技术栈

- HTML5
- CSS3
- 原生 JavaScript ES Modules
- `localStorage` 保存账号、进度、奖励和图鉴
- CSS 与 JS 通过绝对路径 `/css/...`、`/game/...`、`/js/...` 引用
- 当前环境未配置 Node.js、浏览器自动化或构建脚本，修改后主要依靠 VS Code 错误检查和静态阅读验证

不要引入前端框架，除非明确决定重构整个项目。

## 2. 关键目录

### 页面

- `index.html`：首页
- `login.html` / `register.html`：账号登录注册
- `game/story.html`：第一章固定开场剧情
- `game/story2.html`：节点剧情页面，依据 URL 参数读取节点
- `game/event.html` / `game/event2.html`：旧事件页和节点事件页
- `game/battle.html`：战斗页面
- `game/settlement.html`：战斗结算、战后剧情和奖励选项
- `game/map.html`：剧情地图
- `game/cards.html`：图鉴

### 章节与卡牌数据

- `game/content/map.js`：章节节点、剧情文本、节点选项和 `MAP_ROUTES`
- `game/content/cards.js`：玩家卡牌、敌方卡牌、章节卡牌分组
- `game/content/player.js`：玩家英雄和初始牌组
- `game/content/card-icons.js`：卡牌 SVG 图标
- `game/content/road-event.js`：旧版第一章事件页数据，当前正式第一章主要流程不应继续依赖它

### 战斗

- `game/main.js`：战斗入口，根据 `node` 参数创建玩家和遭遇
- `game/encounters/battle 1.js`：当前所有章节遭遇的实现
- `game/game/battle.js`：战斗状态机、回合、出牌、伤害和敌方行动
- `game/game/duel.js`：单位对拼顺序和先手逻辑
- `game/game/card-piles.js`：抽牌和手牌，不再使用弃牌堆回收
- `game/pages/battle-page.js`：战斗页面控制器、跳过战斗和章节推进
- `game/ui/battle-hud.js`：英雄血条、回合、牌库数量和章节横幅
- `game/ui/battle-board.js`：战场单位和敌方行动预览
- `game/ui/card-view.js`：将卡牌数据渲染到卡牌模板
- `game/ui/card-rules.js`：生成入场、先手等卡牌规则文字

### 样式

- `css/journey.css`：剧情页、结算页、地图样式
- `game/styles/cards.css`：战斗卡面样式
- `game/styles/hand.css`：手牌样式
- `game/battle.css`：战斗页面样式组合入口

## 3. 页面路由约定

页面通过 `game/entry.js` 根据路径动态导入模块，路由表位于 `game/session.js`：

```js
export const GAME_PAGES = {
  "/game/story": "../js/story.js",
  "/game/story2": "../js/story2.js",
  "/game/event": "../js/event.js",
  "/game/event2": "../js/event2.js",
  "/game/battle": "./main.js",
  "/game/map": "../js/map.js",
  "/game/settlement": "../js/settlement.js",
  "/game/cards": "../js/cards.js",
};
```

新增页面时必须同时确认：

1. HTML 页面路径
2. `GAME_PAGES` 是否注册
3. 页面是否加载 `/game/entry.js`
4. URL 参数是否携带 `node`
5. 是否需要登录 session

## 4. 当前剧情路线

### 第一章

- `node-1`
- 东疆剿匪，心生疑云
- 第一章结算时分流：
  - 选项一：查账线，进入 `node-2`
  - 选项二：叛徒线，进入 `rebel-2`

### 查账线

```text
node-1
  -> node-2 第二章（查账线）
  -> node-3 第三章（查账线）
  -> node-4 第四章（查账线）
  -> node-6 第六章（查账线）
```

### 叛徒线

```text
node-1
  -> rebel-2 第二章（叛徒线）
  -> rebel-3 第三章（叛徒线，占位）
  -> rebel-4 第四章（叛徒线，占位）
  -> rebel-5 第五章（叛徒线，占位）
```

地图连接不要根据 `MAP_NODES` 数组顺序自动推断。必须使用 `MAP_ROUTES` 显式声明边，否则两条分支会互相串线。

## 5. 分支与进度规则

账号 profile 通过 `game/kv.js` 读写：

```text
grey-knight:profile:<用户名>
```

profile 主要字段：

```js
{
  branch: "audit" | "traitor",
  progress: {
    current: "node-2",
    unlocked: ["node-1", "node-2"]
  },
  rewards: {
    "node-1": "castle-arbalist"
  },
  codex: ["player:scout", "enemy:bandit-grunt"],
  evidenceHidden: {
    "node-4": true
  }
}
```

重要规则：

- 第一章选项决定 `profile.branch`
- 重新回到第一章可以重新选择分支
- 重新选择分支时，进度应重置到新分支第二章起点
- 图鉴解锁和已经获得的卡牌可以保留，用于二周目
- 不要让查账线和叛徒线共用同一组后续节点 ID
- 查账线节点的 `branch` 目前分别是 `audit`、`audit-chapter-3`、`audit-chapter-4`，读取时需要按查账线家族匹配，而不是简单字符串全等

## 6. 战斗遭遇规则

当前所有章节暂时集中在 `game/encounters/battle 1.js` 的 `AbyssFront` 类中，通过构造参数区分：

```js
new AbyssFront(seed, {
  firstChapter: nodeId === "node-1",
  secondChapter: nodeId === "node-2",
  thirdChapter: nodeId === "node-3",
  fourthChapter: nodeId === "node-4",
  sixthChapter: nodeId === "node-6",
  rebelSecondChapter: nodeId === "rebel-2",
});
```

当前已实现：

- 第一章：匪首头目，10 生命；开场 1 匪徒杂兵；第 1 回合 2 匪徒杂兵；第 2 回合匪首副手
- 查账线第二章：私兵团，15 生命；开场 2 公爵私兵；第 1 回合 1 私兵队长
- 查账线第三章：北疆军营，20 生命；开场 2 守卫；第 1 回合 2 守卫；第 2 回合北境守将
- 查账线第四章：护卫团，20 生命；开场 4 护卫；第 1 回合旧管家
- 查账线第六章：匪团，25 生命；开场 3 匪徒杂兵；第 1 回合 3 匪徒杂兵；第 2 回合老管家
- 叛徒线第二章：蛮族战团，15 生命；开场 1 蛮族战熊；第 1 回合 2 蛮族勇士

不要修改以下通用战斗逻辑，除非明确要改核心规则：

- 敌方行动预览
- 空位选择
- 被玩家占据列的优先级
- 无空位时不出牌
- 回合状态机
- 玩家结束回合流程
- 跳过战斗流程

如果章节数量继续增加，建议把每章遭遇拆成独立文件，而不是继续堆叠更多布尔字段。

## 7. 卡牌开发规范

新增玩家卡牌：

1. 在 `game/content/cards.js` 中定义
2. 加入对应章节卡牌数组
3. 加入 `PLAYER_CARDS`
4. 如果可作为奖励，确保结算脚本使用正确的 card id
5. 如需图标，使用已有 `CARD_ICONS`；没有图标时先选择语义相近的图标，不要在数据里写不存在的图标 key

卡牌结构示例：

```js
card("example-card", "示例卡", CARD_ICONS.scout, 2, 3, 2, {
  keyword: "firstStrike",
  onDeploy: [{ count: 1, kind: "damageHero" }],
});
```

当前战斗实际支持的效果主要是：

- `draw`
- `energy`
- `damageHero`
- `healHero`
- `firstStrike`

类型中虽曾加入过部分扩展效果，例如护甲、全体增益、召唤和随机增益，但 `game/game/battle.js` 当前并未完整实现这些效果。新增效果时必须同时修改：

- `game/types.d.ts`
- `game/ui/card-rules.js`
- `game/game/battle.js`
- 必要时修改 UI 动画和事件类型

只修改卡牌文案不会自动产生实际战斗效果。

## 8. 图鉴规则

图鉴脚本为 `js/cards.js`。

解锁规则：

- 初次打开图鉴时，当前账号自动拥有我方初始三张牌：斥候、步兵、弩手
- 章节结算选择后，批量解锁该章节战斗中遇到的敌方卡牌
- 同时解锁当前选择获得的玩家卡牌
- 解锁记录写入当前账号 profile 的 `codex`
- 不要在敌方单位召唤时实时写入图鉴，否则会破坏“章节结算后统一解锁”的规则

图鉴显示的是已解锁卡牌，不是全部数据卡牌。

## 9. 结算页注意事项

`js/settlement.js` 根据 `nodeId` 动态替换：

- 战后剧情
- 奖励卡牌
- 选项文案
- 敌方卡牌解锁列表
- 证据状态
- 分支与进度

无卡牌选项使用：

```js
data-reward="none"
```

处理无卡奖励时不要访问 `reward.id`，应使用：

```js
reward?.id ?? null
```

第一章分支切换时：

- 覆盖 `profile.branch`
- 将进度设置为 `node-1 + 新分支第二章`
- 保留图鉴和已获得卡牌

普通章节结算时：

- 保留之前路线的 `unlocked`
- 追加下一节点
- 不要只保存“第一章 + 当前节点”，否则此前通过章节会变灰

## 10. 地图规范

地图脚本为 `js/map.js`，节点数据为 `game/content/map.js`。

路线必须显式维护：

```js
export const MAP_ROUTES = [
  ["node-1", "node-2"],
  ["node-1", "rebel-2"],
  ["node-2", "node-3"],
];
```

节点状态：

- `current`：当前节点，高亮
- `passed`：已通过，绿色
- `locked`：未解锁，灰暗且不可点击

新增分支时必须同时更新：

1. `MAP_NODES`
2. `MAP_ROUTES`
3. `BattlePage.#nextNodeId()`
4. 第一章或前置章节结算中的分支选择
5. 地图 profile 解锁逻辑
6. 战斗入口遭遇参数

## 11. 账号与本地存储

不要直接写裸的全局键：

```js
localStorage.setItem("grey-knight:codex", ...)
```

账号相关数据应使用：

```js
import { getProfile, setProfile } from "../game/kv.js";
```

登录 session：

```text
grey-knight:session
```

账号密码：

```text
grey-knight:account:<用户名>
```

当前实现是前端演示用明文 localStorage，不具备真实安全性，不要将其当成生产认证系统。

## 12. 推荐开发流程

每次新增章节建议按以下顺序：

1. 在 `cards.js` 添加本章新增卡牌和敌方卡牌
2. 在 `map.js` 添加节点和剧情文本
3. 在 `MAP_ROUTES` 增加路线
4. 在 `story2.js` 确认剧情结束按钮进入战斗
5. 在 `main.js` 增加章节遭遇参数
6. 在 `battle 1.js` 或新的遭遇文件实现敌方波次
7. 在 `battle-hud.js` 增加章节横幅
8. 在 `settlement.js` 增加战后剧情和选项
9. 设置章节敌方图鉴解锁列表
10. 设置奖励卡牌和 profile 保存
11. 运行 VS Code 错误检查
12. 手动验证：剧情、跳过、战斗、结算、地图、图鉴、账号切换

## 13. 当前已知问题与技术债

- `game/encounters/battle 1.js` 已承载多章遭遇，复杂度正在上升，后续应按章节拆文件。
- `game/main.js` 目前通过 `nodeId === ...` 判断章节，新增节点时容易遗漏。
- `game/content/map.js` 中仍有部分早期占位剧情和占位选项，应逐章替换。
- 叛徒线后续章节目前只有节点和占位剧情，战斗使用独立节点 ID 的框架已接通但内容未完成。
- `ROAD_CHOICES` 和旧版 `event.html` 仍存在，新增剧情不应继续依赖旧事件流程。
- 跳过战斗会直接推进节点，不会执行正常战斗过程；如果设计要求跳过也解锁图鉴，需要额外在结算逻辑中处理。
- 当前没有 Node.js、自动化浏览器或单元测试，验证主要依赖编辑器错误检查和人工点击。
- 账号密码为明文 localStorage，仅适用于课程演示。

## 14. 交接原则

- 先读 `map.js`、`settlement.js`、`battle-page.js`、`main.js` 再改章节流程。
- 不要用数组顺序推断地图路线，始终使用 `MAP_ROUTES`。
- 不要删除用户已有的 profile 字段。
- 不要把分支奖励、图鉴解锁和地图进度混用。
- 改动战斗核心前先确认是否只是章节遭遇配置问题。
- 新增能力必须同时实现数据、类型、规则文本和战斗结算。
- 修改后至少检查所有受影响文件的 VS Code 错误。
