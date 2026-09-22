# Grey Knight — 灰骑士

北京理工大学大二 web 开发小学期作业

> 一款基于原生 HTML5 / CSS3 / JavaScript ES Modules 的卡牌对战 RPG 游戏。
> 故事驱动的分支叙事 × 回合制卡牌战斗 × 多结局 Roguelike 冒险。

---

## 项目简介

《Grey Knight》以中世纪奇幻为背景，玩家扮演骑士 **阿尔德里克**，奉命前往东部剿匪。在行军途中，你逐渐发现匪患背后是领主贪腐的真相，最终面临效忠领主还是守护人民的终极抉择。

游戏采用 **Run-based Roguelike** 结构：每次冒险从第一章开始，穿越战场、营地、商店、锻炉、精英战和剧情决斗，根据关键节点的选择走向四种不同结局。核心玩法为 **回合制卡牌对拼**——在 5 列棋盘上部署单位，与敌方对拼，击溃敌方英雄即可获胜。战斗中包含先手、入场效果、领域机制、遗物、誓约、成长等深度策略要素。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 页面结构 | HTML5 |
| 样式 | CSS3（自定义主题变量） |
| 逻辑 | 原生 JavaScript ES Modules |
| 数据持久化 | `localStorage`（账号、进度、图鉴、成就、过往冒险记录） |
| 音频 | Web Audio API（程序化生成音效） |
| 随机数 | Mulberry32 种子随机（保证重现性） |
| 构建 | 无打包工具，纯静态部署 |

**不使用 React、Vue 或任何前端框架。**

---

## 项目结构

```
Grey Knight/
├── index.html                   # 首页入口
├── login.html                   # 登录页
├── register.html                # 注册页
│
├── css/                         # 全局样式
│   ├── theme.css                # 主题色彩变量
│   ├── base.css                 # 基础重置
│   ├── journey.css              # 剧情 / 结算 / 地图样式
│   └── ...
│
├── js/                          # 全局页面控制器
│   ├── auth.js                  # 登录 / 注册
│   ├── story.js / story2.js     # 剧情页
│   ├── settlement.js            # 战斗结算
│   ├── map.js                   # 剧情地图
│   ├── cards.js                 # 图鉴
│   ├── arsenal.js               # 装备 / 遗物 / 誓约
│   ├── records.js               # 历史冒险记录
│   └── components/
│       └── site-header.js       # 公共导航栏组件
│
├── game/                        # 游戏核心
│   ├── entry.js                 # 页面路由入口
│   ├── session.js               # 会话管理 + RunState + 结算推进
│   ├── kv.js                    # localStorage 封装
│   ├── main.js                  # 战斗入口
│   ├── achievements.js          # 成就检测逻辑
│   ├── types.d.ts               # TypeScript 类型定义
│   │
│   ├── content/                 # 游戏数据
│   │   ├── cards.js             # 卡牌数据（玩家 + 敌方 + 仪式阶段 + 生成池）
│   │   ├── map.js               # 章节节点 + 剧情文本 + MAP_ROUTES + 结局定义
│   │   ├── player.js            # 玩家英雄 + 初始牌组
│   │   ├── card-icons.js        # 卡牌 SVG 图标
│   │   ├── achievements.js      # 成就定义
│   │   └── equipment.js         # 遗物（RELICS）+ 誓约（OATHS）定义
│   │
│   ├── game/                    # 战斗引擎
│   │   ├── battle.js            # 战斗状态机（回合 / 出牌 / 伤害 / AI / 领域 / 仪式）
│   │   ├── duel.js              # 单位对拼 + 先手逻辑
│   │   ├── card-piles.js        # 抽牌与手牌管理
│   │   ├── player.js            # 英雄血量 / 治疗 / 受伤
│   │   ├── random.js            # Mulberry32 种子随机数生成器
│   │   └── rules.js             # 常量（能量上限 / 手牌上限 / 列数）
│   │
│   ├── encounters/              # 敌方遭遇
│   │   └── battlefield.js       # 各章节敌方配置、AI 波次、领域效果
│   │
│   ├── pages/                   # 页面控制器
│   │   └── battle-page.js       # 战斗页面（跳过战斗 / 章节推进 / 事件动画）
│   │
│   ├── ui/                      # 战斗 UI 渲染
│   │   ├── battle-view.js       # 事件驱动视图控制器
│   │   ├── battle-board.js      # 战场单位 + 敌方行动预览
│   │   ├── battle-hud.js        # 血条 / 回合 / 牌库 / 章节横幅
│   │   ├── battle-hand.js       # 手牌交互
│   │   ├── battle-input.js      # 玩家输入处理
│   │   ├── battle-animations.js # 战斗动画
│   │   ├── combat-motion.js     # 战斗动作动画
│   │   ├── card-motion.js       # 卡牌动作动画
│   │   ├── card-view.js         # 卡牌渲染
│   │   ├── card-rules.js        # 卡牌规则文字生成
│   │   ├── card-tooltip.js      # 卡牌悬浮提示
│   │   ├── card-icons.js        # 卡牌图标渲染
│   │   ├── enemy-deck.js        # 敌方牌库展示
│   │   ├── fx.js                # 特效
│   │   └── utils.js             # UI 工具函数
│   │
│   ├── audio/                   # 音频系统
│   │   ├── audio.js             # Web Audio API 音效管理器
│   │   └── recipes.js           # 程序化音效配方（出牌 / 战斗 / 击杀等）
│   │
│   └── styles/                  # 战斗样式
│       ├── cards.css            # 卡面样式
│       ├── hand.css             # 手牌样式
│       └── ...
│
├── assets/imgs/                 # 静态图片资源
└── team/                        # 团队介绍页
```

---

## 游戏功能

### 账号系统
- 注册 / 登录（`localStorage` 明文存储，仅用于课程演示）
- 多账号切换，进度独立保存
- 每个账号可保留多次冒险记录（pastRuns）

### 分支叙事与多结局

游戏采用线性关卡 + 关键节点选择的结构，共 7 个主线章节和若干支线节点：

```
node-1（东部剿匪）
  → road-1（粮道伏兵）
    → shop-1 / camp-1
      → node-2（边境蛮族）
        → elite-1（无面钟庭）
          → forge-1 / road-event
            → node-3（深海海怪·首领战）
              → road-2（雾中炮兽）
                → node-4（叛逃骑士·剧情决斗）
                  → camp-2 / shop-2
                    → node-5（流民庙宇·道德抉择）
                      → road-3（密信截击）
                        → elite-2（沉梦堡垒）
                          → forge-2 / camp-3
                            → node-6（老管家·幕后黑手）
                              → node-7（暴君领主·隐藏终章）
```

**四种结局**：

| 结局 | 达成条件 |
|------|----------|
| **正义结局**：新的守护者 | 反抗暴君 + 保留骑士证人 + 保护庙宇 → 攻入宫殿获胜 |
| **普通结局**：未竟的誓言 | 选择继续效忠领主 |
| **普通结局**：孤证难鸣 | 选择反抗但未满足进入宫殿的条件 |
| **悲剧结局**：灰烬中的誓言 | 宫殿终战落败 |
| **旅程结束**：长夜未尽 | 在任意章节战斗中失败 |

### 节点类型

| 类型 | 说明 |
|------|------|
| `battle` | 标准战斗节点 |
| `elite` | 精英战，胜利后获得遗物 |
| `duel` | 剧情决斗（node-4），双方不会被杀死，6 轮后进入抉择 |
| `peaceful` | 和平节点（node-5），敌方不攻击，可直接离开 |
| `camp` | 营地，恢复生命 |
| `shop` | 商店，使用灰烬购买 / 升级卡牌 |
| `forge` | 锻炉，升级 / 移除卡牌 |
| `event` | 随机事件 |

### 卡牌战斗核心机制

- **5 列棋盘**：双方在 5 列上部署单位，同列对拼
- **能量系统**：每回合能量回满至 3，出牌消耗能量
- **征调 / 军令 / 推进**：每回合可使用一次免费行动（征调士兵、军令击杀、推进战线）
- **入场效果**：抽牌、回能、治疗英雄、伤害英雄
- **先手机制**：拥有 `firstStrike` 关键词的单位优先攻击，独占先手时敌单位不反击
- **溢出伤害**：对拼中击杀单位的多余伤害穿透到英雄
- **仪式系统**：三个阶段的圣力仪式，完成后获得强大增益
- **成长系统**：单位在战斗中可积累成长值，永久提升攻击力

### 领域机制

精英战和 Boss 战拥有独特的领域效果：

- **轮转钟庭**（elite-1）：每两轮敌方全体向右轮转一格
- **梦中壁垒**（elite-2）：每两轮敌方沉睡单位获得护甲

### 敌方 AI
- 敌方意图提前公开（攻击 / 召唤 / 领域），玩家可据此决策
- 每回合按章节配置召唤单位
- 优先堵住玩家有单位的列

### 遗物系统
- 精英战胜利后获得一个遗物
- 遗物提供全冒险的被动加成（免费征调、抽牌、移除护甲等）

### 誓约系统
- 第三章结束后选择一项誓约，获得特殊能力
- 焚身誓约、晨钟誓约、篡命誓约

### 战斗结算与奖励
- 战后剧情展示 + 关键抉择
- 可选 3 张奖励卡牌之一（10 灰烬可重掷一次）
- 灰烬货币奖励
- 精英战额外遗物奖励
- 敌方图鉴批量解锁
- 成就实时检测

### 成就系统
- **战斗成就**：初战告捷、无伤之战、身经百战等
- **剧情成就**：仁者之心、真相追寻者、掘墓人、守护无辜等
- **结局成就**：正义的代价、守誓者、灰烬中的誓言等
- **收集成就**：图鉴收集进度相关

### 图鉴系统
- 收集已遭遇的玩家卡牌与敌方卡牌
- 章节结算后统一解锁
- 搜索、筛选与规则查阅

### 剧情地图
- 可视化节点路线，支持多阶段解锁
- 当前节点高亮，已通过节点绿色，未解锁节点灰色
- 路线由 `MAP_ROUTES` 和 `MAP_STAGES` 显式声明

### 历史记录
- 可查看过往冒险记录（路线、结局、关键选择）
- 支持开始新的冒险（旧冒险自动归档）

### 音效
- Web Audio API 程序化生成，无需音频文件
- 涵盖选择、出牌、拒绝、抽牌、战斗、击杀、英雄受伤、胜利等音效
- 支持静音切换

---

## 快速开始

1. 将项目部署到任意静态服务器（如 VS Code Live Server、Nginx、Apache）
2. 浏览器打开 `index.html`
3. 注册账号 → 登录 → 开始游戏

> 注意：项目使用 ES Modules 和绝对路径（`/css/...`、`/game/...`），需通过 HTTP 服务访问，不能直接双击 HTML 文件打开。

---

## 开发规范

### 页面路由约定

页面通过 `game/entry.js` 动态导入模块，路由表位于 `game/session.js`：

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
  "/game/records": "../js/records.js",
  "/game/arsenal": "../js/arsenal.js",
  "/game/rules": null,
};
```

新增页面时需确认：HTML 路径、`GAME_PAGES` 注册、加载 `/game/entry.js`、URL 参数中的 `node`，以及是否需要登录 session。

### RunState 冒险状态

冒险状态通过 `game/kv.js` 读写，profile 结构：

```js
{
  run: {
    seed, deck, health, maxHealth, ashes, relics, oath,
    choices: { bandit, barbarians, knight, temple, lord },
    rewards: { "node-1": "surrendered-bandit" },
    progress: { current, available, unlocked, completed },
    pendingBattle, battle, ending, records
  },
  codex: ["player:scout", "enemy:bandit-grunt"],
  achievements: { unlocked: [...], progress: {...} },
  pastRuns: [...],
  endings: [...]
}
```

核心函数：`getRun()` 获取当前冒险，`recordBattleResult()` 记录战斗结果，`settleChapter()` 处理剧情抉择，`chooseBattleReward()` 选牌，`finishSettlement()` 推进章节。

### 剧情节点开发

节点定义在 `game/content/map.js`，结构：

```js
{
  id: "node-1",
  chapter: 1,
  label: "东部剿匪",
  title: "奉命出征",
  kind: "battle",        // battle | elite | duel | peaceful | camp | shop | forge | event
  x: 15, y: 72,
  location: "东部山区 · 黑石岭",
  seal: "匪",
  story: [...],          // 三段战前剧情
  aftermath: [...],      // 战后文本
  choices: [...],        // 分支选项
}
```

路线由 `MAP_ROUTES` 显式声明边，`MAP_STAGES` 控制分阶段解锁。不要用数组顺序推断连通关系。

```js
export const MAP_ROUTES = [
  ["node-1", "road-1"],
  ["road-1", "shop-1"],
  ["road-1", "camp-1"],
  // ...
];
```

节点状态：`current`（高亮）→ `completed`（绿色）→ `available`（可进入）→ `locked`（灰色不可点击）。

### 战斗遭遇开发

敌方配置在 `game/encounters/battlefield.js` 的 `CHAPTERS` 对象中，按节点 ID 索引：

```js
"node-1": {
  hero: { glyph: "匪", name: "匪首头目", nameEn: "Bandit Chief" },
  maxHealth: 10,
  opening: ["bandit-grunt"],          // 开场单位
  waves: [["raiding-party"], [...]],  // 按回合召唤
  reinforcements: [...],              // 循环增援（可选）
  interval: 2,                        // 增援间隔
  mode: "battle",                     // battle | duel | peaceful
  domain: "rotation",                 // 领域效果（可选）
  rule: "教程：援军有限...",           // 战斗提示
  victory: { title: "东部暂宁", flavor: [...] },
}
```

不要修改通用战斗逻辑（`game/game/battle.js`），除非明确要改核心规则。

### 卡牌开发规范

卡牌定义在 `game/content/cards.js`，使用工厂函数：

```js
// 单位卡
card("card-id", "卡牌名", "A", cost, attack, health, "iconKey", {
  keyword: "firstStrike",
  onDeploy: [{ kind: "draw", count: 1 }],
  text: "入场：抽 1 张牌。",
});

// 行动卡
actionCard("card-id", "卡牌名", cost, "tactic", { kind: "damage", count: 2 }, "效果描述");
```

新增卡牌需同步加入 `PLAYER_CARDS` 或 `GENERATABLE_CARDS`。剧情奖励牌放入 `CHAPTER_REWARDS`，不进入随机生成池。

新增效果时必须同步修改：`game/types.d.ts`、`game/ui/card-rules.js`、`game/game/battle.js`。只改卡牌文案不会产生实际战斗效果。

### 图鉴规则

- 初次打开图鉴时自动解锁初始牌组
- 章节结算后批量解锁该章敌方卡牌 + 玩家获得的奖励牌
- 解锁记录写入 profile 的 `codex`
- 不要在敌方单位召唤时实时写入图鉴，保持"结算后统一解锁"的规则

### 结算页注意事项

`js/settlement.js` 根据 `nodeId` 动态替换战后剧情、奖励卡牌、选项文案、敌方解锁列表。无卡牌选项使用 `rewardId: null`，处理时用可选链 `reward?.id ?? null`。

### 账号与本地存储

统一通过 `game/kv.js` 读写，不要直接操作 `localStorage`：

```js
import { getProfile, setProfile } from "../game/kv.js";
```

存储键：`grey-knight:profile:<用户名>`、`grey-knight:session`、`grey-knight:account:<用户名>`。当前为明文 localStorage，仅适用于课程演示。

### 新增章节推荐流程

1. 在 `cards.js` 添加本章新卡牌和敌方卡牌
2. 在 `map.js` 添加节点、剧情文本、结局文本
3. 在 `MAP_ROUTES` 和 `MAP_STAGES` 增加路线
4. 在 `battlefield.js` 的 `CHAPTERS` 实现敌方波次
5. 在 `session.js` 确认章节推进逻辑
6. 在 `settlement.js` 增加战后剧情和选项
7. 设置敌方图鉴解锁列表和奖励卡牌
8. 手动验证：剧情、战斗、结算、地图、图鉴

### 开发注意事项

- 先读 `map.js`、`session.js`、`battlefield.js`、`battle-page.js`、`main.js` 再改章节流程
- 始终使用 `MAP_ROUTES` 声明路线，不要用数组顺序推断
- 不要删除用户已有的 profile 字段
- 改动战斗核心前先确认是否只是遭遇配置问题
- 新增能力必须同时实现数据、类型、规则文本和战斗结算
- 当前无自动化测试，验证主要依赖编辑器错误检查和人工点击
- 账号密码为明文 localStorage，仅适用于课程演示

---

## 页面一览

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `index.html` | 游戏入口 |
| 登录 | `login.html` | 账号登录 |
| 注册 | `register.html` | 账号注册 |
| 剧情 | `game/story.html` / `game/story2.html` | 章节开场剧情 |
| 事件 | `game/event.html` / `game/event2.html` | 营地 / 商店 / 锻炉 / 事件 |
| 战斗 | `game/battle.html` | 卡牌对战 |
| 结算 | `game/settlement.html` | 战后剧情与奖励 |
| 地图 | `game/map.html` | 章节路线地图 |
| 图鉴 | `game/cards.html` | 卡牌收集与查阅 |
| 装备 | `game/arsenal.html` | 遗物 / 誓约一览 |
| 记录 | `game/records.html` | 历史冒险记录 |
| 规则 | `game/rules.html` | 操作说明 |
| 团队 | `team/index.html` | 开发团队介绍 |