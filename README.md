# Complement-Snake

将 2's Complement（补码）与位运算融入贪吃蛇玩法的极客游戏。

当前完成度：**Sprint 1 —— 单机核心引擎（EPIC-1）**。本阶段跑通最朴素的单机贪吃蛇，**不含任何补码玩法**，食物只是普通"+1 变长"，目标是验证渲染与操作手感。

## 本地运行

```bash
npm install
npm run dev      # 启动开发服务器，默认 http://localhost:5173
```

```bash
npm run test      # 运行单元测试（vitest）
npm run typecheck # 仅做类型检查
npm run build     # 生产构建
```

## 操作方式

- 方向键 / WASD 控制移动
- 移动端：在画面上滑动手指控制移动方向
- `Space`：在 IDLE / GAME_OVER 状态下开始新一局

## Sprint 1 验收对照

| Story | 描述 | 对应实现 | 状态 |
| --- | --- | --- | --- |
| S1-1 | 网格世界数据结构（坐标系、边界） | `engine/core/types.ts`（`Cell`/`Direction`/`GridConfig`）、`engine/core/Grid.ts`（边界判定、随机空格） | ✅ |
| S1-2 | Canvas 渲染蛇身、食物、网格背景 | `rendering/Renderer.ts`（抽象基类，统一 DPR 处理与生命周期）、`rendering/CanvasRenderer.ts`（具体绘制逻辑） | ✅ |
| S1-3 | 键盘/触屏方向输入，节流防误触 | `engine/core/InputController.ts`（键盘 + touch 滑动手势，内置节流） | ✅ |
| S1-4 | 游戏主循环（固定 tick，150ms/帧） | `engine/core/TickLoop.ts`（固定时间步 + 累积器模式，渲染与逻辑帧解耦） | ✅ |
| S1-5 | 基础碰撞判定（撞墙、撞自己） | `engine/core/CollisionDetector.ts` | ✅ |
| S1-6 | 游戏状态机（Idle / Playing / GameOver） | `engine/core/GameState.ts`（表驱动的合法迁移校验 + 订阅机制） | ✅ |

顶层门面 `engine/GameEngine.ts` 把以上模块组合成一个简单的 `start()` / `dispose()` 接口，`src/main.ts` 是唯一的 UI 绑定代码（HUD、开始/结束遮罩层）。

### Definition of Done 自检

- [x] 蛇可以正常移动（固定 150ms tick，不受帧率波动影响）
- [x] 吃到普通食物 `+1` 变长（`SimpleFood`，无补码逻辑）
- [x] 撞墙 / 撞自己后正确进入 `GAME_OVER` 状态并停止循环
- [x] 状态切换正确，UI（HUD、遮罩层）随状态联动

## 关于补码玩法（Sprint 2 预告）

按 DoD 要求，本阶段刻意只实现"+1 变长"的占位食物逻辑（`engine/core/SimpleFood.ts`），避免提前引入补码运算，使两个 Sprint 的关注点保持分离。目录结构中 `engine/complement/` 已预留好 `Food.ts` / `ComplementEngine.ts` / `BitwiseUtils.ts` 的位置，是 Sprint 2 的工作范围。

## 关于测试

`src/engine/**/__tests__/*.test.ts` 覆盖了 Grid、Snake、CollisionDetector、GameState、TickLoop、InputController 以及顶层 GameEngine 的集成行为。本仓库交付时所在的沙盒环境无法访问 npm 公网 registry，因此测试断言均已通过手算/独立脚本逐一验证空间推理的正确性，并用 Node 22 原生 TypeScript 执行能力对核心规则文件（Grid/Snake/CollisionDetector/GameState）做了真实运行验证；请在你本地有网络的环境下执行 `npm install && npm run test` 做最终确认。
