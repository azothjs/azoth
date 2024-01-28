import { signalIterator } from 'azoth/events';

const [signal, iterator] = signalIterator();

function Link({ href, text = href }) {
    return <a href={href} onclick={e => {
        e.preventDefault();
        history.pushState(null, null, href);
        signal(href);
    }}>
        {text}
    </a>;
}

let count = 0;
const [increment, $count] = signalIterator(0, () => ++count);

export default <>
    <header>
        <h1>App Header</h1>
        
        <nav>
            {Link({ href: '/', text: 'home' })}
            {Link({ href: 'emojis' })}
            {Link({ href: 'pokedex' })}
        </nav>
    </header>
    <main>
        <p>
            <button onclick={increment}>++</button>
            <span>{$count}</span>
        </p>

    </main>
</>;