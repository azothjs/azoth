import { fetchEmojis } from './fetchEmojis.js';
import './style.css';

const List = fetchEmojis().then(emojis => EmojiList({ emojis }));

const App = <>
    <header>
        <h1>Emojis for all my friends</h1>
    </header>

    <main>
        <h2>Amazing Emoji List</h2>
        <List />
    </main>
</>;

document.body.append(App);

function EmojiList({ emojis }) {
    return <ul>
        {emojis.map(Emoji)}
    </ul>;
}

function Emoji({ name, unicode, htmlCode }) {
    return <li>
        <span innerHTML={htmlCode.join('')} />
        {name}
        {unicode}
    </li>;
}


