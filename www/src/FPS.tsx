import React, { useEffect, useState } from "react";

import "./FPS.scss";

export const FPS = ({ nowTimestamp }: { nowTimestamp: number }) => {
    const [lastFrameTimeStamp, setLastFrameTimeStamp] = useState(nowTimestamp);
    const [frames, setFrames] = useState([]);
    const [latest, setLatest] = useState(0);
    const [mean, setMean] = useState(0);
    const [min, setMin] = useState(0);
    const [max, setMax] = useState(0);

    useEffect(() => {
        const delta = nowTimestamp - lastFrameTimeStamp;

        const fps = 1 / delta * 1000;

        // Save only the latest 100 timings.
        frames.push(fps);
        if (frames.length > 100) {
            frames.shift();
        }

        // Find the max, min, and mean of our 100 latest timings.
        let tmpMin = Infinity;
        let tmpMax = -Infinity;
        let sum = 0;
        for (let i = 0; i < frames.length; i++) {
            sum += frames[i];
            tmpMin = Math.min(frames[i], tmpMin);
            tmpMax = Math.max(frames[i], tmpMax);
        }
        let tmpMean = sum / frames.length;

        if (tmpMean === Infinity) tmpMean = 0;
        if (tmpMin === Infinity) tmpMin = 0;
        if (tmpMax === Infinity) tmpMax = 0;

        setLastFrameTimeStamp(nowTimestamp);
        setFrames(frames);
        setLatest(Math.round(fps));
        setMean(Math.round(tmpMean));
        setMin(Math.round(tmpMin));
        setMax(Math.round(tmpMax));

    }, [nowTimestamp]);

    return (
        <div id="fps">
            <h4>Frames per Second:</h4>
            <p>latest: {latest}</p>
            <p>mean of last 100: {mean}</p>
            <p>min of last 100: {min}</p>
            <p>max of last 100: {max}</p>
        </div>
    );
};
