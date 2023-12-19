// sequence:
//     * zero or more spaces ("\s*")
//     * one or more \r or \n, ("[\r\n]+")
//     * zero or more spaces ("\s*")
// from start ("^") OR ("|") from end ("$");

export const allRegex = /^\s*[\r\n]+\s*|\s*[\r\n]+\s*$/g;
export const leftRegex = /^\s*[\r\n]+\s*/g;
export const rightRegex = /\s*[\r\n]+\s*$/g;

const replaceWith = regex => html => html.replace(allRegex, '');
export const smartTrim = replaceWith(allRegex, '');
export const smartTrimLeft = replaceWith(leftRegex, '');
export const smartTrimRight = replaceWith(rightRegex, '');