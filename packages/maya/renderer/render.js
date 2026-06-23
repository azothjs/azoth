import { DOMRenderer } from './dom-renderer.js';
import { HTMLRenderer } from './html-renderer.js';
import { activeRenderer } from './rerenderer.js';

export { renderer, rerenderer, activeRenderer } from './rerenderer.js';

const templates = new Map(); // cache
let renderEngine = DOMRenderer; // DOM or HTML engine

export const RenderService = {
    useDOMEngine() {
        renderEngine = DOMRenderer;
        templates.clear();
    },
    useHTMLEngine() {
        renderEngine = HTMLRenderer;
        templates.clear();
    }
};

function get(id, isFragment = false, content) {
    if(templates.has(id)) return templates.get(id);
    const template = renderEngine.createTemplate(id, content, isFragment);
    templates.set(id, template);
    return template;
}

export function render(id, targets, makeBind, isFragment, content) {
    const create = get(id, isFragment, content);

    // Per-declaration identity: the rerenderer's cache key. Each render()
    // call is one compiled call site (per-site factory) — closure identity IS
    // the key, so deduped templates (same id, multiple sites) cannot collide
    // across sites.
    const siteKey = { id };

    function buildFresh() {
        const [node, boundEls] = create();
        const nodes = targets ? targets(node, boundEls) : null;
        const bind = makeBind ? makeBind(nodes) : null;
        return { node, bind };
    }

    return (...args) => {
        if(!create) return null;
        const r = activeRenderer();
        // The active renderer decides: a rerenderer reuses this site's cached
        // node (rebound); a fresh renderer ignores the site and builds anew;
        // no active renderer (plain forward render) also builds fresh.
        const { node: root, bind } = r
            ? r.getBound(siteKey, buildFresh)
            : buildFresh();
        if(bind) bind(...args);
        return root;
    };
}
