import { fetchEmojis, streamEmojis } from './emoji-service.js';
import { JSONParser } from '@streamparser/json-whatwg';
import { RawHTML } from './RawHTML.jsx';
// import { sleep } from 'azoth/promises';


const CHUNK_SIZE = 100;
const batch = new TransformStream({
    start() {
        this.batch = [];
    },
    transform(value, controller) {
        const length = this.batch.push(value);
        if(length >= CHUNK_SIZE) {
            controller.enqueue(this.batch);
            this.batch = [];
        }
    },
    flush(controller) {
        if(this.batch.length) {
            controller.enqueue(this.batch);
        }
    }
});

// const layout = new TransformStream({
//     transform(batch, controller) {
//         const emojis = batch.map(emoji => <Emoji emoji={emoji}/>);
//         controller.enqueue(emojis);
//     },
// });

const layout = new TransformStream({
    transform({ value }, controller) {
        controller.enqueue(<Emoji emoji={value}/>);
    },
});

export function Emojis() {
    const emojiStream = streamEmojis()
        .then(stream => stream
            .pipeThrough(new JSONParser({ stringBufferSize: undefined, paths: ['$.*'], keepStack: false }))
            .pipeThrough(layout)
            .pipeThrough(batch)
        );

    // const emojiLayout = fetchEmojis()
    //     .then(emojis => <EmojiList emojis={emojis}/>);
    
    return <section>
        <h2>Emojis</h2>
        <ul>{emojiStream}</ul>
        {/* {emojiLayout} */}
    </section>;
}


function EmojiList({ emojis }) {
    return <ul>
        {emojis.map(emoji => <Emoji emoji={emoji}/>)}
    </ul>;
}

function Emoji({ emoji }) {
    const { name, unicode, htmlCode } = emoji;   
    return <li>
        <RawHTML html={htmlCode.join('')}/>
        {name}
        {unicode} 
    </li>;
}