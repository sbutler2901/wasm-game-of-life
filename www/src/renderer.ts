import { Universe } from "../../pkg/wasm_game_of_life";

//** Typings **//

export type CanvasPrerenderCallback = (nowTimestamp: number) => void;

//** Universe **//

export const UNIVERSE = Universe.new();
const U_WIDTH = UNIVERSE.width();
const U_HEIGHT = UNIVERSE.height();

//** Implementation specific functions **//

let draw: Function;
let updateFPS: CanvasPrerenderCallback;

//** General **//

let animationId: number = null;

//** Helper functions **//

export const getIndex = (row: number, column: number) => {
    return row * U_WIDTH + column;
};

//** Rendering **//

const renderLoop = () => {
    updateFPS(performance.now());

    for (let i=0; i < 3; i++)
        UNIVERSE.tick();

    draw();

    animationId = requestAnimationFrame(renderLoop);
};

// ** State functions **//

export const clear = () => {
    UNIVERSE.clear();
    draw();
};

export const reset = () => {
    UNIVERSE.reset();
    draw();
};

export const startRender = () => {
    renderLoop();
};

export const pauseRender = () => {
    cancelAnimationFrame(animationId);
    animationId = null;
};

export const isRenderPaused = () => {
    return animationId === null;
};

//** Initialization **//

export const initRenderer = (animationDraw: Function, animationUpdateFPS: CanvasPrerenderCallback) => {
    draw = animationDraw;
    updateFPS = animationUpdateFPS;
};
