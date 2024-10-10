import { escapeCString } from "./misc.js"
// FIXME: path.basename changes depending on OS that this runs on. Which breaks the purity of the preprocessor
import { basename, } from "https://deno.land/std@0.117.0/path/mod.ts"
import { tokenize, kinds, numberPatternStart, identifierPattern, Token } from "./tokenize.js"

export const hardcodedDefaults = Object.freeze({
    // NOTE: these are all from emcc on MacOS
    // NOTE2: frozen to prevent bad-hacks (these can all be changed by the user without mutating this object)
    __STDC__: "1",
    __STDC_VERSION__: "201710L",
    __STDC_HOSTED__: "1",
    __STDC_UTF_16__: "1",
    __STDC_UTF_32__: "1",
    __GNUC__: "4",
    __GNUC_MINOR__: "2",
    __GNUC_PATCHLEVEL__: "1",
    __VERSION__: '"Clang 17.0.6"',
    __NO_INLINE__: "1",
    __GNUC_STDC_INLINE__: "1",
    __USER_LABEL_PREFIX__: "",
    __SIZE_TYPE__: "long unsigned int",
    __PTRDIFF_TYPE__: "long int",
    __WCHAR_TYPE__: "int",
    __WINT_TYPE__: "int",
    __INTMAX_TYPE__: "long long int",
    __UINTMAX_TYPE__: "long long unsigned int",
    __INT8_TYPE__: "signed char",
    __INT16_TYPE__: "short",
    __INT32_TYPE__: "int",
    __INT64_TYPE__: "long long int",
    __UINT8_TYPE__: "unsigned char",
    __UINT16_TYPE__: "unsigned short",
    __UINT32_TYPE__: "unsigned int",
    __UINT64_TYPE__: "long long unsigned int",
    __INT_LEAST8_TYPE__: "signed char",
    __INT_LEAST16_TYPE__: "short",
    __INT_LEAST32_TYPE__: "int",
    __INT_LEAST64_TYPE__: "long long int",
    __UINT_LEAST8_TYPE__: "unsigned char",
    __UINT_LEAST16_TYPE__: "unsigned short",
    __UINT_LEAST32_TYPE__: "unsigned int",
    __UINT_LEAST64_TYPE__: "long long unsigned int",
    __INT_FAST8_TYPE__: "signed char",
    __INT_FAST16_TYPE__: "short",
    __INT_FAST32_TYPE__: "int",
    __INT_FAST64_TYPE__: "long long int",
    __UINT_FAST8_TYPE__: "unsigned char",
    __UINT_FAST16_TYPE__: "unsigned short",
    __UINT_FAST32_TYPE__: "unsigned int",
    __UINT_FAST64_TYPE__: "long long unsigned int",
    __INTPTR_TYPE__: "long int",
    __UINTPTR_TYPE__: "long unsigned int",
    __CHAR_BIT__: "8",
    __SCHAR_MAX__: "127",
    __WCHAR_MAX__: "2147483647",
    __SHRT_MAX__: "32767",
    __INT_MAX__: "2147483647",
    __LONG_MAX__: "2147483647L",
    __LONG_LONG_MAX__: "9223372036854775807LL",
    __WINT_MAX__: "2147483647",
    __SIZE_MAX__: "4294967295UL",
    __PTRDIFF_MAX__: "2147483647L",
    __INTMAX_MAX__: "9223372036854775807LL",
    __UINTMAX_MAX__: "18446744073709551615ULL",
    __SIG_ATOMIC_MAX__: "2147483647L",
    __INT8_MAX__: "127",
    __INT16_MAX__: "32767",
    __INT32_MAX__: "2147483647",
    __INT64_MAX__: "9223372036854775807LL",
    __UINT8_MAX__: "255",
    __UINT16_MAX__: "65535",
    __UINT32_MAX__: "4294967295U",
    __UINT64_MAX__: "18446744073709551615ULL",
    __INT_LEAST8_MAX__: "127",
    __INT_LEAST16_MAX__: "32767",
    __INT_LEAST32_MAX__: "2147483647",
    __INT_LEAST64_MAX__: "9223372036854775807LL",
    __UINT_LEAST8_MAX__: "255",
    __UINT_LEAST16_MAX__: "65535",
    __UINT_LEAST32_MAX__: "4294967295U",
    __UINT_LEAST64_MAX__: "18446744073709551615ULL",
    __INT_FAST8_MAX__: "127",
    __INT_FAST16_MAX__: "32767",
    __INT_FAST32_MAX__: "2147483647",
    __INT_FAST64_MAX__: "9223372036854775807LL",
    __UINT_FAST8_MAX__: "255",
    __UINT_FAST16_MAX__: "65535",
    __UINT_FAST32_MAX__: "4294967295U",
    __UINT_FAST64_MAX__: "18446744073709551615ULL",
    __INTPTR_MAX__: "2147483647L",
    __UINTPTR_MAX__: "4294967295UL",
    __SHRT_WIDTH__: "16",
    __INT_WIDTH__: "32",
    __LONG_WIDTH__: "32",
    __PTRDIFF_WIDTH__: "32",
    __SIG_ATOMIC_WIDTH__: "32",
    __SIZE_WIDTH__: "32",
    __WCHAR_WIDTH__: "32",
    __WINT_WIDTH__: "32",
    __INT_LEAST8_WIDTH__: "8",
    __INT_LEAST16_WIDTH__: "16",
    __INT_LEAST32_WIDTH__: "32",
    __INT_LEAST64_WIDTH__: "64",
    __INT_FAST8_WIDTH__: "8",
    __INT_FAST16_WIDTH__: "16",
    __INT_FAST32_WIDTH__: "32",
    __INT_FAST64_WIDTH__: "64",
    __INTPTR_WIDTH__: "32",
    __INTMAX_WIDTH__: "64",
    __SIZEOF_INT__: "4",
    __SIZEOF_LONG__: "4",
    __SIZEOF_LONG_LONG__: "8",
    __SIZEOF_SHORT__: "2",
    __SIZEOF_POINTER__: "4",
    __SIZEOF_FLOAT__: "4",
    __SIZEOF_DOUBLE__: "8",
    __SIZEOF_LONG_DOUBLE__: "16",
    __SIZEOF_SIZE_T__: "4",
    __SIZEOF_WCHAR_T__: "4",
    __SIZEOF_WINT_T__: "4",
    __SIZEOF_PTRDIFF_T__: "4",
    __BYTE_ORDER__: "1234",
    __ORDER_LITTLE_ENDIAN__: "1234",
    __ORDER_BIG_ENDIAN__: "4321",
    __ORDER_PDP_ENDIAN__: "3412",
    __GCC_HAVE_SYNC_COMPARE_AND_SWAP_1: "1",
    __GCC_HAVE_SYNC_COMPARE_AND_SWAP_2: "1",
    __GCC_HAVE_SYNC_COMPARE_AND_SWAP_4: "1",
    __GCC_HAVE_SYNC_COMPARE_AND_SWAP_8: "1",
    __NO_MATH_ERRNO__: "1",
    __unix__: "1",
    __BIGGEST_ALIGNMENT__: "16",
    __CHAR16_TYPE__: "unsigned short",
    __CHAR32_TYPE__: "unsigned int",
    __CONSTANT_CFSTRINGS__: "1",
    __DECIMAL_DIG__: "36",
    __FINITE_MATH_ONLY__: "0",
    __FLT_EVAL_METHOD__: "0",
    __FLT_RADIX__: "2",
    __GCC_ATOMIC_BOOL_LOCK_FREE: "2",
    __GCC_ATOMIC_CHAR16_T_LOCK_FREE: "2",
    __GCC_ATOMIC_CHAR32_T_LOCK_FREE: "2",
    __GCC_ATOMIC_CHAR_LOCK_FREE: "2",
    __GCC_ATOMIC_INT_LOCK_FREE: "2",
    __GCC_ATOMIC_LLONG_LOCK_FREE: "2",
    __GCC_ATOMIC_LONG_LOCK_FREE: "2",
    __GCC_ATOMIC_POINTER_LOCK_FREE: "2",
    __GCC_ATOMIC_SHORT_LOCK_FREE: "2",
    __GCC_ATOMIC_TEST_AND_SET_TRUEVAL: "1",
    __GCC_ATOMIC_WCHAR_T_LOCK_FREE: "2",
    __GXX_ABI_VERSION: "1002",
    __LITTLE_ENDIAN__: "1",
    __PRAGMA_REDEFINE_EXTNAME: "1",
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
        return new Token({...token, text: hardcodedDefaults.__STDC__, kind: kinds.number})
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
    // all the non-standard hardcoded macros
    ...(Object.fromEntries(Object.entries(defaultMacros).map(
        ([name, value])=>{
            value = String(value)
            let kind = kinds.identifier
            if (value.match(/^-?\d/)) {
                kind = kinds.number
            } else if (value.startsWith('"')) {
                kind = kinds.string
            }
            return [name, (token)=>new Token({...token, text: value, kind})]
        }
    ))),
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
    ...standardSpecialMacros,
}