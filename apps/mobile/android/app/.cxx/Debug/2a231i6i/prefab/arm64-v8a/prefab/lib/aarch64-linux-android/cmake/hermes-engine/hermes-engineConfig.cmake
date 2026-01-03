if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/home/javohir/.gradle/caches/8.13/transforms/fbca6cb3aead19a384d15e29d1f8d74e/transformed/jetified-hermes-android-0.74.5-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/javohir/.gradle/caches/8.13/transforms/fbca6cb3aead19a384d15e29d1f8d74e/transformed/jetified-hermes-android-0.74.5-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

