# NEXUS Launcher

Prism-style Minecraft launcher (Electron + React + TypeScript + Tailwind).

## Start

```bash
cd nexus-launcher
npm install
npm run dev
```

First launch creates a local launcher account. The first registered user is **admin**.

Put your Entra public-client Application ID into `config.json` → `clientId`. See `einrichtung.txt`.

## Build installer

```bash
npm run dist
```

Windows NSIS installer is written to `release/`.
