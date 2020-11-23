const path = require('path')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const outputPath = path.resolve(__dirname, './dist')
const isDevelopment = process.env.NODE_ENV !== 'production'

module.exports = {
    mode: isDevelopment ? 'development' : 'production',
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
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            plugins: [
                                isDevelopment &&
                                    require.resolve('react-refresh/babel'),
                            ].filter(Boolean),
                        },
                    },
                    { loader: 'ts-loader' },
                ],
            },
            {
                test: /\.wasm$/,
                type: 'javascript/auto',
                loader: 'file-loader',
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
            },
        ],
    },
    devServer: {
        contentBase: './public',
        watchContentBase: true,
        inline: true,
        hot: isDevelopment,
        historyApiFallback: true,
        compress: true,
        hotOnly: true,
        lazy: false,
        overlay: true,
        liveReload: false,
    },
    experiments: {
        // syncWebAssembly: true,
        // asyncWebAssembly: true,
        topLevelAwait: true,
        asset: true,
    },
    plugins: [
        isDevelopment && new ReactRefreshWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
    ].filter(Boolean),
}
