/* eslint-disable no-fallthrough */

export default class JSONStream extends TransformStream {
    constructor(options) {
        super(new Transform(options));
    }
}

class Transform {
    #stack = [];
    #context = '';
    #buffer = '';
    #count = 0;
    #batch_size = 1;
    #key = '';
    #data_path = null;

    constructor(options) {
        const path = options?.dataPath || '';
        const batch_size = options?.batchSize || 1;

        if(path) {
            const split = path.split(/[^\w]/);
            this.#data_path = split.filter(s => s).reverse();
        }

        if(batch_size) {
            this.#batch_size = batch_size;
        }
    }

    #raise_error(char, i, chunk, message = '') {
        throw new Error(`Unexpected JSON token "${char}" at ${i} of ${chunk}. ${message}`);
    }

    flush(controller) {
        if(this.#buffer.length) {
            this.#buffer += ']';
            controller.enqueue(JSON.parse(this.#buffer));
        }
    }

    transform(chunk, controller) {
        const stack = this.#stack;
        const batch_size = this.#batch_size;
        // track escape sequence: \"
        let last_char = '';

        for(let i = 0; i < chunk.length; i++) {
            const context = this.#context;
            const char = chunk[i];
            let new_context = char;
            let should_add = true;

            switch(char) {
                case '"': {
                    switch(context) {
                        case '"':
                            // escape sequence \"
                            if(last_char === '\\') break;
                            this.#context = stack.pop();
                            break;
                        case '$':
                            this.#raise_error(
                                char, i, chunk,
                                `Expected object opening "{", string arrays not yet supported`
                            );
                        case '':
                            this.#raise_error(
                                char, i, chunk,
                                `Expected array of objects, not string`
                            );
                        case '${':
                        case '{':
                        case '[':
                            stack.push(context);
                            this.#context = '"';
                    }

                    break;
                }
                case '[': {
                    switch(context) {
                        case '$':
                            this.#raise_error(
                                char, i, chunk,
                                `Sub-array not supported as child of data array`
                            );
                        case '':
                            should_add = false;
                            new_context = '$';
                            if(batch_size > 1) this.#buffer += '[';
                        case '${':
                        case '{':
                        case '[':
                            stack.push(context);
                            this.#context = new_context;
                    }

                    break;
                }
                case '{': {
                    switch(context) {
                        case '':
                            this.#raise_error(char, i, chunk, `Data array expected, not object`);
                        case '$':
                            if(this.#count) this.#buffer += ',';
                            new_context = '${';
                        case '${':
                        case '{':
                        case '[':
                            this.#stack.push(context);
                            this.#context = new_context;
                    }

                    break;
                }
                case ']': {
                    switch(context) {
                        case '$':
                            should_add = false;
                            stack.pop();
                            // TODO: exit stream
                            this.#context = 'END';
                            break;
                        case '[':
                            this.#context = this.#stack.pop();
                            break;
                        case '':
                        case '${':
                        case '{':
                            this.#raise_error(char, i, chunk);
                    }

                    break;

                }
                case '}': {
                    switch(context) {
                        case '${':
                            should_add = false;
                            this.#buffer += char;
                            this.#count++;
                            if(this.#count >= this.#batch_size) {
                                if(batch_size > 1) this.#buffer += ']';
                                controller.enqueue(JSON.parse(this.#buffer));

                                this.#count = 0;
                                this.#buffer = batch_size > 1 ? '[' : '';
                            }
                        // eslint-disable-next-line no-fallthrough
                        case '{':
                            this.#context = this.#stack.pop();
                            break;
                        case '[':
                        case '$':
                        case '':
                            this.#raise_error(char, i, chunk);
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
                            should_add = false;
                    }
                }
            }

            if(should_add) this.#buffer += char;
            last_char = char;
        }

    }
}