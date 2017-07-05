export default function combine(observables, combine, subscriber, once = false) {
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
    };

    const subscriptions = new Array(length);
    const unsubscribes = once ? [] : null;

    for(let i = 0; i < length; i++) {
        subscriptions[i] = observables[i].subscribe(value => {
            if(value !== values[i]) {
                values[i] = value;
                if(subscribed) call();
            }

            if(once) {
                if(subscribed) subscriptions[i].unsubscribe();
                else unsubscribes.push(i);
            }

            any = true;
        });
    }

    subscribed = true;
    if(any) call();
    if(once) {
        unsubscribes.forEach(i => subscriptions[i].unsubscribe());
    }
    
    return {
        unsubscribe() {
            for(let i = 0; i < length; i++) {
                subscriptions[i].unsubscribe();
            }
        }
    };
}
