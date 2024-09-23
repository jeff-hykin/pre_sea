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

// TODO: it should be possible to do with without copying a bunch of tokens (wasted memory)
function handleConditionals(tokens, index) {
    let map = {}
    let condition = tokens[index]
    map[condition] = []
    let index2 = index
    // note the first token is effectively skipped
    while (++index2 < tokens.length) {
        const token = tokens[index2]
        // nested (handles #if #ifdef #ifndef)
        if (token.text.startsWith('#if')) {
            var { endIndex: index2, map: map2 } = handleConditionals(tokens, index2)
            map[condition].push(map2)
        // not nested (change of condition)
        } else if (token.text.startsWith('#else') ||token.text.startsWith('#elif')) {
            condition = tokens[index2]
        // close
        } else if (token.text.startsWith('#endif')) {
            return { endIndex: index2, map }
        } else {
            map[c].push(tokens[index2])
        }
    }
    console.warn(`unmatched #if/#endif at ${tokens[index].path}:${tokens[index].startLine}`)
    return { endIndex: index2, map }
}
// the recursive one
// mutates tokens array
export function* preprocess({ objectMacros, functionMacros, tokens, getFile, expandMacros = true }) {
    let tokenIndex = 0
    while (tokenIndex < tokens.length) {
        const token = tokens[tokenIndex]
        // pass along as-is
        if (neutralKinds.includes(token.kind)) {
            yield token
            tokenIndex++
            continue
        }
        
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
                yield token
                tokenIndex++
                continue
            }


            // easy check
            if (objectMacros[token.text]) {
                // replace token with list of replacement tokens
                tokens[tokenIndex] = objectMacros[token.text]
                yield token
                tokenIndex++
                continue
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
                    continue
                }
            }
            
            // if we get here, then we didn't find a function macro
            yield token
            tokenIndex++
            continue
        }
        
        // only one left (that needs transforming) is directive
        if (token.kind == kinds.directive) {
            const match = token.text.match(/\s*\#\s*(\w*)/)
            const directive = match[1]
            const remainingText = token.text.slice(match[0].length)
            if (directive == 'define') {
                // TODO: unicode and other weird names that are allowed
                const macroNameMatch = remainingText.match(/\s*(\w+)(\(.*\))?(.+)/) || []
                const macroName = macroNameMatch[1]
                const macroArgs = macroNameMatch[2]
                const macroBody = macroNameMatch[3]

                if (!macroName || !macroBody) {
                    return Error(`Bad define directive: ${token.path}:${token.startLine}`)
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
                }
                if (!newString) {
                    return Error(`Bad include directive: ${token.path}:${token.startLine}`)
                }
                const newTokens = expansion({
                    objectMacros,
                    functionMacros,
                    tokens: tokenize({ string: newString, path: fullPath }), 
                    getFile 
                })
                // TODO: may need to add a #line directive
                tokens.splice(tokenIndex, 1, ...newTokens)
            } else if (directive == 'if' || directive == 'ifdef' || directive == 'ifndef' || directive == 'elif' || directive == 'else' || directive == 'endif') {
                // FIXME: if/elif/else/endif
                    // need full compile time eval logic here
                    // needs to read ahead a bunch and effectively delete the closing endif/else/elif
            } else if (directive == 'pragma') {
                // FIXME: pragma
            } else if (directive == 'line') {
                // ignore it for now
                // TODO: consider a better way to handle this
            } else {
                return Error(`Bad directive: ${token.text}`)
            }
            
            yield token
            tokenIndex++
            continue
        }

        // no transformation
        yield token
        tokenIndex++
        continue
    }
}