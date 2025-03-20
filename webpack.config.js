const path = require('path');

module.exports = {
  entry: './src/extension.ts',
  target: 'node',
  mode: 'development', // This addresses the webpack mode warning
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  output: {
    filename: 'extension.js',
    path: path.resolve(__dirname, 'out'),
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  externals: {
    vscode: 'commonjs vscode'
  }
};
