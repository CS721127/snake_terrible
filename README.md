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
