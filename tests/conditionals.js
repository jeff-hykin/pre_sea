import { preprocess } from '../main/main.js'
import { tokenize } from '../main/tokenize.js'
import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.72/main/file_system.js"

const mathH = `#define PI 3.14159265358979323846`
const testCpp = `#include "math.h"

int main() {
    double a, b, c, discriminant, root1, root2, realPart, imagPart;
    printf("Enter coefficients a, b and c: ");
    scanf("%lf %lf %lf", &a, &b, &c);
    PI;

    #define min(a,b) ((a)<(b)?(a):(b))
    
    #if min(-1, 1000) > 0
        printf("I should be NOT true");
    #else
        printf("I should be true");
    #endif

    #ifdef PI
        __FILE__;
        printf("im in a conditional ");
    #else
        printf("ITS A PROBLEM IF IM IN THE LOG FILE ");
    #endif
    
    #ifndef PI
        __FILE__;
        printf("ITS A PROBLEM IF IM IN THE LOG FILE ");
    #else
        __FILE__;
        printf("im in an else of a conditional ");
    #endif
    
    #ifndef PI
        __FILE__;
        printf("ITS A PROBLEM IF IM IN THE LOG FILE ");
    #elif 0
        __FILE__;
        printf("ITS A PROBLEM IF IM IN THE LOG FILE ");
    #endif
    
    #ifdef ALKJFLKASJDLASKJD
        printf("ITS A PROBLEM IF IM IN THE LOG FILE ");
    #elif 0
        printf("also would be a problem");
    #else
        printf("im in the #else of a conditional ");
    #endif

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
`

for (const each of preprocess({
        objectMacros: {},
        functionMacros: {},
        tokens: tokenize({string: testCpp, path: `${FileSystem.pwd}/test.cpp`}),
        getFile: (path)=>{
            if (path.endsWith("math.h")) {
                return mathH
            } else {
                return Deno.readTextFileSync(path)
            }
        }
    })) {
    
    console.log(
        "-- ",
        each
    )
}