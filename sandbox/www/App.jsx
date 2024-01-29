import { subject, junction, multicast } from 'azoth/generators';

const [signal, iterator] = subject();
const urlFeed = multicast(iterator);
const Router = {
    push(url) {
        history.pushState(null, '', url);
        signal(url);
    },
    async subscriber(adaptor) {
        const adapted = adaptor ? () => adaptor(new URL(location.href)) : null; 
        const current = adapted ?? (() => new URL(location.href));
        return urlFeed.subscriber(current(), current); 
    }
};

function Surprise() {
    return <section>
        <h2>Guess What!</h2>
        <p>surprise!</p>
    </section>;
}

function Counter() {
    let count = 0;
    const [increment, $count] = subject(0, () => ++count);
    return <p>
        <button onclick={increment}>++</button>
        <span>{$count}</span>
    </p>;
}



function Link({ href, text = href }) {
    const click = e => {
        e.preventDefault();
        history.pushState(null, null, href);
        signal(href);
    };
    return <a href={href} onclick={click}>
        {text}
    </a>;
}


const frames = new Map();

const pages = Router.subscriber(url => {
    if(frames.has(url)) return frames.get(url);
    const frame = <iframe src={url.toString()}/>;
    frames.set(url, frame);
    return frame;
});

function Frame({ src }) {
    return <iframe src={src}/>;
}


export default <>
    <header>
        <h1>App Header</h1>
        <nav>
            <Link href="/" text="home"/>
            <Link href="emojis"/>
            <Link href="pokedex"/>
        </nav>
    </header>
    <main>
        {pages}
    </main>
</>;