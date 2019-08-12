import typescript from 'rollup-plugin-typescript';
import sourceMaps from 'rollup-plugin-sourcemaps'

export default {
    input: './coroutines.ts',
    output: {
        name: "coroutines",
        file: "build/browser.js",
        format: "iife",
        sourcemap: true
    },
    plugins: [
      typescript(),
      sourceMaps(),
    ],
  };