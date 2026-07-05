// 通过 WebRTC ICE candidate 收集，检测是否会泄露本机局域网 / 公网 IP。
// 只做被动检测与提示，不做任何绕过或伪装处理。
export async function detectWebrtcLeak(timeoutMs = 2500): Promise<{
  supported: boolean
  localIp: string | null
}> {
  const RTCPeerConnectionCtor =
    (window as any).RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection

  if (!RTCPeerConnectionCtor) {
    return { supported: false, localIp: null }
  }

  return new Promise((resolve) => {
    const ipRegex = /([0-9]{1,3}(?:\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){7})/i
    let resolved = false
    let foundIp: string | null = null

    const pc: RTCPeerConnection = new RTCPeerConnectionCtor({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    const finish = () => {
      if (resolved) return
      resolved = true
      try {
        pc.close()
      } catch {
        /* noop */
      }
      resolve({ supported: true, localIp: foundIp })
    }

    const timer = setTimeout(finish, timeoutMs)

    pc.onicecandidate = (event) => {
      if (!event.candidate) return
      const match = event.candidate.candidate.match(ipRegex)
      if (match) {
        const ip = match[1]
        // 过滤掉 mDNS 混淆地址（形如 xxxx.local），以及回环地址
        const isMdnsObfuscated = event.candidate.candidate.includes('.local')
        if (!isMdnsObfuscated && ip !== '0.0.0.0') {
          foundIp = ip
          clearTimeout(timer)
          finish()
        }
      }
    }

    try {
      pc.createDataChannel('probe')
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => finish())
    } catch {
      finish()
    }
  })
}
