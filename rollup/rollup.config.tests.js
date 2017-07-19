import resolve from 'rollup-plugin-node-resolve';
import azoth from 'rollup-plugin-azoth';

export default {
    entry: 'tests/index.js',
    format: 'umd',
    plugins: [
        resolve({ jsnext: true, module: true }),
        azoth()
    ],
    // sourceMap: true,
    dest: 'tests/build/test.js'
}; 