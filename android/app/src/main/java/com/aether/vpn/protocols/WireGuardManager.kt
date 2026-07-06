package com.aether.vpn.protocols

import android.content.Context
import android.util.Log
import com.aether.vpn.model.VpnConfig
import com.wireguard.android.backend.Backend
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import com.wireguard.config.Interface
import com.wireguard.config.Peer
import com.wireguard.crypto.Key
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.InetAddress

class WireGuardManager(private val context: Context) {
    private val TAG = "AetherWireGuard"
    private var backend: Backend? = null
    private var activeTunnel: Tunnel? = null

    init {
        // Initialize official WireGuard Go-Backend for user-space VPN execution
        backend = GoBackend(context)
    }

    class AetherTunnel(private val name: String) : Tunnel {
        override fun getName(): String = name
        override fun onStateChanged(state: Tunnel.State) {
            Log.d("WireGuardTunnel", "Tunnel State changed to: ${state.name}")
        }
    }

    fun startTunnel(config: VpnConfig, onLog: (String) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                onLog("Starting WireGuard Secure Peer Negotiation...")
                
                // Parse keys and configurations safely using wireguard-crypto
                val privateKey = Key.fromBase64(config.wgPrivateKey ?: "")
                val peerPublicKey = Key.fromBase64(config.wgPublicKey ?: "")

                // Configure Virtual TUN Interface
                val interfaceBuilder = Interface.Builder()
                    .addAddress(config.wgAddress ?: "10.0.0.2/32")
                    .setPrivateKey(privateKey)
                    
                config.wgDns?.let {
                    interfaceBuilder.addDnsServer(InetAddress.getByName(it))
                }

                // Configure Endpoint Peer
                val peerBuilder = Peer.Builder()
                    .addAllowedIp("0.0.0.0/0") // Full Tunnel routing
                    .setEndpoint("${config.remoteAddress}:${config.remotePort}")
                    .setPublicKey(peerPublicKey)
                    .setPersistentKeepalive(25)

                val wgConfig = Config.Builder()
                    .setInterface(interfaceBuilder.build())
                    .addPeer(peerBuilder.build())
                    .build()

                onLog("Compiling Interface address: ${config.wgAddress}")
                onLog("Configuring Remote Gateway Node: ${config.remoteAddress}:${config.remotePort}")

                val tunnel = AetherTunnel("AetherWGNode")
                activeTunnel = tunnel

                // Set tunnel state to UP using GoBackend
                backend?.setState(tunnel, Tunnel.State.UP, wgConfig)
                onLog("[OK] WireGuard virtual tunnel established successfully.")
            } catch (e: Exception) {
                Log.e(TAG, "WireGuard configuration failure", e)
                onLog("[WARNING] WireGuard Engine failed: ${e.message}")
            }
        }
    }

    fun stopTunnel(onLog: (String) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                activeTunnel?.let {
                    backend?.setState(it, Tunnel.State.DOWN, null)
                    onLog("[SYSTEM] WireGuard tunnel interfaces torn down.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "WireGuard termination failure", e)
                onLog("[WARNING] Failed to dismantle WireGuard cleanly: ${e.message}")
            }
        }
    }
}
