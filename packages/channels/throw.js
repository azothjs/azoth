
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

export class ConflictingOptionsError extends TypeError {
    constructor() {
        super(`\
Cannot specify both initialValue and startWith options.`);
    }
}

