import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // 关键：确保相对路径，这样部署到 EdgeOne 或任何子目录都能跑
  base: './', 
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 自动更新 Service Worker
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '魔法喫茶店',
        short_name: 'Cafe Planner',
        description: '我的治愈系喫茶店店日程管理',
        theme_color: '#FCE4EC',
        background_color: '#FCE4EC',
        display: 'standalone', // 关键：PWA 沉浸式模式（无地址栏）
        icons: [
          {
            src: 'pwa-192x192.png', // 记得在 public 放这个图
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // 记得在 public 放这个图
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true, // 每次打包前清空目录
  }
});