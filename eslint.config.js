import js from '@eslint/js';
import globals from 'globals';
import { Parser as AcornParser } from 'acorn';
import azoth from './src/parser/index.js';
import espree from 'espree/lib/espree.js';
import { VisitorKeys } from 'espree';

const acornOptions = { 
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    ranges: true,
    comments: true,
};

const espreeOptions = {
    loc: true,
    range: true,
    tokens: true,
    comment: true,
};

const AzothEspreeParser = AcornParser.extend(azoth(), espree());

const parser = {
    meta: {
        name: 'eslint-parser-azoth',
        version: '0.0.0'
    },
    visitorKeys: {
        ...VisitorKeys,
        DomTemplateLiteral: ['expressions', 'elements', 'binders'],
        ChildBinder: ['interpolator'],
        PropertyBinder: ['interpolator'],
        TemplateInterpolator: [],
        DomTemplateElement: [],
    },
    parseForESLint(code, options) {
        const ast = AzothEspreeParser.parse(code, {
            ...acornOptions,
            ...options,
        });
        return {
            ast,
        };
    }
};

export default [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        // linterOptions: {
        //     reportUnusedDisableDirectives: 'warn'
        // },
        languageOptions: {
            globals: {
                ...globals.browser
            },
        },
        rules: {
            eqeqeq: [
                'error',
                'always'
            ],
            'no-console': 'warn',
            indent: [
                'error',
                4,
                {
                    SwitchCase: 1,
                    ignoreComments: true
                }
            ],
            quotes: [
                'error',
                'single',
                {
                    avoidEscape: true,
                    allowTemplateLiterals: true
                }
            ],
            'no-multi-spaces': [
                'error',
                {
                    ignoreEOLComments: true
                }
            ],
            'new-cap': [
                'error',
                {
                    capIsNew: false
                }
            ],
            'no-redeclare': [
                'error',
                {
                    builtinGlobals: true
                }
            ],
            semi: [
                'error',
                'always'
            ],
            'space-in-parens': [
                'error'
            ],
            'space-infix-ops': 'error',
            'object-curly-spacing': [
                'error',
                'always'
            ],
            'comma-spacing': 'error',
            'space-before-function-paren': [
                'error',
                {
                    anonymous: 'never',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ],
            'keyword-spacing': [
                'error',
                {
                    before: true,
                    after: true,
                    overrides: {
                        if: {
                            after: false
                        },
                        for: {
                            after: false
                        },
                        while: {
                            after: false
                        },
                        switch: {
                            after: false
                        }
                    }
                }
            ],
            'array-bracket-spacing': 'error',
            'no-unused-vars': 'off'
        }
    },
    {
        files: ['src/www/*.js'],
        languageOptions: {
            parser
        },
    }
];

