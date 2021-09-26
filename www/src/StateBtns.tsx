import React, { useState } from "react";
import { clear, isRenderPaused, pauseRender, startRender, reset } from "./renderer";

const ToggleAnimationBtn = () => {
    const [text, setText] = useState("⏸");

    const toggleRendering = () => {
        if (!isRenderPaused()) {
            setText("▶");
            pauseRender();
        } else {
            setText("⏸");
            startRender();
        }
    };

    return (
        <button id="play-pause" onClick={toggleRendering}>{text}</button>
    );
};

export const StateBtns = () => {
   return (
       <div id={'state-btns'}>
           <ToggleAnimationBtn/>
           <button id="clear-btn" onClick={clear}>Clear</button>
           <button id="reset-btn" onClick={reset}>Reset</button>
       </div>
   );
};
