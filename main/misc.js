export const replacementId = (prefix)=>`${prefix}${Math.random()}`.replace(".", "")

// TODO: validate this more thoroughly, especially for unicode
export function escapeCString(string) {
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

export class CompilerSpecifics {
    constructor({ defaultIncludePaths }) {
        this.defaultIncludePaths = defaultIncludePaths
    }
}
