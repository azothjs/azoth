
export class AsyncSourceTypeError extends TypeError {
    constructor(type) {
        super(`\
Unexpected asynchronous data source type "${type}". Expected an async data provider type, or \
a function that returns an async data provider type."`);
    }
}