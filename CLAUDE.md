# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ATP Rank — a Next.js 16 app (App Router) built with TypeScript, Tailwind CSS v4, and React 19. Package manager is **Bun**.

## Commands

```bash
bun dev          # Start dev server (localhost:3000)
bun run build    # Production build
bun run start    # Start production server
bun run lint     # ESLint (v9, next core-web-vitals + typescript configs)
```

## Architecture

- **App Router** with server components by default — all routes live under `app/`
- **Tailwind v4** configured via `@theme inline` in `app/globals.css` (no tailwind.config file)
- CSS variables (`--background`, `--foreground`) handle light/dark theming via `prefers-color-scheme`
- Fonts: Geist Sans and Geist Mono loaded through `next/font/google` in `app/layout.tsx`
- Path alias: `@/*` maps to project root

## Git

- Remote uses SSH host alias `github-personal` (not `github.com`) for the personal GitHub account
