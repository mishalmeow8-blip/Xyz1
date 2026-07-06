pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // JitPack for third-party VPN helper libraries
        maven { url = java.net.URI("https://jitpack.io") }
    }
}

rootProject.name = "AetherVPN"
include(":app")
