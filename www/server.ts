import express from "express";
import compression from "compression";

const app = express();

app.use(compression());

app.use(express.static('dist'));

app.use('/static', express.static('static'));

app.listen(8080, function () {
    console.log('Starting the game of life at http://localhost:8080/');
});
