const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',                // change to 'production' for build
  entry: './src/script.js',          // your JS entrypoint
  output: {
    filename: 'bundle.js',           // generated JS
    path: path.resolve(__dirname, 'dist'),
    clean: true,                     // clean /dist before each build
  },
  devServer: {
    static: './dist',                // serve from /dist
    open: true,                      // open browser on start
    hot: true,                       // hot reloading
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],  // load CSS
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',  // use your HTML template
    }),
  ],
};