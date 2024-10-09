import { CompilerSpecifics } from "../misc.js"

// 
// 
// 
// clang (Apple clang version 14.0.0 (clang-1400.0.29.202))
// 
// 
//
    // echo | /usr/bin/gcc -xc -E -v - 


    // pre_sea on  master [!?] 
    // ➜ echo | /usr/bin/gcc -xc -E -v -
    // Apple clang version 14.0.0 (clang-1400.0.29.202)
    // Target: arm64-apple-darwin21.6.0
    // Thread model: posix
    // InstalledDir: /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin
    //  "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang" -cc1 -triple arm64-apple-macosx12.0.0 -Wundef-prefix=TARGET_OS_ -Wdeprecated-objc-isa-usage -Werror=deprecated-objc-isa-usage -Werror=implicit-function-declaration -E -disable-free -clear-ast-before-backend -disable-llvm-verifier -discard-value-names -main-file-name - -mrelocation-model pic -pic-level 2 -mframe-pointer=non-leaf -fno-strict-return -fno-rounding-math -funwind-tables=2 -fobjc-msgsend-selector-stubs -target-sdk-version=13.1 -fvisibility-inlines-hidden-static-local-var -target-cpu apple-m1 -target-feature +v8.5a -target-feature +fp-armv8 -target-feature +neon -target-feature +crc -target-feature +crypto -target-feature +dotprod -target-feature +fp16fml -target-feature +ras -target-feature +lse -target-feature +rdm -target-feature +rcpc -target-feature +zcm -target-feature +zcz -target-feature +fullfp16 -target-feature +sm4 -target-feature +sha3 -target-feature +sha2 -target-feature +aes -target-abi darwinpcs -fallow-half-arguments-and-returns -debugger-tuning=lldb -target-linker-version 820.1 -v -resource-dir /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0 -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk -I/usr/local/include -internal-isystem /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/local/include -internal-isystem /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include -internal-externc-isystem /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include -internal-externc-isystem /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include -Wno-reorder-init-list -Wno-implicit-int-float-conversion -Wno-c99-designator -Wno-final-dtor-non-final-class -Wno-extra-semi-stmt -Wno-misleading-indentation -Wno-quoted-include-in-framework-header -Wno-implicit-fallthrough -Wno-enum-enum-conversion -Wno-enum-float-conversion -Wno-elaborated-enum-base -Wno-reserved-identifier -Wno-gnu-folding-constant -Wno-cast-function-type -Wno-bitwise-instead-of-logical -fdebug-compilation-dir=/Users/jeffhykin/repos/pre_sea -ferror-limit 19 -stack-protector 1 -fstack-check -mdarwin-stkchk-strong-link -fblocks -fencode-extended-block-signature -fregister-global-dtors-with-atexit -fgnuc-version=4.2.1 -fmax-type-align=16 -fcommon -fcolor-diagnostics -clang-vendor-feature=+messageToSelfInClassMethodIdReturnType -clang-vendor-feature=+disableInferNewAvailabilityFromInit -clang-vendor-feature=+disableNonDependentMemberExprInCurrentInstantiation -fno-odr-hash-protocols -clang-vendor-feature=+enableAggressiveVLAFolding -clang-vendor-feature=+revert09abecef7bbf -clang-vendor-feature=+thisNoAlignAttr -clang-vendor-feature=+thisNoNullAttr -mllvm -disable-aligned-alloc-awareness=1 -D__GCC_HAVE_DWARF2_CFI_ASM=1 -o - -x c -
    // clang -cc1 version 14.0.0 (clang-1400.0.29.202) default target arm64-apple-darwin21.6.0
    // ignoring nonexistent directory "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/local/include"
    // ignoring nonexistent directory "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/Library/Frameworks"
    // #include "..." search starts here:
    // #include <...> search starts here:
    //  /usr/local/include
    //  /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include
    //  /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include
    //  /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include
    //  /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks (framework directory)
    // End of search list.
    // # 1 "<stdin>"
    // # 1 "<built-in>" 1
    // # 1 "<built-in>" 3
    // # 400 "<built-in>" 3
    // # 1 "<command line>" 1
    // # 1 "<built-in>" 2
    // # 1 "<stdin>" 2


    // pre_sea on  master [!?] took 2s 
    // # 
    // # caveats:
    // # 
    //     "-I" vs "-internal-isystem" vs "-internal-externc-isystem"
    // # 
    // # clang final list
    // # 
    //     /usr/local/include
    //     /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/local/include
    //     /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include
    //     /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include
    //     /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include
    //     /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks
const clang = {
    "v14.0.0": new CompilerSpecifics({
        defaultIncludePaths: [
            "/usr/local/include",
            "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/local/include",
            "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/14.0.0/include",
            "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include",
            "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include",
            "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks",
        ]
    })
}

// 
// 
// 
// gcc (nix gcc (GCC) 13.3.0)
// 
// 
// 
    // echo | gcc -xc -E -v -

    // # 
    // # nix gcc
    // # 
    // Using built-in specs.
    // COLLECT_GCC=/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/bin/gcc
    // Target
    //  aarch64-apple-darwin
    // Configured with
    //     ../gcc-13.3.0/configure
    //     --prefix=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-gcc-13.3.0
    //     --with-gmp-include=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-gmp-with-cxx-6.3.0-dev/include
    //     --with-gmp-lib=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-gmp-with-cxx-6.3.0/lib
    //     --with-mpfr-include=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-mpfr-4.2.1-dev/include
    //     --with-mpfr-lib=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-mpfr-4.2.1/lib
    //     --with-mpc=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-libmpc-1.3.1
    //     --with-native-system-header-dir=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-libSystem-11.0.0/include
    //     --with-build-sysroot=/
    //     --with-gxx-include-dir=/nix/store/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee-gcc-13.3.0/include/c++/13.3.0/
    //     --program-prefix=
    //     --enable-lto
    //     --disable-libstdcxx-pch
    //     --without-included-gettext
    //     --with-system-zlib
    //     --enable-static
    //     --enable-languages=c,c++,objc,obj-c++
    //     --disable-multilib
    //     --enable-plugin
    //     --build=aarch64-apple-darwin
    //     --host=aarch64-apple-darwin
    //     --target=aarch64-apple-darwin
    // Thread model
    //  posix
    // Supported LTO compression algorithms
    //  zlib
    // gcc version 13.3.0 (GCC) 
    // COLLECT_GCC_OPTIONS='-E'
    //     '-v'
    //     '-B'
    //     '/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/lib/'
    //     '-idirafter'
    //     '/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include'
    //     '-idirafter'
    //     '/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include-fixed'
    //     '-B'
    //     '/nix/store/5amj7axwglslwhy4zn8j1r8k8bgwymzy-gcc-13.3.0-lib/lib'
    //     '-B'
    //     '/nix/store/y11ha0dph8hg80ni4hbbhbjprhhlr0cg-gcc-wrapper-13.3.0/bin/'
    //     '-mmacosx-version-min=11.0'
    //     '-asm_macosx_version_min=11.0'
    //     '-nodefaultexport'
    //     '-mcpu=apple-m1'
    //     '-mlittle-endian'
    //     '-mabi=lp64'
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/libexec/gcc/aarch64-apple-darwin/13.3.0/cc1
    //     -E
    //     -quiet
    //     -v
    //     -D__DYNAMIC__
    //     -idirafter
    //     /nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include
    //     -idirafter
    //     /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include-fixed
    //     -
    //     -fPIC
    //     -mmacosx-version-min=11.0
    //     -mcpu=apple-m1
    //     -mlittle-endian
    //     -mabi=lp64
    //     -dumpbase
    //     -
    // ignoring nonexistent directory "/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/../../../../aarch64-apple-darwin/include"
    // ignoring duplicate directory "/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include"
    // ignoring duplicate directory "/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include-fixed"
    // #include "..." search starts here

    // #include <...> search starts here

    //  /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include
    //  /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/include
    //  /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include-fixed
    //  /nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include
    // End of search list.
    // # 0 "<stdin>"
    // # 0 "<built-in>"
    // # 0 "<command-line>"
    // # 1 "<stdin>"
    // COMPILER_PATH=/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/lib/
    // /nix/store/5amj7axwglslwhy4zn8j1r8k8bgwymzy-gcc-13.3.0-lib/lib/
    // /nix/store/y11ha0dph8hg80ni4hbbhbjprhhlr0cg-gcc-wrapper-13.3.0/bin/
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/libexec/gcc/aarch64-apple-darwin/13.3.0/
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/libexec/gcc/aarch64-apple-darwin/13.3.0/
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/libexec/gcc/aarch64-apple-darwin/
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/
    // LIBRARY_PATH=/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/lib/
    // /nix/store/5amj7axwglslwhy4zn8j1r8k8bgwymzy-gcc-13.3.0-lib/lib/
    // /nix/store/y11ha0dph8hg80ni4hbbhbjprhhlr0cg-gcc-wrapper-13.3.0/bin/
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/
    // /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/../../../
    // COLLECT_GCC_OPTIONS='-E' '-v' '-B' '/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/lib/' '-idirafter' '/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include' '-idirafter' '/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include-fixed' '-B' '/nix/store/5amj7axwglslwhy4zn8j1r8k8bgwymzy-gcc-13.3.0-lib/lib' '-B' '/nix/store/y11ha0dph8hg80ni4hbbhbjprhhlr0cg-gcc-wrapper-13.3.0/bin/' '-mmacosx-version-min=11.0' '-asm_macosx_version_min=11.0' '-nodefaultexport' '-mcpu=apple-m1' '-mlittle-endian' '-mabi=lp64'

    // jeffhykin/Desktop on  master [⇡$!?] 

    // # 
    // # caveats
    // # 
    //     "-I" vs "-idirafter"
    // # 
    // # final list
    // # 
    //     /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/../../../../aarch64-apple-darwin/include
    //     /nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include
    //     /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include
    //     /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/include
    //     /nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include
    //     /nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include
        
const gcc = {
    "v13.3.0": new CompilerSpecifics({
        defaultIncludePaths: [
            "/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/../../../../aarch64-apple-darwin/include",
            "/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include",
            "/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include",
            "/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/include",
            "/nix/store/zv1wwz8v7bh8vqyi2x485dlsnxzkddr7-gcc-13.3.0/lib/gcc/aarch64-apple-darwin/13.3.0/include",
            "/nix/store/na9g3654cpwgsbivqcssqy225x3kafsn-libSystem-11.0.0/include",
        ]
    })
}

export const defaultCompilerInfo = clang["v14.0.0"]