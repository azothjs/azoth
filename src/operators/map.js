export default function map(observable, map, subscriber, once = false) {
    let last;
    let lastMapped;
    let any = false;

    const subscription = observable.subscribe(value => {
        if(value !== last) {
            last = value;
            const mapped = map(value);
            if(mapped !== lastMapped) {
                lastMapped = mapped;
                subscriber(mapped);
            }
        }
        if(any && once) subscription.unsubscribe();
        any = true;
    });

    if(any && once) subscription.unsubscribe();
    any = true;

    return subscription;
}