/**
 * Azoth JSX Type Definitions
 *
 * Azoth JSX produces "DOM literals" - actual DOM elements, not virtual DOM.
 * `<p>hello</p>` yields an HTMLParagraphElement, not a React component.
 *
 * These type definitions leverage TypeScript's built-in lib.dom.d.ts types
 * to provide accurate intellisense for Azoth JSX.
 */

// Children can be strings, numbers, nodes, or arrays of these
type DOMChild =
    | string
    | number
    | boolean
    | Node
    | null
    | undefined
    | DOMChild[];

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

declare global {
    namespace JSX {
        // JSX expressions evaluate to DOM Nodes
        // Specific element types require assertion: <p>hi</p> as HTMLParagraphElement
        // Future: TypeScript contribution for per-tag return types
        type Element = Node;

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
