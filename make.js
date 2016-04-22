import { rollup } from 'rollup';
import buble from 'rollup-plugin-buble';
 
rollup({
  entry: 'main.js',
  plugins: [ buble() ]
}).then(...)