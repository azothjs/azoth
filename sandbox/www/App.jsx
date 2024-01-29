import { subject, broadcast, multicast } from 'azoth/generators';
import page from 'page';

const [emit, add] = broadcast();
const consumers = [];
const Router = {
    push(url) {
        history.pushState(null, '', url);
        for(const consumer of consumers) {
            consumer(location.href);
        }
        emit(url);
    },
    async subscriber(adaptor) {
        const adapted = adaptor ? () => adaptor(new URL(location.href)) : null; 
        const current = adapted ?? (() => new URL(location.href));
        return add(current(), current); 
    }
};

function Link({ href, text = href }) {
    const click = e => {
        // e.preventDefault();
        // history.pushState(null, '', href);

        // Router.push(href);
    };
    return <a href={href}>
        {text}
    </a>;
}


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

const pages = new Map();
const [handlePage, Page] = subject(null, ({ params }) => {
    const url = params?.page || '/';
    if(pages.has(url)) return pages.get(url);
    const page = <div>{url}<input name="save-me"/></div>;
    pages.set(url, page);
    return page;

});

page.start();
page('/:page', handlePage);
page('*', handlePage);

export default <>
    <header>
        <h1>App Header</h1>
        <nav>
            <Link href="/" text="home"/>
            <Link href="/emojis"/>
            <Link href="/pokedex"/>
        </nav>
    </header>
    <main>
        {Page}
    </main>
</>;