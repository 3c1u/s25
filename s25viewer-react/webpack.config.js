const path = require('path');

const outputPath = path.resolve(__dirname, './dist');

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
    output: {
        path: outputPath,
        filename: './dist/bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.wasm'],
        alias: {
            '~': path.resolve(__dirname, 'src/'),
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    { loader: 'ts-loader' }
                ]
            },
            {
                test: /\.wasm$/,
                type: "javascript/auto",
                loader: 'file-loader',
            }
        ]
    },
    experiments: {
        // syncWebAssembly: true,
        // asyncWebAssembly: true,
        topLevelAwait: true,
        asset: true
    },
};
