import { describe, test } from 'vitest';
import './utils/code-matchers.js';
import { compile } from './compile.js';

const _ = () => {};
const __makeRenderer = _;
const property = _;'class';
describe.skip('arrow functions', () => {
    test('implicit return with single line template', ({ expect }) => {
        function template() {
            const Greeting = () => _`<span>hello world</span>`;
        }
    
        const compiled = compile(template.toCode());     
    
        expect(compiled).toMatchCode(() => {
            const Greeting = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<span>hello world</span>`);
        });
    });

    test('implicit return with multi line template', ({ expect }) => {
        function template() {
            const Greeting = () => _`
                <div>
                    <span>hello world</span>
                </div>
            `;
        }
    
        const compiled = compile(template.toCode());   
        
        expect(compiled).toMatchCode(() => {
            const Greeting = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<div>
                    <span>hello world</span>
                </div>`);
        });
    });
    
    test('simple block return with single line (becomes implicit)', ({ expect }) => {
        function template() {
            const Greeting = () => {
                return _`<span>hello world</span>`;
            };
        }
    
        const compiled = compile(template.toCode());     
    
        expect(compiled).toMatchCode(() => {
            const Greeting = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<span>hello world</span>`);
        });
    });
    
    test('simple block return with multi line (becomes implicit)', ({ expect }) => {
        function template() {
            const Greeting = () => {
                return _`
                    <div>
                        <span>hello world</span>
                    </div>
                `;
            };
        }
    
        const compiled = compile(template.toCode());     
    
        expect(compiled).toMatchCode(() => {
            const Greeting = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<div>
                        <span>hello world</span>
                    </div>`);
        });
    });

    test('implicit return with static value bind', ({ expect }) => {
        function template() {
            const Greeting = (style) => _`<span class=${style}>hello</span>`;
        }
    
        const compiled = compile(template.toCode());     
    
        expect(compiled).toMatchCode(() => {
            const Greeting = (style) => {
                const { __root, __nodes } = __render0();
                property(__nodes[0], 'class')(style);
                return __root;
            };
            var __render0 = __makeRenderer(`<span>hello</span>`);
        });
    });

});

describe.skip('function expressions', () => {

    test('single return statement with single line template', ({ expect }) => {
        function template() {
            const Greeting = function() {
                return _`
                    <div>
                        <span>hello world</span>
                    </div>
                `;
            };
        }
    
        const compiled = compile(template.toCode());   
        
        expect(compiled).toMatchCode(() => {
            const Greeting = function() {
                return __render0().__fragment;
            };
            var __render0 = __makeRenderer(`<div>
                        <span>hello world</span>
                    </div>`);
        });
    });

    test('multi line template with function expr return', ({ expect }) => {
        function template() {
            const Greeting = function() {
                return _`
                    <div>
                        <span>hello world</span>
                    </div>
                `;
            };
        }
    
        const compiled = compile(template.toCode());   
        
        expect(compiled).toMatchCode(() => {
            const Greeting = function() {
                return __render0().__fragment;
            };
            var __render0 = __makeRenderer(`<div>
                        <span>hello world</span>
                    </div>`);
        });
    });
});

