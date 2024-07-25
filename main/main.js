// because of nested replacements, sources have a dynmic structure
// the Source and Sources classes are just to make it easier to work with
// example structure:
//  [
//      {columnStart, columnEnd, active, sourceId},
//      {columnStart, columnEnd, active, sourceId},
//      [
//           {columnStart, columnEnd, active, sourceId},
//           {columnStart, columnEnd, active, sourceId},
//           [
//                {columnStart, columnEnd, active, sourceId},
//           ]
///     ],
//      {columnStart, columnEnd, active, sourceId},
//      [
//           {columnStart, columnEnd, active, sourceId},
///     ],
//  ]
class Source {
    constructor({columnStart, columnEnd, active, sourceId, lineNumber}) {
        this.columnStart = columnStart
        this.columnEnd = columnEnd
        this.active = active
        this.sourceId = sourceId
        this.lineNumber = lineNumber
    }
    deactivate() {
        this.active = false
        return this
    }
    duplicateAndDeactivate() {
        return (new Source(this)).deactivate()
    }
    getActiveSource() {
        if (this.active) {
            return this
        }
    }
    duplicate() {
        return new Source(this)
    }
    duplicateAndTrim(frontTrim, backTrim) {
        const duplicate = this.duplicate()
        if (duplicate.active) {
            if (frontTrim!=null) {
                duplicate.columnStart += frontTrim
            }
            if (backTrim!=null) {
                duplicate.columnEnd -= backTrim
            }
        }
        return duplicate
    }
}
// NOTE: refactor this, sources is basically a binary tree
class Sources extends Array {
    constructor(sources) {
        super()
        if (sources == undefined) {
            return
        }
        // for some reason this is being called with a number any time .map() is called on Sources
        // no idea why, probably some convoluted part of the Array class
        if (typeof sources == "number") {
            return
        }
        // enforce classes all the way down
        for (const each of sources) {
            if (each instanceof Sources) {
                this.push(each)
            } else if (each instanceof Source) {
                this.push(each)
            } else if (each instanceof Array) {
                this.push(new Sources(each))
            } else {
                this.push(new Source(each))
            }
        }
    }
    deactivate() {
        for (const each of this) {
            each.deactivate()
        }
        return this
    }
    duplicateAndDeactivate() {
        return (new Sources(this)).deactivate()
    }
    getActiveSource() {
        this.find(each=>each.getActiveSource())
    }
    duplicate() {
        return new Sources(this.map(each=>{
            return each.duplicate()
        }))
    }
    duplicateAndGrabFront(frontAmount) {
        const duplicate = this.duplicate()
        const firstActiveSource = duplicate.getActiveSource()
        if (firstActiveSource) {
            firstActiveSource.columnEnd = firstActiveSource.columnStart+frontAmount
        }
        return duplicate
    }
    duplicateAndGrabEnd(endAmount) {
        const duplicate = this.duplicate()
        const firstActiveSource = duplicate.getActiveSource()
        if (firstActiveSource) {
            firstActiveSource.columnStart = firstActiveSource.columnEnd+endAmount
        }
        return duplicate
    }
    duplicateAndTrim(frontTrim, backTrim) {
        const duplicate = this.duplicate()
        const firstActiveSource = duplicate.getActiveSource()
        if (firstActiveSource) {
            if (frontTrim!=null) {
                firstActiveSource.columnStart += frontTrim
            }
            if (backTrim!=null) {
                firstActiveSource.columnEnd -= backTrim
            }
        }
        return duplicate
    }
    asLineRangeLists() {
        let aggregated = []
        let prev = {}
        for (const each of this) {
            const isSourceList = !each.sourceId
            // leave lists as-is aside from recusing
            if (isSourceList) {
                aggregated.push(each.asLineRangeLists())
                prev = {}
                continue
            }
            // when new source, or a disjointed replacement, start a new range
            // FIXME: there is still an edge case here of a disjointed replacement that has a +1 on lineNumber, probably need to add "isLineEnder" to source info
            if (prev.id != each.sourceId || prev.endLine+1 != each.lineNumber) {
                prev = {
                    id: each.sourceId,
                    startLine: each.lineNumber,
                    endLine: each.lineNumber,
                }
                aggregated.push(prev)
            } else {
                prev.lineNumber += 1
            }
        }
        return aggregated
    }
}

/**
 * this exists to track the original line number for macro expansions (and maybe other things)
 *
 * @example
 * ```js
 * const base = new Stringy("hello world", "string1")
 * console.debug(`base is:`,base)
 * let result = base.splice(0, 5, new Stringy("goodbye", "string2"))
 * console.debug(`result is:`,result)
 * console.debug(`result is:`,result.toString())
 * // base is: Stringy {
 * //   chunks: [
 * //     {
 * //       chars: "hello world",
 * //       sources: Sources(1) [
 * //         Source {
 * //           columnStart: 0,
 * //           columnEnd: 11,
 * //           active: true,
 * //           sourceId: "string1",
 * //           lineNumber: 1
 * //         }
 * //       ]
 * //     }
 * //   ]
 * // }
 * // postChunk is: {
 * //   chars: " world",
 * //   sources: Sources(1) [
 * //     Source {
 * //       columnStart: 0,
 * //       columnEnd: 11,
 * //       active: true,
 * //       sourceId: "string1",
 * //       lineNumber: 1
 * //     }
 * //   ]
 * // }
 * // postChunkLength is: 6
 * // result is: Stringy {
 * //   chunks: [
 * //     {
 * //       chars: "goodbye",
 * //       sources: Sources(2) [
 * //         Source {
 * //           columnStart: 0,
 * //           columnEnd: 11,
 * //           active: false,
 * //           sourceId: "string1",
 * //           lineNumber: 1
 * //         },
 * //         Sources(1) [ [Source] ]
 * //       ]
 * //     },
 * //     {
 * //       chars: " world",
 * //       sources: Sources(1) [
 * //         Source {
 * //           columnStart: 0,
 * //           columnEnd: 11,
 * //           active: true,
 * //           sourceId: "string1",
 * //           lineNumber: 1
 * //         }
 * //       ]
 * //     }
 * //   ]
 * // }
 * // result is: goodbye world
 * ```
 */
class Stringy {
    constructor(str, sourceId) {
        // every chunk is 1 line or less. A chunk will either have no newline or 1 newline at the end
        // NOTE: with this regex (just a lookbehind), all chunks will have a length >=1
        this.chunks = str.split(/(?<=\n)/g).map((each, index) =>{
            return {
                chars: each,
                sources: new Sources([
                    new Source({
                        columnStart: 0,
                        columnEnd: each.length,
                        active: true,
                        sourceId: sourceId,
                        lineNumber: index+1,
                    }),
                ])
            }
        })
    }
    toString() {
        return this.chunks.map(each=>each.chars).join("")
    }
    /**
     * source-tracking splice
     *
     * @example
     *     .splice(start, length, {text: "replacement text", name: "hardCodedMacroReplacment"})
     *
     * @param start - 
     * @param length - 
     * @param {Stringy|Object} replacement - 
     * @param replacement.text - 
     * @param replacement.name - 
     * @returns {Stringy} output - this
     */
    splice(start, length, replacement) {
        // imagine a fence
        // |--|--|--|
        // ^ the bar is a post
        //  ^ the dashes are rails
        // this: |--| has two posts, post0 and post1. It has rail, "rail number" 1, aka "rail index" 0
        // posts != rails
        // only compare rails to rails, and posts to posts

        const postForInsertionStart = start
        const postForInsertionEnd = start+length
        // 
        // find affected chunks and their indicies
        // 
            let startChunk
            let endChunk
            let railForRunningCharNumber = 1
            let railForTheChunkNumberOfTheStartChunk = 0 // 1-indexed
            let railForTheChunkNumberOfTheEndChunk = 0 // 1-indexed
            let railForChunkNumber = 0 // 1-indexed                                        // pointing at first char
            let postForCharStartOfStartChunk = 0 // 0-indexed
            let postForCharEndOfEndChunk = 0 // 0-indexed
            for (const eachChunk of this.chunks) {                                         //  |
                railForChunkNumber += 1 // 1-indexed                                       //  v
                const postForCharStart = railForRunningCharNumber-1                        // |----|   start post is 0
                const postForCharEnd   = railForRunningCharNumber+eachChunk.chars.length-1 // |----|-  end post is 4
                if (startChunk == null) {
                    const startIsBeforeLastPost = postForCharEnd > postForInsertionStart // |----|----|----|
                    if (startIsBeforeLastPost) {                                         // here ^ or ^    ^ NOT here
                        postForCharStartOfStartChunk = postForCharStart
                        railForTheChunkNumberOfTheStartChunk = railForChunkNumber
                        startChunk = eachChunk
                    }
                }
                // dont do else, b/c sometimes startChunk == endChunk
                if (startChunk != null) {
                    if (postForCharEnd >= postForInsertionEnd) {                 // |----|----|----|
                        railForTheChunkNumberOfTheEndChunk = railForChunkNumber  // ^ or ^      or ^
                        postForCharEndOfEndChunk = postForCharEnd
                        endChunk = eachChunk
                        break
                    }
                }
                // move to first char of next chunk
                railForRunningCharNumber += eachChunk.chars.length
            }
            const postForChunkIndexOfStartChunk = railForTheChunkNumberOfTheStartChunk-1
            const postForChunkIndexOfEndChunk = railForTheChunkNumberOfTheEndChunk
            const affectedChunks = this.chunks.slice(postForChunkIndexOfStartChunk, postForChunkIndexOfEndChunk)
        // 
        // enforce classes all the way down for JSON serialization (its maybe possible to prove that this is not needed)
        // 
            for (const each of affectedChunks) {
                if (!(each.sources instanceof Sources)) {
                    each.sources = new Sources(each.sources)
                }
            }
        
        // 
        // create the replacement chunks (pre, mid(s), post)
        // 
            // 
            // handle pre and post chunks
            // 
            let preChunk
            let postChunk
            const preChunkLength = postForInsertionStart-postForCharStartOfStartChunk
            const postChunkLength = postForCharEndOfEndChunk-postForInsertionEnd
            const postForMidChunkRelativeStart = preChunkLength
            const postForMidChunkRelativeEnd = endChunk.chars.length-postChunkLength
            if (preChunkLength != 0) {
                preChunk = {
                    chars: startChunk.chars.slice(0, preChunkLength),
                    sources: startChunk.sources.duplicateAndGrabFront(preChunkLength),
                }
            }
            if (postChunkLength != 0) {
                postChunk = {
                    chars: endChunk.chars.slice(-postChunkLength),
                    sources: endChunk.sources.duplicateAndGrabEnd(postChunkLength),
                }
            }
            
            // 
            // handle mid chunk(s) sources
            // 
            const intermediateChunks = affectedChunks.slice(1, affectedChunks.length-1)
            let midChunkSources = new Sources()
            // slim-down the sources as much as possible (only relvent if they were active)
            if (startChunk == endChunk) {
                midChunkSources = startChunk.sources.duplicateAndTrim(preChunkLength, postChunkLength)
            // startChunk != endChunk
            } else {
                // start
                midChunkSources.push(
                    startChunk.sources.duplicateAndTrim(preChunkLength, null)
                )
                // middle (might be 0-length)
                for (const each of intermediateChunks) {
                    midChunkSources.push(
                        each.sources.duplicate()
                    )
                }
                // end
                midChunkSources.push(
                    endChunk.sources.duplicateAndTrim(null, postChunkLength)
                )
            }
            
            // convert replacement to Stringy if needed
            const isTrivialReplacement = replacement.text && replacement.name
            if (isTrivialReplacement) {
                replacement = new Stringy(replacement.text, replacement.name)
            }

            // finish creating midChunks
            const midChunks = replacement.chunks.map(eachChunk=>({
                chars: eachChunk.chars,
                sources: new Sources([
                    ...midChunkSources.deactivate(),
                    eachChunk.sources.duplicate(), // may or may not be active
                ]),
            }))
        // 
        // perform the splice
        // 
            const chunksToInsert = []
            if (preChunkLength != 0) {
                chunksToInsert.push(preChunk)
            }
            for (const each of midChunks) {
                chunksToInsert.push(each)
            }
            if (postChunkLength != 0) {
                chunksToInsert.push(postChunk)
            }
            
            // final mutation
            this.chunks.splice(postForChunkIndexOfStartChunk, affectedChunks.length, ...chunksToInsert)

        return this
    }
    replaceInplace(regexPattern, replacementFunc) {
        var match
        while (match = regexPattern.exec(sourceString)) {
            this.splice(match.index, match[0].length, replacementFunc(match))
            // handle zero-length matches
            if (match[0].length == 0) {
                regexPattern.lastIndex += 1
            }
        }
        return this
    }
    *rollingLineMutationIterator() {
        // this is complicated because its designed to iterate correctly despite mutations-during-iteration
        // however, this only works as long as the mutations affect prior-chunks

        let nextChunk = this.chunks[0]
        let chunkIndexBeforeYield = null
        while (nextChunk!=null) {
            let line = ""
            
            // 
            // find index of nextChunk
            // 
            let chunkIndex = -1
            // shortcut if nothing has changed
            if (chunkIndexBeforeYield != null && this.chunks[chunkIndexBeforeYield] == nextChunk) {
                chunkIndex = chunkIndexBeforeYield
            // if something did change, then brute force find where the chunk is
            } else {
                // (could probably optize this further by guessing nearyby the chunkIndexBeforeYield)
                for (const each of this.chunks) {
                    chunkIndex += 1
                    if (each == nextChunk) {
                        break
                    }
                }
            }
            let nextChunkIndex = chunkIndex
            for (const each of this.chunks.slice(chunkIndex)) {
                nextChunkIndex += 1
                line += each.chars
                if (line.slice(-1) == "\n") {
                    nextChunk = this.chunks[nextChunkIndex]
                    // this is computationally expensive, which is why its a getter
                    // its also a getter because we expect mutations, and unless the mutations themselved preserve the index somehow, we have to recompute it
                    // TODO: we could do single-line replacements more efficiently by returning a special replacer function that knows what chunks would be affected
                    const getStartCharIndex = ()=>{
                        // 
                        // find the start chunk
                        // 
                        let thisChunkIndex = nextChunkIndex
                        let remaningCharCount = line.length
                        for (const chunk of this.chunks.slice(0, nextChunkIndex-1).toReversed()) {
                            thisChunkIndex -= 1
                            remaningCharCount -= chunk.chars.length
                            if (remaningCharCount <= 0) {
                                break
                            }
                        }
                        // 
                        // count the number of chars to get there
                        //
                        let index = 0
                        for (const each of this.chunks.slice(0, thisChunkIndex)) {
                            index += each.chars.length
                        }
                        return index
                    }
                    // TODO: it could make replacements efficient/nice if we yielded the list of chunks that came together to make the yielded line
                    yield [ line, nextChunkIndex, nextChunk, getStartCharIndex ]
                    // break because we need to potentially re-find nextChunk since replacements may have mutated this Stringy since the last yield
                    chunkIndexBeforeYield = nextChunkIndex
                    break
                }
            }
        }
    }
    slice(start, end) {
        let index = 0
        let output = ""
        let gotStart = false
        for (const each of this.chunks) {
            if (!gotStart) {
                if (start>=index) {
                    gotStart = true
                    output += each.chars.slice(start-index, end-index)
                    const endOfChunk = index+each.chars.length
                    // if starts and ends in the same chunk, we're done
                    if (end<=endOfChunk) {
                        return output
                    }
                }
            } else {
                const endOfChunk = index+each.chars.length
                if (end<=endOfChunk) {
                    output += each.chars.slice(0, end-index)
                    return output
                } else {
                    output += each.chars
                }
            }
            index += each.chars.length
        }
        return output
    }
    firstLineMatch(regexPattern) {
        let line = ""
        for (const each of this.chunks) {
            line += each.chars
            if (line.slice(-1) == "\n") {
                break
            }
        }
        return line.match(regexPattern)
    }
    // trying to be more efficient than match
    lineByLineMatch(regexPattern) {
        let line = ""
        for (const each of this.chunks) {
            line += each.chars
            if (line.slice(-1) == "\n") {
                const match = line.match(regexPattern)
                if (match) {
                    return match
                }
                line = ""
            }
        }
        const match = line.match(regexPattern)
        if (match) {
            return match
        }
    }
    originalLineNumberOf(index) {
        let runningIndex = -1
        for (var each of this.chunks) {
            runningIndex += each.chars.length
            if (index < runningIndex) {
                return each.sources[0].lineNumber
            }
        }
        return each.sources[0].lineNumber
    }
}

const identifierPattern = /(?:[a-zA-Z_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})(?:[a-zA-Z0-9_]|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{8})*/
const stringPattern = /"([^\\]|\\[^"\n\r])*"/g
const charLiteralPattern = /'([^\\]|\\[^'\n\r])*'/g
const replacementId = (prefix)=>`${prefix}${Math.random()}`.replace(".", "")
const punctuationList = [
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
import { escapeRegexMatch } from "https://deno.land/x/good@1.7.1.1/flattened/escape_regex_match.js"
const punctuationRegex = new RegExp(`(${punctuationList.map(escapeRegexMatch).join("|")})`, "g")

const tokenize = (string) => {
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
