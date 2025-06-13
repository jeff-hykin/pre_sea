// parses C character literals including escape sequences and returns integer value
export function cCharToInt(str) {
    // FIXME: this function has a lot of problems / edge cases
    // Remove surrounding single quotes
    str = str.slice(1, -1)
    
    // TODO: empty char case
    
    // Handle escape sequences
    if (str.startsWith("\\")) {
        const escapeChar = str[1]
        switch (escapeChar) {
            // Simple escapes
            case "a":
                return 0x07 // Bell
            case "b":
                return 0x08 // Backspace
            case "f":
                return 0x0c // Form feed
            case "n":
                return 0x0a // Line feed
            case "r":
                return 0x0d // Carriage return
            case "t":
                return 0x09 // Horizontal tab
            case "v":
                return 0x0b // Vertical tab
            case "\\":
                return 0x5c // Backslash
            case "'":
                return 0x27 // Single quote
            case '"':
                return 0x22 // Double quote
            case "?":
                return 0x3f // Question mark

            // Octal escapes
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7": {
                const octalStr = str.slice(1).match(/^[0-7]{1,3}/)[0]
                return parseInt(octalStr, 8)
            }

            // Hex escapes
            case "x": {
                const hexStr = str.slice(2).match(/^[0-9a-fA-F]+/)[0]
                return parseInt(hexStr, 16)
            }

            // Unicode escapes
            case "u": {
                const codePoint = str.slice(2).match(/^[0-9a-fA-F]{4}/)[0]
                return parseInt(codePoint, 16)
                // Match 1-4 hex digits after \u
                const match = str.slice(2).match(/^[0-9a-fA-F]{1,4}/)
                if (!match) {
                    throw new Error("Invalid unicode escape sequence")
                }
                return String.fromCodePoint(parseInt(match[0].padEnd(4, "0"), 16)).codePointAt(0)
            }
            case "U": {
                const codePoint = str.slice(2).match(/^[0-9a-fA-F]{8}/)[0]
                return parseInt(codePoint, 16)
                // Match 1-8 hex digits after \U
                const match = str.slice(2).match(/^[0-9a-fA-F]{1,8}/)
                if (!match) {
                    throw new Error("Invalid unicode escape sequence")
                }
                return String.fromCodePoint(parseInt(match[0].padEnd(8, "0"), 16)).codePointAt(0)
            }

            default:
                throw new Error(`Invalid escape sequence: \\${escapeChar}`)
        }
    }

    // Handle multi-byte characters by using codePointAt instead of charCodeAt
    return str.codePointAt(0)
}
