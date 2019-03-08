const path = require("path");

module.exports = {
    entry: {
        background: "./src/browser_scripts/background.ts",
        content: "./src/browser_scripts/content.ts"
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    }
};