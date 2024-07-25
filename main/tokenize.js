import { escapeRegexMatch } from "https://deno.land/x/good@1.7.1.1/flattened/escape_regex_match.js"

export const identifierPattern = /(?:[a-zA-Z_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})(?:[a-zA-Z0-9_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})*/
export const stringPattern = /"([^\\]|\\[^"\n\r])*"/g
export const charLiteralPattern = /'([^\\]|\\[^'\n\r])*'/g
export const punctuationList = [
    "<<=",
    ">>=",
    "<=>",
    "->*",
    "++",
    "--",
    "<<",
    ">>",
    "+=",
    "-=",
    "/=",
    "*=",
    "%=",
    "&=",
    "|=",
    "^=",
    "!=",
    "==",
    ">=",
    "<=",
    "->",
    "&&",
    "||",
    "::",
    ".*",
    "<%",
    "%>",
    "<:",
    ":>",
    "%:",
    ":%",
    "##",
    "!",
    "#",
    "%",
    "&",
    "(",
    ")",
    "*",
    "+",
    ",",
    "-",
    ".",
    "/",
    ":",
    ";",
    "<",
    "=",
    ">",
    "?",
    "[",
    "\\",
    "]",
    "^",
    "_",
    "{",
    "|",
    "}",
    "~",
    // intentionally not including: $,@,` because of the spec
    // intentionally not including quotes because this preprocessor handles strings and char literals separately
]

export const punctuationRegex = new RegExp(`(${punctuationList.map(escapeRegexMatch).join("|")})`, "g")
export const tokenize = (string) => {
    // null bytes outside of string/char is treated as whitespace
    let remainingString = string.replace(/"([^\\]|\\[^"\n\r])*"|'([^\\]|\\[^'\n\r])*'|.+/g, (result)=>{
        // if string/char no change
        if (result[0] != `"` && result[0] != `'`) {
            return result.replace(/\0/g, " ")
        // else replace null bytes with spaces
        } else {
            return result
        }
    })
    const tokens = []
    let index = 0
    while (remainingString.length) {
        let match
        // null bytes outside of string/char is treated as whitespace
        if ((match = remainingString.match(/\s+/))) {
            tokens.push({
                kind: "whitespace",
                value: match[0],
                startIndex: index,
                endIndex: index+match[0].length,
            })
        // number literal (straight from the spec)
        // "optional period, a required decimal digit, and then continue with any sequence of letters, digits, underscores, periods, and exponents. Exponents are the two-character sequences ‘e+’, ‘e-’, ‘E+’, ‘E-’, ‘p+’, ‘p-’, ‘P+’, and ‘P-’ "
        } else if ((match = remainingString.match(/\.?\d([0-9a-zA-Z_\.]|[eEpP][-+])*/))) {
            tokens.push({
                kind: "numeric",
                value: match[0],
                startIndex: index,
                endIndex: index+match[0].length,
            })
        // identifier
        } else if ((match = remainingString.match(identifierPattern))) {
            tokens.push({
                kind: "identifier",
                value: match[0],
                startIndex: index,
                endIndex: index+match[0].length,
            })
        // string
        } else if ((match = remainingString.match(stringPattern))) {
            tokens.push({
                kind: "string",
                value: match[0],
                startIndex: index,
                endIndex: index+match[0].length,
            })
        // char literal
        } else if ((match = remainingString.match(charLiteralPattern))) {
            tokens.push({
                kind: "charLiteral",
                value: match[0],
                startIndex: index,
                endIndex: index+match[0].length,
            })
        // punctuation
        } else if ((match = remainingString.match(punctuationRegex))) {
            tokens.push({
                kind: "punctuation",
                value: match[0],
                startIndex: index,
                endIndex: index+match[0].length,
            })
        } else if ((match = remainingString.match(/.+/))) {
            tokens.push({
                kind: "other",
                value: match[0],
                startIndex: index,
                endIndex: index+match[0].length,
            })
        } else {
            throw Error(`This should be unreachable: 82094209`)
        }
        index += match[0].length
        remainingString = remainingString.slice(match[0].length)
    }
    return tokens
    // TODO: check if $ should be treated as a letter/identifier 
}