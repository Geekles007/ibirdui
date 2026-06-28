# ibirdui — Launch week communication

> Drafts for next week's posts about the additions of 24→28 June 2026.
> Language: English. Lead angle: **AI-native / MCP**.
> Links: repo https://github.com/Geekles007/ibirdui · site https://ui.ibird.dev · npm `ibirdui`, `ibirdui-mcp`.

---

## 🧵 X / Twitter (thread)

**1/**
I spent 5 days turning my React component registry into something an AI can actually build with.

Not "here's a snippet" — an MCP server that hands Claude/Cursor the **real source** of state-complete, accessible components.

Here's what shipped 👇

**2/**
The problem: ask an LLM for "a users list with loading, empty and error states" and it hallucinates markup. Looks right, subtly wrong, zero a11y.

ibirdui's components already encode every one of those states. So I exposed them over MCP.

**3/**
`ibirdui-mcp` gives an assistant 3 tools:
• `search_components` — rank the catalog by what you're building
• `get_component` — the real source + props + a11y notes
• `list_components` — filter by async state (loading/empty/error…)

It reads the actual code, then writes with it.

**4/**
One line to add it:

```
claude mcp add ibirdui -- npx -y ibirdui-mcp
```

Then: *"use ibirdui to build a save button with a loading state"* → it pulls `async-button`'s real source and composes with it. No guessing.

**5/**
Also shipped this week:
• Layers 7–9 → realtime (streaming/presence/optimistic), overlays (menu/popover/tooltip/stepper), utility hooks
• 46 components, layers 0→9 complete
• `ibirdui doctor` — health-check your installed components
• a live, interactive playground in the docs

**6/**
The thesis (shadcn's ownership idea, taken further): you own the code **and** every component handles loading → empty → error → success + ships an axe a11y test.

The happy path is the only part you write.

**7/**
Open source, MIT, on npm.

```
npx ibirdui add async-button
```

Repo + live docs 👇
https://github.com/Geekles007/ibirdui

Feedback very welcome — especially on the MCP tool design.

#React #TypeScript #MCP

---

## 💼 LinkedIn

**Most AI coding assistants build UI by guessing.**

Ask one for "a list with loading, empty and error states" and you get plausible markup that's subtly wrong — and almost never accessible. The model has no idea what's actually in your component library.

This week I shipped something to fix that for my open-source React library, **ibirdui**.

🤖 **An MCP server (`ibirdui-mcp`)** that hands AI assistants the *real* source of state-complete components — not a description, the actual code. Claude, Cursor, or any MCP client can now:

• search the catalog by what you're building
• pull a component's real source, props and accessibility notes
• filter by async state (loading / empty / error / optimistic / offline)

One line to connect it:
`claude mcp add ibirdui -- npx -y ibirdui-mcp`

The bigger idea: ibirdui builds on shadcn's principle — you own the code, it's copied into your repo. But every component also handles the full async lifecycle (loading → empty → error → success) and ships a verified axe accessibility test. The "happy path" is the only part you write.

**Also shipped in the last 5 days:**
✅ 46 components across 10 layers (0→9) — realtime, overlays, forms, hooks
✅ `ibirdui doctor` — a read-only health check for your installed components
✅ `ibirdui upgrade` — edit-safe updates that never clobber your local changes
✅ A live, interactive playground on the docs site

Open source, MIT, on npm → https://github.com/Geekles007/ibirdui

Curious what people think about giving LLMs real, verified components to compose with — instead of letting them hallucinate UI.

#React #TypeScript #WebDevelopment #AI #OpenSource

---

## 👽 Reddit

**Best fit: r/reactjs.** Also works (lightly reworded) in r/webdev (Showoff Saturday), r/SideProject, and r/ClaudeAI or r/mcp for the AI crowd.

**Title:**
> I built an MCP server that gives AI assistants the *real* source of state-complete React components (instead of letting them hallucinate UI)

**Body:**

**TL;DR:** ibirdui is a shadcn-style React registry (you own the code) where every component handles loading/empty/error/success and ships an axe a11y test. This week I added an MCP server so AI assistants build with the *real* components instead of guessing. Open source.

I kept hitting the same wall with AI coding: ask for "a users list with loading, empty and error states" and you get markup that looks right but is subtly wrong and not accessible. The model has no idea what's actually in your library.

So over the last 5 days I shipped:

**`ibirdui-mcp` (Model Context Protocol server)** — three tools for an assistant:
- `search_components` — rank the catalog against a plain-language need
- `get_component` — the actual source, props and a11y guarantees of one component
- `list_components` — filter by async state (loading/empty/error/optimistic/offline)

Add it in one line:
```
claude mcp add ibirdui -- npx -y ibirdui-mcp
```
Then *"use ibirdui to build a save button with a loading state"* pulls the real `async-button` source and composes with it.

**Also new this week:**
- Layers 7–9: realtime (streaming list, presence, optimistic toggle, offline banner), overlays (dropdown menu, popover, tooltip, accordion, stepper), utility hooks (debounce, intersection, clipboard, media-query, poll)
- 46 components total across layers 0→9
- `ibirdui doctor` — read-only health check (flags components you've edited locally or that have updates available)
- `ibirdui upgrade` — edit-safe 3-way updates (keeps your edits, writes the new version alongside to merge)
- live, interactive previews on the docs site

**The thesis** (shadcn's ownership idea, taken further): you own the code *and* it's state-complete + accessibility-tested out of the box.

Repo + live docs: https://github.com/Geekles007/ibirdui
Install a component: `npx ibirdui add async-button`

It's a solo open-source project and I'd genuinely love feedback — especially on the MCP tool design: are search/get/list the right primitives? What would *you* want an assistant to be able to query?

---

## 📅 Suggested rollout

| Day | Platform | Why |
| --- | --- | --- |
| **Tue AM** | LinkedIn | Tue–Thu mornings = best B2B reach |
| **Wed** | X thread | Midweek dev-Twitter activity; pin tweet 1 |
| **Thu** | Reddit (r/reactjs) | Avoid Mon/Fri; reply actively in the first 2h |

## 🎬 Assets to capture before posting

- **(money shot)** 10–15s screen capture of the MCP in action inside Claude — *"build a loading button"* → it pulls `async-button`'s real source.
- A GIF of the live playground (dropdown-menu or stepper "try it") from `/components`.
- The colored `ibirdui doctor` terminal output from the `/tools` page.

> Note: each subreddit has self-promo rules — post as a participant, lead with the problem (not the link), and disclose it's your project.
