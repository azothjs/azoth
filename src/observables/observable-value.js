export default class ObservableValue {
    constructor(value) {
        this.value = value;
        this.subscribers = null;
    }

    subscribe(subscriber) {
        if(!this.subscribers) {
            this.subscribers = subscriber;
        } 
        else if(Array.isArray(this.subscribers)) {
            this.subscribers.push(subscriber);
        }
        else {
            this.subscribers = [this.subscribers, subscriber];
        }

        subscriber(this.value);

        return {
            unsubscribe: () => {
                this.unsubscribe(subscriber);
            }
        };
    }

    destroy() {
        this.subscribers = null;
    }

    unsubscribe(subscriber) {
        const { subscribers } = this;        
        if(!subscribers) return;
        else if(Array.isArray(subscribers)) {
            const index = subscribers.indexOf(subscriber);
            if(index > -1) subscribers.splice(index, 1);
        }
        else {
            this.subscribers = null;
        }    
    }

    next(value) {
        if(this.value === value) return;
        this.value = value;
        
        const { subscribers } = this;
        if(!subscribers) return;
        else if(Array.isArray(subscribers)) {
            for(let i = 0; i < subscribers.length; i++) {
                subscribers[i](value);
            }
        }
        else {
            subscribers(value);
        }      
    }
}