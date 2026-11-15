import AVFoundation
import SwiftUI

@main
struct GyroRangeApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    init() {
        let ljud = AVAudioSession.sharedInstance()
        try? ljud.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? ljud.setActive(true)
    }

    var body: some Scene {
        WindowGroup {
            NavigationStack {
                StartVy()
            }
            .preferredColorScheme(.dark)
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        Orientering.delad.mask
    }
}
