import { operator, collect } from 'azoth/events';

const [control, listener] = operator('/');

function Link({ href, text = href }) {
    return <a href={href} onclick={e => {
        e.preventDefault();
        history.pushState(null, null, href);
        listener(href);
    }}>
        {text}
    </a>;
}

let count = 0;
const [increment, $count] = collect(0, () => ++count);

export default <>
    <header>
        <h1>App Header</h1>
        <nav>
            { Link({ href: '/', text: 'home' }) }
            { Link({ href: 'emojis' }) }
            { Link({ href: 'pokedex' }) }
        </nav>
    </header>
    <main>
        <button onclick={increment}>++</button>
        <p>{$count}</p>

    </main>
</>;