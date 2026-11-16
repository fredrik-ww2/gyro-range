import SwiftUI
import WebKit

struct WebbVy: UIViewRepresentable {
    let sida: SpelSida

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let sidaPrefs = WKWebpagePreferences()
        sidaPrefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = sidaPrefs
        let script = WKUserScript(source: BryggaJS.kalla, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        config.userContentController.addUserScript(script)
        config.userContentController.add(sida.mottagare, name: "gyroRange")

        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = sida
        web.uiDelegate = sida
        web.isOpaque = true
        web.backgroundColor = SpelFarg.bakgrund
        web.scrollView.backgroundColor = SpelFarg.bakgrund
        web.scrollView.bounces = false
        web.scrollView.alwaysBounceVertical = false
        web.scrollView.alwaysBounceHorizontal = false
        web.scrollView.isScrollEnabled = false
        web.scrollView.delaysContentTouches = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.minimumZoomScale = 1
        web.scrollView.maximumZoomScale = 1
        web.scrollView.pinchGestureRecognizer?.isEnabled = false
        web.allowsBackForwardNavigationGestures = false
        web.isInspectable = true
        sida.koppla(web)
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

enum SpelFarg {
    static let bakgrund = UIColor(red: 0.09, green: 0.12, blue: 0.11, alpha: 1)
    static let text = Color(red: 0.93, green: 0.95, blue: 0.90)
    static let svag = Color(red: 0.66, green: 0.73, blue: 0.66)
    static let accent = Color(red: 0.88, green: 0.95, blue: 0.64)
    static let kort = Color(red: 0.14, green: 0.18, blue: 0.16)
}
