// 
// 
// Stringy: track a replacement came from (mutable string)
// 
// 



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
export class Source {
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
export class Sources extends Array {
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
export class Stringy {
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