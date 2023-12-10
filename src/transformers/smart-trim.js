// sequence:
//     * zero or more spaces ("\s*")
//     * one or more \r or \n, ("[\r\n]+")
//     * zero or more spaces ("\s*")
// from start ("^") OR ("|") from end ("$");

const regex = /^\s*[\r\n]+\s*|\s*[\r\n]+\s*$/g;

export default html => html.replace(regex, '');