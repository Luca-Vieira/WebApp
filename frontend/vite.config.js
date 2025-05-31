// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Configure esta linha:
  base: '/', // Substitua <NOME_DO_REPOSITORIO> pelo nome real do seu repositório
})