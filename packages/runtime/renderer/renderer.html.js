export const HTMLRenderer = {
    name: 'HTMLRenderer',
    make(html) {
        return html;
    },
    get(id) {
        // Q: what is the prod optimized equiv? if any?
        // Array/String literal seems as good or better than JSON file?
        // TODO: benchmark
        throw new Error(`HTMLRenderer does not support "get(id)" of "${id}". Use "make(html)" instead`);
    },
    // pretty sure fragments NOT needed for html render,
    // really a DOM optimization to avoid Fragment container
    // on single element root
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
