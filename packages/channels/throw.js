
export class AsyncSourceTypeError extends TypeError {
    constructor(asyncProvider) {
        let message = '';
        if(!asyncProvider) {
            message = `Missing async provider argument.` + getObjectJSON(asyncProvider);
        }
        else {
            const type = typeof (asyncProvider);
            message = `\
Invalid async provider type "${type}". Expected a valid async provider, or \
a function that returns an async provider."`;

            if(type === 'object') message += getObjectJSON(asyncProvider);
        }

        super(message);

    }
}

// TODO: this is in both maya and channels
function getObjectJSON(obj) {
    let message = '';
    try {
        const json = JSON.stringify(obj, null, 2);
        message = ` Received:\n\n${json}\n\n`;
    }
    catch(ex) {
        /* no-op */
    }
    return message;
}

export class OptionMissingFunctionArgumentError extends TypeError {
    constructor(option = 'map: true') {
        super(`\
More arguments needed: option "${option}" requires a mapping function.`);
    }
}

export class BadTeeCountArgumentError extends TypeError {
    constructor(count) {
        super(`tee "count" argument must be a whole number 2 or greater, received "${count}".`);
    }
}

export class InitOptionWithSyncWrappedAsyncProviderError extends TypeError {
    constructor() {
        super(`\
Option "init" was supplied with an async provider that \
is wrapped with its own initial synchronous initial value to be provided \
as the initial input of this channel. Use one or the other, but not both.`
        );
    }
}

