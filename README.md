# Porthole

A geek-style desktop tool to discover, identify, and manage local Web UI services (Ollama, LM Studio, ComfyUI, Jupyter, etc.).

## Features

- **Discover**: Scan 30+ common ports with concurrent HTTP probing
- **Identify**: Fingerprint engine recognizes 12+ AI/dev apps out of the box
- **Manage**: Open in browser, kill process, view PID and confidence
- **UI**: Dark-first, flat, mono-typed, keyboard-driven (press `R` to scan)

## Tech Stack

- Electron 31 + electron-vite + electron-builder (portable)
- React 18 + TypeScript + Tailwind CSS 3
- Zero-runtime CSS variables for dual theme (dark default, follows system)

## Project Structure

```
src/
├── shared/types.ts              # Shared data models
├── main/                        # Electron main process
│   ├── modules/
│   │   ├── scanner/             # Port scan + HTTP probe
│   │   ├── recognizer/          # Fingerprint engine + data
│   │   └── process/             # Port → PID → process name
│   └── ipc/                     # Pluggable IPC handlers
├── preload/                     # Secure context bridge
└── renderer/                    # React UI
    └── src/
        ├── components/          # AppCard
        ├── features/dashboard/  # Dashboard + category config
        ├── hooks/               # useDiscoveredApps
        └── styles/              # Design tokens + components
```

## Getting Started

```bash
npm install
npm run dev      # Development with HMR
npm run dist     # Build portable .exe for Windows
```

## Usage

1. Launch the app
2. Press `R` (or click `scan`) to scan local ports
3. Click any card to open the Web UI in your default browser
4. Hover a card to reveal `open ↗` / `kill` actions

## License

MIT
