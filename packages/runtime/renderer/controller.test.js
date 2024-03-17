import { describe, test, beforeEach, beforeAll } from 'vitest';
import { compose } from '../compose/compose.js';
import {
    get,
    render,
    Controller,
    Updater,
    clearBind,
    RenderService,
} from './renderer.js';

describe('dom render', () => {
    beforeAll(() => {
        RenderService.useDOMEngine();
    });

    function getTargets(r, boundEls) {
        return [r.childNodes[0]];
    }

    const makeBind = targets => {
        const t0 = targets[0];
        return p0 => {
            compose(t0, p0);
        };
    };

    function renderDOM(p0) {
        const [root, bind] = render(
            'id',
            getTargets,
            makeBind,
            false,
            `<p data-bind><!--0--></p>`,
        );
        bind(p0);
        return root;
    }

    test('Controller.for', ({ expect }) => {
        const controller = Controller.for(name => renderDOM(name));

        let node1 = controller.render('felix');
        let node2 = controller.render('duchess');
        expect(node1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--1--></p>"`);
        expect(node2.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--1--></p>"`);

        controller.update(node1, 'garfield');
        controller.update(node2, 'stimpy');
        expect(node1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">garfield<!--1--></p>"`);
        expect(node2.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">stimpy<!--1--></p>"`);
    });

    test('inject unknown node creates bind', ({ expect }) => {
        const controller = Controller.for(name => renderDOM(name));
        let node = controller.render('felix');
        clearBind(node);
        controller.update(node, 'garfield');
        expect(node.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">garfield1<!--1--></p>"`);
    });

    test('Updater.for', ({ expect }) => {
        const updater = Updater.for(name => renderDOM(name));
        const node = updater.render('felix');
        expect(node.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--1--></p>"`);

        updater.update('duchess');
        expect(node.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--1--></p>"`);
    });

});

describe('html render', () => {
    const flatRender = node => node.flat().join('');

    beforeAll(() => {
        RenderService.useHTMLEngine();
    });

    function getTargets(r, boundEls) {
        return [boundEls[0]];
    }

    const makeBind = targets => {
        const t0 = targets[0];
        return p0 => {
            t0[0] = p0;
        };
    };
    function renderHTML(p0) {
        const [root, bind] = render(
            'id',
            getTargets,
            makeBind,
            false,
            [`<p data-bind>`, `</p>`],
        );
        bind(p0);
        return root;
    }

    test('Controller.for', ({ expect }) => {
        const controller = Controller.for(name => renderHTML(name));

        let node1 = controller.render('felix');
        let node2 = controller.render('duchess');
        expect(flatRender(node1)).toMatchInlineSnapshot(
            `"<p data-bind>felix</p>"`
        );
        expect(flatRender(node2)).toMatchInlineSnapshot(
            `"<p data-bind>duchess</p>"`
        );

        controller.update(node1, 'garfield');
        controller.update(node2, 'stimpy');
        expect(flatRender(node1)).toMatchInlineSnapshot(
            `"<p data-bind>garfield</p>"`
        );
        expect(flatRender(node2)).toMatchInlineSnapshot(
            `"<p data-bind>stimpy</p>"`
        );
    });

    test('inject unknown node', ({ expect }) => {
        const controller = Controller.for(name => renderHTML(name));
        let node = controller.render('felix');
        clearBind(node);
        controller.update(node, 'garfield');
        expect(flatRender(node)).toMatchInlineSnapshot(`"<p data-bind>garfield</p>"`);
    });

    test('Updater.for', ({ expect }) => {
        const updater = Updater.for(name => renderHTML(name));
        const node = updater.render('felix');
        expect(flatRender(node)).toMatchInlineSnapshot(
            `"<p data-bind>felix</p>"`
        );

        updater.update('duchess');
        expect(flatRender(node)).toMatchInlineSnapshot(
            `"<p data-bind>duchess</p>"`
        );
    });

});

