import { eventOperator } from 'azoth/events';

const { operator, listener } = eventOperator('/');


function Link({ href, text = href }) {
    return <a href={href} onclick={e => {
        e.preventDefault();
        history.pushState(null, null, href);
        listener(href);
    }}>
        {text}
    </a>;
}

const $someFruits = <ul>
    <li>apple</li>
    <li>banana</li>
    <li>cherry</li>
    <li>pear</li>
    <li>orange</li>
</ul>;

const [$apple, , ...$rest] = $someFruits.querySelectorAll('li'); //as HTMLUListElement;
const $vipFruits = [$apple, ...$rest];
document.body.append(<ol>{$vipFruits}</ol>);

for(const child of $vipFruits) {
    console.log(child);
}


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
        {/* <iframe src="/emojis/"></iframe> */}

        {/* <button>{count}</button> */}
    </main>
</>;