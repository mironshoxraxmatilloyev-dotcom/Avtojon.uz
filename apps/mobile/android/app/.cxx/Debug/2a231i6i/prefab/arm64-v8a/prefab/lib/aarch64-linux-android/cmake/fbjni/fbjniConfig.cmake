if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/home/javohir/.gradle/caches/8.13/transforms/e600c72ca8c8188a01eae2e9a86ca54f/transformed/jetified-fbjni-0.6.0/prefab/modules/fbjni/libs/android.arm64-v8a/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/javohir/.gradle/caches/8.13/transforms/e600c72ca8c8188a01eae2e9a86ca54f/transformed/jetified-fbjni-0.6.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

