const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: {
    firebase_init: './firebase-init.js',
    content: './content.js', // Entry point for content.js
    youtube_extension_citation: './youtube_extension_citation.js', // Entry point for youtube_extension_citation.js
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
    }),
  ],
};