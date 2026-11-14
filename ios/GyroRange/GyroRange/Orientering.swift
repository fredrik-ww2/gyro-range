import UIKit

final class Orientering {
    static let delad = Orientering()
    var mask: UIInterfaceOrientationMask = .allButUpsideDown

    func sätt(_ mask: UIInterfaceOrientationMask) {
        self.mask = mask
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first else { return }
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask)) { _ in }
        for window in scene.windows {
            window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
        }
    }
}

final class OrienteringKontroll: UIViewController {
    var mask: UIInterfaceOrientationMask = .allButUpsideDown
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { mask }
    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
}
