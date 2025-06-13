# What is this?

A C Preprocessor as a pure-function written in JavaScript. Majority of features are working, but alpha-level quality.

Present features:
- `#include`
- `#define` object and function macros
- `#undef`
- `#ifdef` / `#ifndef`
- `#if` / `#elif`
- `defined()`
- `__FILE__`, `__DATE__`, `__TIME__`, `__TIMESTAMP__`,`__COUNTER__`,`__BASE_FILE__`,`__FILE_NAME__`,`__INCLUDE_LEVEL__`, etc
- stringizing
- concatenation
- `__LINE__` (kinda)

Missing features:
- `__has_attribute`
- pragmas
- vararg macros
- `#embed`


# Usage

```js
import { preprocess, tokenize } from "./main/main.js"

const fakeFileSystem = {
    // source code
    "/test.cpp": `
        #include <math.h>

        int main() {
            printf("PI = %.2lf", PI);
            return 0;
        }
    `,
    // All headers need to be in this object somewhere
    "/system/math.h": `
        #define PI 3.14159265358979323846
    `,
}

let tokenIterator = preprocess({
    tokens: tokenize({
        string: fakeFileSystem["/test.cpp"],
        path: `/test.cpp`,
    }),
    getFile: (path)=>fakeFileSystem[FileSystem.normalize(path)],
    systemFolders: [ "/system" ], // this is where #include <math.h> will be looked for
                                  // (top = highest priority, bottom = lowest priority)
    
    // use this to override stuff like __STDC__, __FILE__, or __LINE__
    specialMacros: {
        // __STDC__(token, {tokens, tokenIndex, sharedState, preprocessor}) {
        //     return new Token({...token, text: hardcodedDefaults.__STDC__, kind: kinds.number})
        // },
    },
    objectMacros: {}, // if you want to pre-declare your own macros they would go here
    functionMacros: {},
})

for (const each of tokenIterator) {
    console.log(
        each
    )
}
```