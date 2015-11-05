var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    index: path.join(__dirname, 'src', 'index.js')
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'build')
  },
  target: 'node',
  externals: [/^[a-z0-9[]+$/i],
  module: {
    loaders: [{
      test: /\.jsx?$/i,
      include: path.join(__dirname, 'src'),
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.BannerPlugin('require("source-map-support").install();', {
      raw: true,
      entryOnly: false
    })
  ],
  devtool: 'sourcemap'
};
