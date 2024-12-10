import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd() + '/env', '')
  return {
    plugins: [vue(), vueJsx()],
    envDir: './env',
    base: env.VITE_BASE_URL,
    resolve: {
    }
  }
})
