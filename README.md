# Conway's Game of Life - WASM

## About
An implementation of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) using Rust and Webassembly.
The game is implemented in Rust which is compiled to web assembly. There are two rendering implementations, one using the 
[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) and the other using WebGL and [ThreeJS](https://threejs.org/)

[See it running](https://pages.github.com/sbutler2901/wasm-game-of-life/)

## Usage

### Rust / WASM

1. [Rust (nightly)](https://rustup.rs/) and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) must be installed
2. Building:
    - Release: `wasm-pack build --release`
    - Dev: `wasm-pack build --dev`
3. Testing:
    - `wasm-pack test --headless --firefox`
    
### Running
 1. Build the web assembly files
 2. Navigate to the `www` directory
 3. `npm install`
 4. `npm run dev`
 5. Visit [localhost:8080](https://localhost:8080/)
    - Firefox is preferred.
    - Chrome can be a pain with http and localhost, but this [solution](https://stackoverflow.com/a/28586593) can be used if issues occur.

### Canvas API / ThreeJs
- To switch between [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) and [ThreeJS WebGL](https://www.npmjs.com/package/three/v/0.110.0) implementations:
  - Alter imports and React component used in `www/src/app.tsx`
    - `<WebglAnimation/>` or `<CanvasAnimation/>`

## Rust Performance Profiling

- Must disable `wasm_bindgen` annotations in code
- Must disable `cdylib` in Cargo.toml
- Must convert js_sys / web_sys wasm_bindgen crates to use rust native
- Must run dev build
- Run with Time profiler using MacOS Instruments application

## Acknowledgements
- [create-wasm-app](https://github.com/rustwasm/create-wasm-app)
