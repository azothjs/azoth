/// <reference types="vitest" />
/// <reference path="../azoth/jsx.d.ts" />
/**
 * ARTICLE EXAMPLES — the intro article's code, verified.
 *
 * Every snippet in docs/articles/jsx-for-the-web-platform.md runs here
 * against real output before it ships ("the test suite is the
 * documentation" applies to the article too).
 * Snippets are kept as authored — multi-line JSX and all — so assertions
 * target text/identity rather than whitespace-sensitive innerHTML.
 */

import { describe, test } from 'vitest';
import { Channel, pushable } from '@azothjs/maya/channels';
import { rerenderer } from '@azothjs/maya/renderer';

function fixture(): HTMLElement {
    document.body.innerHTML = '';
    return document.body;
}

async function microtasks(): Promise<void> {
    await null;
    await null;
}

async function macrotask(): Promise<void> {
    await new Promise(r => setTimeout(r, 0));
}

describe('opt-in async — the Promise slot', () => {

    test('render me now / render me later', async ({ expect }) => {
        const root = fixture();
        root.append(<p>Render me now - {Promise.resolve(`Render me later`)}</p>);

        expect(root.textContent).toBe('Render me now - ');
        await microtasks();
        expect(root.textContent).toBe('Render me now - Render me later');
    });

    test('CatList — async function feeding a slot', async ({ expect }) => {
        const fetchCats = async () => [{ name: 'felix' }, { name: 'duchess' }];
        const Cat = ({ name }: { name: string }) => <li>{name}</li>;

        function CatList() {
            async function getCats() {
                const cats = await fetchCats();
                return cats.map(cat => <Cat {...cat} />);
            }
            return <ul>{getCats()}</ul>;
        }

        const root = fixture();
        root.append(<CatList />);
        await macrotask();

        expect([...root.querySelectorAll('li')].map(li => li.textContent)).toEqual(['felix', 'duchess']);
    });

});

describe('Channel', () => {

    test('Ticker — async iterator source with `as` transform', async ({ expect }) => {
        const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        async function* getTickerStream(_symbol: string) {
            yield { price: 1234.5 };
            yield { price: 1240 };
        }

        function Ticker({ symbol }: { symbol: string }) {
            return <div>
                {symbol}:
                <Channel
                    source={getTickerStream(symbol)}
                    as={({ price }) => usdFormatter.format(price)}
                />
            </div>;
        }

        const root = fixture();
        root.append(<Ticker symbol="AZTH" />);
        await macrotask();

        expect(root.textContent).toContain('AZTH');
        expect(root.textContent).toContain('$1,240.00');   // last value replaced
    });

    test('Feed — EventTarget source, append, initial children', async ({ expect }) => {
        // The article uses `new WebSocket(url)` — a WebSocket IS an
        // EventTarget dispatching "message" events, so a stub target with
        // MessageEvents verifies the identical Channel wiring.
        const socket = new EventTarget();
        const send = (payload: object) =>
            socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(payload) }));

        function Feed() {
            return <ul>
                <Channel source={socket}
                    eventType="message"
                    append
                    as={({ data }) => {
                        const { header, content } = JSON.parse(data);
                        return <li>
                            <h2>{header}</h2>
                            <p>{content}</p>
                        </li>;
                    }}>

                    <p>Connecting to feed...</p>

                </Channel>
            </ul>;
        }

        const root = fixture();
        root.append(<Feed />);
        await macrotask();
        expect(root.textContent).toContain('Connecting to feed...');

        send({ header: 'one', content: 'first' });
        await macrotask();
        expect(root.textContent).not.toContain('Connecting');   // first replaces initial
        expect(root.querySelectorAll('li').length).toBe(1);

        send({ header: 'two', content: 'second' });
        await macrotask();
        expect(root.querySelectorAll('li').length).toBe(2);     // subsequent append
        expect([...root.querySelectorAll('h2')].map(h => h.textContent)).toEqual(['one', 'two']);
    });

});

describe('state without the management', () => {

    test('Counter — a closure and direct DOM mutation', ({ expect }) => {
        const Counter = () => {
            let n = 0;
            const label = <span>{n}</span> as HTMLSpanElement;
            return <button onclick={() => { label.textContent = `${++n}`; }}>
                {label}
            </button>;
        };

        const root = fixture();
        root.append(<Counter />);
        const button = root.querySelector('button')!;

        expect(button.textContent!.trim()).toBe('0');
        button.click();
        button.click();
        expect(button.textContent!.trim()).toBe('2');
    });

    test('Counter — pushable event loop, seeded via the Input shape', async ({ expect }) => {
        function Counter() {
            let count = 0;
            const [count$, push] = pushable();
            const increment = () => push(++count);
            return <button onclick={increment}>{{ initial: count, from: count$ }}</button>;
        }

        const root = fixture();
        root.append(<Counter />);
        const button = root.querySelector('button')!;

        expect(button.textContent).toBe('0');       // the seed shows immediately
        button.click();
        await macrotask();
        expect(button.textContent).toBe('1');
        button.click();
        button.click();
        await macrotask();
        expect(button.textContent).toBe('3');
    });

});

describe('rerendering — the master/detail flow', () => {

    type Item = { id: number; title: string };
    type Detail = { title: string; type: string; description: string; tags: string[] };

    const DATA: Record<number, Detail> = {
        1: { title: 'Felix', type: 'premium', description: 'the classic', tags: ['black', 'white'] },
        2: { title: 'Tom', type: 'basic', description: 'the striver', tags: ['grey'] },
    };
    const fetchItems = async (): Promise<Item[]> => [{ id: 1, title: 'Felix' }, { id: 2, title: 'Tom' }];
    const fetchDetail = async (id: number): Promise<Detail> => DATA[id];

    function ListView({ items, onselect }: { items: Item[]; onselect: (id: number) => void }) {
        return <ul>{items.map(({ id, title }) => (
            <li onclick={() => onselect(id)}>{title}</li>
        ))}</ul>;
    }

    function Tags({ tags }: { tags: string[] }) {
        return <ul>{tags.map(tag => <li>{tag}</li>)}</ul>;
    }

    function DetailView({ title, type, description, tags }: Detail) {
        const badge = type === 'premium' ? <span>VIP</span> : <button>Upgrade</button>;
        return <article>
            <h1>{title}</h1>
            <p>{badge}-{description}</p>
            <Tags tags={tags} />
        </article>;
    }

    function App() {
        const [detail$, push] = pushable();
        const handleSelect = async (id: number) => push(await fetchDetail(id));

        return <main>
            <Channel source={fetchItems()} as={(items: Item[]) => (
                <ListView items={items} onselect={handleSelect} />
            )}>
                Loading list...
            </Channel>

            <Channel source={detail$} as={rerenderer((detail: Detail) => <DetailView {...detail} />)}>
                Select an item from the list
            </Channel>
        </main>;
    }

    test('same DOM rebound per event; conditional branches cached by site', async ({ expect }) => {
        const root = fixture();
        root.append(<App />);

        expect(root.textContent).toContain('Loading list...');
        await macrotask();
        expect(root.textContent).toContain('Select an item from the list');
        const [felixLi, tomLi] = [...root.querySelectorAll('main > ul > li')] as HTMLLIElement[];
        expect(felixLi.textContent).toBe('Felix');

        // Select Felix (premium) — DetailView renders, badge branch = <span>
        felixLi.click();
        await macrotask();
        const article = root.querySelector('article')!;
        expect(article.querySelector('h1')!.textContent).toBe('Felix');
        const vip = article.querySelector('span')!;
        expect(vip.textContent).toBe('VIP');
        expect([...article.querySelectorAll('article ul li, article > ul li')].length).toBe(2);

        // Select Tom (basic) — SAME article, rebound; badge branch flips to <button>
        tomLi.click();
        await macrotask();
        expect(root.querySelector('article')).toBe(article);            // same DOM, replayed bindings
        expect(article.querySelector('h1')!.textContent).toBe('Tom');
        expect(article.querySelector('span')).toBe(null);               // premium branch asleep
        expect(article.querySelector('button')!.textContent).toBe('Upgrade');

        // Back to Felix — the sleeping branch's SAME node returns
        felixLi.click();
        await macrotask();
        expect(root.querySelector('article')).toBe(article);
        expect(article.querySelector('span')).toBe(vip);                // resurrected, not recreated
        expect(article.querySelector('h1')!.textContent).toBe('Felix');
    });

});
