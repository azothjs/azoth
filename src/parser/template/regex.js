// sequence:
//     * zero or more spaces ("\s*")
//     * one or more \r or \n, ("[\r\n]+")
//     * zero or more spaces ("\s*")
// from: start ("^") AND/OR ("|") from end ("$");
export const DEV_TRIM_START = /^\s*[\r\n]+\s*/g;
export const DEV_TRIM_END = /\s*[\r\n]+\s*$/g;
export const DEV_TRIM = /^\s*[\r\n]+\s*|\s*[\r\n]+\s*$/g;

// https://regex101.com/r/eJJwAv/2
export const LAST_QUOTE = /(?:=)\s*(["|']?)\s*$/;
export const NEXT_QUOTE = /^\s*(["|'])/;
