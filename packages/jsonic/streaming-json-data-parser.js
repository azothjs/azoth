/* eslint-disable no-fallthrough */

export class JSONParseTransformStream extends TransformStream {
    constructor(options) {
        super(new Transform(options));

    }
}

export class Transform {
    stack = [];
    context = '';
    buffer = '';
    count = 0;
    batchSize = 1;
    key = '';
    dataPath = null;

    constructor(options) {
        const path = options?.dataPath || '';
        const batchSize = options?.batchSize || 1;

        if(path) {
            const split = path.split(/[^\w]/);
            this.dataPath = split.filter(s => s).reverse();
        }

        if(batchSize) {
            this.batchSize = batchSize;
        }
    }

    raiseError(char, i, chunk, message = '') {
        throw new Error(`Unexpected JSON token "${char}" at ${i} of ${chunk}. ${message}`);
    }

    flush(controller) {
        if(this?.buffer?.length) {
            this.buffer += ']';
            controller.enqueue(JSON.parse(this.buffer));
        }
    }

    transform(chunk, controller) {
        const { stack, batchSize } = this;
        // track escape sequence: \"
        let lastChar = '';

        for(let i = 0; i < chunk.length; i++) {
            const { context } = this;
            const char = chunk[i];
            let newContext = char;
            let addToBuffer = true;

            switch(char) {
                case '"': {
                    switch(context) {
                        case '"':
                            // escape sequence \"
                            if(lastChar === '\\') break;
                            this.context = stack.pop();
                            break;
                        case '$':
                            this.raiseError(
                                char, i, chunk,
                                `Expected object opening "{", string arrays not yet supported`
                            );
                        case '':
                            this.raiseError(
                                char, i, chunk,
                                `Expected array of objects, not string`
                            );
                        case '${':
                        case '{':
                        case '[':
                            stack.push(context);
                            this.context = '"';
                    }


                    break;
                }
                case '[': {
                    switch(context) {
                        case '$':
                            this.raiseError(
                                char, i, chunk,
                                `Sub-array not supported as child of data array`
                            );
                            throw new Error(`Sub-array not supported as direct descendent of root array, ${char} at ${i} of ${chunk}`);
                        case '':
                            addToBuffer = false;
                            newContext = '$';
                            if(batchSize > 1) this.buffer += '[';
                        case '${':
                        case '{':
                        case '[':
                            stack.push(context);
                            this.context = newContext;
                    }

                    break;
                }
                case '{': {
                    switch(context) {
                        case '':
                            this.raiseError(char, i, chunk, `Data array expected, not object`);
                        case '$':
                            if(this.count) this.buffer += ',';
                            newContext = '${';
                        case '${':
                        case '{':
                        case '[':
                            this.stack.push(context);
                            this.context = newContext;
                    }

                    break;
                }
                case ']': {
                    switch(context) {
                        case '$':
                            addToBuffer = false;
                            stack.pop();
                            // TODO: exit stream
                            this.context = 'END';
                            break;
                        case '[':
                            this.context = this.stack.pop();
                            break;
                        case '':
                        case '${':
                        case '{':
                            this.raiseError(char, i, chunk);
                    }

                    break;

                }
                case '}': {
                    switch(context) {
                        case '${':
                            addToBuffer = false;
                            this.buffer += char;
                            this.count++;
                            if(this.count >= this.batchSize) {
                                if(batchSize > 1) this.buffer += ']';
                                controller.enqueue(JSON.parse(this.buffer));

                                this.count = 0;
                                this.buffer = batchSize > 1 ? '[' : '';
                            }
                        // eslint-disable-next-line no-fallthrough
                        case '{':
                            this.context = this.stack.pop();
                            break;
                        case '[':
                        case '$':
                        case '':
                            this.raiseError(char, i, chunk);
                    }

                    break;
                }
                default: {
                    switch(context) {
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
            lastChar = char;
        }

    }
}