import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default {
  entry: "./src/main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(dirname, "public"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  devServer: {
    static: [{ directory: path.join(dirname, "public") }],
    compress: true,
    port: 3000,
  },
};
