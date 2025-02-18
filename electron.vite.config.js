import { defineConfig, externalizeDepsPlugin } from "electron-vite"

import { resolve } from "path"

import { fileURLToPath, URL } from "url"
import postcss from "./postcss.config.js"
import react from "@vitejs/plugin-react"
import dns from "dns"
import { visualizer } from "rollup-plugin-visualizer"

dns.setDefaultResultOrder("verbatim")

console.log("__dirname: ")
console.log(__dirname)

export default defineConfig({
  main: {
    // vite config options
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.js")
        }
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    worker: {
      format: "es"
    },
    optimizeDeps: {
      include: ["@mintplex-labs/piper-tts-web"],
      esbuildOptions: {
        define: {
          global: "globalThis"
        },
        plugins: []
      }
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: fileURLToPath(new URL("./src", import.meta.url))
        },
        {
          process: "process/browser",
          stream: "stream-browserify",
          zlib: "browserify-zlib",
          util: "util",
          find: /^~.+/,
          replacement: (val) => {
            return val.replace(/^~/, "")
          }
        }
      ]
    }
  },
  preload: {
    // vite config options
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.js")
        },
        // output: {
        //   // Explicitly set the file extension to `.js`
        //   entryFileNames: `[name].js`,
        //   format: "cjs" // Use CommonJS format for `.js` output
        // },
        external: [
          "@electron-toolkit/preload"
        ]
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    worker: {
      format: "es"
    },
    optimizeDeps: {
      include: ["@mintplex-labs/piper-tts-web"],
      esbuildOptions: {
        define: {
          global: "globalThis"
        },
        plugins: []
      }
    }
  },
  renderer: {
    // vite config options,
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html")
        },
        output: {
          inlineDynamicImports: true
        },
        external: ["/@phosphor-icons/react/dist/ssr/"]
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    worker: {
      format: "es"
    },
    define: {
      "process.env": process.env
    },
    css: {
      postcss
    },
    optimizeDeps: {
      include: ["@mintplex-labs/piper-tts-web"],
      esbuildOptions: {
        define: {
          global: "globalThis"
        },
        plugins: []
      }
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve('src/renderer/src')
        },
        {
          process: "process/browser",
          stream: "stream-browserify",
          zlib: "browserify-zlib",
          util: "util",
          find: /^~.+/,
          replacement: (val) => {
            return val.replace(/^~/, "")
          }
        }
      ]
    }
  }
})
