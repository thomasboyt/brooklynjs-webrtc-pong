const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './client/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../dist'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        LOBBY_SERVER: JSON.stringify(
          process.env.LOBBY_SERVER || 'localhost:3000'
        ),
        ENABLE_SOCKET_LOG: 'true',
      },
    }),
  ],
};
