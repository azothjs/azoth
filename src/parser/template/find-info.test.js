import { beforeEach, describe, test, } from 'vitest';
import { findInfo } from './find-info.js';

test('fix for event properties', ({ expect }) => {
    // bug in property-information so we use wrapper
    // function to correct event property names.
    // https://github.com/wooorm/property-information/issues/18
    expect(findInfo('onclick')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "onclick",
        "property": "onclick",
        "space": "html",
      }
    `);
});

test('data- properties', ({ expect }) => {
    expect(findInfo('data-title')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "data-title",
        "property": "dataTitle",
      }
    `);
});

test('pin class/className behavior for "property-information" package ', ({ expect }) => {

    expect(findInfo('class')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "class",
        "property": "className",
        "space": "html",
        "spaceSeparated": true,
      }
    `);
    expect(findInfo('CLASS')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "class",
        "property": "className",
        "space": "html",
        "spaceSeparated": true,
      }
    `);
    expect(findInfo('Class')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "class",
        "property": "className",
        "space": "html",
        "spaceSeparated": true,
      }
    `);
    expect(findInfo('className')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "class",
        "property": "className",
        "space": "html",
        "spaceSeparated": true,
      }
    `);
    expect(findInfo('classname')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "class",
        "property": "className",
        "space": "html",
        "spaceSeparated": true,
      }
    `);
    
    expect(findInfo('class-name')).toMatchInlineSnapshot(`
      Info {
        "attribute": "class-name",
        "property": "class-name",
      }
    `);
});

test('for and htmlFor works as expected', ({ expect }) => {
    expect(findInfo('for')).toMatchInlineSnapshot(`
      DefinedInfo {
        "attribute": "for",
        "property": "htmlFor",
        "space": "html",
        "spaceSeparated": true,
      }
    `);
    expect(findInfo('html-for')).toMatchInlineSnapshot(`
      Info {
        "attribute": "html-for",
        "property": "html-for",
      }
    `);
});

