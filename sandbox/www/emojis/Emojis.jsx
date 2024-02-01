import { fetchEmojis, streamEmojis } from './emoji-service.js';
import { JSONParser } from '@streamparser/json-whatwg';
import { RawHTML } from './RawHTML.jsx';
// import { sleep } from 'azoth/promises';


const CHUNK_SIZE = 100;
const batch = new TransformStream({
    start() {
        this.pages = [];
        this.batch = [];
        this.firstPageSent = false;
    },
    transform(value, controller) {
        const length = this.batch.push(value);
        if(length >= CHUNK_SIZE) {
            if(!this.firstPageSent) {
                this.firstPageSent = true;
                controller.enqueue(this.batch);
            }
            else {
                this.pages.push(batch);
            }

            this.batch = [];
        }
    },
    flush(controller) {
        if(!this.firstPageSent && this.batch.length) {
            controller.enqueue(this.batch);
        }
    }
});

const layout = new TransformStream({
    transform(batch, controller) {
        const emojis = batch.map(({ value: emoji }) => <Emoji emoji={emoji}/>);
        controller.enqueue(emojis);
    },
});

// const layout = new TransformStream({
//     transform({ value }, controller) {
//         controller.enqueue(<Emoji emoji={value}/>);
//     },
// });

export function Emojis() {
    const emojiStream = streamEmojis()
        .then(stream => stream
            .pipeThrough(new JSONParser({ 
                stringBufferSize: undefined, 
                paths: ['$.*'], 
                keepStack: false 
            }))
            .pipeThrough(batch)
            .pipeThrough(layout)
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
        <RawHTML html={htmlCode?.join('')}/>
        {name}
        {unicode} 
    </li>;
}