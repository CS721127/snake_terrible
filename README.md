# Complement-Snake

Complement-Snake is a browser snake game that keeps the existing Canvas game
engine while moving the application shell to the requested Sprint Planning
architecture.

> **Proceed with caution.** An experimental, delightfully unpolished prototype born out of a questionable hackathon idea. It might be boring, it might break, but it’s open for exploration if you dare.

## Overview

This project started as an ambitious hackathon submission that quickly proved to be... well, a terrible idea. Rather than letting it rot in a local folder, we've opened the source code for anyone curious enough to poke around, reuse components, or salvage useful bits.

Expect bugs, rough edges, and minimal polish. You’ve been warned!

## Important Notices & Licensing

* **Use at Your Own Risk:** We provide this software strictly "as-is" without any warranties. We hold no responsibility or liability for how you use, run, or deploy this code.
* **Third-Party Branding & Assets:** Some components within this repository may contain third-party logos, assets, or proprietary branding. **Please ensure you have proper authorization or rights from the respective brand owners** before reusing or redistributing those specific components.
* **Open Exploration:** Feel free to fork, salvage, or adapt any original parts of this repository for your own projects!

---

## Architecture

Plan A: Host browser authority + Supabase Realtime transport layer.

Stack:

- TypeScript
- React
- Vite
- TailwindCSS
- Supabase Realtime
- Canvas

The Host browser owns the `GameEngine`, advances ticks, resolves collisions,
handles revival quizzes, and publishes render snapshots. Client browsers do not
run authoritative game logic; they render Host snapshots and send directional
input or start commands through the realtime transport.

Supabase is optional at runtime. Without `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`, the game stays fully playable as a local Host session.

## Local Development

```bash
npm install
npm run dev
```

The current dev server is usually available at `http://localhost:5173`. If that
port is occupied, Vite will choose the next free port.

## Supabase Realtime

Create a `.env.local` file when you want browser-to-browser transport:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then run `npm run dev`, open one browser as `HOST`, and open another as
`CLIENT` with the same room code.

## Gameplay Kept

- Arrow keys, WASD, and touch swipe input
- Canvas board rendering
- Difficulty presets: Easy, Medium, Hard
- Skin selector: Default, Classic, Neon
- Score, length in decimal/hex/binary, phase, and free revival HUD
- Seven-food pool
- Three free revivals per run
- Revival quiz after free revivals are exhausted
- Dark/light theme toggle

## Verification

```bash
npm run typecheck
npm run test
npm run build
```

