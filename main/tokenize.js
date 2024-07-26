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
export const numberPattern = /(?:\.?[0-9a-zA-Z_\.]|[eEpP][-+])*/
export const numberPatternStart = /^(?:\.?[0-9a-zA-Z_\.]|[eEpP][-+])*/
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
    while (string.length != 0) {
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
        let kind
        let match
        if (match = string.match(directivePatternStart)) {
            kind = kind.directive
        } else if (match = string.match(whitespacePatternStart)) {
            kind = kind.whitespace
        } else if (match = string.match(numberPatternStart)) {
            kind = kind.number
        } else if (match = string.match(commentPatternStart)) {
            kind = kind.comment
        } else if (match = string.match(stringPatternStart)) {
            kind = kind.string
        } else if (match = string.match(identifierPatternStart)) {
            kind = kind.identifier
        } else if (match = string.match(punctuationRegexStart)) {
            kind = kind.punctuation
        } else if (match = string.match(/.+/)) {
            kind = kind.other
        } else if (string.length == 0) {
            break
        } else {
            throw Error(`This should be unreachable: 50390539`)
        }
        const token = {
            kind,
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
        token.text = token.text.replace(id,"")
        tokens.push(token)
    }
    
    return tokens
}