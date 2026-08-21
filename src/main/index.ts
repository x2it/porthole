import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * 解析渲染进程入口路径
 * - dev:   http://localhost:xxxx (由 ELECTRON_RENDERER_URL 注入)
 * - prod:  resources/app/out/renderer/index.html
 *          基于 app.getAppPath() 拼装,避免 __dirname 依赖层级
 */
function resolveRendererEntry(): { url?: string; file?: string } {
  if (process.env['ELECTRON_RENDERER_URL']) {
    return { url: process.env['ELECTRON_RENDERER_URL'] }
  }
  return { file: join(app.getAppPath(), 'out/renderer/index.html') }
}

/**
 * 解析 preload 入口路径
 * - dev:   out/main/index.js 与 out/preload/index.js 相邻
 * - prod:  resources/app/out/preload/index.js
 */
function resolvePreloadPath(): string {
  return join(app.getAppPath(), 'out/preload/index.js')
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Porthole',
    backgroundColor: '#0a0a0b',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: resolvePreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const entry = resolveRendererEntry()
  if (entry.url) {
    mainWindow.loadURL(entry.url)
  } else if (entry.file) {
    mainWindow.loadFile(entry.file)
  }
}

app.whenReady().then(() => {
  // 创建默认 fingerprints.json(如果不存在)
  const userDataPath = app.getPath('userData')
  const fingerprintsFile = join(userDataPath, 'fingerprints.json')
  if (!existsSync(fingerprintsFile)) {
    const defaultFingerprints = [
      {
        id: 'example',
        name: 'Example App',
        category: 'dev-tool',
        defaultPorts: [3000],
        titleKeywords: ['example'],
        processKeywords: ['example']
      }
    ]
    try {
      mkdirSync(userDataPath, { recursive: true })
      writeFileSync(fingerprintsFile, JSON.stringify(defaultFingerprints, null, 2), 'utf-8')
      console.log(`[porthole] created default fingerprints.json at ${fingerprintsFile}`)
    } catch (e) {
      console.warn('[porthole] failed to create default fingerprints:', e)
    }
  }

  // 注册 IPC handlers
  registerIpcHandlers(getMainWindow)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { Channels }
