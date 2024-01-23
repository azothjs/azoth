import { multiplex } from './multiplex.js';
import './style.css';

const EMOJIS = 'EMOJIS';

async function fetchEmojis() {
    const json = localStorage.getItem(EMOJIS);
    if(json) {
        try {
            return JSON.parse(json);
        }
        catch(ex) {
            // failed parse
            localStorage.removeItem(EMOJIS);
        }
    }
    // await sleep(3000);
    const res = await fetch('https://emojihub.yurace.pro/api/all');
    const emojis = await res.json();

    localStorage.setItem(EMOJIS, JSON.stringify(emojis, true, 4));
    
    return emojis;
}
const start = new Date();

class RawHtml extends HTMLElement {
    static observedAttributes = ['html'];
    render() {
        return <li>{this.name}</li>;
    }
    attributeChangedCallback(name, old, value) {
        if(name === 'html') {
            this.innerHTML = value;
        }
    }
}
window.customElements.define('raw-html', RawHtml);

const $emojiCount = ({ length }) => <span>{length}</span>;
const $emoji = ({ name, unicode, htmlCode }) => {    
    // const rawEmoji = <span class="emoji"></span>;
    // rawEmoji.firstChild.innerHTML = htmlCode.join('');
    return <li><span is="raw-html" html={htmlCode} /> {unicode} {name}</li>;
};
const $emojiList = emojis => <ul>{emojis.map($emoji)}</ul>;

const [Count, List] = multiplex(
    fetchEmojis(), 
    $emojiCount, 
    $emojiList,
);

const App = <div>
    <header>
        <h1>{Count} Emojis for all my friends</h1>
    </header>
        
    <main>
        <h2>Amazing Emoji List</h2>
        {List}
    </main>

</div>;

document.body.append(App);




