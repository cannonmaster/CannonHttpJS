import path, { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
// import dts from "vite-plugin-dts";
export default defineConfig((config) => ({
  publicDir: false,
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      sourcemap: false,
      brotliSize: true,
      entry: resolve(__dirname, "src/main.ts"),
      name: "CannonHttpJS",
      // the proper extensions will be added
      fileName: "cannon-httpjs",
      formats: ["es", "umd", "iife"],
      chunkSizeWarningLimit: 500,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
    outDir: "cannonHttpJS",
  },
  plugins: [
    visualizer({
      open: true,
    }),
    // rollupNodePolyFill(),
  ],
  // resolve: {
  //   alias: {
  //     "./runtimeConfig": "./runtimeConfig.browser", // <-- Fix from above
  //   },
  // },
}));
