
export class AsyncSourceTypeError extends TypeError {
    constructor(type) {
        super(`\
Unexpected asynchronous data source type "${type}". Expected an async data provider type, or \
a function that returns an async data provider type."`);
    }
}


export class OptionMissingFunctionArgumentError extends TypeError {
    constructor(option = 'map: true') {
        super(`\
More arguments needed: option "${option}" requires a mapping function.`);
    }
}

export class InitOptionWithSyncWrappedAsyncProviderError extends TypeError {
    constructor() {
        super(`\
Option "init" was supplied with an asynchronous data provider that \
already has been wrapped with a synchronous initial value to be provided \
as the initial input of this channel. Use one or the other, but not both.`
        );
    }
}

