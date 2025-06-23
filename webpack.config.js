const path = require('path');

module.exports = {
  // ...existing config...
  module: {
    rules: [
      // ...outros loaders...
      {
        test: /\.xlsx$/,
        use: 'arraybuffer-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.vue', '.json']
  }
};
