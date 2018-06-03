const path = require('path');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
  BaseHrefWebpackPlugin
} = require('base-href-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');
const webpack = require('webpack');
const minimizeCss = false;

const {
  NoEmitOnErrorsPlugin,
  LoaderOptionsPlugin
} = require('webpack');

const nodeModules = path.join(process.cwd(), 'node_modules');
const entryPoints = ["inline", "polyfills", "sw-register", "styles", "vendor", "main"];
const baseHref = "";
const deployUrl = "";

const postcssPlugins = function () {
  // safe settings based on: https://github.com/ben-eb/cssnano/issues/358#issuecomment-283696193
  const importantCommentRe = /@preserve|@license|[@#]\s*source(?:Mapping)?URL|^!/i;
  const minimizeOptions = {
    autoprefixer: false,
    safe: true,
    mergeLonghand: false,
    discardComments: {
      remove: (comment) => !importantCommentRe.test(comment)
    }
  };
  return [
    postcssUrl({
      url: (URL) => {
        // Only convert root relative URLs, which CSS-Loader won't process into require().
        if (!URL.startsWith('/') || URL.startsWith('//')) {
          return URL;
        }
        if (deployUrl.match(/:\/\//)) {
          // If deployUrl contains a scheme, ignore baseHref use deployUrl as is.
          return `${deployUrl.replace(/\/$/, '')}${URL}`;
        } else if (baseHref.match(/:\/\//)) {
          // If baseHref contains a scheme, include it as is.
          return baseHref.replace(/\/$/, '') +
            `/${deployUrl}/${URL}`.replace(/\/\/+/g, '/');
        } else {
          // Join together base-href, deploy-url and the original URL.
          // Also dedupe multiple slashes into single ones.
          return `/${baseHref}/${deployUrl}/${URL}`.replace(/\/\/+/g, '/');
        }
      }
    }),
    autoprefixer(),
  ].concat(minimizeCss ? [cssnano(minimizeOptions)] : []);
};
const src = path.resolve(__dirname, 'src/');
module.exports = (env, argv) => {
  var mode = (argv || {}).mode;
  console.log("******* Mode: " + mode + " *******");
  var isDevBuild = !mode || mode === "development";
  //isDevBuild = true;
  return {
    target: "webworker",
    "devtool": isDevBuild ? "cheap-eval-source-map" : undefined,
    devServer: {
      hot: isDevBuild
    },
    "resolve": {
      "extensions": [
        ".ts",
        ".js"
      ],
      "modules": [
        "./node_modules"
      ]
    },
    "resolveLoader": {
      "modules": [
        "./node_modules"
      ]
    },
    "entry": {
      "main": [
        "./src/main.ts"
      ],
      "polyfills": [
        "./src/polyfills.ts"
      ],
      "styles": [
        "./src/styles.css"
      ],
      "webworker": [
        './src/webWorker/workerLoader.ts'
      ]
    },
    "output": {
      pathinfo: true,
      "path": path.join(process.cwd(), "dist"),
      "filename": "[name].bundle.js",
      "chunkFilename": "[id].chunk.js",
      globalObject: 'self'
    },
    "module": {
      "rules": [{
          "enforce": "pre",
          "test": /\.js$/,
          "loader": "source-map-loader",
          "exclude": [
            /\/node_modules\//
          ]
        },
        {
          "test": /\.html$/,
          "loader": "raw-loader"
        },
        {
          "exclude": [
            path.join(process.cwd(), "src/styles.css")
          ],
          "test": /\.css$/,
          "loaders": [
            "exports-loader?module.exports.toString()",
            "css-loader?{\"sourceMap\":false,\"importLoaders\":1}",
            {
              "loader": "postcss-loader",
              "options": {
                "ident": "postcss",
                "plugins": postcssPlugins,
                "sourceMap": false
              }
            }
          ]
        },
        {
          "include": [
            path.join(process.cwd(), "src/styles.css")
          ],
          "test": /\.css$/,
          "loaders": [
            MiniCssExtractPlugin.loader,
            "css-loader?{\"sourceMap\":false,\"importLoaders\":1}",
            {
              "loader": "postcss-loader",
              "options": {
                "ident": "postcss",
                "plugins": postcssPlugins,
                "sourceMap": false
              }
            }
          ]
        },
        {
          test: /\.ts$/,
          use: isDevBuild ? [{
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              experimentalWatchApi: true
            }
          }, 'angular2-template-loader', 'angular2-router-loader'] : '@ngtools/webpack'
        }
      ]
    },
    "plugins": [
      new CopyWebpackPlugin([{
          from: process.cwd() + '/src/assets/**/*',
          to: process.cwd() + "/dist",
          ignore: ['*.gitkeep']
        },
        {
          from: process.cwd() + '/src/favicon.ico',
          to: process.cwd() + "/dist"
        }
      ]),
      new ProgressPlugin(),
      new HtmlWebpackPlugin({
        "template": "./src/index.html",
        "filename": "./index.html",
        "hash": false,
        "inject": true,
        "compile": true,
        "favicon": false,
        "minify": false,
        "cache": true,
        "showErrors": true,
        "chunks": "all",
        "excludeChunks": [
          'webworker'
        ],
        "title": "Webpack App",
        "xhtml": true,
        "chunksSortMode": function sort(left, right) {
          let leftIndex = entryPoints.indexOf(left.names[0]);
          let rightindex = entryPoints.indexOf(right.names[0]);
          if (leftIndex > rightindex) {
            return 1;
          } else if (leftIndex < rightindex) {
            return -1;
          } else {
            return 0;
          }
        }
      }),
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new BaseHrefWebpackPlugin({}),
      new MiniCssExtractPlugin({
        "filename": "[name].bundle.css",
        "disable": true
      }),
      new LoaderOptionsPlugin({
        "sourceMap": false,
        "options": {
          "postcss": [
            autoprefixer(),
            postcssUrl({
              "url": (URL) => {
                // Only convert root relative URLs, which CSS-Loader won't process into require().
                if (!URL.startsWith('/') || URL.startsWith('//')) {
                  return URL;
                }
                if (deployUrl.match(/:\/\//)) {
                  // If deployUrl contains a scheme, ignore baseHref use deployUrl as is.
                  return `${deployUrl.replace(/\/$/, '')}${URL}`;
                } else if (baseHref.match(/:\/\//)) {
                  // If baseHref contains a scheme, include it as is.
                  return baseHref.replace(/\/$/, '') +
                    `/${deployUrl}/${URL}`.replace(/\/\/+/g, '/');
                } else {
                  // Join together base-href, deploy-url and the original URL.
                  // Also dedupe multiple slashes into single ones.
                  return `/${baseHref}/${deployUrl}/${URL}`.replace(/\/\/+/g, '/');
                }
              }
            })
          ],
          "sassLoader": {
            "sourceMap": false,
            "includePaths": []
          },
          "lessLoader": {
            "sourceMap": false
          },
          "context": ""
        }
      })
    ],
    "node": {
      "fs": "empty",
      "global": true,
      "crypto": "empty",
      "tls": "empty",
      "net": "empty",
      "process": true,
      "module": false,
      "clearImmediate": false,
      "setImmediate": false
    }
  };
};
