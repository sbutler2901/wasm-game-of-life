import { memory } from "wasm-game-of-life/wasm_game_of_life_bg.wasm";
import { Cell } from "wasm-game-of-life";
import React, { MouseEvent, useEffect, useRef, useState } from "react";
import { FPS } from "./FPS";
import { StateBtns } from "./StateBtns";
import {
    UNIVERSE,
    startRender,
    pauseRender,
    getIndex,
    initRenderer,
    CanvasPrerenderCallback,
} from "./renderer";

import "./animation.scss";

//** Constants **//

const CANVAS_WIDTH: string = "500px";
const CANVAS_HEIGHT: string = "500px";

let CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const U_WIDTH = UNIVERSE.width();
const U_HEIGHT = UNIVERSE.height();

//** HTML Elements **//

let canvas: HTMLCanvasElement = null;

//** General **//

let ctx: CanvasRenderingContext2D;

//** Drawing Functions **//

// Unoptimized cell drawing
const drawCellsBasic = () => {
    const cellsPtr = UNIVERSE.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, U_WIDTH * U_HEIGHT);

    ctx.beginPath();

    for (let row = 0; row < U_HEIGHT; row++) {
        for (let col = 0; col < U_WIDTH; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = cells[idx] === Cell.Dead
                ? DEAD_COLOR
                : ALIVE_COLOR;

            fillCell(row, col);
        }
    }

    ctx.stroke();
};

const fillCell = (row: number, col: number) => {
    ctx.fillRect(
        col * CELL_SIZE,
        row * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    );
};

// Draws cells using changed cells provided by universe with minimal canvas fill-style
const drawCells = () => {
    const cellsPtr = UNIVERSE.cells();
    const cellsChangedPtr = UNIVERSE.changed_cells();
    const cellsChangedMultiplier = 2;
    const cellsChangedLength = UNIVERSE.changed_cells_length() * cellsChangedMultiplier;
    // directly access the WebAssembly's memory as a linear buffer
    const cells = new Uint8Array(memory.buffer, cellsPtr, U_WIDTH * U_HEIGHT);
    const cellsChanged = new Uint16Array(memory.buffer, cellsChangedPtr, cellsChangedLength);

    // console.log("Changed_cells: ", universe.changed_cells_length());

    // Alive cells.
    ctx.fillStyle = ALIVE_COLOR;
    for (let i=0; i < cellsChangedLength; i += cellsChangedMultiplier) {
        const row = cellsChanged[i];
        const col = cellsChanged[i+1];
        const idx = getIndex(row, col);

        if (cells[idx] !== Cell.Alive) continue;

        fillCell(row, col);
    }

    // Dead cells.
    ctx.fillStyle = DEAD_COLOR;
    for (let i=0; i < cellsChangedLength; i += cellsChangedMultiplier) {
        const row = cellsChanged[i];
        const col = cellsChanged[i+1];
        const idx = getIndex(row, col);

        if (cells[idx] !== Cell.Dead) continue;

        fillCell(row, col);
    }

    UNIVERSE.changed_cells_clear();
};

// Draws the game's grid
const drawGrid = () => {
    ctx.beginPath();    // initializes a path to draw
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= U_WIDTH; i++) {
        // moves starting point across page without drawing for each cell
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        // draws line from starting point down page
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * U_HEIGHT + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= U_HEIGHT; j++) {
        // moves starting point down page without drawing for each cell
        ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
        // draws line from starting point across page
        ctx.lineTo((CELL_SIZE + 1) * U_WIDTH + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();   // strokes (draws) paths
};

const draw = () => {
    // drawCellsBasic();
    drawCells();
    // drawGrid();
};

//** Event Listeners **/

const canvasClickHandler = (event: MouseEvent) => {
    // Get the canvas coordinates within the browser window
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    // Determine click coordinates within the canvas
    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    // Determine the cell clicked based on the canvas coordinates
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), U_HEIGHT - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), U_WIDTH - 1);

    if (event.altKey) {
        UNIVERSE.insert_glider(row, col);
    } else if (event.shiftKey) {
        UNIVERSE.insert_pulsar(row, col);
    } else {
        UNIVERSE.toggle_cell(row, col);
    }

    draw();
};

//** Initialization **//

const init = (canvasRef: HTMLCanvasElement) => {
    canvas = canvasRef;
    ctx = canvas.getContext('2d');
    CELL_SIZE = Math.ceil(Math.min((canvas.width/U_WIDTH), (canvas.height/U_HEIGHT)));
};

//** Components **//

const Canvas = ({ preRenderCallback }: { preRenderCallback: CanvasPrerenderCallback }) => {
    const canvas = useRef(null);

    useEffect(() => {
        init(canvas.current);
        initRenderer(draw, preRenderCallback);
        startRender();

        return () => {
            pauseRender();
        };
    }, []);

    return (
        <div className={'canvas-container'}>
            <canvas
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                ref={canvas}
                onClick={canvasClickHandler}
            />
        </div>
    );
};

export const CanvasAnimation = () => {
    const [timestamp, setTimestamp] = useState(performance.now());

    return (
        <div className={'animation-container'}>
            <div>
                <h3 className={'title'}>Canvas API</h3>
                <StateBtns/>
                <FPS nowTimestamp={timestamp}/>
            </div>
            <Canvas preRenderCallback={setTimestamp}/>
        </div>
    );
};
