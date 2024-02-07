const EMOJIS = 'EMOJIS';
export async function fetchEmojis() {
    // const json = localStorage.getItem(EMOJIS);
    // if(json) {
    //     try {
    //         return JSON.parse(json);
    //     }
    //     catch(ex) {
    //         // failed parse
    //         localStorage.removeItem(EMOJIS);
    //     }
    // }

    const res = await fetch('https://emojihub.yurace.pro/api/all');
    const emojis = await res.json();

    // localStorage.setItem(EMOJIS, JSON.stringify(emojis, true, 4));

    return emojis;
}

const EMOJI_URL = 'https://emojihub.yurace.pro/api/all';

export function streamEmojis() {
    return fetch(EMOJI_URL).then(res => res.body);
}

