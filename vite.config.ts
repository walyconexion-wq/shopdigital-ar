import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { 
    port: 3000 
  },
  build: {
    // Raise warning threshold to 800kB to avoid noise; real fix is manualChunks below
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Vendor core (React, router, Lucide) ─────────────────────────
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          // ── Firebase ─────────────────────────────────────────────────────
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase';
          }
          // ── Enterprise, Admin panels & Management (merged to avoid circular deps) ──────
          if (
            id.includes('/pages/Enterprise') ||
            id.includes('/pages/Factory') ||
            id.includes('/firebase_enterprise') ||
            id.includes('AdminPanelPage') ||
            id.includes('MasterPanelPage') ||
            id.includes('AmbassadorPanelPage') ||
            id.includes('AmbassadorRecruitment') ||
            id.includes('AcademyPage') ||
            id.includes('ShopMasterPanelPage') ||
            id.includes('MarketingPanelPage') ||
            id.includes('ManagementPage') ||
            id.includes('BillingManagement') ||
            id.includes('InvoiceViewer') ||
            id.includes('SurveyForm') ||
            id.includes('SurveyManagement') ||
            id.includes('OfferForm') ||
            id.includes('OfferManagement')
          ) {
            return 'chunk-admin';
          }
          // ── Búnkers de comando ───────────────────────────────────────────
          if (id.includes('BunkerPage') || id.includes('bunker-waly') || id.includes('BroadcastPage')) {
            return 'chunk-bunkers';
          }
          // ── Credenciales y cliente VIP ───────────────────────────────────
          if (
            id.includes('ClientCredential') ||
            id.includes('ClientVipCredential') ||
            id.includes('ClientSubscription') ||
            id.includes('ClientValidation') ||
            id.includes('ClientLanding') ||
            id.includes('ClientsDatabase') ||
            id.includes('ClientOffers')
          ) {
            return 'chunk-client-flow';
          }
          // ── Resto de páginas de soporte — Rollup las asigna automáticamente
          // (No aplicamos catch-all en /pages/ para evitar ciclos circulares)
        },
      },
    },
  },
})