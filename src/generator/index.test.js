/* eslint-disable no-undef */
import { Parser } from 'acorn';
import acornAz from '../parser';
import { azothGenerate as generate } from './index.js';
import '../utils/code-matchers.js';
import { describe, it } from 'vitest';
import { SourceMapGenerator } from 'source-map';

const AzParser = Parser.extend(acornAz());

const parse = code => {
    if(code.toBody) code = code.toBody();
    return AzParser.parse(code, {
        ecmaVersion: 'latest',
        locations: true,
    });
};

const transpile = input => {
    const ast = parse(input);
    const sourceMap = new SourceMapGenerator({ file: 'test.js' });
    const code = generate(ast, { sourceMap });
    return { code, map: sourceMap };
};

describe.skip('generator', () => {

    it.skip('generates from normal ast', ({ expect }) => {
        const t = () => {
            `hello ${place}`;
        }; 

        expect(transpile(t).code).toMatchInlineSnapshot(`
      "\`hello \${place}\`;
      "
    `);
    });

    it.skip('generates from azoth ast static template', ({ expect }) => {
        const t = () => {
            let t = _`az`;
        }; 

        const { code, map } = transpile(t);
    
        expect(code).toMatchInlineSnapshot(`
      "let t = (() => {
        const __renderer = __makeRenderer(\`az\`);
        const fn = () => {
          return __renderer().__root;
        };
        return fn;
      })();
      "
    `);

    // expect(map.toJSON()).toMatchInlineSnapshot(`
    //   {
    //     "file": "test.js",
    //     "mappings": "IAAIA,IAAIC;AAAAA,oCAAA,CAAE;AAAFA;AAAAA",
    //     "names": [
    //       "t",
    //       "_",
    //     ],
    //     "sources": [
    //       "test.js",
    //     ],
    //     "version": 3,
    //   }
    // `);
    });
});