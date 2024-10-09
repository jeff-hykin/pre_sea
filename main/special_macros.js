export const standardSpecialMacros = {
    // see: https://gcc.gnu.org/onlinedocs/cpp/Standard-Predefined-Macros.html
    __FILE__(sharedState, token, tokens, tokenIndex, identifierTransformation) {
        return new Token({...token, text: `"${escapeCString(token.path)}"`, kind: kinds.string})
    },
    __LINE__(sharedState, token, tokens, tokenIndex, identifierTransformation) {
        // TODO: test gcc/clang to see if it should be token.startLine or token.endLine
        //       (startLine can be different from endLine because of line continuations)
        // 
        // FIXME: I think this is wrong for nested macro expansions
        //        check if the token is original or from an expansion
        //        if from an expansion, then use the line of what the expansion replaced
        return new Token({...token, text: String(token.startLine-1), kind: kinds.number})
    },
    __DATE__(sharedState, token, tokens, tokenIndex, identifierTransformation) {
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
    __TIME__(sharedState, token, tokens, tokenIndex, identifierTransformation) {
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
    __STDC__(sharedState, token, tokens, tokenIndex, identifierTransformation) {
        return new Token({...token, text: "1", kind: kinds.number})
    },
    __STDC_VERSION__(sharedState, token, tokens, tokenIndex, identifierTransformation) {

    },
    __STDC_HOSTED__(sharedState, token, tokens, tokenIndex, identifierTransformation) {

    },
    __cplusplus(sharedState, token, tokens, tokenIndex, identifierTransformation) {

    },
    __OBJC__(sharedState, token, tokens, tokenIndex, identifierTransformation) {

    },
    __ASSEMBLER__(sharedState, token, tokens, tokenIndex, identifierTransformation) {

    },
}
export const commonMacros = {
    __TIMESTAMP__(sharedState, token, tokens, tokenIndex, identifierTransformation) {
        // example: __TIMESTAMP__ = "Wed Oct  9 16:17:38 2024"
        const dateToken = this.__DATE__(sharedState, token, tokens, tokenIndex, identifierTransformation)
        const timeToken = this.__TIME__(sharedState, token, tokens, tokenIndex, identifierTransformation)
        return new Token({
            ...token,
            text: dateToken.text.slice(0,-1) + " " + timeToken.text.slice(1),
            kind: kinds.string,
        })
    },
    ...standardSpecialMacros,
}