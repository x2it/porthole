import type { AppFingerprint } from '@shared/types'

/**
 * 已知应用指纹库 - 可扩展的数据驱动配置
 * 新增应用只需要 push 一个对象,无需改识别逻辑
 */
export const FINGERPRINTS: AppFingerprint[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    category: 'ai-local',
    homepage: 'https://ollama.com',
    defaultPorts: [11434],
    titleKeywords: ['ollama'],
    processKeywords: ['ollama'],
    faviconKeywords: ['ollama']
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    category: 'ai-local',
    homepage: 'https://lmstudio.ai',
    defaultPorts: [1234],
    titleKeywords: ['lm studio', 'lmstudio'],
    processKeywords: ['lm studio', 'lmstudio']
  },
  {
    id: 'jan',
    name: 'Jan',
    category: 'ai-local',
    homepage: 'https://jan.ai',
    defaultPorts: [1337, 3000],
    titleKeywords: ['jan'],
    processKeywords: ['jan']
  },
  {
    id: 'open-webui',
    name: 'Open WebUI',
    category: 'ai-local',
    homepage: 'https://openwebui.com',
    defaultPorts: [3000, 8080],
    titleKeywords: ['open webui', 'open-webui'],
    bodyKeywords: ['open-webui']
  },
  {
    id: 'jupyter',
    name: 'Jupyter Notebook',
    category: 'dev-tool',
    homepage: 'https://jupyter.org',
    defaultPorts: [8888],
    titleKeywords: ['jupyter', 'home page - select or create a notebook'],
    serverKeywords: ['tornado'],
    processKeywords: ['jupyter', 'ipython']
  },
  {
    id: 'gradio',
    name: 'Gradio App',
    category: 'ai-local',
    homepage: 'https://gradio.app',
    defaultPorts: [7860],
    titleKeywords: ['gradio'],
    bodyKeywords: ['gradio-app', 'gradio'],
    processKeywords: ['python']
  },
  {
    id: 'vite-dev',
    name: 'Vite Dev Server',
    category: 'dev-tool',
    homepage: 'https://vitejs.dev',
    defaultPorts: [5173],
    titleKeywords: ['vite', 'dev server'],
    bodyKeywords: ['@vite', '/@vite/']
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    category: 'dev-tool',
    homepage: 'https://fastapi.tiangolo.com',
    defaultPorts: [8000],
    titleKeywords: ['fastapi'],
    bodyKeywords: ['swagger', 'openapi']
  },
  {
    id: 'streamlit',
    name: 'Streamlit',
    category: 'dev-tool',
    homepage: 'https://streamlit.io',
    defaultPorts: [8501],
    titleKeywords: ['streamlit'],
    bodyKeywords: ['streamlit']
  },
  {
    id: 'comfyui',
    name: 'ComfyUI',
    category: 'ai-local',
    homepage: 'https://github.com/comfyanonymous/ComfyUI',
    defaultPorts: [8188],
    titleKeywords: ['comfyui'],
    processKeywords: ['comfyui', 'python']
  },
  {
    id: 'automatic1111',
    name: 'Stable Diffusion WebUI',
    category: 'ai-local',
    homepage: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
    defaultPorts: [7860],
    titleKeywords: ['stable diffusion'],
    processKeywords: ['webui', 'launch']
  },
  {
    id: 'librechat',
    name: 'LibreChat',
    category: 'ai-cloud',
    homepage: 'https://librechat.ai',
    defaultPorts: [3080],
    titleKeywords: ['librechat'],
    bodyKeywords: ['librechat']
  }
]
