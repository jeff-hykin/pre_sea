import { toRepresentation } from "https://deno.land/x/good@1.7.1.1/flattened/to_representation.js"
import { escapeRegexMatch } from "https://deno.land/x/good@1.7.1.1/flattened/escape_regex_match.js"
import { tokenize, kinds } from "./tokenize.js"
const Path = await import('https://deno.land/std@0.117.0/path/mod.ts')

// next Tasks:
    // DONE: get #include working for relative paths
    // DONE: get #define working for object macros
    // test out nested macros and __LINE__
    // function macros
    // get ifndef working


const neutralKinds = [ kinds.whitespace, kinds.comment, kinds.punctuation, kinds.string, kinds.number, kinds.other ]
const specialMacros = [
    // see: https://gcc.gnu.org/onlinedocs/cpp/Standard-Predefined-Macros.html
    "__FILE__",
    "__LINE__",
    "__DATE__",
    "__TIME__",
    "__STDC__",
    "__STDC_VERSION__",
    "__STDC_HOSTED__",
    "__cplusplus",
    "__OBJC__",
    "__ASSEMBLER__",
]

// the recursive one
// mutates tokens array
export function* preprocess({ objectMacros, functionMacros, tokens, getFile, expandMacros = true }) {
    var tokenIndex = 0
    // basically a wrapper so that we can process yielded tokens
    function nextToken({ tokenIndex }) {
        const token = tokens[tokenIndex]
        // pass along as-is
        if (neutralKinds.includes(token.kind)) {
            return true
        }
        
        // 
        // macro expansion
        // 
        if (expandMacros && token.kind == kinds.identifier) {
            
            // see: https://gcc.gnu.org/onlinedocs/cpp/Standard-Predefined-Macros.html
            if (specialMacros.includes(token.text)) {
                if (token.text == '__FILE__') {
                    token.text = token.path
                } else if (token.text == '__LINE__') {
                    // TODO: test gcc/clang to see if it should be token.startLine or token.endLine
                    //       (startLine can be different from endLine because of line continuations)
                    // 
                    // FIXME: I think this is wrong for nested macro expansions
                    //        check if the token is original or from an expansion
                    //        if from an expansion, then use the line of what the expansion replaced
                    token.text = String(token.startLine-1)
                }
                // FIXME: other special macros expansion
                return true 
            }


            // easy check
            if (objectMacros[token.text]) {
                // replace token with list of replacement tokens
                tokens[tokenIndex] = objectMacros[token.text]
                return true 
            }
            
            // TODO: test this out
            if (functionMacros[token.text]) {
                let foundOpenParen = false
                let foundCloseParen = false
                let futureIndex = tokenIndex
                let paraenthesisCount = 0
                let args = [
                    []
                ]
                while (++futureIndex < tokens.length) {
                    const futureToken = tokens[futureIndex]
                    if (futureToken.kind == kinds.whitespace || futureToken.kind == kinds.comment) {
                        continue
                    }
                    if (!foundOpenParen && futureToken.kind != kinds.punctuation) {
                        break
                    }
                    if (futureToken.kind == kinds.punctuation) {
                        if (futureToken.text == '(') {
                            foundOpenParen = true
                            paraenthesisCount += 1
                            continue
                        }
                        if (futureToken.text == ')') {
                            foundCloseParen = true
                            paraenthesisCount -= 1
                            if (paraenthesisCount <= 0) {
                                break
                            }
                            continue
                        }
                        if (futureToken.text == ',') {
                            // TODO: should add checking here for borked parentheses
                            args.push([])
                        }
                    }
                    if (foundOpenParen) {
                        args[args.length-1].push(futureToken)
                    }
                }
                // then we found one
                if (foundCloseParen) {
                    // FIXME: function macro expansion
                    throw Error(`Unimplemented function macro expansion: ${token.text}`)
                }
            }
            
            // if we get here, then we didn't find a function macro
            return true 
        }

        // 
        // conditional map (leftover from #if/#elif/#else/#ifdef/#ifndef)
        // 
        if (token.kind == kinds.conditionalMap) {
            for (const [condition, consequence] of Object.entries(token.map)) {
                if (evalCondition({text: condition, objectMacros, functionMacros})) {
                    tokens.splice(tokenIndex, 1, ...consequence)
                    return false
                }
            }
            tokens.splice(tokenIndex, 1)
            return false
        }
        
        // 
        // 
        // directives
        // 
        // 
        if (token.kind == kinds.directive) {
            const match = token.text.match(/\s*\#\s*(\w*)/)
            const directive = match[1]
            const remainingText = token.text.slice(match[0].length)
            
            // 
            // macros
            // 
            if (directive == 'define') {
                // TODO: unicode and other weird names that are allowed
                const macroNameMatch = remainingText.match(/\s*(\w+)(\(.*\))?(.+)/) || []
                const macroName = macroNameMatch[1]
                const macroArgs = macroNameMatch[2]
                const macroBody = macroNameMatch[3]

                if (!macroName || !macroBody) {
                    throw Error(`Bad define directive: ${token.path}:${token.startLine}`)
                }

                if (macroArgs) {
                    // FUTURE: add warning for redefinition
                    functionMacros[macroName] = {
                        args: macroArgs.slice(1, -1).split(',').map(each=>each.trim()),
                        body: tokenize({ string: macroBody, path: token.path, startLine: token.startLine }),
                    }
                } else {
                    objectMacros[macroName] = tokenize({ string: macroBody, path: token.path, startLine: token.startLine })
                }
                tokens[tokenIndex] = []
            // 
            // includes
            // 
            } else if (directive == 'include') {
                const includeRawTarget = remainingText.trim()
                const quoteIncludeTarget = includeRawTarget.startsWith('"') && includeRawTarget.endsWith('"')
                const angleIncludeTarget = includeRawTarget.startsWith('<') && includeRawTarget.endsWith('>')
                const includeTarget = includeRawTarget.slice(1, -1)
                let newString = ""
                let fullPath
                if (quoteIncludeTarget) {
                    // FIXME: probably need to add like `${parentPath(token.path)}/${includeTarget}`
                    fullPath = `${Path.dirname(token.path)}/${includeTarget}`
                    newString = getFile(fullPath)
                } else if (angleIncludeTarget) {
                    // FIXME: do the proper lookup 
                    // newString = getFile(includeTarget)
                    // fullPath = includeTarget
                    throw Error(`Unimplemented angle include: ${token.text}`)
                }
                if (!newString) {
                    throw Error(`Bad include directive: ${token.path}:${token.startLine}`)
                }
                const newTokens = preprocess({
                    objectMacros,
                    functionMacros,
                    tokens: tokenize({ string: newString, path: fullPath }), 
                    getFile,
                    expandMacros,
                })
                // TODO: may need to add a #line directive
                tokens.splice(tokenIndex, 1, ...newTokens)
                return false
            //
            // conditionals
            //
            } else if (directive == 'endif') {
                console.warn(`Encountered unmatched #endif at ${token.path}:${token.startLine}`)
            } else if (directive.startsWith("if") || directive.startsWith("el")) {
                const metaToken = handleConditionals(tokens, tokenIndex)
                const totalTokensConsumed = (metaToken.endIndex+1)-tokenIndex
                tokens.splice(tokenIndex, totalTokensConsumed, metaToken)
                return false
            // 
            // pragma
            // 
            } else if (directive == 'pragma') {
                throw Error(`Unimplemented (pragma) ${token.text}`)
                // FIXME: pragma
            } else if (directive == 'embed') {
                throw Error(`Unimplemented (embed) ${token.text}`)
            } else if (directive == 'line') {
                // ignore it for now
                // TODO: consider a better way to handle this
            } else {
                throw Error(`Bad directive: ${token.text}`)
            }
            
            return true
        }
        
        // no transformation
        return true
    }

    while (tokenIndex < tokens.length) {
        if (nextToken({ tokenIndex })) {
            const token = tokens[tokenIndex]
            tokenIndex += 1
            // flatten as needed
            if (token instanceof Array) {
                for (const each of token) {
                    yield each
                }
            } else {
                yield token
            }
        }
    }
}

// TODO: it should be possible to do with without copying a bunch of tokens (wasted memory)
function handleConditionals(tokens, index) {
    let map = {}
    let condition = tokens[index].text
    map[condition] = []
    var index2 = index
    // note the first token is effectively skipped
    while (++index2 < tokens.length) {
        const token = tokens[index2].text.replace(/\s*#\s*/g, '')
        // nested (handles #if #ifdef #ifndef)
        if (token.startsWith('if')) {
            var { endIndex: index2, map: map2 } = handleConditionals(tokens, index2)
            map[condition].push(map2)
        // not nested (change of condition)
        } else if (token.startsWith('else') ||token.startsWith('elif')) {
            condition = tokens[index2].text
            map[condition] = []
        // close
        } else if (token.startsWith('endif')) {
            return { endIndex: index2, map, kind: kinds.conditionalMap }
        } else {
            map[condition].push(tokens[index2])
        }
    }
    console.warn(`unmatched #if/#endif at ${tokens[index].path}:${tokens[index].startLine}`)
    return { endIndex: index2, map, kind: kinds.conditionalMap }
}

function evalCondition({text, objectMacros, functionMacros}) {
    text = text.replace(/\s*#\s*/g, '')
    if (text == 'else') {
        return true
    }
    let match
    if (match = text.match(/^ifn?def/)) {
        const macroName = text.slice(match[0].length,).trim()
        // FIXME: test what this is supposed to do for built-in macros
        const out = objectMacros[ macroName]
        if (text.startsWith("ifn")) {
            return !out
        }
        return !!out
    } else if (text.match(/(el)?if/)) {
        throw Error(`Unimplemented #if/#elif`)
        // TODO full on eval machine with macro expansion
        // https://gcc.gnu.org/onlinedocs/cpp/If.html
    } else {
        throw Error(`Can't preprocessor-eval token: ${text}`)
    }
}