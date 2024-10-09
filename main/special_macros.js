import { escapeCString } from "./misc.js"
// FIXME: path.basename changes depending on OS that this runs on. Which breaks the purity of the preprocessor
import { basename, } from "https://deno.land/std@0.117.0/path/mod.ts"
import { tokenize, kinds, numberPatternStart, identifierPattern, Token } from "./tokenize.js"

export const hardcodedDefaults = Object.freeze({
    // NOTE: no particular reason for any of these at the moment
    // NOTE2: frozen to prevent bad-hacks (these can all be changed by the user without mutating this object)
    __STDC_VERSION__: "201710L",
    __GNUC_MAJOR__: "4",
    __GNUC_MINOR__: "2",
    __GNUC_PATCHLEVEL__: "1",
})
export const standardSpecialMacros = {
    // see: https://gcc.gnu.org/onlinedocs/cpp/Standard-Predefined-Macros.html
    __FILE__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        return new Token({...token, text: `"${escapeCString(token.path)}"`, kind: kinds.string})
    },
    __LINE__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        // TODO: test gcc/clang to see if it should be token.startLine or token.endLine
        //       (startLine can be different from endLine because of line continuations)
        // 
        // FIXME: I think this is wrong for nested macro expansions
        //        check if the token is original or from an expansion
        //        if from an expansion, then use the line of what the expansion replaced
        return new Token({...token, text: String(token.startLine-1), kind: kinds.number})
    },
    __DATE__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        // example: __DATE__ = "Oct  9 2024"
        if (!sharedState.dateTime) {
            sharedState.dateTime = new Date()
        }
        const date = sharedState.dateTime
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
        return new Token({...token, text: `"${month} ${day} ${year}"`, kind: kinds.string})
    },
    __TIME__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        // example: __TIME__ = "16:17:38"
        if (!sharedState.dateTime) {
            sharedState.dateTime = new Date()
        }
        const date = sharedState.dateTime
        const hours   = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
        return new Token({...token, text: `"${hours}:${minutes}:${seconds}"`, kind: kinds.string})
    },
    __STDC__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        return new Token({...token, text: "1", kind: kinds.number})
    },
    __STDC_VERSION__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        return new Token({...token, text: hardcodedDefaults.__STDC_VERSION__, kind: kinds.number})
    },
    __STDC_HOSTED__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        return new Token({...token, text: "1", kind: kinds.number})
    },
    // part of the preprocessor standard, but not defined for C
    // __cplusplus(token, {tokens, tokenIndex, sharedState, preprocessor}) {
    //     // NOTE: is supposed to expand to a version number
    // },
    // part of the preprocessor standard, but not defined for C
    // __OBJC__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
    // 
    // },
    // part of the preprocessor standard, but not defined for C
    // __ASSEMBLER__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
    // 
    // },
}
export const commonMacros = {
    __TIMESTAMP__(token, ...args) {
        // example: __TIMESTAMP__ = "Wed Oct  9 16:17:38 2024"
        const dateToken = this.__DATE__(token, ...args)
        const timeToken = this.__TIME__(token, ...args)
        return new Token({
            ...token,
            text: dateToken.text.slice(0,-1) + " " + timeToken.text.slice(1),
            kind: kinds.string,
        })
    },
    __COUNTER__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        // example: __BASE_FILE__ = "/tmp/def25823.c"
        sharedState.counter = sharedState.counter || 0
        return new Token({
            ...token,
            text: String(sharedState.counter++),
            kind: kinds.number,
        })
    },
    __BASE_FILE__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        // example: __BASE_FILE__ = "/tmp/def25823.c"
        return new Token({
            ...token,
            text: `"${escapeCString(preprocessor.currentArgument.includeStack[0])}"`,
            kind: kinds.string,
        })
    },
    __FILE_NAME__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        // example: __FILE_NAME__ = "def25823.c"
        return new Token({...token, text: `"${escapeCString(basename(token.path))}"`, kind: kinds.string})
    },
    __INCLUDE_LEVEL__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        // example: __FILE_NAME__ = "def25823.c"
        return new Token({
            ...token,
            text: `"${escapeCString(preprocessor.currentArgument.includeStack.length-1)}"`,
            kind: kinds.number,
        })
    },
    __GNUC__(...args) { return this.__GNUC_MAJOR__(...args) },
    __GNUC_MAJOR__:(token)=>new Token({...token, text: hardcodedDefaults.__GNUC_MAJOR__, kind: kinds.number}),
    __GNUC_MINOR__:(token)=>new Token({...token, text: hardcodedDefaults.__GNUC_MINOR__, kind: kinds.number}),
    __GNUC_PATCHLEVEL__:(token)=>new Token({...token, text: hardcodedDefaults.__GNUC_PATCHLEVEL__, kind: kinds.number}),
    ...standardSpecialMacros,
}