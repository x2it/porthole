/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 中性灰阶 - 深色优先,通过 CSS 变量切换浅色
        bg: {
          base: 'rgb(var(--bg-base) / <alpha-value>)',
          muted: 'rgb(var(--bg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--bg-subtle) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)'
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
          faint: 'rgb(var(--border-faint) / <alpha-value>)'
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          faint: 'rgb(var(--text-faint) / <alpha-value>)'
        },
        // 状态色 - 仅用于状态指示,不做装饰
        status: {
          ok: 'rgb(var(--status-ok) / <alpha-value>)',
          warn: 'rgb(var(--status-warn) / <alpha-value>)',
          err: 'rgb(var(--status-err) / <alpha-value>)',
          info: 'rgb(var(--status-info) / <alpha-value>)'
        },
        // 强调色 - 极克制,仅用于关键操作焦点
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          muted: 'rgb(var(--accent-muted) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'SF Mono', 'Menlo', 'Consolas', 'Courier New', 'monospace']
      },
      borderRadius: {
        card: '8px',
        btn: '5px',
        tag: '3px'
      },
      fontSize: {
        '2xs': ['11px', '16px']
      },
      spacing: {
        4.5: '18px'
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
}
