# roach_terrible

### 简介
Complement-Snake 是一款将经典玩法与硬核计算机底层科学原理深度融合的极客贪吃蛇游戏。它打破了传统贪吃蛇的线性成长规则，将蛇的食物判定与长短变化逻辑完全交由 2's Complement（补码）、位运算以及底层编码机制来接管。

### 结构
```
src/
├── engine/
│   ├── core/
│   │   ├── Grid.ts                  # class Grid
│   │   ├── Snake.ts                 # class Snake
│   │   ├── CollisionDetector.ts     # class CollisionDetector
│   │   ├── GameState.ts             # class GameState (状态机)
│   │   └── TickLoop.ts              # class TickLoop
│   │
│   ├── complement/
│   │   ├── Food.ts                  # class Food
│   │   ├── ComplementEngine.ts      # class ComplementEngine（核心运算）
│   │   ├── BitwiseUtils.ts          # class BitwiseUtils（静态工具类）
│   │   └── __tests__/
│   │       └── ComplementEngine.test.ts
│   │
│   ├── multiplayer/
│   │   ├── AuthoritativeWorld.ts    # class AuthoritativeWorld（Host权威世界，组合多个Snake）
│   │   ├── StateDiffer.ts           # class StateDiffer
│   │   ├── Reconciler.ts            # class Reconciler（Client端对账）
│   │   └── ViewportClipper.ts       # class ViewportClipper
│   │
│   └── GameEngine.ts                # class GameEngine（顶层门面，组合上述所有）
│
├── network/
│   ├── SupabaseClient.ts
│   ├── channels/
│   │   ├── RealtimeChannel.ts       # abstract class，基类
│   │   ├── RoomChannel.ts           # extends RealtimeChannel
│   │   ├── BroadcastChannel.ts      # extends RealtimeChannel
│   │   └── PresenceChannel.ts       # extends RealtimeChannel
│   ├── HostConnection.ts            # class HostConnection
│   └── ClientConnection.ts          # class ClientConnection
│
├── rendering/
│   ├── Renderer.ts                  # abstract class Renderer
│   ├── HostViewRenderer.ts          # extends Renderer
│   └── ClientViewRenderer.ts        # extends Renderer
```

### Sprint

# Complement-Snake · Sprint Planning

**架构方案**：方案A — Host 浏览器权威 + Supabase Realtime 传输层
**技术栈**：TS + React + Vite + TailwindCSS + Supabase + Canvas

---

## 前提假设（请按实际情况调整）

- Sprint 长度：1 周（如果是兼职/业余项目，建议按"理想小时数"而非自然周来排，可把每个 Sprint 当作一个里程碑块）
- 团队规模：1-2 人
- 阶段目标：先打透单机版核心玩法，再叠加多人骨架，最后做规模化与体验打磨
- 排期单位：每个 User Story 用 T恤尺码估算（S = 0.5天，M = 1天，L = 2-3天，XL = 需要拆分）
- **里程碑节点**：Sprint 3 结束 = 单机版可玩 Demo；Sprint 5 结束 = 多人版可玩 Demo（2-4人验证）；Sprint 7 结束 = 5-15人压测通过

---

## Roadmap 总览

| Sprint | 主题 | 产出 |
|---|---|---|
| Sprint 0 | 架构验证 Spike | 技术选型落地、Supabase 项目初始化、最小可行通信验证 |
| Sprint 1 | 单机核心引擎 | 网格世界、Canvas 渲染、移动与基础碰撞 |
| Sprint 2 | 补码/位运算玩法核心 | 食物判定、蛇长度变化逻辑、核心差异化机制 |
| Sprint 3 | 单机打磨 + 持久化 | 计分、排行榜（Supabase 表）、单机 Demo 完成 |
| Sprint 4 | 多人架构骨架 | Host/Client 角色拆分、Realtime channel、Presence 接入 |
| Sprint 5 | 权威循环与状态对账 | Tick loop、状态 diff 广播、Client 预测与 reconciliation |
| Sprint 6 | 视野与上帝视角 | 大地图边界扩展、Client 局部视野裁剪、Host 全局视角 UI |
| Sprint 7 | 规模化与韧性 | 5-15人压测、断线重连、Host 掉线降级策略 |
| Sprint 8 | 打磨与发布 | UI/UX 收尾、性能优化、部署上线 |

---

## Epic 拆解

- **EPIC-1**：单机游戏引擎（网格、渲染、输入、碰撞）
- **EPIC-2**：补码/位运算核心玩法（项目灵魂机制）
- **EPIC-3**：数据持久化与计分
- **EPIC-4**：多人通信架构（Host/Client + Supabase Realtime）
- **EPIC-5**：权威状态同步（tick loop、diff、reconciliation）
- **EPIC-6**：地图扩展与视野系统（上帝视角 + 局部视野）
- **EPIC-7**：规模化与容错（5-15人、断线、Host 切换）
- **EPIC-8**：UI/UX 与发布

---

## Sprint 0：架构验证 Spike

**目标**：在写正式功能代码前，验证关键技术假设是否成立，避免后期推翻架构。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S0-1 | 初始化 Vite + React + TS + Tailwind 项目骨架 | `npm run dev` 可启动，Tailwind 样式生效 | S |
| S0-2 | 创建 Supabase 项目，验证 Realtime Broadcast 最小通信 | 两个浏览器 Tab 之间能互相收发一条广播消息，延迟可观测 | M |
| S0-3 | 验证 Presence：模拟 Host + 2 Client 上下线 | Presence 列表能正确反映在线/离线状态变化 | S |
| S0-4 | Canvas 基础绘制 Spike：网格 + 单个方块渲染性能测试 | 在较大网格（如 100x100）下渲染帧率稳定在可接受范围 | M |

**Definition of Done**：技术风险点（通信延迟、Presence 可靠性、Canvas 性能）已有数据支撑，可以放心进入正式开发。

**风险点**：如果 Broadcast 延迟在弱网下表现差，需要提前考虑是否要做"输入缓冲"设计，影响 Sprint 5 的方案细节。

---

## Sprint 1：单机核心引擎（EPIC-1）

**目标**：跑通一个最朴素的单机贪吃蛇，不含补码玩法，验证渲染与操作手感。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S1-1 | 定义网格世界数据结构（坐标系、边界） | 提供 `GridState` 类型定义与边界碰撞工具函数 | S |
| S1-2 | Canvas 渲染蛇身、食物、网格背景 | 蛇与食物正确显示，刷新流畅无闪烁 | M |
| S1-3 | 键盘/触屏方向输入 | 支持方向键与移动端滑动手势，输入有节流防误触 | M |
| S1-4 | 游戏主循环（固定 tick，如 150ms/帧） | 蛇按 tick 稳定移动，不受帧率波动影响 | M |
| S1-5 | 基础碰撞判定（撞墙、撞自己） | 碰撞后正确触发游戏结束状态 | S |
| S1-6 | 游戏状态机（Idle / Playing / GameOver） | 状态切换正确，UI 随状态变化 | S |

**Definition of Done**：单机模式下，蛇可以正常移动、吃普通食物变长、撞墙/撞自己结束游戏。**此时还不含补码逻辑**，食物只是普通"+1变长"。

---

## Sprint 2：补码/位运算核心玩法（EPIC-2）⭐ 项目灵魂

**目标**：把"食物判定与长短变化逻辑交由 2's Complement 与位运算接管"这个核心卖点实现出来。这是最需要设计讨论的 Sprint，建议先用纸面/伪代码把规则定死，再写代码。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S2-1 | **设计文档**：补码食物机制规则定稿 | 输出一份规则说明：食物代表什么数值/编码？吃到后如何通过补码运算决定蛇变长/变短/反转方向等？建议先写 markdown 设计稿，团队对齐后再开发 | M |
| S2-2 | 食物生成逻辑：按规则生成带"数值载荷"的食物 | 食物对象携带数值（如一个 8-bit 有符号数），不同数值范围对应不同视觉样式 | M |
| S2-3 | 补码运算核心模块（纯函数，独立于游戏循环） | 编写可单元测试的 `applyComplementRule(snakeLength, foodValue): newLength` 等纯函数，覆盖正数/负数/溢出边界场景 | L |
| S2-4 | 吃食物后触发位运算结算并更新蛇身 | 吃到食物后，蛇的长度变化与运算结果一致，包括"负数=变短"等规则 | M |
| S2-5 | 边界/溢出情况的视觉与规则处理（如长度归零、溢出回绕） | 极端情况（如长度减到0、超过补码位宽）有明确且不崩溃的处理逻辑 | M |
| S2-6 | 单元测试覆盖核心运算模块 | 关键运算路径（正常、边界、溢出）均有测试用例 | S |

**Definition of Done**：这是整个游戏的差异化机制，建议在这个 Sprint 结束时做一次"规则可玩性验证"——哪怕没有美术，也要确认这套数值规则玩起来是有意思的，而不是纯粹的工程实现。

**建议**：S2-1 这个设计文档非常关键，值得单独开一次"设计会"过一遍规则，避免做到一半发现数值体验不平衡（比如负数食物太多导致游戏体验很挫败）。

---

## Sprint 3：单机打磨 + 持久化（EPIC-3）

**目标**：把单机版做成一个完整可发布的 Demo，并为后续多人版打基础（Supabase 表结构、账号体系雏形）。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S3-1 | Supabase 表设计：scores / players（为多人版预留字段） | 表结构包含未来多人需要的字段（room_id、player_id 等），避免后续大改 | M |
| S3-2 | 单机分数计算与结算 | 游戏结束后正确计算并展示分数 | S |
| S3-3 | 排行榜（写入/读取 Supabase） | 分数可写入数据库，排行榜页面可正确展示 Top N | M |
| S3-4 | 基础 UI/UX：开始页、游戏内 HUD、结束页 | 三个核心页面交互流畅，移动端适配良好 | M |
| S3-5 | 音效/视觉反馈（吃到正数食物 vs 负数食物的差异化反馈） | 玩家能直观感知"这次是好事还是坏事" | S |
| S3-6 | 单机版 Demo 自测与 Bug 修复 | 核心路径无阻断性 bug | M |

**Definition of Done**：✅ **里程碑：单机版 Demo 完成，可以独立发布/演示**。

---

## Sprint 4：多人架构骨架（EPIC-4）

**目标**：搭建 Host/Client 角色拆分的通信骨架，先不接游戏逻辑，只验证"指挥链路"通畅。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S4-1 | 房间（Room）概念设计：创建房间、加入房间（room code） | Host 可创建房间生成房间码，Client 可通过房间码加入 | M |
| S4-2 | Host 角色页面骨架（大屏幕视角） | Host 进入页面后展示房间码、已加入玩家列表（基于 Presence） | M |
| S4-3 | Client 角色页面骨架（手机视角） | Client 输入房间码加入后，能看到"已连接"状态 | M |
| S4-4 | Supabase Realtime channel 命名规范与连接管理 | 按 room_id 隔离 channel，避免跨房间消息串扰 | M |
| S4-5 | Client → Host 输入通道（仅传输方向指令，不含逻辑） | Client 发送方向输入，Host 端能正确接收并打印日志验证 | M |
| S4-6 | Host 断线检测（基于 Presence） | Host 离开后，Client 端能感知并展示"等待 Host"状态 | S |

**Definition of Done**：Host 与多个 Client 能建立稳定连接，输入能从 Client 传到 Host，但**游戏逻辑还未联动**。

**风险点**：这个 Sprint 要重点验证 Sprint 0 中关于 Realtime 在多人（先测 2-4人）场景下的稳定性，如果这里暴露问题，要在 Sprint 5 之前解决。

---

## Sprint 5：权威循环与状态对账（EPIC-5）⭐ 架构核心

**目标**：把 Sprint 1-2 的单机游戏逻辑搬到 Host 端作为权威循环，Client 端只做渲染+预测。这是整个多人架构里技术难度最高的 Sprint，建议预留缓冲。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S5-1 | Host 端权威 tick loop：维护全量多蛇世界状态 | Host 能同时管理多条蛇的位置、补码食物状态，每 tick 统一结算 | L |
| S5-2 | 多蛇碰撞判定（含同 tick 内的"谁先到"裁决规则） | 两条蛇同时进入同一格子时，有明确且一致的判定规则（如按 player_id 排序裁决），不会出现两端结果不一致 | L |
| S5-3 | 状态 Diff 计算与广播（只传变化量，不传全量） | 每 tick 广播的 payload 经过 diff 压缩，避免冗余传输 | M |
| S5-4 | Client 端订阅状态广播并渲染 | Client 收到 diff 后正确合并到本地状态并渲染 | M |
| S5-5 | Client 端预测性渲染（本地先走一步，再用 Host 状态纠正） | 操作有"跟手"的即时反馈，同时不会和 Host 权威状态长期偏离 | L |
| S5-6 | 全量快照机制（Client 加入/重连时拉取一次完整状态） | 新加入或重连的 Client 能正确同步到当前最新状态，而非等下一次 diff | M |
| S5-7 | 多人场景下补码玩法联调（确保 Sprint 2 的核心规则在多人下依然正确） | 多个玩家同时触发补码运算时，结算顺序与结果符合预期 | M |

**Definition of Done**：✅ **里程碑：2-4人可玩的多人 Demo**，Host 权威裁决一致，Client 操作有即时反馈。

**建议**：这个 Sprint 工作量大，如果时间紧张，可以先做"无预测、直接显示 Host 状态"的简化版（牺牲一点跟手感），把 S5-5 客户端预测挪到 Sprint 8 打磨阶段再做，先保证正确性。

---

## Sprint 6：地图扩展与视野系统（EPIC-6）

**目标**：实现"大屏幕上帝视角 + 客户端局部视野"的核心体验诉求。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S6-1 | 地图边界从固定小网格扩展为可配置大边界 | 支持配置更大的世界尺寸（如 200x200），性能仍可接受 | M |
| S6-2 | Host 端全局视角渲染（整张地图缩略展示所有玩家） | Host 屏幕能看到所有蛇的实时位置，类似"上帝视角"小地图或全图 | M |
| S6-3 | Client 端局部视野裁剪（围绕自己蛇头的可视区域） | Client 只渲染自己周围一定半径内的区域，性能优化明显 | M |
| S6-4 | （可选优化）Host 按需广播视野子集，而非全量状态 | 如果带宽成为瓶颈，Host 可以为每个 Client 计算并只发送其视野内的状态 | L |
| S6-5 | 视野边缘的平滑滚动/跟随相机 | Client 视角跟随蛇头移动时画面流畅不跳变 | M |

**Definition of Done**：Host 和 Client 的视觉体验差异化明确，符合"上帝视角 vs 局部视野"的产品设想。

**风险点**：S6-4 是性能优化项，建议先不做，等 Sprint 7 压测后如果发现带宽确实是瓶颈再回来做，避免过早优化。

---

## Sprint 7：规模化与容错（EPIC-7）

**目标**：从"2-4人能跑"推进到"5-15人稳定可玩"，并补齐容错机制。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S7-1 | 压测：模拟 15 个 Client 同时连接同一房间 | 记录消息延迟、丢包率、Host 端 CPU/渲染表现，输出压测报告 | L |
| S7-2 | 根据压测结果优化 tick 频率/payload 大小 | 找到延迟与流畅度的平衡点，必要时降低 tick 频率或精简广播字段 | M |
| S7-3 | Client 断线重连机制 | Client 网络波动后能自动重连并通过快照机制恢复状态 | M |
| S7-4 | Host 掉线降级策略 | 明确产品决策：Host 掉线后是"游戏暂停等待"还是"指定备用 Host 接管"，并实现对应逻辑 | L |
| S7-5 | 异常输入防护（基础层面，非强作弊对抗） | 过滤明显非法的方向指令（如同 tick 内反复横跳），避免 Host 端异常崩溃 | S |

**Definition of Done**：✅ **里程碑：5-15人场景压测通过**，有明确的断线/Host掉线应对策略文档。

---

## Sprint 8：打磨与发布（EPIC-8）

**目标**：收尾体验细节，准备对外发布。

| Story | 描述 | 验收标准 | 估时 |
|---|---|---|---|
| S8-1 | 整体 UI/UX 视觉打磨（配色、动效、补码玩法的视觉化呈现） | 界面风格统一，补码运算结果有清晰的视觉反馈语言 | L |
| S8-2 | 新手引导/规则说明页 | 新玩家能在不看说明书的情况下理解补码玩法核心规则 | M |
| S8-3 | 移动端适配最终检查（触屏操作、不同屏幕尺寸） | 主流移动设备上操作流畅、布局正常 | M |
| S8-4 | 性能最终优化与 bug bash | 无阻断性 bug，关键路径性能达标 | L |
| S8-5 | 部署上线（Vercel/Netlify + Supabase 生产环境） | 生产环境可访问，Supabase RLS 策略正确配置（防止未授权访问） | M |
| S8-6 | （如未在 S5 做）补充客户端预测优化 | Client 操作跟手感达到可接受水平 | M |

**Definition of Done**：✅ **正式发布版本上线**。

---

## 待办：架构决策待确认事项

以下问题需要在执行过程中明确，会影响具体 Sprint 的细节安排：

1. **使用场景**（线下聚会 vs 线上陌生人匹配）—— 决定是否需要在 Sprint 7-8 补充反作弊层，若是线上竞技场景，建议追加一个 EPIC 评估是否要把权威逻辑迁移至后端
2. **Host 掉线后的产品策略**（S7-4）—— 暂停等待 vs 备用 Host 接管，两者实现成本差异较大，建议提前拍板
3. **补码玩法的具体数值规则**（S2-1）—— 这是最需要提前对齐的设计细节，建议单独花时间打磨，不要等开发到一半才发现规则不好玩
