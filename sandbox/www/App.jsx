import { subject, junction, multicast } from 'azoth/generators';

const [signal, generator] = junction();
const Router = {
    push(url) {
        history.pushState(null, '', url);
        signal(url);
    },
    async feed() {
        const current = new URL(location.href);
        return generator(current); 
    }


};

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

    </main>
</>;