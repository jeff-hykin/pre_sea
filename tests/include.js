import { preprocess } from '../main/main.js'
import { tokenize } from '../main/tokenize.js'
import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.72/main/file_system.js"

const mainFile = `#include "math.h"

    int main() {
        double a, b, c, discriminant, root1, root2, realPart, imagPart;
        printf("Enter coefficients a, b and c: ");
        scanf("%lf %lf %lf", &a, &b, &c);
        PI;
        
        __FILE__;
        __LINE__;
        discriminant = b * b - 4 * a * c;

        // condition for real and different roots
        if (discriminant > 0) {
            root1 = (-b + sqrt(discriminant)) / (2 * a);
            root2 = (-b - sqrt(discriminant)) / (2 * a);
            printf("root1 = %.2lf and root2 = %.2lf", root1, root2);
        }

        // condition for real and equal roots
        else if (discriminant == 0) {
            root1 = root2 = -b / (2 * a);
            printf("root1 = root2 = %.2lf;", root1);
        }

        // if roots are not real
        else {
            realPart = -b / (2 * a);
            imagPart = sqrt(-discriminant) / (2 * a);
            printf("root1 = %.2lf+%.2lfi and root2 = %.2f-%.2fi", realPart, imagPart, realPart, imagPart);
        }

        return 0;
    } 
`.replace(/    \n/g,"\n")


const fakeFileSystem = {
    "/test.cpp": mainFile,
    "/math.h": `#define PI 3.14159265358979323846`,
}

for (
    const each of preprocess({
        objectMacros: {},
        functionMacros: {},
        tokens: tokenize({string: fakeFileSystem["/test.cpp"], path: `/test.cpp`}),
        getFile: (path)=>fakeFileSystem[FileSystem.normalize(path)]
    })
) {
    
    console.log(
        each
    )
}