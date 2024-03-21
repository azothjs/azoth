export async function fetchEmojis() {
    const res = await fetch('https://emojihub.yurace.pro/api/all');
    return await res.json();
}
