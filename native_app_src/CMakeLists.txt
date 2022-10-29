cmake_minimum_required(VERSION 3.20...3.23)

project(youtube_auto_shutdown_native VERSION 1.0 LANGUAGES CXX)

add_executable(youtube_auto_shutdown_native "main.cpp" "MessagePassing.cpp")

target_compile_features(youtube_auto_shutdown_native PUBLIC cxx_std_20)
set_target_properties(youtube_auto_shutdown_native PROPERTIES CXX_EXTENSIONS OFF)

set(CMAKE_INSTALL_PREFIX ../../)

if (WIN32)
	target_sources(youtube_auto_shutdown_native PRIVATE "Windows/ShutdownPcWin32.cpp" "Windows/windows.native_app.manifest")

	target_link_libraries(youtube_auto_shutdown_native Comctl32.lib)

	install(TARGETS youtube_auto_shutdown_native DESTINATION ../../native_app/windows)
endif (WIN32)

if (UNIX)
	find_package(X11 REQUIRED)

	find_package(PkgConfig REQUIRED)
	pkg_check_modules(GTK4 REQUIRED gtk4)

	include_directories(${GTK4_INCLUDE_DIRS})
	link_directories(${GTK4_LIBRARY_DIRS})

	add_definitions(${GTK4_CFLAGS_OTHER})

	target_sources(youtube_auto_shutdown_native PRIVATE "Linux/ShutdownPcLinux.cpp")

	target_link_libraries(youtube_auto_shutdown_native ${X11_LIBRARIES})

	target_link_libraries(youtube_auto_shutdown_native ${GTK4_LIBRARIES})

	install(TARGETS youtube_auto_shutdown_native DESTINATION native_app/linux)
endif (UNIX)
