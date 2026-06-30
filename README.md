# Ocelescope instance template

A starter monorepo for running your own [Ocelescope](https://www.ocelescope.org)
instance **and** developing your own modules — built on the published packages.

It combines a **pnpm workspace** (frontend) and a **uv workspace** (backend):

```
.
├── app/                     # the Next.js frontend app
├── frontend-modules/        # your custom frontend modules (pnpm packages)
│   └── example/
├── backend-modules/         # your custom backend modules (Python packages)
│   └── example/
├── pnpm-workspace.yaml      # frontend workspace: app + frontend-modules/*
├── pyproject.toml           # uv workspace + the backend instance
├── package.json             # root scripts
├── .env.example             # backend config
└── .npmrc                   # auto-install-peers=true
```

- The **backend host** is the published `ocelescope-backend` package. The uv
  workspace's root project depends on it, on published modules
  (`ocelescope-module-filter`), and on your local backend modules under
  `backend-modules/*`. The host discovers every module automatically via the
  `ocelescope_backend.modules` entry point — installing them is enough.
- The **frontend app** (`app/`) depends on the published `@ocelescope/*`
  packages and on your local frontend modules (via `workspace:*`). Modules are
  registered in `app/ocelescope.config.ts`.
- A bundled **example module** (frontend + backend) shows the full wiring,
  including a typed API client: the frontend route calls its backend module's
  `/hello` endpoint via a react-query hook generated with orval. Rename or copy
  it to build your own.

> The **Ocelot** module is published from its own repository, so it is omitted
> here. Comments in `pyproject.toml` and `app/ocelescope.config.ts` show how to
> add it once available.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python ≥ 3.11)
- [pnpm](https://pnpm.io/) ≥ 8 and Node ≥ 20

## Getting started

```bash
cp .env.example .env                 # backend config (optional)
cp app/.env.example app/.env.local   # frontend config (optional)

pnpm run sync                        # set up backend + frontend (see below)
pnpm run dev                         # run the whole app
```

`pnpm run dev` starts the backend on <http://localhost:8000> and the frontend on
<http://localhost:3000>.

### Scripts

| Script | What it does |
| --- | --- |
| `pnpm run sync` | Full setup: `sync:backend` then `sync:frontend`. |
| `pnpm run sync:backend` | `uv sync` — installs the host + published + local backend modules. |
| `pnpm run sync:frontend` | `pnpm install` + `build:modules`. |
| `pnpm run build:modules` | Builds each local frontend module (regenerates its API client first). |
| `pnpm run dev` | Runs `dev:backend` and `dev:app` together. |
| `pnpm run dev:backend` | `ocelescope-backend serve` with reload watching `backend-modules/`. |
| `pnpm run dev:app` | `next dev` for the frontend app. |
| `pnpm run dev:modules` | Watch-rebuild local frontend modules (run alongside `dev` while editing them). |

> `build:modules` runs each module's `build`, which regenerates its API client
> from the backend's OpenAPI schema (`uv run ocelescope-backend openapi
> --module <name>` → orval). `sync` runs `sync:backend` first so that command is
> available. The generated `openapi.json` and `src/api/` are git-ignored.
>
> `pnpm run dev` backgrounds the backend with `&`; stop it with `pnpm run
> dev:backend` / `dev:app` in separate terminals if you prefer independent
> control. When actively editing a local frontend module, also run
> `pnpm run dev:modules`.

## Adding a module

**Frontend** — copy `frontend-modules/example` to a new folder, rename it in its
`package.json`, then in `app/`:
1. add it to `dependencies` (`"@instance/your-module": "workspace:*"`),
2. import and register it in `app/ocelescope.config.ts`,
3. add it to `transpilePackages` in `app/next.config.ts`,
4. import its `styles.css` in `app/pages/_app.tsx` if it ships one.

**Backend** — copy `backend-modules/example`, rename the package and its entry
point in `pyproject.toml`, then add it to the root `pyproject.toml`
(`dependencies` + a `[tool.uv.sources]` `{ workspace = true }` entry) and run
`uv sync`.

A frontend module and its backend module are a pair. The example shows how to
call your backend from the frontend:

- `backend-modules/example/.../routes.py` defines `GET /hello` (with a typed
  `HelloResponse` and a stable `operation_id`).
- `frontend-modules/example/orval.config.ts` uses `defineConfig` from
  `@ocelescope/api-config`; `src/lib/fetcher.ts` re-exports `customFetch` from
  `@ocelescope/api-client` (so requests share session handling).
- `pnpm run build:modules` dumps the backend's OpenAPI schema and runs orval to
  generate `src/api/example.ts`, giving you the typed `useHello` hook used in
  `src/routes/Hello.tsx`.

## Styles

The `@ocelescope/*` packages ship only their own (scoped) component styles and
do **not** bundle their dependencies' global CSS. So the app imports the
third-party stylesheets itself, in order, in `app/pages/_app.tsx` — Mantine's
core stylesheet first, the rest after, and each `@ocelescope/*/styles.css`
**last** so its overrides win. The packages that provide those stylesheets
(`@mantine/*`, `mantine-datatable`, `@xyflow/react`) are therefore listed in
`app/package.json`. Each module's README documents the stylesheets it needs.

## A note on peer dependencies

You do **not** need to list every peer (React Query, `@mantine/hooks`, etc.).
The `@ocelescope/*` packages declare them as `peerDependencies`, and pnpm
installs missing peers automatically (`auto-install-peers`, default since pnpm
v8; set explicitly in `.npmrc`). The app only declares what it imports directly
— `react`/`next`, plus the packages whose **CSS** it imports (see *Styles*) so
their versions are pinned.

## Versions

Packages are pinned to the `0.1.x` line; bump the ranges as new versions are
published. The published packages must exist on PyPI / npm for install to
succeed.
