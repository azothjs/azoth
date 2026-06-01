/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * COMPONENT TESTS
 * 
 * Tests for Azoth component patterns, especially where they differ from React.
 * 
 * Key differences from React:
 * - JSX returns DOM elements, not virtual DOM
 * - Components are regular functions that return DOM
 * - <Component/> vs Component() have different behavior (see invocation tests)
 * - class={var} doesn't work; use className={var} for dynamic classes
 */

import { describe, test } from 'vitest';

// Render helper: clears body, appends node, returns innerHTML
function fixture(node: Node): string {
    document.body.innerHTML = '';
    document.body.append(node);
    return document.body.innerHTML;
}

describe('slottable with nested components', () => {

    // Slottable is Azoth's mechanism for passing children to components.
    // Unlike React's props.children, it's the second parameter: (props, slottable)
    // This test verifies slottable works with nested components and dynamic props.

    test('nested components with slottable and dynamic props', ({ expect }) => {
        // Slottable components for testing
        const Card = (props, slottable) => <div class="card">{slottable}</div>;
        const CardTitle = ({ title }) => <h2 class="card-title">{title}</h2>;
        
        // Wrapper component receives slottable children
        // Inner component receives props that flow through from outer
        const StatsCard = ({ title }) => (
            <Card>
                <CardTitle title={title} />
                <div class="stats-content">Content here</div>
            </Card>
        );
        
        const el = <StatsCard title="Dashboard Stats" />;
        
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="card"><h2 class="card-title">Dashboard Stats<!--1--></h2><!--1-->
                <div class="stats-content">Content here</div><!--1--></div>"`
        );
    });

});

describe('dynamic class attributes', () => {

    test('class={var} does NOT work - uses attribute name not property name', ({ expect }) => {
        // This demonstrates the known limitation: dynamic bindings need DOM property names
        const Box = ({ class: className }) => (
            <div class={className}>content</div>
        );
        
        const el = <Box class="highlighted" />;
        
        // BUG: class attribute missing because element["class"] doesn't work
        expect(fixture(el)).toMatchInlineSnapshot(/* HTML */ `"<div>content</div>"`);
    });

    test('className={var} DOES work - uses DOM property name', ({ expect }) => {
        // Correct approach: use className for dynamic class bindings
        const Box = ({ className }) => (
            <div className={className}>content</div>
        );
        
        const el = <Box className="highlighted" />;
        
        // Works because element.className = value
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="highlighted">content</div>"`
        );
    });

});

// ============================================================================
// COMPONENT INVOCATION: <Component/> vs Component()
// ============================================================================
//
// JSX invocation always passes a props object (empty {} if no attributes).
// Direct function calls pass exactly what you give them.
//
// BEHAVIOR:
// - <Component />       → props is {} (empty object, destructuring safe)
// - Component()         → props is undefined (just JavaScript)
// - <Component x={1}/>  → props is { x: 1 }
// - Component({ x: 1 }) → props is { x: 1 }
//
// KEY INSIGHT: JSX invocation enables safe destructuring. Direct calls do not.

describe('component invocation: <Component/> vs Component()', () => {

    test('JSX invocation with NO props passes empty object', ({ expect }) => {
        // JSX always passes a props object, even when no attributes specified.
        // This enables safe destructuring in component signatures.
        
        let receivedProps: unknown = 'not called';
        
        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };
        
        // JSX invocation with no props
        <Inspector />;
        
        // Props is empty object, NOT undefined
        expect(receivedProps).toEqual({});
    });

    test('JSX invocation with props passes object with those props', ({ expect }) => {
        let receivedProps: unknown = 'not called';
        
        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };
        
        <Inspector foo="bar" count={42} />;
        
        // When attributes are present, props is an object with those values
        expect(receivedProps).toEqual({ foo: 'bar', count: 42 });
    });

    test('direct function call with NO args passes undefined', ({ expect }) => {
        // Direct function calls bypass JSX compilation.
        // The function receives exactly what you pass - nothing means undefined.
        
        let receivedProps: unknown = 'not called';
        
        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };
        
        // Direct call with no arguments
        // @ts-expect-error Testing runtime behavior - TypeScript correctly flags missing arg
        Inspector();
        
        // Props is undefined - this is just JavaScript
        expect(receivedProps).toBeUndefined();
    });

    test('direct function call with object passes that object', ({ expect }) => {
        let receivedProps: unknown = 'not called';
        
        const Inspector = (props) => {
            receivedProps = props;
            return <div>inspector</div>;
        };
        
        // Direct call with explicit object
        Inspector({ foo: 'bar' });
        
        expect(receivedProps).toEqual({ foo: 'bar' });
    });

    test('destructuring WORKS with JSX invocation (no defensive coding needed)', ({ expect }) => {
        // Because <Component /> passes {}, destructuring is safe.
        
        const Greeting = ({ name = 'World' }) => (
            <p>Hello, {name}</p>
        );
        
        // JSX with no attributes - destructuring works!
        const el = <Greeting />;
        
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<p>Hello, World<!--1--></p>"`
        );
    });

    test('destructuring WORKS when props are always provided', ({ expect }) => {
        // Destructuring is safe IF you ensure props are always passed.
        
        const Greeting = ({ name = 'World' }) => (
            <p>Hello, {name}</p>
        );
        
        // With explicit props - destructuring works
        const el = <Greeting name="Azoth" />;
        
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<p>Hello, Azoth<!--1--></p>"`
        );
    });

    test('destructuring WORKS with spread of object data', ({ expect }) => {
        // Common pattern: API returns object, spread as props
        
        const Profile = ({ name, market }) => (
            <div class="profile">{name} - {market}</div>
        );
        
        // Simulating API response
        const data = { name: 'Agent Smith', market: 'Portland' };
        
        // Spread passes the object - destructuring works
        const el = <Profile {...data} />;
        
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="profile">Agent Smith<!--1--> - Portland<!--1--></div>"`
        );
    });

    test('direct call still needs defensive coding', ({ expect }) => {
        // Direct function calls bypass JSX - props is undefined.
        // Use defensive coding only if supporting direct calls.
        
        const Greeting = (props) => {
            const name = props?.name ?? 'World';
            return <p>Hello, {name}</p>;
        };
        
        // JSX invocation - works (props is {})
        expect(fixture(<Greeting />)).toMatchInlineSnapshot(
            /* HTML */ `"<p>Hello, World<!--1--></p>"`
        );
        
        // Direct call - also works due to defensive coding (props is undefined)
        // @ts-expect-error Testing runtime behavior - TypeScript correctly flags missing arg
        expect(fixture(Greeting())).toMatchInlineSnapshot(
            /* HTML */ `"<p>Hello, World<!--1--></p>"`
        );
        
        // With explicit props
        expect(fixture(<Greeting name="Azoth" />)).toMatchInlineSnapshot(
            /* HTML */ `"<p>Hello, Azoth<!--1--></p>"`
        );
    });

    test('destructuring FAILS with direct call (not JSX)', ({ expect }) => {
        // Direct function calls bypass JSX compilation.
        // Without the {} that JSX provides, destructuring throws.
        
        const Greeting = ({ name = 'World' }) => (
            <p>Hello, {name}</p>
        );
        
        // Direct call with no arguments - destructuring undefined throws!
        // @ts-expect-error Testing runtime behavior - TypeScript correctly flags missing arg
        expect(() => Greeting()).toThrow(TypeError);
    });

});

// ============================================================================
// PROPS PATTERNS SUMMARY
// ============================================================================
//
// JSX invocation always passes a props object, so destructuring is safe:
//
//   const ProfileView = ({ name, market }) => <div>{name}</div>;
//   <ProfileView />           // props is {} - destructuring works
//   <ProfileView name="Jo" /> // props is { name: "Jo" }
//
// Direct function calls bypass JSX and pass undefined:
//
//   ProfileView()             // props is undefined - destructuring throws!
//
// RECOMMENDATION: Use JSX invocation for components. Destructuring is safe.
// Reserve direct calls for utilities, and use defensive coding if needed.

// ============================================================================
// ELEMENT BINDING POSITIONS: Root vs Child
// ============================================================================
//
// Azoth JSX templates can have bindings at different positions:
// - Property on a CHILD element:  <header><img src={logo} /></header>
// - Content on the ROOT element:  <h2>{title}</h2>
//
// These produce different internal template structures (tMap) and must be
// handled correctly by the compiler. These tests verify both patterns work
// at the API level.
//
// Related: packages/thoth/compiler.test.js "template key generation" tests
// verify the compiler produces distinct keys for these patterns.

describe('element binding positions: root vs child', () => {

    test('property binding on CHILD element works', ({ expect }) => {
        // Pattern: <parent><child prop={value} /></parent>
        // The binding targets a child element's property
        
        const logo = 'logo.png';
        const Header = () => <header><img src={logo} alt="Logo" /></header>;
        
        // Assert as Element to use querySelector below
        const el = <Header /> as Element;
        
        // Note: data-bind="" marker appears on elements with dynamic bindings
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<header><img alt="Logo" data-bind="" src="logo.png"></header>"`
        );
        
        // Verify the binding actually worked
        const img = el.querySelector('img');
        expect(img?.src).toContain('logo.png');
    });

    test('content binding on ROOT element works', ({ expect }) => {
        // Pattern: <element>{content}</element>
        // The binding targets the root element's child content
        
        const CardTitle = ({ title }) => <h2 class="card-title">{title}</h2>;
        
        const el = <CardTitle title="Dashboard" />;
        
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<h2 class="card-title">Dashboard<!--1--></h2>"`
        );
        
        expect(el.textContent).toBe('Dashboard');
    });

    test('both patterns work in same component', ({ expect }) => {
        // Complex component with both binding types
        
        const ProfileCard = ({ name, avatarUrl }) => (
            <div class="profile">
                <img src={avatarUrl} alt={name} />
                <span>{name}</span>
            </div>
        );
        
        const el = <ProfileCard name="Agent Smith" avatarUrl="avatar.jpg" />;
        
        // Note: data-bind="" markers on elements with dynamic bindings
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="profile">
                <img data-bind="" src="avatar.jpg" alt="Agent Smith">
                <span data-bind="">Agent Smith<!--1--></span>
            </div>"`
        );
    });

    test('nested components with different binding positions', ({ expect }) => {
        // Inner component: content binding on root
        const Title = ({ text }) => <h2>{text}</h2>;
        
        // Outer component: property binding on child + slottable
        const Card = (props, slottable) => (
            <div className={props?.class || 'card'}>{slottable}</div>
        );
        
        const el = (
            <Card class="featured">
                <Title text="Featured Content" />
                <p>Some description here</p>
            </Card>
        );
        
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="featured"><h2>Featured Content<!--1--></h2><!--1-->
                <p>Some description here</p><!--1--></div>"`
        );
    });

    test('multiple bindings at different depths', ({ expect }) => {
        // Tests template keying when multiple bindings exist at different levels
        
        const DeepComponent = ({ a, b, c }) => (
            <div class="level-1">
                <div class="level-2">
                    <span>{a}</span>
                </div>
                <p>{b}</p>
                <footer data-value={c}>Footer</footer>
            </div>
        );
        
        // Assert as Element to use querySelector below
        const el = <DeepComponent a="deep" b="medium" c="attr" /> as Element;
        
        // Note: data-bind="" markers on elements with dynamic bindings
        expect(fixture(el)).toMatchInlineSnapshot(
            /* HTML */ `"<div class="level-1">
                <div class="level-2">
                    <span data-bind="">deep<!--1--></span>
                </div>
                <p data-bind="">medium<!--1--></p>
                <footer data-bind="" data-value="attr">Footer</footer>
            </div>"`
        );
        
        // Verify each binding worked
        expect(el.querySelector('.level-2 span')?.textContent).toBe('deep');
        expect(el.querySelector('p')?.textContent).toBe('medium');
        expect(el.querySelector('footer')?.getAttribute('data-value')).toBe('attr');
    });

});
