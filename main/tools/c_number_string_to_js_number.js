/**
 * Converts a C++ number string to a JavaScript number
 * Handles hex, binary, octal numbers and supports single quotes as digit separators
 * @param {string} str - The C++ number string (e.g. "0x1'23'45", "0b1010'1100", "123'456")
 * @returns {number} The converted JavaScript number
 */
export function cNumberStringToJsNumber(str) {
    // TODO: I have not rigorously compared this to the spec.
    // FIXME: There are certainly edge cases because of JS floating point values
    //        notably things like INT_MAX or LONG_MAX
    //        this should probably be re-written to use BigInt

    // Remove all single quotes used as digit separators
    str = str.replace(/'/g, "")

    // Handle different number formats
    if (str.startsWith("0x") || str.startsWith("0X")) {
        // Hexadecimal
        return parseInt(str.substring(2), 16)
    } else if (str.startsWith("0b") || str.startsWith("0B")) {
        // Binary
        return parseInt(str.substring(2), 2)
    } else if (str.startsWith("0") && str.length > 1 && /^0[0-7]+$/.test(str)) {
        // Octal
        return parseInt(str.substring(1), 8)
    } else {
        // Decimal
        return parseFloat(str)
    }
}
