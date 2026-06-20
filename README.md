# roach_terrible

### 简介
Complement-Snake 是一款将经典玩法与硬核计算机底层科学原理深度融合的极客贪吃蛇游戏。它打破了传统贪吃蛇的线性成长规则，将蛇的食物判定与长短变化逻辑完全交由 2's Complement（补码）、位运算以及底层编码机制来接管。

### 结构
```
complement-snake/
├── src/
│   ├── components/           # 视图层：React UI 组件
│   │   ├── CanvasBoard.tsx   # 游戏渲染器：接收网格数据，执行底层方块填充与清空 
│   │   ├── TerminalUI.tsx    # 极客交互面板：利用 Tailwind 渲染 1 (STDOUT) 和 2 (STDERR) 输出 [cite: 51]
│   │   └── TaskList.tsx      # 打卡桥接：左侧的每日待办事项面板 [cite: 48]
│   │
│   ├── hooks/                # 逻辑层：游戏引擎与本地计算节点
│   │   ├── useGameLoop.ts    # 核心心跳：封装 setInterval 驱动坐标计算、撞墙/自咬判定 
│   │   └── useInputBuffer.ts # 硬核微操：监听 WASD 键盘输入，维护指令队列防自咬 
│   │
│   ├── lib/                  # 服务层：外部依赖与 API
│   │   └── supabase.ts       # Supabase Client：基础环境连通与初始化 
│   │
│   ├── types/                # 类型层：TypeScript 严格类型接口
│   │   └── index.ts          # 类型声明复用：定义 snakeBody, isDead 等数据包结构 
│   │
│   ├── App.tsx               # 顶层容器：统筹左侧任务、中央游戏、底部终端的三屏布局 [cite: 48]
│   ├── main.tsx              # React 应用挂载入口
│   └── index.css             # 全局样式与 TailwindCSS 核心指令引入 
│
├── public/                   # 静态资源 (音效、Favicon 等)
├── index.html                # Vite 的原生 HTML 入口文件
├── tailwind.config.js        # Tailwind 极客皮肤配置文件 
├── vite.config.ts            # Vite 极速构建驱动配置 
├── tsconfig.json             # TypeScript 编译规则配置
└── package.json              # 核心依赖清单 (React, Supabase-js, Tailwind 等)
```
