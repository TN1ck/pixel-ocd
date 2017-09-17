const path = require('path');
const webpack = require('webpack');

const IS_PRODUCTION = process.env.NODE_ENV = 'production';

module.exports = {
  devtool: 'eval',
  entry: IS_PRODUCTION ? ['./src/index'] : [
    'webpack-dev-server/client?http://localhost:3000',
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/build/'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "awesome-typescript-loader"
          },
        ],
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  }
};
