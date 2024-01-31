
export function RawHTML({ html, className = '' }) {
    const rawEmoji = <span className={className ?? ''}></span>;
    if(html) rawEmoji.innerHTML = html;
    return rawEmoji;
}