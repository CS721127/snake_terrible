# roach_terrible

### 简介
Complement-Snake 是一款将经典玩法与硬核计算机底层科学原理深度融合的极客贪吃蛇游戏。它打破了传统贪吃蛇的线性成长规则，将蛇的食物判定与长短变化逻辑完全交由 2's Complement（补码）、位运算以及底层编码机制来接管。

### 结构
```
complement-snake/
├── public/
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── routes/                      # 页面路由
│   │   ├── HomePage.tsx
│   │   ├── SinglePlayerPage.tsx
│   │   ├── HostPage.tsx             # 大屏幕「上帝视角」
│   │   ├── ClientPage.tsx           # 手机端
│   │   └── LeaderboardPage.tsx
│   │
│   ├── engine/                      # 游戏引擎核心（纯逻辑，不依赖React/Canvas）
│   │   ├── core/
│   │   │   ├── grid.ts              # 网格世界、边界工具
│   │   │   ├── snake.ts             # 蛇身数据结构与移动
│   │   │   ├── collision.ts         # 碰撞判定（含多蛇互撞裁决）
│   │   │   ├── gameState.ts         # 状态机（Idle/Playing/GameOver）
│   │   │   └── tickLoop.ts          # 主循环
│   │   │
│   │   ├── complement/              # ⭐ 补码/位运算核心玩法（独立可测）
│   │   │   ├── food.ts              # 食物生成与数值载荷
│   │   │   ├── complementRules.ts   # 2's Complement 运算规则
│   │   │   ├── bitwise.ts           # 位运算工具函数
│   │   │   └── __tests__/
│   │   │       └── complementRules.test.ts
│   │   │
│   │   └── multiplayer/             # 多人权威逻辑（仅Host端运行）
│   │       ├── authoritativeLoop.ts # Host tick loop，全量世界状态
│   │       ├── stateDiff.ts         # 状态diff计算
│   │       ├── reconciliation.ts    # Client预测与对账
│   │       └── viewportClip.ts      # 视野裁剪
│   │
│   ├── network/                     # Supabase Realtime 通信层
│   │   ├── supabaseClient.ts
│   │   ├── channels/
│   │   │   ├── roomChannel.ts       # 房间创建/加入
│   │   │   ├── broadcastChannel.ts  # 状态/输入广播
│   │   │   └── presenceChannel.ts   # 在线状态感知
│   │   ├── hooks/
│   │   │   ├── useHostConnection.ts
│   │   │   ├── useClientConnection.ts
│   │   │   └── usePresence.ts
│   │   └── types.ts                 # 网络消息类型定义
│   │
│   ├── rendering/                   # Canvas渲染层（与逻辑解耦）
│   │   ├── CanvasRenderer.tsx
│   │   ├── drawGrid.ts
│   │   ├── drawSnake.ts
│   │   ├── drawFood.ts
│   │   ├── hostView/
│   │   │   └── drawFullMap.ts       # 全局小地图/全图绘制
│   │   └── clientView/
│   │       ├── drawViewport.ts      # 局部视野裁剪绘制
│   │       └── cameraFollow.ts      # 跟随相机
│   │
│   ├── components/                  # 通用UI组件
│   │   ├── HUD/
│   │   │   ├── ScoreBoard.tsx
│   │   │   └── PlayerList.tsx
│   │   ├── RoomCodeDisplay.tsx
│   │   ├── DirectionControls.tsx    # 移动端触屏方向控制
│   │   └── ConnectionStatus.tsx     # 断线/重连提示
│   │
│   ├── hooks/
│   │   ├── useGameLoop.ts
│   │   ├── useKeyboardInput.ts
│   │   └── useTouchInput.ts
│   │
│   ├── store/                       # 状态管理（zustand/jotai等）
│   │   ├── gameStore.ts
│   │   ├── networkStore.ts
│   │   └── playerStore.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── schema.sql           # scores/players/rooms 表结构
│   │   │   └── rls-policies.sql     # 行级安全策略
│   │   └── utils/
│   │       ├── id.ts                # room code / player id 生成
│   │       └── throttle.ts
│   │
│   ├── types/
│   │   ├── game.types.ts
│   │   ├── network.types.ts
│   │   └── supabase.types.ts        # Supabase自动生成类型
│   │
│   └── config/
│       ├── constants.ts             # tick间隔、网格尺寸等
│       └── env.ts
│
├── supabase/
│   ├── migrations/
│   └── config.toml
│
├── tests/
│   └── e2e/                         # 多端同步场景测试
│
├── .env.example
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```
