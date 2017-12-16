'use strict';

const webpack = require("webpack");
const path = require("path");
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const CompressionPlugin = require("zopfli-webpack-plugin");
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const BrotliPlugin = require('brotli-webpack-plugin');
const MinifyPlugin = require("babel-minify-webpack-plugin");

module.exports = {
	devtool: 'source-map',
	entry: {
		app: [
			'./src/index.tsx'
		],
		polyfills: [
			`whatwg-fetch`,
		],
	},
	output: {
		path: path.join(__dirname, "build"),
		filename: "[name]-[hash].js",
		libraryTarget: 'umd',
		publicPath: '/'
	},
	resolve: {
		extensions: ['.js', '.jsx', '.tsx', '.ts'],
		alias: {
			'react': 'preact-compat',
			'react-dom': 'preact-compat',
			'create-react-class': 'preact-compat/lib/create-react-class'
		}
	},
	plugins: [
		new webpack.LoaderOptionsPlugin({
			options: {
				imageWebpackLoader: {
					pngquant: {
						quality: "65-90",
						speed: 4
					},
					svgo: {
						plugins: [
							{
								removeViewBox: false
							}
						]
					}
				}
			},
			minimize: true,
			debug: false
		}),
		new CleanPlugin(['build']),
		new ExtractTextPlugin({
			filename: '[contenthash].css'
		}),
		new webpack.NoEmitOnErrorsPlugin({
			mangle: { topLevel: true }
		}),
		new webpack.optimize.OccurrenceOrderPlugin(),
		new MinifyPlugin(),
		new webpack.DefinePlugin({
			'process.env': {
				// Useful to reduce the size of client-side libraries, e.g. react
				NODE_ENV: JSON.stringify('production')
			}
		}),
		new FaviconsWebpackPlugin({
			logo: './src/images/logo.png',
			title: 'demos.tf',
			background: '#444'
		}),
		new HtmlWebpackPlugin({
			title: 'demos.tf',
			chunks: ['app'],
			inlineSource: '\.css$',
			template: '!!html-loader!src/index.html'
		}),
		new HtmlWebpackInlineSourcePlugin(),
		new CompressionPlugin({
			algorithm: "zopfli",
			test: /\.(js|css|html|svg)$/,
			threshold: 1024
		}),
		new BrotliPlugin({
			test: /\.(js|css|html|svg)$/,
			threshold: 1024
		}),
		new SWPrecacheWebpackPlugin(
			{
				maximumFileSizeToCacheInBytes: 750000,
				cacheId: 'demos-tf',
				filename: 'service-worker.js',
				minify: true,
				dontCacheBustUrlsMatching: [
					/^(?=.*\.\w{1,7}$)/, // I'm cache busting js and css files myself
				],
				verbose: false,
				stripPrefix: 'build',
				staticFileGlobs: ['build/*.js', 'build/*.css']
			}
		)
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				options: {
					silent: true
				}
			},
			{
				test: /.*\.(gif|png|jpe?g|svg|webp)(\?.+)?$/i,
				use: [
					'url-loader?limit=5000&hash=sha512&digest=hex&name=[hash].[ext]',
					'image-webpack-loader'
				]
			},
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: "style-loader",
					use: ['css-loader', 'postcss-loader']
				})
			}
		]
	}
};
