import React from 'react';
import ReactDom from 'react-dom';
import { CanvasAnimation } from "./CanvasAnimation";
// import { WebglAnimation } from './WebglAnimation';

import './app.scss';

//** Components

// NOTE: Change animation component here
const App = () => {
    return (
        <React.Fragment>
            <h1 className={'page-title'}>Conway's Game of Life</h1>
            {/*<WebglAnimation/>*/}
            <CanvasAnimation/>
        </React.Fragment>
    );
};

//*** INIT ***//

ReactDom.render(<App/>, document.getElementById("root"));
