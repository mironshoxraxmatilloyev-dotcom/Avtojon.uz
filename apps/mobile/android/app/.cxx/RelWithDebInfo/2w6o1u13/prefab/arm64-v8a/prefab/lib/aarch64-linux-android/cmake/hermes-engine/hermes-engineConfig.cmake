if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/home/javohir/.gradle/caches/8.13/transforms/7cd5f17da845308fd85cd9dcbebbd233/transformed/jetified-hermes-android-0.74.5-release/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/javohir/.gradle/caches/8.13/transforms/7cd5f17da845308fd85cd9dcbebbd233/transformed/jetified-hermes-android-0.74.5-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

