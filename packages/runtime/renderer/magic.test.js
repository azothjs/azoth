import { describe, test } from 'vitest';
import { compose } from '../compose/compose.js';
import { makeRenderer, makeTemplate, Controller, Updater, makeStringRenderer } from './renderer.js';

// template generated artifacts
const source = makeRenderer('id', `<p data-bind><!--0--></p>`);
const stringSource = makeStringRenderer('id', [`<p data-bind>`, `</p>`]);

function getTargets(r, boundEls) {
    return [r.childNodes[0]];
}

const makeBind = targets => {
    const t0 = targets[0];
    return p0 => {
        compose(t0, p0);
    };
};

function getStringTargets(r, boundEls) {
    return [boundEls[0]];
}

const makeStringBind = targets => {
    const t0 = targets[0];
    return p0 => {
        t0[0] = p0;
    };
};
function render123(p0) {
    const [root, bind] = makeTemplate(
        source,
        getTargets,
        makeBind
    );
    bind(p0);
    return root;
}
function renderString(p0) {
    const [root, bind] = makeTemplate(
        stringSource,
        getStringTargets,
        makeStringBind
    );
    bind(p0);
    return root;
}
/*
const NameTag = Controller.for(({ greeting, name }) => {
    const Greeting = Controller.for(greeting => <span>{greeting}</span>);

    return <p>
        <Greeting greeting={greeting} /> {name}
    </p>;
});

const Hello = Controller.for(name => <p>{name}</p>);
*/
describe('string render', () => {
    const flatRender = node => node.flat().join('');
    test('Controller.for', ({ expect }) => {
        const controller = Controller.for(name => renderString(name));

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

    test('Updater.for', ({ expect }) => {
        const updater = Updater.for(name => renderString(name));
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
describe('dom render', () => {

    test('Controller.for', ({ expect }) => {
        const controller = Controller.for(name => render123(name));

        let node1 = controller.render('felix');
        let node2 = controller.render('duchess');
        expect(node1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--1--></p>"`);
        expect(node2.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--1--></p>"`);

        controller.update(node1, 'garfield');
        controller.update(node2, 'stimpy');
        expect(node1.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">garfield<!--1--></p>"`);
        expect(node2.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">stimpy<!--1--></p>"`);
    });

    test('Updater.for', ({ expect }) => {
        const updater = Updater.for(name => render123(name));
        const node = updater.render('felix');
        expect(node.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">felix<!--1--></p>"`);

        updater.update('duchess');
        expect(node.outerHTML).toMatchInlineSnapshot(`"<p data-bind="">duchess<!--1--></p>"`);
    });

});
