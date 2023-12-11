import { expect, describe, test } from 'vitest';
import './utils/code-matchers.js';
import { compile } from './compile.js';

const _ = () => {};
const __makeRenderer = _;
const property = _;'class';
describe('arrow functions', () => {
    test('implicit return with single line template', () => {
        function template() {
            const template = () => _`<span>hello world</span>`;
        }
    
        const compiled = compile(template.toCode());     
    
        expect(compiled).toMatchCode(() => {
            const template = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<span>hello world</span>`);
        });
    });

    test('implicit return with multi line template', () => {
        function template() {
            const template = () => _`
                <div>
                    <span>hello world</span>
                </div>
            `;
        }
    
        const compiled = compile(template.toCode());   
        
        expect(compiled).toMatchCode(() => {
            const template = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<div>
                    <span>hello world</span>
                </div>`);
        });
    });
    
    test('simple block return with single line (becomes implicit)', () => {
        function template() {
            const template = () => {
                return _`<span>hello world</span>`;
            };
        }
    
        const compiled = compile(template.toCode());     
    
        expect(compiled).toMatchCode(() => {
            const template = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<span>hello world</span>`);
        });
    });
    
    test('simple block return with multi line (becomes implicit)', () => {
        function template() {
            const template = () => {
                return _`
                    <div>
                        <span>hello world</span>
                    </div>
                `;
            };
        }
    
        const compiled = compile(template.toCode());     
    
        expect(compiled).toMatchCode(() => {
            const template = () => __render0().__fragment;
            var __render0 = __makeRenderer(`<div>
                        <span>hello world</span>
                    </div>`);
        });
    });

});

describe('function expressions', () => {

    test('single return statement with single line template', () => {
        function template() {
            const template = function() {
                return _`
                    <div>
                        <span>hello world</span>
                    </div>
                `;
            };
        }
    
        const compiled = compile(template.toCode());   
        
        expect(compiled).toMatchCode(() => {
            const template = function() {
                return __render0().__fragment;
            };
            var __render0 = __makeRenderer(`<div>
                        <span>hello world</span>
                    </div>`);
        });
    });

    test('multi line template with function expr return', () => {
        function template() {
            const template = function() {
                return _`
                    <div>
                        <span>hello world</span>
                    </div>
                `;
            };
        }
    
        const compiled = compile(template.toCode());   
        
        expect(compiled).toMatchCode(() => {
            const template = function() {
                return __render0().__fragment;
            };
            var __render0 = __makeRenderer(`<div>
                        <span>hello world</span>
                    </div>`);
        });
    });
});

