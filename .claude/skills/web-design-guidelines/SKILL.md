---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Vercel's Web Interface Guidelines.

Vendored from github.com/vercel-labs/agent-skills + github.com/vercel-labs/web-interface-guidelines (MIT).
The rules live in `rules.md` next to this file (a pinned local copy — do NOT fetch them from the network).
To update, re-download `command.md` from the upstream repo, review it, and replace `rules.md`.

## How It Works

1. Read `rules.md` in this skill's directory
2. Read the specified files (or ask the user which files/pattern to review)
3. Check against all rules
4. Output findings in the terse `file:line` format described in `rules.md`

## Project notes (CG Educacional)

- UI copy is **pt-BR**. Skip English-only copy rules ("Title Case" headings/buttons, `&` over "and"); in Portuguese, headings/buttons use sentence case.
- Quotes in pt-BR copy: curly `“ ”` are fine; don't flag them either way in code strings.
- Use shadcn/ui components in `components/ui/` — flag reinvented primitives rather than suggesting new ones.
