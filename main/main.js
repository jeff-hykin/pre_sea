import { escapeRegexMatch } from "https://deno.land/x/good@1.7.1.1/flattened/escape_regex_match.js"

import { Stringy } from "./generic/stringy.js"
import { tokenize, identifierPattern, stringPattern, charLiteralPattern, punctuationRegex } from "./tokenize.js"

const replacementId = (prefix)=>`${prefix}${Math.random()}`.replace(".", "")
const macroExpand = ({string, getStartCharIndex, code, functionMacros, objectMacros, hasBeenExpanded={}, }) => {
    const tokens = tokenize(line)
    for (const token of tokens) {
        if (token.kind === 'identifier') {
            if (token.value == '__LINE__') {
                const lineStartIndex = getStartCharIndex()
                const lineNumber = code.originalLineNumberOf(lineStartIndex)
                code.splice(
                    lineStartIndex+token.startIndex,
                    token.endIndex-token.startIndex,
                    new Stringy(`${lineNumber}`, "__LINE__"),
                )
            //
            // FIXME: lookahed for ()'s
            //
            // PROBLEM: if this replacement grabs in to future chunks (which it very well may), then it will screw up the iteration
            } else if (functionMacros[token.value]) {
                // PROBLEM2: what happens if a macro is defined in the call of a function macro
                hasBeenExpanded[token.value] = true
                
            } else if (objectMacros[token.value]) {
                objectMacros[token.value] = macroExpand({
                    string: token.value,
                    code,
                    functionMacros,
                    objectMacros,
                    hasBeenExpanded
                })
                
            }
        } else if (token.type === 'char') {
            // replace macros with their definitions
            const macro = macros[token.value]
            if (macro) {
                token.value = macro
            }
        }
    }
}

function preprocess(path, fileContents, lookupOtherFiles, objectMacros = {}, functionMacros = {}) {
    const code = new Stringy(fileContents, path)
    // remove \\\n
    code.replaceInplace(/\\\n/g, (match)=>" ")
    // replace comments with space
    code.replaceInplace(/\/\/.+|\/\*([^\*]|\*[^\/])*\*\/()/g, (match)=>" ")
    // replace strings with placeholders
    let strings = {}
    let charLiterals = {}

    // process the file
    for (const [ line, _chunkIndex, _nextChunk, getStartCharIndex ] of code.rollingLineMutationIterator()) {
        let match
        // #error
        if (match = line.match(/ *# *error *(.+)/)) {
            throw Error(match[1])
        // #warning
        } else if (match = line.match(/ *# *warn(?:ing)? *(.+)/)) {
            console.warn(match[1])
            let index = getStartCharIndex()
            code.splice(index, match[0].length, new Stringy(" ", "#warningRemover"))
        // #define
        } else if (match = line.match(/ *# *define *(.+)/)) {
            // function macro
            if (match = line.match(/ *# *define *([^ \t\n\r\(\)]+) *\((.+)/)) {
                // FIXME:
                functionMacros[match[1]] = match[2]
            // object macro
            } else {
                objectMacros[match[1]] = match[2]
            }
            let index = getStartCharIndex()
            code.splice(index, match[0].length, new Stringy(" ", "#defineRemover"))
        // #include
        } else if (match = line.match(/ *# *include *([^ \t\n\r\(\)]+)/)) {
            // 
            // FIXME: do recursion here
            // 
                const rawPath = match[1]
                // TODO: parse the path
                // TODO: read the file
                // TODO: replacements and macro expansions

            const includeThing = match[1]
            code = code.slice(match[0].length)
        // if,ifdef,ifndef,else,elif,endif
        } else if (match = line.match(/ *# *(if|ifdef|ifndef|else|elif|endif) *(.+)/)) {
            // FIXME
        // pragma
        } else if (match = line.match(/ *# *pragma *(.+)/)) {
            // FIXME
        } else if (match = line.match(/ *# */)) {
            // probably a bad directive, TODO: handle this better
            console.warn(`Bad directive: ${line}`)
        // non-directive (keep as-is)
        } else {
            const tokens = tokenize(line)
            for (const token of tokens) {
                if (token.kind === 'identifier') {
                    if (token.value == '__LINE__') {
                        const lineStartIndex = getStartCharIndex()
                        const lineNumber = code.originalLineNumberOf(lineStartIndex)
                        code.splice(
                            lineStartIndex+token.startIndex,
                            token.endIndex-token.startIndex,
                            new Stringy(`${lineNumber}`, "__LINE__"),
                        )
                    //
                    // FIXME: lookahed for ()'s
                    //
                    // PROBLEM: if this replacement grabs in to future chunks (which it very well may), then it will screw up the iteration
                    } else if (functionMacros[token.value]) {
                        // PROBLEM2: what happens if a macro is defined in the call of a function macro
                        
                    } else if (objectMacros[token.value]) {
                        objectMacros[token.value] = token.value
                    }
                } else if (token.type === 'char') {
                    // replace macros with their definitions
                    const macro = macros[token.value]
                    if (macro) {
                        token.value = macro
                    }
                }
            }
            // use start/end of tokens to know where to replace on the code string
            // replace macros with their definitions
            // include __LINE__ and friends
        }
    }
    // restore strings and char literals
    
}


// Functions

// - tokenize ( string ) return iterable
//     - if null byte, treat as whitespace
//     - parse identifier
//     - parse number
//     - parse string
//         - "(\\.|[^"\n\r])*+"
//         - '(\\.|[^'\n\r])*+'
//         - *raw strings (grab from textmate)
//     - parse punctuation
//         - big punctuation
//             - <<=
//             - >>=
//             - <=>
//             - ->*
//             - ++
//             - --
//             - <<
//             - >>
//             - +=
//             - -=
//             - /=
//             - *=
//             - %=
//             - &=
//             - |=
//             - ^=
//             - !=
//             - ==
//             - >=
//             - <=
//             - ->
//             - &&
//             - ||
//             - ::
//             - .*
//             - <%  %>  <:  :>  %:  %:%:
//             - ##
//         - small
//             - get ASCII list, exclude $,@,`
//     - other
//         - if non whitespace and non punctuation
// - applyExpansion(tokens, activeMacros, keywords)
//     - for each token
//         - if keyword then skip
//         - check if function macro
//             - Problem: are arguments expanded before reaching the next argument (can an argument contain commas that affect the number of arguments)
//             - if next token is ( 
//             - and token is function macro
//             - iterate tokens, keep count
//                 - if directive, throw error (todo: see what gcc does)
//                 - if ) at count==0 then stop
//                 - If ( +1 
//                 - If ) -1
//                 - if comma at 0, then +1 comma
//                 - check if number of commas matches macro number of args+1
//                 - if yes then its a function macro expansion
//         - If yes then
//             - recursively run on each argument string, add active macro argument
//             - get the template
//                 - tokenize it
//                 - swap the arguments with their contents
//                 - if there is ## then concat two tokens
//                 - if there is # then run the stringify process
//             - swap out the tokens, and run the expansion again without the func macro as an active argument (see docs and test gcc on this) 
//         - If no then check if object macro
//             - if yes, then expand and call recursively with obj macro active macro
//             - *test if namespace of obj macro and func macro are separate
//     - return new token list
// - evaluateCondition(line)
//     - tokenize
//     - applyExpansion( line, keywords=["defined"])
//     - FIXME
//     - replace all non keyword identifiers with 0
//     - eval
//         - replace char literals with integers
//         - all ints are treated as 64bit
//         - operators:
//             - parentheses
//             - addition, subtraction, multiplication, division, bitwise operations, shifts, comparisons, and logical operations
//             - defined()
//             - special ones: __has_attribute, __has_cpp_attribute, __has_c_attribute, __has_builtin, etc
// - handle directive (string, macros)
//     - if not # then return string
//     - # error throw
//     - # warn, print then return string
//     - # undef
//         - delete macro definition
//     - # define
//         - if identifier not followed by ( then
//             - add name to the object macros and set rest of the line as the definition
//             - remove name from function macros
//         - if has parentheses then check the number of arguments
//             - If variadic, then make the number of arguments negative. Include the variadic name as part of the arguments 
//             - add the identifier to the function macro list, along with the number of arguments, the tokenized argument list, and the body of the macro
//     - # if/elif/ifdef/ifndef call 
//             - if def-based 
//                 - just check if name in macro definitions
//         -  else
//             - evaluateCondition(line)
//         - if false, iterate lines
//             - record char index
//             - count = 0
//             - if # if/ifdef/ifndef +1
//             - if # end if -1
//             - if -1 then stop
//             - if # elif or # else and 0 then stop
//             - slice out from start to stop
//             - return string 
//         - if true, iterate lines
//             - count = 0
//             - if # if/ifdef/ifndef +1
//             - if # endif -1
//             - if first (elif or else) for count = 0 record char number
//             - if count == -1 stop
//                 - if elif / else found, slice out from it to end
//                 - return new string
//         - # include
//             - can be followed by an identifier
//                 - expand
//                     - 
//                     - If expands to quote 
//                     - chop of first quote non-whitespace 
//                     - last non-whitespace char needs to be a quote
//                     - this is a hack for getting quotes into a file name
//                 -  if bracket, go till next >, reduce all whitespace to a single space
//                     - trailing space is removed
//                 - error if followed by non-comments
//             - <name> note: can't escape>
//                 - check standard system folders 
//                     -  /usr/local/include
//                     - libdir/gcc/target/version/include
//                     - /usr/target/include
//                     - /usr/include
//                     - folders get prepended with -I 
//                     - target is the canonical name of the system GCC was configured to compile code for
//                 - For C++ programs, it will also look in /usr/include/g++-v3, first
//                 - You can prevent GCC from searching any of the default directories with the -nostdinc option
//             - "name" also can't escape quote
//                 - check if exists as a relative to that file path (not relative to PWD)
//                 - then check if the file is used in the -iquote directories 
//                 - then check the same paths as <file>
//                 - read the file, ensure it ends with a new line, recurse with shared state, then resume
//         - # pragma
//             - FIXME
// - main(string, systemPaths, includePaths, predefinedMacros, availableCAttributes, availableCppAttributes, features)
//     - get paths for include
//     - remove \\\n
//     - replace comments with space
//     - add predefined macros
//     - iterate line by line
//         - if # then handle macro, receive replacement string
//         - if not # then perform macro expansion on the line
//     - return string and macro definitions
//         - # 
//         - Space after
//         - Directive name
//             - define
//                 - Token no-space ( is function like macro
//                 - Token space stuff is object macro
//             - include
//                 - can be followed by an identifier
//                 - <name> note: can't escape >
//                     - "name" also can't escape quote
//                 - error if followed by non-comments
//             - GNU extension # include_next
//                 - probably not going to support it
//     - some special things
//         - "defined"
//         - C++ operator aliases (and/or)
//     - string (single, double, raw?)
//         - Header file names not included
//     - identifier
//         - Unicode stuff
//         - $ as a letter
//     - number
//         - numbers begin with an optional period, a required decimal digit, and then continue with any sequence of letters, digits, underscores, periods, and exponents. Exponents are the two-character sequences ‘e+’, ‘e-’, ‘E+’, ‘E-’, ‘p+’, ‘p-’, ‘P+’, and ‘P-’
//     - punctuation
//         - all the two- and three-character operators
//         - ## and #
//         - Digraphs <%  %>  <:  :>  %:  %:%:
//         - every punctuation character in ASCII other than @ $ and backtick
//     - other-char
//         - null char outside of string is treated as whitespace
//         - pass everything else as-is
// - Process
//     - if token is a obj macro name
//         - perform replacements repeatedly but prevent infinite recursion
//     - if token is a func macro name
//         - check for open-close parentheses 
//         - All arguments to a macro are completely macro-expanded before they are substituted into the macro body
//         - Leading and trailing whitespace in each argument is dropped
//         - Says "After substitution, the complete text is scanned again for macros to expand, including the arguments." but I'm not sure if that includes weird stuff like the b macro `a b ()` becoming `a ()`  then that triggering the a macro
//         - Stringigizing
//         - Concat
//         - 
//     - define func macro
//         - register it in the func macro list
//     - define object macro
//         - register it in the obj macro list
//     - Include macro_name
//         - expand
//         - If quote 
//             - chop of first quote non-whitespace 
//             - last non-whitespace char needs to be a quote
//             - this is a hack for getting quotes into a file name
//         -  if bracket, go till next >, reduce all whitespace to a single space
//             - trailing space is removed
//     - Include <>
//         - check standard system folders 
//         -  /usr/local/include
//         - libdir/gcc/target/version/include
//         - /usr/target/include
//         - /usr/include
//         - folders get prepended with -I 
//         - target is the canonical name of the system GCC was configured to compile code for
//         - For C++ programs, it will also look in /usr/include/g++-v3, first
//         - You can prevent GCC from searching any of the default directories with the -nostdinc option
//     - Include "path/file.h"
//         - check if exists as a relative to that file path (not relative to PWD)
//         - then check if the file is used in the -iquote directories 
//         - then check the same paths as <file>
//         - read the file, ensure it ends with a new line, recurse with shared state, then resume
// Caveats:
// - Some (hardcoded list) system headers get wrapped with an extern "C"





// old notes:
// Line start
// Space before
// #
// Space after
// Directive name
// define
// Token no-space ( is function like macro
// Token space stuff is object macro
// include
// can be followed by an identifier
// <name> note: can't escape >
// "name" also can't escape quote
// error if followed by non-comments
// GNU extension # include_next
// probably not going to support it
// some special things
// "defined"
// C++ operator aliases (and/or)
// string (single, double, raw?)
// Header file names not included
// identifier
// Unicode stuff
// $ as a letter
// number
// numbers begin with an optional period, a required decimal digit, and then continue with any sequence of letters, digits, underscores, periods, and exponents. Exponents are the two-character sequences ‘e+’, ‘e-’, ‘E+’, ‘E-’, ‘p+’, ‘p-’, ‘P+’, and ‘P-’
// punctuation
// all the two- and three-character operators
// ## and #
// Digraphs <%  %>  <:  :>  %:  %:%:
// every punctuation character in ASCII other than @ $ and backtick
// other-char
// null char outside of string is treated as whitespace
// pass everything else as-is
// Process
// if token is a obj macro name
// perform replacements repeatedly but prevent infinite recursion
// if token is a func macro name
// check for open-close parentheses
// All arguments to a macro are completely macro-expanded before they are substituted into the macro body
// Leading and trailing whitespace in each argument is dropped
// Says "After substitution, the complete text is scanned again for macros to expand, including the arguments." but I'm not sure if that includes weird stuff like the b macro a b () becoming a ()  then that triggering the a macro
// Stringigizing
// Concat

// define func macro
// register it in the func macro list
// define object macro
// register it in the obj macro list
// Include macro_name
// expand
// If quote
// chop of first quote non-whitespace
// last non-whitespace char needs to be a quote
// this is a hack for getting quotes into a file name
//  if bracket, go till next >, reduce all whitespace to a single space
// trailing space is removed
// Include <>
// check standard system folders
//  /usr/local/include
// libdir/gcc/target/version/include
// /usr/target/include
// /usr/include
// folders get prepended with -I
// target is the canonical name of the system GCC was configured to compile code for
// For C++ programs, it will also look in /usr/include/g++-v3, first
// You can prevent GCC from searching any of the default directories with the -nostdinc option
// Include "path/file.h"
// check if exists as a relative to that file path (not relative to PWD)
// then check if the file is used in the -iquote directories
// then check the same paths as <file>
// read the file, ensure it ends with a new line, recurse with shared state, then resume

// Caveats:
// Some (hardcoded list) system headers get wrapped with an extern "C"
