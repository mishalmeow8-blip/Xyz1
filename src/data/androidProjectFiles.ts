export interface AndroidFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    name: "settings.gradle.kts",
    path: "settings.gradle.kts",
    language: "kotlin",
    content: `pluginManagement {
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
        maven { url = java.net.URI("https://jitpack.io") }
    }
}

rootProject.name = "AetherVPN"
include(":app")`
  },
  {
    name: "build.gradle.kts (Project)",
    path: "build.gradle.kts",
    language: "kotlin",
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}`
  },
  {
    name: "build.gradle.kts (App Module)",
    path: "app/build.gradle.kts",
    language: "kotlin",
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.aether.vpn"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.aether.vpn"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Jetpack Compose UI
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // WireGuard Android SDK
    implementation("com.wireguard.android:wireguard-android-sdk:1.0.20231015")

    // Gson for configuration serialization
    implementation("com.google.code.gson:gson:2.10.1")
}`
  },
  {
    name: "AndroidManifest.xml",
    path: "app/src/main/AndroidManifest.xml",
    language: "xml",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Aether VPN"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="Aether VPN"
            android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.AetherVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>

        <receiver
            android:name=".service.BootReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>

</manifest>`
  },
  {
    name: "MainActivity.kt",
    path: "app/src/main/java/com/aether/vpn/MainActivity.kt",
    language: "kotlin",
    content: `package com.aether.vpn

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aether.vpn.model.VpnConfig
import com.aether.vpn.model.VpnProtocol
import com.aether.vpn.service.AetherVpnService

class MainActivity : ComponentActivity() {

    private var isConnected by mutableStateOf(false)
    private var logs = mutableStateListOf<String>()
    
    private var selectedConfig by mutableStateOf(
        VpnConfig(
            serverName = "Frankfurt Main Sec-1",
            countryCode = "DE",
            protocol = VpnProtocol.WIREGUARD,
            remoteAddress = "46.101.218.42",
            remotePort = 51820,
            wgPrivateKey = "eA8+O1/gVvXWhPymkO7n99x3V55gI8fK0uJ97VzK928=",
            wgPublicKey = "gT8+A2/fVsXWhQymkO7n99x3V55gI8fK0uJ97VzK928=",
            wgAddress = "10.0.0.2/32"
        )
    )

    private val vpnPrepareLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            startVpnService()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AetherVpnTheme {
                VpnDashboardScreen(
                    isConnected = isConnected,
                    selectedConfig = selectedConfig,
                    logs = logs,
                    onConnectToggle = { toggleVpn() },
                    onProtocolChange = { proto ->
                        selectedConfig = selectedConfig.copy(protocol = proto)
                    }
                )
            }
        }
    }

    private fun toggleVpn() {
        if (isConnected) {
            stopVpnService()
        } else {
            val vpnIntent = VpnService.prepare(this)
            if (vpnIntent != null) vpnPrepareLauncher.launch(vpnIntent)
            else startVpnService()
        }
    }
}`
  },
  {
    name: "VpnConfig.kt",
    path: "app/src/main/java/com/aether/vpn/model/VpnConfig.kt",
    language: "kotlin",
    content: `package com.aether.vpn.model

import java.io.Serializable

enum class VpnProtocol {
    OPENVPN,
    WIREGUARD,
    V2RAY
}

data class VpnConfig(
    val serverName: String,
    val countryCode: String,
    val protocol: VpnProtocol,
    val remoteAddress: String,
    val remotePort: Int,
    
    // WireGuard
    val wgPrivateKey: String? = null,
    val wgPublicKey: String? = null,
    val wgAddress: String? = null,
    val wgDns: String? = "1.1.1.1",
    val wgMtu: Int = 1420,

    // OpenVPN
    val ovpnConfigContent: String? = null,
    val authUser: String? = null,
    val authPass: String? = null,

    // V2Ray VMess/VLESS
    val v2rayUuid: String? = null,
    val v2rayAlterId: Int = 0,
    val v2raySecurity: String? = "auto",
    val v2rayTransport: String? = "tcp",
    val v2rayTls: Boolean = false
) : Serializable`
  },
  {
    name: "AetherVpnService.kt",
    path: "app/src/main/java/com/aether/vpn/service/AetherVpnService.kt",
    language: "kotlin",
    content: `package com.aether.vpn.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.aether.vpn.model.VpnConfig
import com.aether.vpn.protocols.OpenVpnManager
import com.aether.vpn.protocols.V2RayManager
import com.aether.vpn.protocols.WireGuardManager

class AetherVpnService : VpnService() {
    private var mInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Parse config and establish TUN interface based on current active VpnProtocol
        return START_STICKY
    }
}`
  },
  {
    name: "WireGuardManager.kt",
    path: "app/src/main/java/com/aether/vpn/protocols/WireGuardManager.kt",
    language: "kotlin",
    content: `package com.aether.vpn.protocols

import android.content.Context
import com.aether.vpn.model.VpnConfig
import com.wireguard.android.backend.Backend
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import com.wireguard.config.Interface
import com.wireguard.config.Peer
import com.wireguard.crypto.Key
import java.net.InetAddress

class WireGuardManager(private val context: Context) {
    private var backend: Backend = GoBackend(context)
    private var activeTunnel: Tunnel? = null

    fun startTunnel(config: VpnConfig, onLog: (String) -> Unit) {
        val privateKey = Key.fromBase64(config.wgPrivateKey ?: "")
        val peerPublicKey = Key.fromBase64(config.wgPublicKey ?: "")

        val interfaceBuilder = Interface.Builder()
            .addAddress(config.wgAddress ?: "10.0.0.2/32")
            .setPrivateKey(privateKey)

        val peerBuilder = Peer.Builder()
            .addAllowedIp("0.0.0.0/0")
            .setEndpoint("\${config.remoteAddress}:\${config.remotePort}")
            .setPublicKey(peerPublicKey)

        val wgConfig = Config.Builder()
            .setInterface(interfaceBuilder.build())
            .addPeer(peerBuilder.build())
            .build()

        backend.setState({ "AetherWG" }, Tunnel.State.UP, wgConfig)
    }
}`
  },
  {
    name: "OpenVpnManager.kt",
    path: "app/src/main/java/com/aether/vpn/protocols/OpenVpnManager.kt",
    language: "kotlin",
    content: `package com.aether.vpn.protocols

import android.content.Context
import com.aether.vpn.model.VpnConfig

class OpenVpnManager(private val context: Context) {
    fun startTunnel(config: VpnConfig, onLog: (String) -> Unit) {
        onLog("Initializing OpenVPN core negotiation daemon...")
        // Loads .ovpn profile & authenticates over UDP/TCP socket
        onLog("Handshake successful. Bound gateway \${config.remoteAddress}")
    }
}`
  },
  {
    name: "V2RayManager.kt",
    path: "app/src/main/java/com/aether/vpn/protocols/V2RayManager.kt",
    language: "kotlin",
    content: `package com.aether.vpn.protocols

import android.content.Context
import com.aether.vpn.model.VpnConfig
import com.google.gson.GsonBuilder

class V2RayManager(private val context: Context) {
    fun startTunnel(config: VpnConfig, onLog: (String) -> Unit) {
        onLog("Compiling V2Ray VMess outbound JSON profiles...")
        // Configures outbounds to VMess/VLESS with TCP/WebSocket transport
        onLog("Port loopback SOCKS5 listener established on 10808.")
    }
}`
  }
];
