import resolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'src/index.js',
    format: 'umd',
    plugins: [
        resolve({ jsnext: true, module: true })
    ],
    sourceMap: true,
    dest: 'build/bundle.js'
};