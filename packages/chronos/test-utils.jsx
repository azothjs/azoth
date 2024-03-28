import { SyncAsync } from '@azothjs/maya/compose';

export const Loading = () => <p>loading...</p>;

export const Cat = ({ name }) => <p>{name}</p>;

export const CatList = cats => <ul>{cats?.map(Cat)}</ul>;

export const CatCount = cats => <p>{cats?.length || 0} cats</p>;

export const CatName = name => <li>{name}</li>;

export const CatNames = cats => <ul>{cats?.map(CatName)}</ul>;

export class SyncAsyncReader {
    constructor(async) {
        if(async instanceof SyncAsync) {
            this.state = async.sync;
            async = async.async;
        }
        this.read(async);
    }
    async read(iter) {
        let { promise, resolve } = Promise.withResolvers();
        this.promise = promise;
        for await(const value of iter) {
            this.state = value;
            resolve();
            ({ promise, resolve } = Promise.withResolvers());
            this.promise = promise;
        }
    }
}
