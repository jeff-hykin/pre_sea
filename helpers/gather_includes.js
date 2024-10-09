import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.72/main/file_system.js"
// import { pureBinaryifyFolder } from "https://deno.land/x/binaryify@2.5.0.1/tools.js"
import { _binaryifyFolder } from "/Users/jeffhykin/repos/binaryify/binaryify_api.js"
import { hashers } from "https://deno.land/x/good@1.9.1.1/encryption.js"



var paths = [
    "/usr/local/include",
    "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/local/include", // didnt exist
    "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include",
    "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include",
    "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include",
    "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks",
]
for (const each of paths) {
    const hash = await hashers.sha256(each)
    console.log(`cp ${JSON.stringify(each)} "./main/compiler_specifics/macos_apple_silicon/${hash}"`)
}

// await FileSystem.write({
//     data: await _binaryifyFolder("/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include"),
//     path: "./bundle.js"
// })

// import * as data from "./bundle.js"
// data.items["stdalign.h"].bytes


// "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include")

// function bundleUp(includePaths, targetDirectory) {
//     const importPathList = []
//     const fakeFileSystem = {}
//     // NOTE: this outside loop CANNOT be put in an await Promise.all because the order matters
//     for (const eachIncludePath of includePaths) {
//         // await FileSystem.listFilePathsIn("/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include")
//         await Promise.all(
//             (await FileSystem.listFilePathsIn(eachIncludePath)).map(async (eachHeaderPath)=>{
//                 const relativePart = eachHeaderPath.slice(eachIncludePath.length+1)
//                 // NOTE: 
//                 if (!fakeFileSystem[relativePart]) {
//                     await binaryify({
//                         pathToBinary: eachHeaderPath,
//                         pathToBinarified: FileSystem.join(targetDirectory, relativePart),
//                     })
//                 }
//             })
//         )
//     }
// }



// [
//     "__clang_cuda_builtin_vars.h",
//     "__clang_cuda_cmath.h",
//     "__clang_cuda_complex_builtins.h",
//     "__clang_cuda_device_functions.h",
//     "__clang_cuda_intrinsics.h",
//     "__clang_cuda_libdevice_declares.h",
//     "__clang_cuda_math.h",
//     "__clang_cuda_math_forward_declares.h",
//     "__clang_cuda_runtime_wrapper.h",
//     "__clang_cuda_texture_intrinsics.h",
//     "__clang_hip_cmath.h",
//     "__clang_hip_libdevice_declares.h",
//     "__clang_hip_math.h",
//     "__clang_hip_runtime_wrapper.h",
//     "__stddef_max_align_t.h",
//     "__wmmintrin_aes.h",
//     "__wmmintrin_pclmul.h",
//     "adxintrin.h",
//     "altivec.h",
//     "ammintrin.h",
//     "amxintrin.h",
//     "arm64intr.h",
//     "arm_acle.h",
//     "arm_bf16.h",
//     "arm_cde.h",
//     "arm_cmse.h",
//     "arm_fp16.h",
//     "arm_mve.h",
//     "arm_neon.h",
//     "arm_sve.h",
//     "armintr.h",
//     "avx2intrin.h",
//     "avx512bf16intrin.h",
//     "avx512bitalgintrin.h",
//     "avx512bwintrin.h",
//     "avx512cdintrin.h",
//     "avx512dqintrin.h",
//     "avx512erintrin.h",
//     "avx512fintrin.h",
//     "avx512fp16intrin.h",
//     "avx512ifmaintrin.h",
//     "avx512ifmavlintrin.h",
//     "avx512pfintrin.h",
//     "avx512vbmi2intrin.h",
//     "avx512vbmiintrin.h",
//     "avx512vbmivlintrin.h",
//     "avx512vlbf16intrin.h",
//     "avx512vlbitalgintrin.h",
//     "avx512vlbwintrin.h",
//     "avx512vlcdintrin.h",
//     "avx512vldqintrin.h",
//     "avx512vlfp16intrin.h",
//     "avx512vlintrin.h",
//     "avx512vlvbmi2intrin.h",
//     "avx512vlvnniintrin.h",
//     "avx512vlvp2intersectintrin.h",
//     "avx512vnniintrin.h",
//     "avx512vp2intersectintrin.h",
//     "avx512vpopcntdqintrin.h",
//     "avx512vpopcntdqvlintrin.h",
//     "avxintrin.h",
//     "avxvnniintrin.h",
//     "bmi2intrin.h",
//     "bmiintrin.h",
//     "builtins.h",
//     "cet.h",
//     "cetintrin.h",
//     "cldemoteintrin.h",
//     "clflushoptintrin.h",
//     "clwbintrin.h",
//     "clzerointrin.h",
//     "cpuid.h",
//     "crc32intrin.h",
//     "emmintrin.h",
//     "enqcmdintrin.h",
//     "f16cintrin.h",
//     "float.h",
//     "fma4intrin.h",
//     "fmaintrin.h",
//     "fxsrintrin.h",
//     "gfniintrin.h",
//     "hexagon_circ_brev_intrinsics.h",
//     "hexagon_protos.h",
//     "hexagon_types.h",
//     "hresetintrin.h",
//     "htmintrin.h",
//     "htmxlintrin.h",
//     "hvx_hexagon_protos.h",
//     "ia32intrin.h",
//     "immintrin.h",
//     "intrin.h",
//     "inttypes.h",
//     "invpcidintrin.h",
//     "iso646.h",
//     "keylockerintrin.h",
//     "limits.h",
//     "lwpintrin.h",
//     "lzcntintrin.h",
//     "mm3dnow.h",
//     "mm_malloc.h",
//     "mmintrin.h",
//     "module.modulemap",
//     "movdirintrin.h",
//     "msa.h",
//     "mwaitxintrin.h",
//     "nmmintrin.h",
//     "opencl-c-base.h",
//     "opencl-c.h",
//     "pconfigintrin.h",
//     "pkuintrin.h",
//     "pmmintrin.h",
//     "popcntintrin.h",
//     "prfchwintrin.h",
//     "ptrauth.h",
//     "ptwriteintrin.h",
//     "rdseedintrin.h",
//     "rtmintrin.h",
//     "s390intrin.h",
//     "serializeintrin.h",
//     "sgxintrin.h",
//     "shaintrin.h",
//     "smmintrin.h",
//     "stdalign.h",
//     "stdarg.h",
//     "stdatomic.h",
//     "stdbool.h",
//     "stddef.h",
//     "stdint.h",
//     "stdnoreturn.h",
//     "tbmintrin.h",
//     "tgmath.h",
//     "tmmintrin.h",
//     "tsxldtrkintrin.h",
//     "uintrintrin.h",
//     "unwind.h",
//     "vadefs.h",
//     "vaesintrin.h",
//     "varargs.h",
//     "vecintrin.h",
//     "vpclmulqdqintrin.h",
//     "waitpkgintrin.h",
//     "wasm_simd128.h",
//     "wbnoinvdintrin.h",
//     "wmmintrin.h",
//     "x86gprintrin.h",
//     "x86intrin.h",
//     "xmmintrin.h",
//     "xopintrin.h",
//     "xsavecintrin.h",
//     "xsaveintrin.h",
//     "xsaveoptintrin.h",
//     "xtestintrin.h",
// ]