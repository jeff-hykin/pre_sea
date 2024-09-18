import { escapeRegexMatch } from "https://deno.land/x/good@1.7.1.1/flattened/escape_regex_match.js"
import { replacementId } from "./misc.js"


export const kind = Object.freeze({
    directive: 1,
    whitespace: 2,
    number: 3,
    comment: 4,
    string: 5,
    identifier: 6,
    punctuation: 7,
    other: 8,
})

export const directivePatternStart = /^[ \t]*#.+/
export const whitespacePatternStart = /^[ \t\n\r]+/
// number literal (straight from the spec)
// "optional period, a required decimal digit, and then continue with any sequence of letters, digits, underscores, periods, and exponents. Exponents are the two-character sequences ‘e+’, ‘e-’, ‘E+’, ‘E-’, ‘p+’, ‘p-’, ‘P+’, and ‘P-’ "
export const numberPattern = /(?:\.?[0-9a-zA-Z_\.]|[eEpP][-+])+/
export const numberPatternStart = /^(?:\.?[0-9a-zA-Z_\.]|[eEpP][-+])+/
export const identifierPattern = /(?:[a-zA-Z_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})(?:[a-zA-Z0-9_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})*/
export const identifierPatternStart = /^(?:[a-zA-Z_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})(?:[a-zA-Z0-9_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})*/
export const commentPatternStart = /^\/\/.+|\/\*([^\*]|\*[^\/])*\*\//
export const stringPattern = /"([^\\]|\\[^"\n\r])*"/g
export const stringPatternStart = /^("([^\\]|\\[^"\n\r])*")/
export const charLiteralPattern = /'([^\\]|\\[^'\n\r])*'/g
export const charLiteralPatternStart = /^('([^\\]|\\[^'\n\r])*')/
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
export const punctuationRegexStart = new RegExp(`^(${punctuationList.map(escapeRegexMatch).join("|")})`, "g")

export class Token {
    constructor({kind, text, path, startLine, endLine}) {
        this.kind = kind
        this.text = text
        this.path = path
        this.startLine = startLine
        this.endLine = endLine
    }
}

/**
 * Tokenizes the provided string into a list of tokens.
 *
 * This function takes a string and a file path, and returns an array of `Token` objects representing the tokens in the string. The tokens are identified based on a set of regular expressions that match different types of tokens, such as directives, whitespace, numbers, comments, strings, identifiers, and punctuation.
 *
 * The function also handles line extensions (represented by a special line extension ID) and updates the `startLine` and `endLine` properties of each token to reflect the line numbers in the original string.
 *
 * @param {object} options - The options object.
 * @param {string} options.string - The input string to be tokenized.
 * @param {string} options.path - The file path of the input string.
 * @returns {Token[]} - An array of `Token` objects representing the tokens in the input string.
 */
export const tokenize = ({string, path}) => {
    
    // 
    // get a unique id for the line extension
    // 
    let lineExtensionId = replacementId()
    while (string.match(lineExtensionId)) {
        lineExtensionId = replacementId()
    }
    lineExtensionId = lineExtensionId+replacementId()
    
    // handle line extension 
    string = string.replace(/\\\n/g, lineExtensionId)

    // 
    // tokenize
    // 
    let tokens = []
    let lineNumber = 1
    let prevLength = string.length+1
    while (string.length != 0) {
        // prevent infinite loop if this code is broken somehow
        if (prevLength == string.length) {
            throw Error(`Internal error, string length did not change: ${string}`)
        }
        prevLength = string.length
        // match one of:
            // directive
            // or whitespace
            // or number
            // or comment
            // or string
            // or identifier
            // or punctuation
            // or other
        
        //
        // directives
        //
        let theKind
        let match
        if (match = string.match(directivePatternStart)) {
            theKind = kind.directive
        } else if (match = string.match(whitespacePatternStart)) {
            theKind = kind.whitespace
        } else if (match = string.match(numberPatternStart)) {
            theKind = kind.number
        } else if (match = string.match(commentPatternStart)) {
            theKind = kind.comment
        } else if (match = string.match(stringPatternStart)) {
            theKind = kind.string
        } else if (match = string.match(identifierPatternStart)) {
            theKind = kind.identifier
        } else if (match = string.match(punctuationRegexStart)) {
            theKind = kind.punctuation
        } else if (match = string.match(/.+/)) {
            theKind = kind.other
        } else if (string.length == 0) {
            break
        } else {
            throw Error(`This should be unreachable: 50390539`)
        }
        const token = {
            kind: theKind,
            text: match[0],
            path,
            startLine: -1,
            endLine: -1, 
        }
        // reduce the string
        string = string.slice(match[0].length)
        // track line number
        token.startLine = lineNumber
        lineNumber += [...match[0].matchAll(new RegExp(lineExtensionId+"|\n|\r","g"))].length
        token.endLine = lineNumber
        // fully remove line extension
        token.text = token.text.replace(lineExtensionId,"")
        tokens.push(new Token(token))
    }
    
    return tokens
}