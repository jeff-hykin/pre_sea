import { cNumberStringToJsNumber } from '../main/tools/c_number_string_to_js_number.js'

// Test cases
const testCases = [
    // Hexadecimal numbers
    { input: "0x123", expected: 291 },
    { input: "0X123", expected: 291 },
    { input: "0x1'23", expected: 291 },
    { input: "0x1'23'45", expected: 74565 },
    { input: "0xABCD", expected: 43981 },
    { input: "0xa'b'c'd", expected: 43981 },
    
    // Binary numbers
    { input: "0b101", expected: 5 },
    { input: "0B101", expected: 5 },
    { input: "0b1010'1100", expected: 172 },
    { input: "0b1'0'1'0", expected: 10 },
    
    // Octal numbers
    { input: "0123", expected: 83 },
    { input: "0'1'2'3", expected: 83 },
    
    // Decimal numbers
    { input: "123", expected: 123 },
    { input: "123'456", expected: 123456 },
    { input: "123.456", expected: 123.456 },
    { input: "123'456.789", expected: 123456.789 },
]

for (let each of testCases) {
    try {
        let result = cNumberStringToJsNumber(each.input)
        if (result === each.expected) {
            console.log(`PASS: ${each.input} => ${result}`)
        } else {
            console.log(`FAIL: ${each.input} => ${result}, expected ${each.expected}`)
        }
    } catch (error) {
        console.log(`ERROR: ${each.input} => ${error}`)
    }
}