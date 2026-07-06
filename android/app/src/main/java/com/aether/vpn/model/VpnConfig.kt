package com.aether.vpn.model

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
    
    // WireGuard specific variables
    val wgPrivateKey: String? = null,
    val wgPublicKey: String? = null,
    val wgAddress: String? = null, // e.g. 10.0.0.2/32
    val wgDns: String? = "1.1.1.1",
    val wgMtu: Int = 1420,
    val wgPreservedKey: String? = null,

    // OpenVPN specific variables
    val ovpnConfigContent: String? = null, // Raw string config file content
    val authUser: String? = null,
    val authPass: String? = null,

    // V2Ray VMess/VLESS variables
    val v2rayUuid: String? = null,
    val v2rayAlterId: Int = 0,
    val v2raySecurity: String? = "auto", // auto, aes-128-gcm, chacha20-poly1305, none
    val v2rayTransport: String? = "tcp", // tcp, ws, grpc
    val v2rayPath: String? = null, // WebSocket path
    val v2rayTls: Boolean = false
) : Serializable
