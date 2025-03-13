const path = require('path');

module.exports = {
  entry: {
    youtube_extension_citation: './youtube_extension_citation.js', 
    firebase_init: './firebase-init.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
};