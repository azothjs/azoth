

function render(...p?) : Node {
    console.log('yo')
    return document.createElement('p')
}



type emoji = { name: string, text: string };
type emojiStream = (emoji: emoji) => void;

type unsubscribe = () => void;
interface Observable<T> {
    subscribe: (subscriber : (value : T) => void) => unsubscribe
}

function getCoolEmoji() : Observable<emoji> {
    return {
        subscribe(fn) {
            // handle fn
            return () => {
                //unsubscribe
            }
        }
    }
}

type Root = HTMLElement | DocumentFragment;
type Rendered = { root : Root, targets : NodeList } 

function templateService(id: string) {
    return () : Rendered => {
        const root = document.getElementById(id);
        if(!root) throw new Error('Invalid id');
        const targets = root.querySelectorAll('[data-bind]');
        return { root, targets };
    }
}

const subscriptions = new WeakMap<Node, unsubscribe>();
function subscription(root: Root, unsubscribe: () => void) {
    subscriptions.set(root, unsubscribe);
}

const emoji = getCoolEmoji()

// const t = _`<p>{~emoji.name}: {~emoji.text}</p>`;

function elText(el: HTMLElement) {
    return (content : string) => el.textContent = content;
}

function childText(el: HTMLElement, index: number) {
    const childNode = el.childNodes[index];
    return (content : string) => childNode.textContent = content

}


class Template1 {
    static template = dom(`c1d46e`);
    
    constructor(targets) {
        const { root, targets } = template();
        this.root = root;
        const t0 = targets[0];              
        this.t0_0 = t0.childNodes[0];
        this.t0_2 = t0.childNodes[1];
        this.t2 = targets[2];
    }

    // s1(obs, handler = null) {
    //     const fn = handler ? v => this.u1(handler(v)) : v => this.u1(v);
    //     subscription(obs.subscribe(fn));
    // }

    u2(val) {
        this.t2.class = val
    }

    u1(emoji) {
        this.t0_0.textContent = emoji.name;                        
        this.t0_2.textContent = emoji.text; 
    }
}

// _`<p>{~emoji.name}: {~emoji.text}</p>`;
(() => {
    return () => {
        const t1 = new Template1();
        t1.u2 = x + y;
        subscription(root, emoji.subscribe((emoji : emoji) => t1.u1(emoji)));
        return root;
    }
})();

(() => {
    // _`<p>{~emoji.name}: {~emoji.text}</p>`;
    const renderDom = templateService(`c1d46e`);                                      
    return () => {
        const { root, targets } = renderDom();        
        const t0 = <HTMLParagraphElement>targets[0];              
        const t0_0 = t0.childNodes[0];
        const t0_2 = t0.childNodes[1];
        subscription(root, emoji.subscribe((emoji : emoji) => {
            t0_0.textContent = emoji.name;                        
            t0_2.textContent = emoji.text;   
        }))
        return root;
    }
})();





(() => {
    // _`<p>{~emoji.name}: {~emoji.text}</p>`;
    const renderDom = templateService(`c1d46e`);                    
    const expr0 = (emoji) => emoji.name;                    
    const expr1 = (emoji) => emoji.text; 

    const bind = nodes => {                                         
        const node0 : HTMLParagraphElement = nodes[0];              
        const text0_0 = childText(node0, 0);                        
        const text0_2 = childText(node0, 2);   
        const b1 = emoji => text0_0(expr0(emoji)); 
        const b2 = emoji => text0_2(expr1(emoji)); 
        return [b1, b2];
    }                     
    
    const fn = () => {
        const { root, targets } = renderDom();
        const binders = bind(targets);
        const u1 = emoji.subscribe(binders[0])
        const u2 = emoji.subscribe(binders[1])

        const unsubscribe = () => {
            u1();
            u2();
        };

        return root;
    }

    return fn;
})();



(() => {
    const renderDom = templateService(`c1d46e`);                    // _

    const expr0 = (emoji : emoji) => emoji.name;                    // {~emoji.name}
    const expr1 = (emoji : emoji) => emoji.text;                    // {~emoji.type}

    const bind = nodes => {                                         // _
        const node0 : HTMLParagraphElement = nodes[0];              // <p>
        const text0_0 = childText(node0, 0);                        // {~emoji.name}
        const text0_2 = childText(node0, 2);                        // {~emoji.type}
        const b1 = emoji.subscribe(emoji => text0_0(expr0(emoji))); // {~emoji.name}
        const b2 = emoji.subscribe(emoji => text0_2(expr1(emoji))); // {~emoji.text}
        return [b1, b2];
    }

    const fn = () => {
        const { root, targets } = renderDom();
        const binders = bind(targets);
        return root;
    }

    return fn;
})();



// _`<p>{~emoji.name}: {~emoji.text}</p>`

function () {
    const emoji = await getCoolEmoji();
    const card = (emoji : any) => _`<p>${await emoji.name, await emoji.text}: {emoji.text}</p>`
    return card;
}

// state 
const cat = 'felix';
const favorite = 'fish';
const lives = 2;

// const p = /*html*/`
//     <p><strong>Hello</strong><em>{name}</em></p>
// `;
// document.body.append(p);

const p = document.createElement('p')
p.innerHTML = /*html*/`
    <p class=${lives < 3 && 'warning'}>
        ${cat} <strong>loves</strong> <em>${favorite}</em>
    </p>
`;
document.body.append(p);

const _ = () : HTMLElement => { return document.createElement('p'); }

// Azoth
const p = /*#*//*html*/`
    <p class="{lives < 3 && 'warning'}">
        {cat} <strong>loves</strong> <em>{favorite}</em>
    </p>
`;

const p = (() => {
    const { root, targets } = azoth('1er3d5');
    const p = targets[0], em = targets[1];
    p.textContent = cat;
    p.className = lives < 3 && 'warning';
    em.textContent = favorite;
    return root
})();

document.body.append(p);

