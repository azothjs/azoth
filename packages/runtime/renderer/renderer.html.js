export const HTMLRenderEngine = {
    name: 'HTMLRenderEngine',
    make(html) {
        return html;
    },
    get(id) {
        // TODO: what is the prod equiv? if any
        throw new Error(`HTMLRenderEngine does not support "get(id)" of "${id}". Use "make(html)" instead`);
    },
    // TODO: are fragments a thing with html render?
    renderer(html/*, isFragment*/) {
        const template = [];
        for(let i = 0; i < html.length; i++) {
            if(i !== 0) template.push(null);
            template.push(html[i]);
        }

        return () => {
            const root = template.slice();
            const targets = [];
            for(let i = 1; i < root.length; i += 2) {
                targets.push(root[i] = []);
            }
            return [root, targets];
        };
    },
    bound(root) {
        const targets = [];
        for(let i = 1; i < root.length; i += 2) {
            targets.push(root[i] = []);
        }
        return targets;
    }
};


export function makeStringRenderer(id, html, isFragment = false) {
    const template = [];
    for(let i = 0; i < html.length; i++) {
        if(i !== 0) template.push(null);
        template.push(html[i]);
    }

    return () => {
        const root = template.slice();
        const targets = [];
        for(let i = 1; i < root.length; i += 2) {
            targets.push(root[i] = []);
        }
        return [root, targets];
    };
}

export function getStringBound(root) {
    const targets = [];
    for(let i = 1; i < root.length; i += 2) {
        targets.push(root[i] = []);
    }
    return targets;
}

