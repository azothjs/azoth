import { subject, broadcast } from 'azoth/generators';
import page from 'page';

const [signal, join] = broadcast();
const consumers = [];
// function push(url) {
//     history.pushState(null, '', url);
//     for(const consumer of consumers) {
//         consumer(location.href);
//     }
//     signal(url);
// }

export async function subscribe(transform) {
    const adapted = transform ? () => transform(new URL(location.href)) : null; 
    const current = adapted ?? (() => new URL(location.href));
    return join(current(), current); 
}

export function Link({ href, text = href }) {
    // const click = e => {
        // e.preventDefault();
        // history.pushState(null, '', href);

        // Router.push(href);
    // };
    return <a href={href}>
        {text}
    </a>;
}

