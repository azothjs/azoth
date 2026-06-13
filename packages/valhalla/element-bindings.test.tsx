/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * ELEMENT BINDING POSITION TESTS
 *
 * Azoth JSX templates can have bindings at different positions:
 * - Property on a CHILD element:  <header><img src={logo} /></header>
 * - Content on the ROOT element:  <h2>{title}</h2>
 *
 * These produce different internal template structures (tMap) and must be
 * handled correctly by the compiler. These tests verify both patterns work
 * at the API level.
 *
 * Related: packages/thoth/compiler.test.js "template key generation" tests
 * verify the compiler produces distinct keys for these patterns.
 *
 * See docs/topics/components.md and docs/topics/thoth-compiler.md for the
 * full mental model.
 */

import { describe, test } from 'vitest';

function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('element binding positions: root vs child', () => {

    test('property binding on CHILD element works', ({ expect }) => {
        const logo = 'logo.png';
        const Header = () => <header><img src={logo} alt="Logo" /></header>;

        const el = <Header /> as Element;

        // data-bind="" marker appears on elements with dynamic bindings
        expect(fixture(el)).toMatchInlineSnapshot(`"<header><img alt="Logo" data-bind="" src="logo.png"></header>"`);

        const img = el.querySelector('img');
        expect(img?.src).toContain('logo.png');
    });

    test('content binding on ROOT element works', ({ expect }) => {
        const CardTitle = ({ title }) => <h2 class="card-title">{title}</h2>;

        const el = <CardTitle title="Dashboard" />;

        expect(fixture(el)).toMatchInlineSnapshot(`"<h2 class="card-title">Dashboard<!--1--></h2>"`);

        expect(el.textContent).toBe('Dashboard');
    });

    test('both patterns work in same component', ({ expect }) => {
        const ProfileCard = ({ name, avatarUrl }) => (
            <div class="profile">
                <img src={avatarUrl} alt={name} />
                <span>{name}</span>
            </div>
        );

        const el = <ProfileCard name="Agent Smith" avatarUrl="avatar.jpg" />;

        expect(fixture(el)).toMatchInlineSnapshot(`"<div class="profile">
                <img data-bind="" src="avatar.jpg" alt="Agent Smith">
                <span data-bind="">Agent Smith<!--1--></span>
            </div>"`);
    });

    test('nested components with different binding positions', ({ expect }) => {
        const Title = ({ text }) => <h2>{text}</h2>;

        const Card = (props, childNodes) => (
            <div className={props?.class || 'card'}>{childNodes}</div>
        );

        const el = (
            <Card class="featured">
                <Title text="Featured Content" />
                <p>Some description here</p>
            </Card>
        );

        expect(fixture(el)).toMatchInlineSnapshot(`"<div class="featured"><h2>Featured Content<!--1--></h2><!--1-->
                <p>Some description here</p><!--1--></div>"`);
    });

    test('multiple bindings at different depths', ({ expect }) => {
        const DeepComponent = ({ a, b, c }) => (
            <div class="level-1">
                <div class="level-2">
                    <span>{a}</span>
                </div>
                <p>{b}</p>
                <footer data-value={c}>Footer</footer>
            </div>
        );

        const el = <DeepComponent a="deep" b="medium" c="attr" /> as Element;

        expect(fixture(el)).toMatchInlineSnapshot(`"<div class="level-1">
                <div class="level-2">
                    <span data-bind="">deep<!--1--></span>
                </div>
                <p data-bind="">medium<!--1--></p>
                <footer data-bind="" data-value="attr">Footer</footer>
            </div>"`);

        expect(el.querySelector('.level-2 span')?.textContent).toBe('deep');
        expect(el.querySelector('p')?.textContent).toBe('medium');
        expect(el.querySelector('footer')?.getAttribute('data-value')).toBe('attr');
    });

});
