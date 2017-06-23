import compile from 'diamond-compiler';
import resolve from 'rollup-plugin-node-resolve';

const node_modules = /node_modules/
const plugin = {
    transform(source, id) {
        if(node_modules.test(id)) return source;
        return compile(source);
    },
    name: 'diamond-compiler'
};

export default {
    entry: 'src/index.js',
    format: 'umd',
    plugins: [
        resolve({ jsnext: true, module: true }),
        plugin
    ],
    // sourceMap: true,
    dest: 'build/bundle.js'
};