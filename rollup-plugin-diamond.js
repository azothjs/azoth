import compile from 'diamond-compiler';
import MagicString from 'magic-string';
import createFilter from 'rollup-pluginutils';

const node_modules = /node_modules/
const notInNodeModules = id => !node_modules.test(id);

const plugin = {
    transform(source, id) {
        if(node_modules.test(id)) return source;
        return compile(source);
    },
    name: 'diamond-compiler'
};

export default function(options = {}){
  const filter = options.include || options.exclude
    ? createFilter(options.include, options.exclude)
    : notInNodeModules
  
  return {
    transform(code, id){
      if (!filter(id)) return null;

      const s = new MagicString(code);
      const out = compile(code);
      s.overwrite(0, code.length, out);

      return  {
        code: s.toString(),
        map: s.generateMap({ hires: true })
      };
    }
  };
}