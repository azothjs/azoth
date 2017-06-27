
export function map(observable, map, subscriber) {
    let last;
    let lastMapped;
    observable.subscribe(value => {
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
    let values = new Array(observables.length);
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

    for(let i = 0; i < observables.length; i++) {
        observables[i].subscribe(value => {
            if(value === values[i]) return;
            values[i] = value;
            any = true;
            if(subscribed) call();
        });
    }
    subscribed = true;
    
    if(any) call();
}
