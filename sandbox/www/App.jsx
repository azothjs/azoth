
function Link({ href, text = href }) {
    return <a href={href} onclick={e => {
        e.preventDefault();
        history.pushState(null, null, );
    }}>
        {text}
    </a>;
}

function handlePushState(href) {
    history.pushState(null, null, href);
}

window.onpopstate = console.log


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
        <iframe src="/emojis/">

        </iframe>
    </main>
</>;