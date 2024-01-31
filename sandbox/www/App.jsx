import { subject } from 'azoth/futures';
import { Counter } from './Counter.jsx';
import { Emojis } from './emojis/Emojis.jsx';

const pages = { 
    emojis: <Emojis/>, 
    counter: <Counter initial={0}/> 
};

const [hashChange, Page] = subject((e) => {
    const url = new URL(e.newURL);
    const key = url.hash.slice(1);
    return pages[key] || pages.emojis;
}, { startWith: pages.emojis });

window.onhashchange = hashChange;

export default <>
    <header>
        <h1>App Header</h1>
        <nav>
            <a href="#">home</a>
            <a href="#emojis">emojis</a>
            <a href="#pokedex">pokedex</a>
        </nav>
    </header>
    <main>
        {Page}
    </main>
</>;