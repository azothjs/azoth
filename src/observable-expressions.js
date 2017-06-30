
export function map(observable, map, subscriber) {
    let last;
    let lastMapped;
    return observable.subscribe(value => {
        if(value === last) return;
        last = value;
        const mapped = map(value);
        if(mapped !== lastMapped) {
            lastMapped = mapped;
            subscriber(mapped);
        }
    });
}

export function combine(observables, combine, subscriber) {
    const length = observables.length;
    let values = new Array(length);
    let lastCombined;
    let subscribed = false;
    let any = false;

    const call = () => {
        const combined = combine.apply(null, values);
        if(combined !== lastCombined ) {
            lastCombined = combined;
            subscriber(combined);
        }
    }

    const subscriptions = new Array(length);

    for(let i = 0; i < length; i++) {
        subscriptions.push(
            observables[i].subscribe(value => {
                if(value === values[i]) return;
                values[i] = value;
                any = true;
                if(subscribed) call();
            })
        );
    }
    subscribed = true;
    
    if(any) call();

    return {
        unsubscribe() {
            for(let i = 0; i < length; i++) {
                subscriptions[i].unsubscribe();
            }
        }
    }
}
