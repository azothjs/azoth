/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * COMPONENT INVOCATION TESTS
 *
 * JSX invocation always passes a props object (empty {} if no attributes).
 * Direct function calls pass exactly what you give them.
 *
 *   <Component />        → props is {} (empty object, destructuring safe)
 *   Component()          → props is undefined
 *   <Component x={1}/>   → props is { x: 1 }
 *   Component({ x: 1 })  → props is { x: 1 }
 *
 * Key insight: JSX invocation enables safe destructuring. Direct calls do not.
 *
 * See docs/topics/components.md for the full discussion.
 */

import { describe, test } from 'vitest';

function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('component invocation: <Component/> vs Component()', () => {

    test('JSX invocation with NO props passes empty object', ({ expect }) => {
        let receivedProps: unknown = 'not called';

        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };

        <Inspector />;

        expect(receivedProps).toEqual({});
    });

    test('JSX invocation with props passes object with those props', ({ expect }) => {
        let receivedProps: unknown = 'not called';

        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };

        <Inspector foo="bar" count={42} />;

        expect(receivedProps).toEqual({ foo: 'bar', count: 42 });
    });

    test('direct function call with NO args passes undefined', ({ expect }) => {
        let receivedProps: unknown = 'not called';

        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };

        // @ts-expect-error Testing runtime behavior — TypeScript correctly flags missing arg
        Inspector();

        expect(receivedProps).toBeUndefined();
    });

    test('direct function call with object passes that object', ({ expect }) => {
        let receivedProps: unknown = 'not called';

        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };

        Inspector({ foo: 'bar' });

        expect(receivedProps).toEqual({ foo: 'bar' });
    });

    test('destructuring WORKS with JSX invocation (no defensive coding needed)', ({ expect }) => {
        const Greeting = ({ name = 'World' }) => (
            <p>Hello, {name}</p>
        );

        const el = <Greeting />;

        expect(fixture(el)).toMatchInlineSnapshot(`"<p>Hello, World<!--1--></p>"`);
    });

    test('destructuring WORKS when props are always provided', ({ expect }) => {
        const Greeting = ({ name = 'World' }) => (
            <p>Hello, {name}</p>
        );

        const el = <Greeting name="Azoth" />;

        expect(fixture(el)).toMatchInlineSnapshot(`"<p>Hello, Azoth<!--1--></p>"`);
    });

    test('destructuring WORKS with spread of object data', ({ expect }) => {
        const Profile = ({ name, market }) => (
            <div class="profile">{name} - {market}</div>
        );

        const data = { name: 'Agent Smith', market: 'Portland' };

        const el = <Profile {...data} />;

        expect(fixture(el)).toMatchInlineSnapshot(`"<div class="profile">Agent Smith<!--1--> - Portland<!--1--></div>"`);
    });

    test('direct call still needs defensive coding', ({ expect }) => {
        const Greeting = (props) => {
            const name = props?.name ?? 'World';
            return <p>Hello, {name}</p>;
        };

        // JSX invocation — works (props is {})
        expect(fixture(<Greeting />)).toMatchInlineSnapshot(`"<p>Hello, World<!--1--></p>"`);

        // Direct call — also works due to defensive coding (props is undefined)
        // @ts-expect-error Testing runtime behavior — TypeScript correctly flags missing arg
        expect(fixture(Greeting())).toMatchInlineSnapshot(`"<p>Hello, World<!--1--></p>"`);

        // With explicit props
        expect(fixture(<Greeting name="Azoth" />)).toMatchInlineSnapshot(`"<p>Hello, Azoth<!--1--></p>"`);
    });

    test('destructuring FAILS with direct call (not JSX)', ({ expect }) => {
        const Greeting = ({ name = 'World' }) => (
            <p>Hello, {name}</p>
        );

        // Direct call with no arguments — destructuring undefined throws
        // @ts-expect-error Testing runtime behavior — TypeScript correctly flags missing arg
        expect(() => Greeting()).toThrow(TypeError);
    });

});
