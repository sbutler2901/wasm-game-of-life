///<reference path="../node_modules/three/src/Three.d.ts" />

import React, { useEffect, useRef, useState } from "react";
import "three";
// @ts-ignore
import * as THREE from "three";

import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
import { Cell } from "wasm-game-of-life";
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

const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const U_WIDTH = UNIVERSE.width();
const U_HEIGHT = UNIVERSE.height();

//** HTML Elements **//

let mount: HTMLDivElement;

//** General **//

let renderer: any;
let scene: any;
let camera: any;
let group: any;
let glCells: any = [];
let CELL_SIZE: number;

//** Drawing Functions **//

const drawCells = ()=> {
    const cellsPtr = UNIVERSE.cells();
    const cellsChangedPtr = UNIVERSE.changed_cells();
    const cellsChangedMultiplier = 2;
    const cellsChangedLength = UNIVERSE.changed_cells_length() * cellsChangedMultiplier;
    // directly access the WebAssembly's memory as a linear buffer
    const cells = new Uint8Array(memory.buffer, cellsPtr, U_WIDTH * U_HEIGHT);
    const cellsChanged = new Uint16Array(memory.buffer, cellsChangedPtr, cellsChangedLength);

    let mesh: any;
    let row: number, col: number, idx: number;
    for (let i=0; i < cellsChangedLength; i += cellsChangedMultiplier) {
        row = cellsChanged[i];
        col = cellsChanged[i+1];
        idx = getIndex(row, col);

        mesh = glCells[row][col];

        if (cells[idx] === Cell.Alive) {
            group.add(mesh);
        } else {
            group.remove(mesh);
        }
    }

    UNIVERSE.changed_cells_clear();
};

const draw = () => {
    drawCells();
    renderer.render(scene, camera);
};

//** Event Listeners **/

const canvasClickHandler = (event: MouseEvent) => {
    const canvas = renderer.domElement;
    // Get the canvas coordinates within the browser window
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.clientWidth / boundingRect.width;
    const scaleY = canvas.clientHeight / boundingRect.height;

    // Determine click coordinates within the canvas
    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    // Determine the cell clicked based on the canvas coordinates
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE)), U_HEIGHT - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE)), U_WIDTH - 1);
    console.log(`canvasTop: ${canvasTop / CELL_SIZE}, canvasLeft: ${canvasLeft / CELL_SIZE}`);

    // Invert row since threeJS uses traditional cartesian coordinates for y-axis
    const threeRow = Math.min(U_HEIGHT - row - 1, U_HEIGHT - 1);

    console.log(`${col}x${row}, threeRow: ${threeRow}`);

    if (event.altKey) {
        UNIVERSE.insert_glider(threeRow, col);
    } else if (event.shiftKey) {
        UNIVERSE.insert_pulsar(threeRow, col);
    } else {
        UNIVERSE.toggle_cell(threeRow, col);
    }

    draw();
};

//** Initialization **//

const initCells = () => {
    const material = new THREE.MeshBasicMaterial({ color: ALIVE_COLOR, wireframe: false });
    const cellsPtr = UNIVERSE.cells();
    // directly access the WebAssembly's memory as a linear buffer
    const cells = new Uint8Array(memory.buffer, cellsPtr, U_WIDTH * U_HEIGHT);

    let cellRow: any[];
    for (let row = 0; row < U_HEIGHT; row++) {
        cellRow = [];
        for (let col = 0; col < U_WIDTH; col++) {
            const x_position = col * CELL_SIZE;
            const y_position = row * CELL_SIZE;

            const squareShape: any = new THREE.Shape();
            squareShape.moveTo( x_position, y_position )
                .lineTo( x_position, y_position + CELL_SIZE )
                .lineTo( x_position + CELL_SIZE, y_position + CELL_SIZE )
                .lineTo( x_position + CELL_SIZE, y_position )
                .lineTo( x_position, y_position );

            const geometry = new THREE.ShapeGeometry(squareShape);
            const mesh = new THREE.Mesh(geometry, material);

            cellRow.push(mesh);

            const idx = getIndex(row, col);
            if (cells[idx] === Cell.Alive) group.add(mesh);
        }
        glCells.push(cellRow);
    }
};

const init = (mountRef: HTMLDivElement) => {
    const FOV = 100;

    mount = mountRef;

    const mountWidth = mount.clientWidth;
    const mountHeight = mount.clientHeight;

    CELL_SIZE = Math.ceil(Math.min((mountWidth/U_WIDTH), (mountHeight/U_HEIGHT)));
    console.log(`CELL_SIZE: ${CELL_SIZE}`);

    // Calculate center point of Universe
    const cameraX = (CELL_SIZE * U_WIDTH) / 2;
    const cameraY = (CELL_SIZE * U_HEIGHT) / 2;

    // Determine camera distance required to view all cells in Universe
    const cameraZ = Math.ceil(Math.max(
        cameraX / Math.tan((FOV / 2) * Math.PI / 180),
        cameraY / Math.tan((FOV / 2) * Math.PI / 180),
    ));

    camera = new THREE.PerspectiveCamera(FOV, mountWidth / mountHeight, 0.1, 1000);
    camera.position.set( cameraX, cameraY, cameraZ);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountWidth, mountHeight);
    renderer.domElement.onclick = canvasClickHandler;

    mount.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    //@ts-ignore
    scene.background = new THREE.Color(DEAD_COLOR);

    group = new THREE.Group();

    scene.add(group);

    initCells();
};

//** Components **//

const Webgl = ({ preRenderCallback }: { preRenderCallback: CanvasPrerenderCallback }) => {
    const mountRef = useRef(null);

    useEffect(() => {
       init(mountRef.current);
       initRenderer(draw, preRenderCallback);
       startRender();

       return () => {
         pauseRender();
         mount.removeChild(renderer.domElement);
       };
    }, []);

    return (
        <div>
            <div
                className="canvas-container"
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                ref={mountRef}
            />
        </div>
    );
};

export const WebglAnimation = () => {
    const [timestamp, setTimestamp] = useState(performance.now());

    return (
        <div className={'animation-container'}>
            <div>
                <h3 className={'title'}>WebGL</h3>
                <StateBtns/>
                <FPS nowTimestamp={timestamp}/>
            </div>
            <Webgl preRenderCallback={setTimestamp}/>
        </div>
    );
};
