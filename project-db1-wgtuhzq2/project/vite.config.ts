import { defineConfig, loadEnv, ConfigEnv, UserConfig, Plugin, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import JavaScriptObfuscator from 'javascript-obfuscator';

// Créer un plugin d'obfuscation optimisé
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
            const fileSizeKB = chunk.code.length / 1024;
            console.log(`Obfuscating: ${fileName} (${fileSizeKB.toFixed(2)} KB)`);
            
            // Utiliser des options moins agressives pour les gros fichiers
            const isLargeFile = fileSizeKB > 500; // Plus de 500KB
            
            try {
              chunk.code = JavaScriptObfuscator.obfuscate(chunk.code, {
                compact: true,
                // Options réduites pour les gros fichiers
                controlFlowFlattening: !isLargeFile,
                controlFlowFlatteningThreshold: isLargeFile ? 0.3 : 0.5,
                deadCodeInjection: !isLargeFile,
                deadCodeInjectionThreshold: isLargeFile ? 0.2 : 0.3,
                debugProtection: false, // Désactivé car peut causer des problèmes
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                numbersToExpressions: !isLargeFile, // Désactivé pour gros fichiers
                renameGlobals: false,
                splitStrings: !isLargeFile,
                splitStringsChunkLength: 5,
                stringArray: true,
                stringArrayEncoding: isLargeFile ? [] : ['base64'], // Pas d'encoding pour gros fichiers
                stringArrayThreshold: isLargeFile ? 0.5 : 0.75,
                selfDefending: false, // Désactivé car peut causer des problèmes
                transformObjectKeys: !isLargeFile,
                unicodeEscapeSequence: false, // Désactivé car augmente la taille
                // Options de performance
                target: 'browser',
                seed: 0 // Pour des résultats reproductibles
              }).getObfuscatedCode();
              
              console.log(`✓ Successfully obfuscated: ${fileName}`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`✗ Failed to obfuscate ${fileName}:`, errorMessage);
              console.log(`  Skipping obfuscation for this file...`);
              // Ne pas bloquer le build, continuer sans obfuscation
            }
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
  
  // Vérifier si l'obfuscation est activée (peut être désactivée via variable d'environnement)
  const enableObfuscation = env.VITE_ENABLE_OBFUSCATION !== 'false';
  
  // Configurer les plugins
  const plugins: (Plugin | PluginOption)[] = [react()];
  if (isProd && enableObfuscation) {
    console.log('🔒 Obfuscation enabled for production build');
    plugins.push(createObfuscatorPlugin());
  } else if (isProd) {
    console.log('⚠️  Obfuscation disabled (set VITE_ENABLE_OBFUSCATION=true to enable)');
  }
  
  return {
    plugins,
    define: {
      // Rendre les variables d'environnement disponibles globalement
      'process.env': env
    },
    build: {
      sourcemap: false,
      minify: 'terser', // Activer la minification avec Terser
      terserOptions: {
        compress: {
          drop_console: true, // Supprimer les console.log en production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false // Supprimer tous les commentaires
        }
      },
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
