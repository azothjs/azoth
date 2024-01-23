import { multiplex } from './multiplex.js';
import './style.css';

const { resolve, promise } = Promise.withResolvers();
setTimeout(resolve, 3000);

async function fetchEmojis() {
    await promise;
    const res = await fetch('https://emojihub.yurace.pro/api/all');
    return res.json();
}

const $emojiCount = ({ length }) => <span>{length}</span>;
const $emoji = ({ name }) => <li>{name}</li>;
const $emojiList = emojis => <ul>{emojis.map($emoji)}</ul>;

const Emojis = multiplex(fetchEmojis(), {
    Count: $emojiCount, 
    List: $emojiList,
});

const App = <div>
    <header>
        <h1>{Emojis.Count} Emojis for all my friends</h1>
    </header>
        
    <main>
        <h2>Amazing Emoji List</h2>
        {Emojis.List}
    </main>

</div>;

document.body.append(App);



