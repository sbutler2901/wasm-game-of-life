const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const pagesBuild = process.env.PAGES_BUILD;

const GHPAGES_URL = "https://pages.github.com/sbutler2901/wasm-game-of-life/www/build/";
const DEV_URL = "http://localhost:8080/";

dev ? console.log("Running dev build") : console.log("Running production build");

module.exports = {
  entry: "./src/index.ts",
  output: {
    path: pagesBuild ? path.resolve(__dirname, "build") : path.resolve(__dirname, "dist"),
    publicPath: pagesBuild ? GHPAGES_URL : DEV_URL,
    filename: "index.js",
  },
  mode: dev ? "development" : "production",
  devtool: dev ? "inline-source-map" : "source-map",
  plugins: [
      new HtmlWebpackPlugin({
        title: "Conway's Game of Life",
        favicon: './static/favicon.jpeg',
        template: 'index.html'
      }),
      new MiniCssExtractPlugin({
        filename: dev ? '[name].css' : '[name].[hash].css',
        chunkFilename: dev ? '[id].css' : '[id].[hash].css',
      }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
            dev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          },
        ]
      }
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.wasm' ],
  },
};
