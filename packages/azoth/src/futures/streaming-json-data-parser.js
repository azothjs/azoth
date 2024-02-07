
export class JSONParseTransformStream extends TransformStream {
    constructor() {
        super(new Transform());

    }
}



// return new JSONParseTransformStream()

export class Transform {
    stack = [];
    context = '';
    buffer = '';
    transform(chunk, controller) {
        for(let i = 0; i < chunk.length; i++) {
            const char = chunk[i];
            let newContext = char;
            let addToBuffer = true;
            switch(char) {
                case '[': {
                    switch(this.context) {
                        case '$':
                            throw new Error(`Sub-array not supported as descendent of root array, ${char} at ${index} of ${chunk}`);
                        case '':
                            addToBuffer = false;
                            newContext = '$';
                        case '${':
                        case '{':
                        case '[':
                            this.stack.push(this.context);
                            this.context = newContext;
                    }
                    break;
                }
                case '{': {
                    switch(this.context) {
                        case '':
                            throw new Error('not yet implemented to find non-root array');
                        case '$':
                            newContext = '${';
                        case '${':
                        case '{':
                        case '[':
                            this.stack.push(this.context);
                            this.context = newContext;
                    }
                    break;
                }
                case ']': {
                    switch(this.context) {
                        case '$':
                            addToBuffer = false;
                        case '[':
                            this.context = this.stack.pop();
                            break;
                        case '':
                        case '${':
                        case '{':
                            throw new Error(`Unexpected JSON token "${char}" at ${i} of ${chunk}`);
                    }
                    break;
                }
                case '}': {
                    switch(this.context) {
                        case '${':
                            addToBuffer = false;
                            this.buffer += char;
                            controller.enqueue(this.buffer);
                            this.buffer = '';
                        case '{':
                            this.context = this.stack.pop();
                            break;
                        case '[':
                        case '$':
                        case '':
                            throw new Error(`Unexpected JSON token "${char}" at ${i} of ${chunk}`);
                        default:
                            continue;
                    }
                    break;
                }
                default: {
                    switch(this.context) {
                        case '${':
                        case '{':
                        case '[':
                            break;
                        case '$':
                        case '':
                            addToBuffer = false;
                    }
                }
            }

            if(addToBuffer) this.buffer += char;

        }

    }
}