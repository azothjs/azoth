import resolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'src/azoth.js',
    plugins: [
        resolve({ jsnext: true, module: true })
    ],
    // sourceMap: true
};