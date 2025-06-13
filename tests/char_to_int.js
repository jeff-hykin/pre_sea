import { cCharToInt } from '../main/tools/c_char_to_int.js' 

// Test cases
const testCases = [
    // Valid character literals
    { input: "'a'", expected: true },
    { input: "'\\n'", expected: true },
    { input: "'\\t'", expected: true },
    { input: "'\\''", expected: true },
    { input: "'\\\\'", expected: true },
    { input: "'\\0'", expected: true },
    { input: "'\\x41'", expected: true },
    { input: "'\\101'", expected: true },
    { input: "'\\u0041'", expected: true },
    { input: "'\\u03A9'", expected: true },
    { input: "'\\U0001F600'", expected: true },

    { input: "L'a'", expected: true },
    { input: "u'a'", expected: true },
    { input: "U'a'", expected: true },
    { input: "u8'a'", expected: true },
    { input: "U'\\U0001F600'", expected: true },

    // Invalid character literals
    { input: "''", expected: false },
    { input: "'ab'", expected: false },
    { input: "'👋🏽'", expected: false },
    { input: "'''", expected: false },
    { input: "'\\x1234'", expected: false },
    { input: "'\\x'", expected: false },
    { input: "'\\u123'", expected: false },
    { input: "'\\U110000'", expected: false },
    { input: "'\\uD83D'", expected: false }, // lone surrogate
    { input: "'\\uDE00'", expected: false }, // lone surrogate
] 

for (let each of testCases) {
    let threw = false
    let message = ""
    try {
        let result = cCharToInt(each.input)
        message = `${each.input} => ${result}`
    } catch (error) {
        threw = true
        message = `${each.input} => ${error}`
    }
    if (!threw === each.expected) {
        console.log(`PASS: ${message}`)
    } else {
        console.log(`FAIL: ${message}`)
    }
}