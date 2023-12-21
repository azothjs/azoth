// sequence:
//     * zero or more spaces ("\s*")
//     * one or more \r or \n, ("[\r\n]+")
//     * zero or more spaces ("\s*")
// from: start ("^") AND/OR ("|") from end ("$");

export const SMART_TRIM_START = /^\s*[\r\n]+\s*/g;
export const SMART_TRIM_END = /\s*[\r\n]+\s*$/g;
export const SMART_TRIM = /^\s*[\r\n]+\s*|\s*[\r\n]+\s*$/g;
