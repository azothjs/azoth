import { html, find } from 'property-information';

export function findInfo(value) {
    const info = find(html, value);

    // fix for incorrect property names for events
    const { property } = info;
    if(property.startsWith('on')) {
        info.property = property.toLowerCase();
    }
    
    return info;
}

