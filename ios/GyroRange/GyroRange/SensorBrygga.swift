import CoreMotion
import WebKit

/// Core Motion, 80 gånger per sekund, in i sidans befintliga format.
/// `ww2-native-gyro` får vinkelhastighet i rad/s, samma axlar som Expo och Core Motion.
/// Övriga spel får vanliga deviceorientation- och devicemotion-händelser.
@MainActor
final class SensorBrygga {
    weak var webView: WKWebView?
    private let motion = CMMotionManager()
    private var igång = false

    func start() {
        guard !igång else { return }
        guard motion.isDeviceMotionAvailable else {
            status(false)
            return
        }
        igång = true
        motion.deviceMotionUpdateInterval = 1.0 / 80.0
        motion.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: .main) { [weak self] prov, _ in
            guard let prov else { return }
            MainActor.assumeIsolated {
                self?.skicka(prov)
            }
        }
        status(true)
    }

    func stop() {
        motion.stopDeviceMotionUpdates()
        igång = false
    }

    func liv(_ aktiv: Bool) {
        let js = "window.__gyroLiv && window.__gyroLiv(\(aktiv ? "true" : "false"));"
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    private func status(_ tillganglig: Bool) {
        let js = "window.__gyroStatus && window.__gyroStatus(\(tillganglig ? "true" : "false"));"
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    private func skicka(_ prov: CMDeviceMotion) {
        let rr = prov.rotationRate
        let g = prov.gravity
        let a = prov.userAcceleration
        let q = prov.attitude.quaternion
        let beta = atan2(-g.z, -g.y) * 180 / .pi
        let gamma = atan2(g.x, max(hypot(g.y, g.z), 1e-4)) * 180 / .pi
        var alpha = prov.attitude.yaw * 180 / .pi
        alpha = alpha.truncatingRemainder(dividingBy: 360)
        if alpha < 0 { alpha += 360 }
        let tal: [String: Double] = [
            "t": prov.timestamp,
            "x": rr.x, "y": rr.y, "z": rr.z,
            "alpha": alpha, "beta": beta, "gamma": gamma,
            "qx": q.x, "qy": q.y, "qz": q.z, "qw": q.w,
            "gx": g.x, "gy": g.y, "gz": g.z,
            "ax": a.x, "ay": a.y, "az": a.z,
            "intervall": 12.5
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: tal),
              let json = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.__gyroMata && window.__gyroMata(\(json));", completionHandler: nil)
    }
}
