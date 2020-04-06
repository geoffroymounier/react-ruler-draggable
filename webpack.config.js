var path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  watch: true,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "bundle.js",
    libraryTarget: "commonjs2"
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'url-loader',
          },
        ],
      }
    ]
  },
  externals: {
    react: "react"
  }
};
