// const path = require('path');
// module.exports = {
//   entry: './src/index.js', // Entry point of the application
//   output: {
//     path: path.resolve(__dirname, 'dist'), // Output directory
//     filename: 'bundle.js', // Output file name
//   },
//   module: {
//     rules: [
//       {
//         test: /\.js$/,
//         enforce: 'pre',
//         use: ['source-map-loader'],
//         exclude: [
//           /node_modules\/lucide-react/,
//         ],
//       },
//       {
//         test: /\.css$/, // Process CSS files
//         use: ['style-loader', 'css-loader'], // Loaders for CSS
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.js'], // Resolve these extensions
//   },
//   devServer: {
//     contentBase: path.join(__dirname, 'dist'), // Serve files from 'dist'
//     compress: true, // Enable gzip compression
//     port: 9000, // Development server port
//   },
//   mode: 'development', // Set mode to development
// };
