import { toRepresentation } from "https://deno.land/x/good@1.7.1.1/flattened/to_representation.js"
import { escapeRegexMatch } from "https://deno.land/x/good@1.7.1.1/flattened/escape_regex_match.js"
import { zipLong as zip } from "https://deno.land/x/good@1.9.0.0/flattened/zip_long.js"
import { regex } from "https://deno.land/x/good@1.9.0.0/flattened/regex.js"
import { tokenize, kinds, numberPatternStart, identifierPattern, Token } from "./tokenize.js"
const Path = await import('https://deno.land/std@0.117.0/path/mod.ts')

// next Tasks:
    // DONE: get #include working for relative paths
    // DONE: get #define working for object macros
    // DONE: get ifndef working
    // DONE: get stringizing working
    // DONE: get a hack for #if defined() working
    // make special macros an argument
    // test concat operator
    // test out nested macros and __LINE__
    // function macros

// features todo:
    // #include<>
    // test macro function expansion basic args
    // #if with function macro expansion
    // #if with __has_attribute()
    // #if with operators
    // macro function expansion VARARGS
    // finish __FILE__, __LINE__
    // __DATE__, __TIME__,
    // __STDC__, __STDC_VERSION__, __STDC_HOSTED__, __ASSEMBLER__
    // #line markers
    // pragma
    // standard macros for gcc MacOS
    // standard macros for gcc Linux
    // embed

const neutralKinds = new Set([ kinds.whitespace, kinds.number, kinds.comment, kinds.string, kinds.punctuation, kinds.other ])
const plainTextKinds = new Set([ ...neutralKinds, kinds.identifier ])
const standardSpecialMacros = {
    // see: https://gcc.gnu.org/onlinedocs/cpp/Standard-Predefined-Macros.html
    "__FILE__":(token, tokens, tokenIndex, identifierTransformation)=>{
        return new Token({...token, text: `"${escapeCString(token.path)}"`, kind: kinds.string})
    },
    "__LINE__":(token, tokens, tokenIndex, identifierTransformation)=>{
        // TODO: test gcc/clang to see if it should be token.startLine or token.endLine
        //       (startLine can be different from endLine because of line continuations)
        // 
        // FIXME: I think this is wrong for nested macro expansions
        //        check if the token is original or from an expansion
        //        if from an expansion, then use the line of what the expansion replaced
        return new Token({...token, text: String(token.startLine-1), kind: kinds.number})
    },
    "__DATE__":(token, tokens, tokenIndex, identifierTransformation)=>{
        //__DATE__ = "Oct  9 2024"
        const date = new Date()
        let month, day, year
        switch (date.getMonth()) {
            case 0: month = "Jan"; break
            case 1: month = "Feb"; break
            case 2: month = "Mar"; break
            case 3: month = "Apr"; break
            case 4: month = "May"; break
            case 5: month = "Jun"; break
            case 6: month = "Jul"; break
            case 7: month = "Aug"; break
            case 8: month = "Sep"; break
            case 9: month = "Oct"; break
            case 10: month = "Nov"; break
            case 11: month = "Dec"; break
        }
        day = `${date.getDay()}`.padStart(2, " ")
        year = date.getFullYear()
        return new Token({...token, text: `${month} ${day} ${year}`, kind: kinds.string})
    },
    "__TIME__":(token, tokens, tokenIndex, identifierTransformation)=>{

    },
    "__STDC__":(token, tokens, tokenIndex, identifierTransformation)=>{

    },
    "__STDC_VERSION__":(token, tokens, tokenIndex, identifierTransformation)=>{

    },
    "__STDC_HOSTED__":(token, tokens, tokenIndex, identifierTransformation)=>{

    },
    "__cplusplus":(token, tokens, tokenIndex, identifierTransformation)=>{

    },
    "__OBJC__":(token, tokens, tokenIndex, identifierTransformation)=>{

    },
    "__ASSEMBLER__":(token, tokens, tokenIndex, identifierTransformation)=>{

    },
}
const specialMacros = new Set([
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
])

// the recursive one
// mutates tokens array
export function* preprocess({ objectMacros, functionMacros, specialMacros=standardSpecialMacros, tokens, getFile, expandTextMacros = true, tokenIndex = 0, systemFolders=[] }) {
    const identifierTransformation = (tokens, tokenIndex)=>{
        if (expandTextMacros) {
            const token = tokens[tokenIndex]
            // 
            // special macros
            // 
            // see: https://gcc.gnu.org/onlinedocs/cpp/Standard-Predefined-Macros.html
            if (specialMacros[token.text]) {
                const token = specialMacros[token.text](token, tokens, tokenIndex, identifierTransformation)
                tokens.splice(tokenIndex, 1, token)
                return 1
            }
            
            //
            // object macros
            //
            if (objectMacros[token.text]) {
                tokens.splice(tokenIndex, 1, ...objectMacros[token.text])
                // don't double expand
                return objectMacros[token.text].length
            }
            
            // 
            // function macros
            // 
            if (functionMacros[token.text]) {
                let foundStart = false
                let futureTokenIndex = tokenIndex
                while (++futureTokenIndex < tokens.length) {
                    const each = tokens[futureTokenIndex]
                    if (each.text == "(") {
                        foundStart = true
                        break
                    } else if (each.kind == kinds.whitespace || each.kind == kinds.comment) {
                        continue
                    } else {
                        break
                    }
                }
                if (foundStart) {
                    console.log(`found start of function macro: ${token.text}`)

                    // make a copy incase of mutation
                    const macroInfo = {
                        ...functionMacros[token.text],
                        body: functionMacros[token.text].body.slice(),
                    }
                    let foundOpenParen = false
                    let foundCloseParen = false
                    let extraParaenthesisCount = 0
                    let indexToResumeOn = tokenIndex
                    let prevArg = []
                    const args = [
                        prevArg,
                    ]
                    let tokensToSplice = 1
                    
                    // NOTE: this is going to be mutatking the tokens array, but only tokens that appear after futureTokenIndex
                    for (const eachToken of preprocess({ objectMacros, functionMacros, tokens, getFile, expandTextMacros: false, tokenIndex: futureTokenIndex+1 })) {
                        console.debug(`eachToken is:`,eachToken)
                        tokensToSplice += 1
                        // 
                        // balace parentheses and check for end of args
                        //
                        if (eachToken.text == "(") {
                            prevArg.push(eachToken)
                            extraParaenthesisCount += 1
                        } else if (eachToken.text == ")") {
                            if (extraParaenthesisCount == 0) {
                                break
                            } else {
                                prevArg.push(eachToken)
                                extraParaenthesisCount -= 1
                            }
                        } else if (eachToken.text == ",") {
                            prevArg = []
                            args.push(prevArg)
                        } else {
                            prevArg.push(eachToken)
                        }
                    }
                    
                    if (args.length != macroInfo.args.length) {
                        // TODO: improve the error message
                        throw Error(`Function macro ${token.text} has ${args.length} args but it was called with ${macroInfo.args.length} args ${JSON.stringify(args)}`)
                    }
                    
                    // remove trailing and leading whitespace
                    for (const tokenList of args) {
                        while (tokenList[0]?.kind == kinds.whitespace) {
                            tokenList.shift()
                        }
                        while (tokenList.slice(-1)[0]?.kind == kinds.whitespace) {
                            tokenList.pop()
                        }
                    }
                    
                    // FIXME: check for stringized args or concat args
                    const argNameToTokens = Object.fromEntries(zip(macroInfo.args, args))
                    const argNames = new Set(macroInfo.args)
                    const bodyTokens = [...macroInfo.body]
                    let cleanerIndex = 0
                    // remove all prefixing whitespace tokens for ## concats
                    // (probably not efficent to do this before the next while loop but whatever)
                    while (cleanerIndex < bodyTokens.length) {
                        if (bodyTokens[cleanerIndex].kind == kinds.whitespace && bodyTokens[cleanerIndex+1].text == "##") {
                            bodyTokens.splice(cleanerIndex, 1)
                            continue
                        } else if (bodyTokens[cleanerIndex].text == "##" && bodyTokens[cleanerIndex+1].kind == kinds.whitespace) {
                            bodyTokens.splice(cleanerIndex+1, 1)
                            continue
                        } else {
                            cleanerIndex += 1
                        }
                    }
                    let bodyIndex = 0
                    while (bodyIndex < bodyTokens.length) {
                        const eachToken = bodyTokens[bodyIndex]
                        if (eachToken.text == "##") {
                            // NOTE:  bodyIndex will never be 0 because of the check when the macro was defined 
                            
                            // TODO: this should throw errors for invalid ## concats, but thats a lot of work
                            let prevToken = bodyTokens[bodyIndex-1]
                            let nextToken = bodyTokens[bodyIndex+1]
                            let prefixTokens = []
                            let postfixTokens = []
                            if (prevToken.kind == kinds.identifier && argNames.has(prevToken.text)) {
                                const tokens = argNameToTokens[prevToken.text]
                                prevToken = tokens[tokens.length-1]||new Token({kind: kinds.whitespace, text: " ", path: eachToken.path, startLine: eachToken.startLine, endLine: eachToken.endLine})
                                prefixTokens = tokens.slice(0, -1)
                            }
                            if (nextToken.kind == kinds.identifier && argNames.has(nextToken.text)) {
                                const tokens = argNameToTokens[nextToken.text]
                                nextToken = tokens[0]||new Token({kind: kinds.whitespace, text: " ", path: eachToken.path, startLine: eachToken.startLine, endLine: eachToken.endLine})
                                postfixTokens = tokens.slice(1)
                            }
                            const newToken = new Token({
                                kind: [prevToken.kind, nextToken.kind].filter(each=>each!=kinds.whitespace).pop()||kinds.other,
                                text: prevToken.text+nextToken.text,
                                // TODO: I'm unsure about this path and startLine/endLine
                                path: prevToken.path,
                                startLine: prevToken.startLine,
                                endLine: nextToken.endLine,
                            })
                            // NOTE: prefixTokens and postfixTokens are NOT standard
                            // usually I think they would cause errors, as would mixing invalid tokens (ex: string with an identifier)
                            bodyTokens.splice(bodyIndex-1, 3, ...prefixTokens, newToken, ...postfixTokens)
                            continue
                        } else if (eachToken.text.startsWith("#")) {
                            const argName = eachToken.text.slice(1,)
                            let text = argNameToTokens[argName].map(each=>each.text).join("")
                            // TODO: check that the startLine/endLine of this token makes sense
                            // need to C escape text
                            // FIXME: check if stringizing can have a string with two back to back spaces in it
                            const replacementToken = new Token({kind: kinds.string, text: `"${escapeCString(text)}"`, path: eachToken.path, startLine: eachToken.startLine, endLine: eachToken.endLine})
                            bodyTokens.splice(bodyIndex, 1, replacementToken)
                            continue
                        } else if (eachToken.kind == kinds.identifier && bodyTokens[bodyIndex+1]?.text != "##") {
                            if (argNameToTokens != null) {
                                // FIXME: I think they said args are expanded before being inserted
                                // which could make a differnce for function macros (arg name gets inserted in front of ()'s )
                                // right now its kind of coincidentally expanded in context inside this loop
                                bodyTokens.splice(bodyIndex, 1, ...argNameToTokens[eachToken.text])
                                continue
                            }
                            bodyIndex += identifierTransformation(bodyTokens, bodyIndex)
                            continue
                        }
                        bodyIndex += 1
                    }
                    
                    // FIXME: check for varargs
                    // then check for varargs
                    // FIXME: expand/replace normal args
                    // * I think then run another expansion pass on the output
                    // unclear if concat can concat to a macro name that then gets expanded by the second pass
                    tokens.splice(tokenIndex, tokensToSplice+1, ...bodyTokens)
                    return bodyTokens.length
                }
            }
            
            // if we get here, then we found a normal identifier
            return 1
        }
        return 1
    }
    let numberToYield = 0
    while (tokenIndex < tokens.length) {
        // this while(1) is only here to break/continue off of
        process_current_token: while(1) {
            const token = tokens[tokenIndex]

            // NOTE:
                // read "continue process_current_token" as "don't yield a token, re-evalute the (now swapped) current token"
                // read "break process_current_token" as "yield a token, process next token"
            
            // 
            // flatten
            // 
                // flatten conditional map (leftover from #if/#elif/#else/#ifdef/#ifndef)
                if (token.kind == kinds.conditionalMap) {
                    for (const [condition, consequence] of Object.entries(token.map)) {
                        const conditionToken = token.map[meta][condition]
                        if (evalCondition({text: condition, conditionToken, objectMacros, functionMacros, identifierTransformation})) {
                            tokens.splice(tokenIndex, 1, ...consequence)
                            numberToYield = 0 // needs re-evalution
                            // console.log(`breaking: 1`)
                            break process_current_token
                        }
                    }
                    tokens.splice(tokenIndex, 1)
                    numberToYield = 0 // needs re-evalution
                    // console.log(`breaking: 2`)
                    break process_current_token
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
                        const macroNameMatch = remainingText.match(/\s*(\w+)(\(.*?\))?(.+)/) || []
                        const macroName = macroNameMatch[1]
                        const macroArgs = macroNameMatch[2]
                        const macroBody = macroNameMatch[3]

                        if (!macroName || !macroBody) {
                            throw Error(`Bad define directive: ${token.path}:${token.startLine}`)
                        }
                        
                        if (macroArgs) {
                            // NOTE: this tokenize destroys the additional line numbers because the escaped newlines are already removed
                            const body = tokenize({ string: macroBody, path: token.path, startLine: token.startLine })
                            for (const each of body) {
                                each.endLine = token.endLine
                            }
                            if (body.length > 0) {
                                if (body[0].text == "##" || body.slice(-1)[0].text == "##") {
                                    throw Error(`Function macro ${token.text} on ${token.path}:${token.startLine} has ## at the end or beginning (which is invalid)`)
                                }
                            }
                            // FUTURE: add warning for redefinition
                            functionMacros[macroName] = {
                                args: macroArgs.slice(1, -1).split(',').map(each=>each.trim()),
                                body,
                            }
                        } else {
                            objectMacros[macroName] = tokenize({ string: macroBody, path: token.path, startLine: token.startLine })
                        }
                        tokens.splice(tokenIndex, 1)
                        numberToYield = 0 // doens't need re-evaluation, but just removed itself
                        // console.log(`breaking: 3`)
                        break process_current_token
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
                            
                            // error if followed by non-comments
                            // <name> note: can't escape>
                            // check standard system folders
                            // /usr/local/include
                            // libdir/gcc/target/version/include
                            // /usr/target/include
                            // /usr/include
                            // folders get prepended with -I 
                            // target is the canonical name of the system GCC was configured to compile code for
                            // For C++ programs, it will also look in /usr/include/g++-v3, first
                            // You can prevent GCC from searching any of the default directories with the -nostdinc option
                            // "name" also can't escape quote
                            // check if exists as a relative to that file path (not relative to PWD)
                            // then check if the file is used in the -iquote directories 
                            // then check the same paths as <file>
                            // read the file, ensure it ends with a new line, recurse with shared state, then resume

                            throw Error(`Unimplemented angle include: ${token.text}`)
                        } else {
                            throw Error(`Bad include directive: ${token.path}:${token.startLine}`)
                        }
                        if (!newString) {
                            throw Error(`Bad include directive: ${token.path}:${token.startLine}`)
                        }
                        const newTokens = preprocess({
                            objectMacros,
                            functionMacros,
                            specialMacros,
                            tokens: tokenize({ string: newString, path: fullPath }), 
                            getFile,
                            expandTextMacros: true, // TODO: check if this is correct
                        })
                        // TODO: may need to add a #line directive here
                        tokens.splice(tokenIndex, 1, ...newTokens)
                        numberToYield = newTokens.length
                        // console.log(`breaking: 4`)
                        break process_current_token
                    //
                    // conditionals
                    //
                    } else if (directive == 'endif') {
                        console.warn(`Encountered unmatched #endif at ${token.path}:${token.startLine}`)
                    } else if (directive.startsWith("if") || directive.startsWith("el")) {
                        const metaToken = handleConditionals(tokens, tokenIndex)
                        const totalTokensConsumed = (metaToken.endIndex+1)-tokenIndex
                        tokens.splice(tokenIndex, totalTokensConsumed, metaToken)
                        numberToYield = 0 // needs re-evaluation
                        // console.log(`breaking: 5`)
                        break process_current_token
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
                        numberToYield = 1
                        // console.log(`breaking: 6`)
                        break process_current_token
                    } else {
                        throw Error(`Bad directive: ${token.text}`)
                    }
                    
                    // console.log(`breaking: 7`)
                    break process_current_token
                }

            // 
            // 
            // macro expansion
            // 
            // 
                if (token.kind == kinds.identifier) {
                    numberToYield = identifierTransformation(tokens, tokenIndex)
                    // console.log(`breaking: 8`)
                    break process_current_token
                }
            
            // if we get here, there's no token transformation needed
            numberToYield = 1
            // console.log(`breaking: 9`)
            break process_current_token
        }
        while (numberToYield--) {
            if (tokens[tokenIndex]?.kind == kinds.conditionalMap) {
                throw Error(`This should never happen yielding a conditional map meta-token`)
            }
            yield tokens[tokenIndex]
            tokenIndex += 1
        }
    }
}

// TODO: it should be possible to do with without copying a bunch of tokens (wasted memory)
const meta = Symbol("meta")
function handleConditionals(tokens, index) {
    let map = {}
    map[meta] = {}
    let condition = tokens[index].text
    map[condition] = []
    map[meta][condition] = tokens[index]
    var index2 = index
    // note the first token is effectively skipped
    while (++index2 < tokens.length) {
        const tokenText = tokens[index2].text.replace(/^\s*#\s*/g, '')
        // nested (handles #if #ifdef #ifndef)
        if (tokenText.startsWith('if')) {
            var { endIndex: index2, map: map2 } = handleConditionals(tokens, index2)
            map[condition].push(map2)
        // not nested (change of condition)
        } else if (tokenText.startsWith('else') ||tokenText.startsWith('elif')) {
            const nextCondition = tokens[index2].text
            const conditionAlreadyExists = map[nextCondition] != null
            // impossible for the condition to be met, but it WOULD override the correct previous version
            // so we banish it to a usless #elif 0 instead of rewriting the code
            if (conditionAlreadyExists) {
                condition = `#elif 0 && ${Math.random()}`
            } else {
                condition = nextCondition
            }
            map[condition] = []
            map[meta][condition] = tokens[index2]
        // close
        } else if (tokenText.startsWith('endif')) {
            return { endIndex: index2, map, kind: kinds.conditionalMap }
        } else {
            map[condition].push(tokens[index2])
        }
    }
    console.warn(`unmatched #if/#endif at ${tokens[index].path}:${tokens[index].startLine}`)
    return { endIndex: index2, map, kind: kinds.conditionalMap }
}

// this one takes a directive
function evalCondition({text, conditionToken, objectMacros, functionMacros, identifierTransformation}) {
    text = text.replace(/\s*#\s*/g, '')
    if (text == 'else') {
        return true
    }
    let match
    if (match = text.match(/^ifn?def/)) {
        const macroName = text.slice(match[0].length,).trim()
        // FIXME: test what this is supposed to do for built-in macros
        const out = objectMacros[macroName] || functionMacros[macroName] || specialMacros.has(macroName)
        if (text.startsWith("ifn")) {
            return !out
        }
        return !!out
    } else if (match = text.match(/(?:el)?if\s*(.+)/)) {
        return preprocessorEval({string:match[1], conditionToken, objectMacros, functionMacros, identifierTransformation})
    } else {
        throw Error(`Can't preprocessor-eval token: ${text}`)
    }
}

// this one takes an expression (not a directive)
function preprocessorEval({string, conditionToken, objectMacros, functionMacros, identifierTransformation}) {
    let match
    const condition = string.trim()
    if (condition.match(/^\d+$/)) { // yes this can match octal, but for a boolean check it doesn't matter
        return !!condition.match(/[1-9]/)
    } else if ((match = condition.match(numberPatternStart)) && match.length == condition.length) {
        const baseNumber = match.replace(/(?:^0x|^0b|p|\.)/g,"").replace(/[eE].+/,"")
        // TODO: make sure this shortcut allways works for correctly formatted numbers
        //       (it will definitely give junk results for invalid numbers (ex: 0x1.2))
        return !!baseNumber.match(/[1-9a-fA-F]/)
    }
    
    // quick/short circuit if just one identifier
    if (match = string.match(regex`^\\s*(${identifierPattern})\\s*$`)) {
        if (!objectMacros[match[1]] && !specialMacros.has(match[1])) {
            return false
        }
    }

    // STEP 1: find all the "defined" usages and replace them with 1 or 0
    string = string.replaceAll(/\bdefined\s*\(\s*(\w+)\s*\)/g, (matchText, macroName)=>{
        if (objectMacros[macroName] || functionMacros[macroName] || specialMacros.has(macroName)) {
            return ' 1 '
        }
        return ' 0 '
    })
    
    // TODO: special handling would be needed here for __has_attribute
    // STEP 2: then expand all macros
    let tokens = tokenize({ string, path: conditionToken.path, startLine: conditionToken.startLine })
    for (const each of tokens) {
        each.endLine = conditionToken.endLine
    }
    let index = 0
    while (index < tokens.length) {
        index += identifierTransformation(tokens, index)
    }
    console.debug(`tokens is:`,tokens)
    // STEP 3: convert all non-macro identifiers into 0
    tokens = tokens.map(
        each=>(
            (each.kind != kinds.identifier)   ?   each   :    new Token({...each,  kind: kinds.number, text: "0"})
        )
    )
    // STEP 4: then convert all the chars to ints
    tokens = tokens.map(
        each=>(
                                                            // FIXME: this has many problems
            (each.kind != kinds.string)   ?   each   :    new Token({...each,  kind: kinds.number, text: eval(each.text).charCodeAt(0)})
        )
    )
    // string = string.replaceAll(/'(\\[^']|')*'/g, (matchText)=>{
    //     // FIXME: this has multiple problems
    //     return eval(matchText).charCodeAt(0)
    // })

    // STEP 5: then eval
    // FIXME: obvious multiple problems
    const stringVal = tokens.map(each=>each.text).join("")
    console.debug(`stringVal  is:`,stringVal )
    return eval(stringVal)

    // operators: addition, subtraction, multiplication, division, bitwise operations, shifts, comparisons, and logical operations (&& and ||). The latter two obey the usual short-circuiting rules of standard C.
        // +
        // -
        // *
        // /
        // &
        // |
        // ^
        // <<
        // >>
        // <
        // >
        // <=
        // >=
        // ==
        // !=
        // &&
        // ||
    //      expression is a C expression of integer type, subject to stringent restrictions. It may contain
    //     Integer constants.
    //     Character constants, which are interpreted as they would be in normal code.
    //     Arithmetic operators for addition, subtraction, multiplication, division, bitwise operations, shifts, comparisons, and logical operations (&& and ||). The latter two obey the usual short-circuiting rules of standard C.
    //     Macros. All macros in the expression are expanded before actual computation of the expression's value begins.
    //     Uses of the defined operator, which lets you check whether macros are defined in the middle of an `#if'.
    //     Identifiers that are not macros, which are all considered to be the number zero. This allows you to write #if MACRO instead of #ifdef MACRO, if you know that MACRO, when defined, will always have a nonzero value. Function-like macros used without their function call parentheses are also treated as zero.
    //     In some contexts this shortcut is undesirable. The `-Wundef' option causes GCC to warn whenever it encounters an identifier which is not a macro in an `#if'. 
    // The preprocessor does not know anything about types in the language. Therefore, sizeof operators are not recognized in `#if', and neither are enum constants. They will be taken as identifiers which are not macros, and replaced by zero. In the case of sizeof, this is likely to cause the expression to be invalid.

// The preprocessor calculates the value of expression. It carries out all calculations in the widest integer type known to the compiler; on most machines supported by GCC this is 64 bits. This is not the same rule as the compiler uses to calculate the value of a constant expression, and may give different results in some cases. If the value comes out to be nonzero, the `#if' succeeds and the controlled text is included; otherwise it is skipped. 

    throw Error(`Unimplemented #if/#elif`)
    // TODO full on eval machine with macro expansion
    // https://gcc.gnu.org/onlinedocs/cpp/If.html
}

// TODO: validate this more thoroughly, especially for unicode
function escapeCString(string) {
    // (\n|\r|\t|v|\\|'|"|\?)
    return string.replace(/(\\|\n|\r|\t|\v|'|"|\?|\0)/g, (matchText)=>{
        switch (matchText) {
            case "\\": return "\\\\"
            case "\n": return "\\n"
            case "\r": return "\\r"
            case "\t": return "\\t"
            case "\v": return "\\v"
            case "'": return "\\'"
            case '"': return '\\"'
            case "?": return "\\?"
            case "\0": return "\\0"
            default: return matchText
        }
    })
}