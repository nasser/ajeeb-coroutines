import typescript from 'rollup-plugin-typescript';
import sourceMaps from 'rollup-plugin-sourcemaps'

let plugins = [typescript(), sourceMaps()]
let input = "./coroutines.ts"
let name = "coroutines"
let sourcemap = true

export default [
  {
    input, plugins,
    output: {
      name, sourcemap,
      file: "build/coroutines.iife.js",
      format: "iife"
    }
  },
  {
    input, plugins,
    output: {
      name, sourcemap,
      file: "build/coroutines.cjs.js",
      format: "cjs"
    }
  },
  {
    input, plugins,
    output: {
      name, sourcemap,
      file: "build/coroutines.esm.js",
      format: "esm"
    }
  },
];