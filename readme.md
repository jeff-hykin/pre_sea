# What is this?

A C Preprocessor as a pure-function written in JavaScript. Majority of features are working, but alpha-level quality.

# Usage

```js
import { preprocess } from "./main/main.js"

const fakeFileSystem = {
    // All headers need to be in this object somewhere
    "/math.h": `
        #define PI 3.14159265358979323846
    `,
    // actual source code
    "/test.cpp": `
        #include "math.h"
        #include "stdio.h"

        int main() {
            printf("PI = %.2lf", PI);
            return 0;
        }
    `,
}

for (
    const each of preprocess({
        objectMacros: {}, // if you want to pre-declare your own macros they would go here
        functionMacros: {},
        tokens: tokenize({string: fakeFileSystem["/test.cpp"], path: `/test.cpp`}),
        getFile: (path)=>fakeFileSystem[FileSystem.normalize(path)]
    })
) {
    console.log(
        each
    )
}
```