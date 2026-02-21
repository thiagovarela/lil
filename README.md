# lil

A minimal personal AI assistant built on [pi](https://github.com/badlogic/pi-mono)'s SDK, agent runtime, and extension system.

> **Where OpenClaw is a full-featured multi-channel assistant with 15+ integrations** —
> **lil starts with one thing done well**: a single, powerful agent session that reuses the entire pi ecosystem.

## Philosophy

lil is a thin wrapper around pi, not a replacement. Everything in the pi ecosystem works out of the box:

- Extensions from `~/.pi/agent/extensions/` and `.pi/extensions/`
- Skills from `~/.agents/skills/`, `~/.pi/agent/skills/`, and project `.pi/skills/`
- Prompt templates from `~/.pi/agent/prompts/`
- Context files (`AGENTS.md` walking up from cwd)
- `pi install` packages — just works

## Usage

```bash
# Interactive chat session (full pi TUI)
lil chat

# Send a message and get a response (non-interactive)
lil send "What files are in the current directory?"

# Shorthand — no subcommand needed
lil "Refactor this function to be async"

# Authenticate with your AI provider (uses pi's login dialog)
lil login

# Configuration
lil config show
lil config set model gpt-4o
lil config set provider openai
```

## Installation

Requires [Bun](https://bun.sh).

```bash
git clone https://github.com/thiagovarela/lil
cd lil
bun install
bun link          # installs `lil` globally via ~/.bun/bin/lil
```

Then just use `lil` from anywhere.

## Authentication

lil uses pi's `AuthStorage` at `~/.pi/agent/auth.json` — the same credentials as the `pi` CLI. You authenticate once and both tools share it.

Options:
- `lil login` — Opens pi's interactive login dialog (OAuth or API key)
- Environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, etc.

## Configuration

Config lives at `~/.lil/config.json` (permissions: `0600`).

| Key | Default | Description |
|-----|---------|-------------|
| `provider` | (from pi settings) | Provider name: `openai`, `anthropic`, `google` |
| `model` | (from pi settings) | Model ID: `gpt-4o`, `claude-opus-4-5`, etc. |
| `agentDir` | `~/.pi/agent` | Override pi's agent directory |
| `workspace` | `process.cwd()` | Agent's working directory |

## Security

lil ships with a built-in security extension that:

- **Blocks dangerous bash commands**: `rm -rf`, `sudo`, `curl | sh`, `eval`, network exfiltration patterns
- **Protects sensitive write paths**: `~/.ssh/`, `~/.aws/`, `~/.lil/`, `.env` files, system dirs
- **Blocks reads of credential files**: SSH keys, `.env`, `~/.lil/config.json`, AWS credentials
- **Redacts sensitive output**: PEM private keys, AWS access keys, OpenAI/Anthropic/GitHub tokens

See [docs/security.md](docs/security.md) for the full threat model.

## Development

```bash
# Run directly with Bun (no compile step)
bun run src/cli.ts chat
bun run src/cli.ts send "hello"

# Build single-file binary
bun run build

# Build all targets
bun run build:all
```

## Roadmap

- **Milestone 0** ✅ — Core agent loop, CLI (`send`, `chat`, `login`), security extension, `bun link` global install
- **Milestone 1** — Telegram channel (long polling, allowlist, daemon mode)
- **Milestone 2** — Memory & persistent context
- **Milestone 3** — More channels (WhatsApp, Signal, Discord)

See [docs/plan.md](docs/plan.md) for the full plan.
