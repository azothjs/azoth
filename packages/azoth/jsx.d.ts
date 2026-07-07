/**
 * Azoth JSX Type Definitions
 *
 * Azoth JSX produces "DOM literals" - actual DOM elements, not virtual DOM.
 * `<p>hello</p>` yields an HTMLParagraphElement, not a React component.
 *
 * These type definitions leverage TypeScript's built-in lib.dom.d.ts types
 * to provide accurate intellisense for Azoth JSX.
 */

import type { Channel } from '@azothjs/maya/channels';
import type { Input, Component } from '@azothjs/maya/compose';

// maya's Composable — everything compose() accepts: a {…} slot value, or a
// component's return. (DOMChild was the child subset; this is the full set,
// mirroring compose's own dispatch.)
type Composable =
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | Node
    | Channel
    | Input                              // { initial?, from, append? }
    // Anything with render() — compose's render branch needs only that;
    // update() is the ADDITIONAL change-channel verb (see UIComponent).
    // Structural, so render-only classes/objects are Composable too.
    | { render(): Composable }
    | Promise<Composable>
    | AsyncIterable<Composable>
    | ReadableStream
    | ((props?: any, childNodes?: Node) => Composable)  // function / rerenderable
    | Composable[];

type DOMChild = Composable;

// Properties to exclude from element attributes
type ExcludedProps = "children";

// Get writable properties from an element, excluding functions and specific props
type WritableElementProps<T> = {
    [
        K in keyof T as K extends ExcludedProps ? never
            : K extends string ? (T[K] extends Function ? never : K)
            : never
    ]?: T[K];
};

// HTML attributes that differ from DOM properties
// Azoth supports both HTML attributes (class, for) and DOM properties (className, htmlFor)
type HTMLAttributeAliases = {
    class?: string; // HTML attribute (alias for className)
    for?: string; // HTML attribute (alias for htmlFor)
};

// Combined props for an intrinsic element
type IntrinsicElementProps<T> =
    & WritableElementProps<T>
    & HTMLAttributeAliases
    & {
        children?: DOMChild;
    };

// Custom elements (hyphenated tags) are author-defined, so props are open.
// Matched via a template-literal index key (below) so ONLY hyphenated tags
// resolve to this — an unknown NON-hyphenated tag (e.g. an HTML typo) still
// errors. Authors can augment a specific tag with precise props if they want.
type CustomElementProps = {
    children?: DOMChild;
    [prop: string]: any;
};

// SVG attributes are authored as strings/numbers, but the DOM reflects them as
// SVGAnimated* objects — so reusing the element interfaces here would reject
// `viewBox="0 0 10 10"` or `r={5}`. Open for now; precise SVG attribute typing
// is a deferred refinement (a hand-rolled attribute map, React-style).
type SVGElementProps = {
    children?: DOMChild;
    [attr: string]: any;
};

declare global {
    namespace JSX {
        // JSX expressions evaluate to DOM Nodes
        // Specific element types require assertion: <p>hi</p> as HTMLParagraphElement
        // Future: TypeScript contribution for per-tag return types
        type Element = Node;

        // What may be used as a JSX tag: an intrinsic/custom-element string tag;
        // null/undefined (a conditional no-op — `<C/>` where C is null); a
        // function or class component (returns a Composable, including a
        // rerenderable, which is why `() => rerenderer(...)` typechecks); or a
        // Component object (create()'s full { initialize?, render, update }).
        // Components are invoked `(props, childNodes)` — childNodes is the
        // JSX content COMPOSED to one Node: the element itself for a single
        // child, a DocumentFragment for several/text/{expr}, absent for none.
        // (Pinned: valhalla/child-nodes.test.tsx.)
        type ElementType =
            | string                                               // intrinsic + custom-element tags
            | null | undefined                                     // conditional no-op: <C/> where C is null
            | ((props?: any, childNodes?: Node) => Composable)     // function component
            | (new (props?: any, childNodes?: Node) => Composable) // class component
            | Component;                                           // object component (full lifecycle)

        // Children attribute
        interface ElementChildrenAttribute {
            children: {};
        }

        // Intrinsic elements: HTML + SVG
        interface IntrinsicElements {
            // HTML Elements
            a: IntrinsicElementProps<HTMLAnchorElement>;
            abbr: IntrinsicElementProps<HTMLElement>;
            address: IntrinsicElementProps<HTMLElement>;
            area: IntrinsicElementProps<HTMLAreaElement>;
            article: IntrinsicElementProps<HTMLElement>;
            aside: IntrinsicElementProps<HTMLElement>;
            audio: IntrinsicElementProps<HTMLAudioElement>;
            b: IntrinsicElementProps<HTMLElement>;
            base: IntrinsicElementProps<HTMLBaseElement>;
            bdi: IntrinsicElementProps<HTMLElement>;
            bdo: IntrinsicElementProps<HTMLElement>;
            blockquote: IntrinsicElementProps<HTMLQuoteElement>;
            body: IntrinsicElementProps<HTMLBodyElement>;
            br: IntrinsicElementProps<HTMLBRElement>;
            button: IntrinsicElementProps<HTMLButtonElement>;
            canvas: IntrinsicElementProps<HTMLCanvasElement>;
            caption: IntrinsicElementProps<HTMLTableCaptionElement>;
            cite: IntrinsicElementProps<HTMLElement>;
            code: IntrinsicElementProps<HTMLElement>;
            col: IntrinsicElementProps<HTMLTableColElement>;
            colgroup: IntrinsicElementProps<HTMLTableColElement>;
            data: IntrinsicElementProps<HTMLDataElement>;
            datalist: IntrinsicElementProps<HTMLDataListElement>;
            dd: IntrinsicElementProps<HTMLElement>;
            del: IntrinsicElementProps<HTMLModElement>;
            details: IntrinsicElementProps<HTMLDetailsElement>;
            dfn: IntrinsicElementProps<HTMLElement>;
            dialog: IntrinsicElementProps<HTMLDialogElement>;
            div: IntrinsicElementProps<HTMLDivElement>;
            dl: IntrinsicElementProps<HTMLDListElement>;
            dt: IntrinsicElementProps<HTMLElement>;
            em: IntrinsicElementProps<HTMLElement>;
            embed: IntrinsicElementProps<HTMLEmbedElement>;
            fieldset: IntrinsicElementProps<HTMLFieldSetElement>;
            figcaption: IntrinsicElementProps<HTMLElement>;
            figure: IntrinsicElementProps<HTMLElement>;
            footer: IntrinsicElementProps<HTMLElement>;
            form: IntrinsicElementProps<HTMLFormElement>;
            h1: IntrinsicElementProps<HTMLHeadingElement>;
            h2: IntrinsicElementProps<HTMLHeadingElement>;
            h3: IntrinsicElementProps<HTMLHeadingElement>;
            h4: IntrinsicElementProps<HTMLHeadingElement>;
            h5: IntrinsicElementProps<HTMLHeadingElement>;
            h6: IntrinsicElementProps<HTMLHeadingElement>;
            head: IntrinsicElementProps<HTMLHeadElement>;
            header: IntrinsicElementProps<HTMLElement>;
            hgroup: IntrinsicElementProps<HTMLElement>;
            hr: IntrinsicElementProps<HTMLHRElement>;
            html: IntrinsicElementProps<HTMLHtmlElement>;
            i: IntrinsicElementProps<HTMLElement>;
            iframe: IntrinsicElementProps<HTMLIFrameElement>;
            img: IntrinsicElementProps<HTMLImageElement>;
            input: IntrinsicElementProps<HTMLInputElement>;
            ins: IntrinsicElementProps<HTMLModElement>;
            kbd: IntrinsicElementProps<HTMLElement>;
            label: IntrinsicElementProps<HTMLLabelElement>;
            legend: IntrinsicElementProps<HTMLLegendElement>;
            li: IntrinsicElementProps<HTMLLIElement>;
            link: IntrinsicElementProps<HTMLLinkElement>;
            main: IntrinsicElementProps<HTMLElement>;
            map: IntrinsicElementProps<HTMLMapElement>;
            mark: IntrinsicElementProps<HTMLElement>;
            menu: IntrinsicElementProps<HTMLMenuElement>;
            meta: IntrinsicElementProps<HTMLMetaElement>;
            meter: IntrinsicElementProps<HTMLMeterElement>;
            nav: IntrinsicElementProps<HTMLElement>;
            noscript: IntrinsicElementProps<HTMLElement>;
            object: IntrinsicElementProps<HTMLObjectElement>;
            ol: IntrinsicElementProps<HTMLOListElement>;
            optgroup: IntrinsicElementProps<HTMLOptGroupElement>;
            option: IntrinsicElementProps<HTMLOptionElement>;
            output: IntrinsicElementProps<HTMLOutputElement>;
            p: IntrinsicElementProps<HTMLParagraphElement>;
            picture: IntrinsicElementProps<HTMLPictureElement>;
            pre: IntrinsicElementProps<HTMLPreElement>;
            progress: IntrinsicElementProps<HTMLProgressElement>;
            q: IntrinsicElementProps<HTMLQuoteElement>;
            rp: IntrinsicElementProps<HTMLElement>;
            rt: IntrinsicElementProps<HTMLElement>;
            ruby: IntrinsicElementProps<HTMLElement>;
            s: IntrinsicElementProps<HTMLElement>;
            samp: IntrinsicElementProps<HTMLElement>;
            script: IntrinsicElementProps<HTMLScriptElement>;
            section: IntrinsicElementProps<HTMLElement>;
            select: IntrinsicElementProps<HTMLSelectElement>;
            slot: IntrinsicElementProps<HTMLSlotElement>;
            small: IntrinsicElementProps<HTMLElement>;
            source: IntrinsicElementProps<HTMLSourceElement>;
            span: IntrinsicElementProps<HTMLSpanElement>;
            strong: IntrinsicElementProps<HTMLElement>;
            style: IntrinsicElementProps<HTMLStyleElement>;
            sub: IntrinsicElementProps<HTMLElement>;
            summary: IntrinsicElementProps<HTMLElement>;
            sup: IntrinsicElementProps<HTMLElement>;
            table: IntrinsicElementProps<HTMLTableElement>;
            tbody: IntrinsicElementProps<HTMLTableSectionElement>;
            td: IntrinsicElementProps<HTMLTableCellElement>;
            template: IntrinsicElementProps<HTMLTemplateElement>;
            textarea: IntrinsicElementProps<HTMLTextAreaElement>;
            tfoot: IntrinsicElementProps<HTMLTableSectionElement>;
            th: IntrinsicElementProps<HTMLTableCellElement>;
            thead: IntrinsicElementProps<HTMLTableSectionElement>;
            time: IntrinsicElementProps<HTMLTimeElement>;
            title: IntrinsicElementProps<HTMLTitleElement>;
            tr: IntrinsicElementProps<HTMLTableRowElement>;
            track: IntrinsicElementProps<HTMLTrackElement>;
            u: IntrinsicElementProps<HTMLElement>;
            ul: IntrinsicElementProps<HTMLUListElement>;
            var: IntrinsicElementProps<HTMLElement>;
            video: IntrinsicElementProps<HTMLVideoElement>;
            wbr: IntrinsicElementProps<HTMLElement>;

            // SVG Elements (svg-only tag names; shared names like title/a/script
            // stay HTML above). Open props — see SVGElementProps.
            svg: SVGElementProps;
            g: SVGElementProps;
            path: SVGElementProps;
            circle: SVGElementProps;
            ellipse: SVGElementProps;
            rect: SVGElementProps;
            line: SVGElementProps;
            polyline: SVGElementProps;
            polygon: SVGElementProps;
            text: SVGElementProps;
            tspan: SVGElementProps;
            defs: SVGElementProps;
            use: SVGElementProps;
            symbol: SVGElementProps;
            clipPath: SVGElementProps;
            mask: SVGElementProps;
            pattern: SVGElementProps;
            image: SVGElementProps;
            linearGradient: SVGElementProps;
            radialGradient: SVGElementProps;
            stop: SVGElementProps;
            filter: SVGElementProps;
            foreignObject: SVGElementProps;
            marker: SVGElementProps;
            view: SVGElementProps;
            desc: SVGElementProps;
            metadata: SVGElementProps;

            // Custom elements: the template-literal key matches ONLY hyphenated
            // tags, so `<pet-list>` resolves here while a non-hyphenated typo
            // still errors. Author-defined → open props.
            [customTag: `${string}-${string}`]: CustomElementProps;
        }
    }

    // JSX factory function signature (for TypeScript's classic JSX transform)
    function h(
        tag: string,
        props?: object | null,
        ...children: DOMChild[]
    ): Node;
    function Fragment(props: { children?: DOMChild }): Node;
}

export {};
