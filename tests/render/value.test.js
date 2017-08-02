import { module, test, fixture } from '../qunit';
import { html as _ } from '../../src/azoth';

module('value rendering', () => {

    test('hello azoth', t => {
        const template = name => _`<span>Hello ${name}!</span>`;
        const fragment = template('azoth');
        t.notOk(fragment.unsubscribe);
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<span>Hello azoth!</span>');
    });

    test('expression', t => {
        const template = (x, y) => _`${x} + ${y} = ${x + y}`;
                
        const fragment1 = template(5, 2);
        fixture.appendChild(fragment1);		
        t.equal(fixture.cleanHTML(), '5 + 2 = 7');

    });

    test('attribute', t => {
        const template = foo => _`<span class=${foo}></span>`;
       
        const fragment1 = template('foo');
        fixture.appendChild(fragment1);		
        t.equal(fixture.cleanHTML(), '<span class="foo"></span>');

    });

    test('external variables', t => {
        const upper = s => s.toUpperCase();
        const template = x => _`${upper(x)}`;

        const fragment = template('foo');
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), 'FOO');
    });

    test('block', t => {
        const template = () => _`<div>${_`<span>foo</span>`}#</div>`;

        const fragment = template();
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<div><span>foo</span></div>');
    });

    test('conditional block with variables', t => {
        const yes = _`<span>Yes</span>`;
        const no = _`<span>No</span>`;
        const template = choice => _`${choice ? yes : no}#`;

        const fragment = template(true);
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<span>Yes</span>');
    });

    test('block with array', t => {
        const template = items => _`
            <ul>
                ${items.map(({ name }) => _`
                    <li>${name}</li>	
                `)}#
            </ul>
        `;

        const items = [
            { name: 'balloon' },
            { name: 'hammer' },
            { name: 'lipstick' },
        ];

        const fragment = template(items);
        fixture.appendChild(fragment);
        
        t.contentEqual(fixture.cleanHTML(), `
            <ul>
                <li>balloon</li>
                <li>hammer</li>
                <li>lipstick</li>
            </ul>
        `);
    });


    test('component', t => {
        const Component = {
            span: null,
            onanchor(anchor) {
                const span = this.span = document.createElement('SPAN');
                span.textContent = 'Hello Component';
                anchor.parentNode.insertBefore(span, anchor);
            },
            unsubscribe() {
                this.span && this.span.remove();
            }
        };

        const template = () => _`<div><#:${Component}/></div>`;

        const fragment = template();
        fixture.appendChild(fragment);
        t.equal(fixture.cleanHTML(), '<div><!-- component start --><span>Hello Component</span><!-- component end --></div>');
        fragment.unsubscribe();
        t.equal(fixture.cleanHTML(), '<div><!-- component start --><!-- component end --></div>');

    });


});