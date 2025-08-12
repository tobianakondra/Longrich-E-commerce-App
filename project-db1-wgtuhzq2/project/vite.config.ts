import { defineConfig, loadEnv, ConfigEnv, UserConfig, Plugin, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import JavaScriptObfuscator from 'javascript-obfuscator';

// Créer un plugin d'obfuscation
function createObfuscatorPlugin(): Plugin {
  return {
    name: 'js-obfuscator',
    enforce: 'post',
    apply: 'build',
    generateBundle(_, bundle: any): void {
      // Obfusquer uniquement les fichiers JS principaux, pas les bibliothèques
      for (const fileName in bundle) {
        if (fileName.endsWith('.js') && !fileName.includes('vendor') && !fileName.includes('polyfill')) {
          const chunk = bundle[fileName];
          if ('code' in chunk) {
            console.log(`Obfuscating: ${fileName}`);
            chunk.code = JavaScriptObfuscator.obfuscate(chunk.code, {
              compact: true,
              controlFlowFlattening: true,
              controlFlowFlatteningThreshold: 0.7,
              deadCodeInjection: true,
              debugProtection: true,
              deadCodeInjectionThreshold: 0.4,
              disableConsoleOutput: true,
              identifierNamesGenerator: 'hexadecimal',
              numbersToExpressions: true,
              renameGlobals: false,
              splitStrings: true,
              stringArray: true,
              stringArrayEncoding: ['base64'],
              stringArrayThreshold: 0.8,
              selfDefending: true,
              transformObjectKeys: true,
              unicodeEscapeSequence: true
            }).getObfuscatedCode();
          }
        }
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // Charger les variables d'environnement basées sur le mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Déterminer si nous sommes en mode production
  const isProd = mode === 'production';
  
  // Configurer les plugins
  const plugins: (Plugin | PluginOption)[] = [react()];
  if (isProd) {
    plugins.push(createObfuscatorPlugin());
  }
  
  return {
    plugins,
    define: {
      // Rendre les variables d'environnement disponibles globalement
      'process.env': env
    },
    build: {
      sourcemap: false,
      minify: false,
      rollupOptions: {
        output: {
          compact: true,
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          }
        }
      },
      // Améliorer les performances de chargement
      cssCodeSplit: true,
      cssMinify: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000, // Augmenter la limite d'avertissement
      target: 'es2018', // Cibler des navigateurs plus récents pour un code plus compact
      modulePreload: {
        polyfill: true
      }
    },
    // Optimiser le serveur de développement
    server: {
      hmr: true,
      open: true,
      host: true
    }
  };
});
