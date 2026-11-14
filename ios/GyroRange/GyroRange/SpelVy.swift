import AVFoundation
import SwiftUI
import WebKit

@MainActor
final class BryggaMottagare: NSObject, WKScriptMessageHandler {
    weak var sida: SpelSida?
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        sida?.togEmot(message.body)
    }
}

@MainActor
final class SpelSida: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    let mottagare = BryggaMottagare()
    let sensor = SensorBrygga()
    let volym = VolymKnappar()
    @Published var laddar = true
    @Published var fel: String?

    private weak var webView: WKWebView?
    private var spel: SpelPost?
    private var startad = false

    override init() {
        super.init()
        mottagare.sida = self
        volym.onTryck = { [weak self] upp in
            self?.avtryckare(upp: upp)
        }
    }

    func koppla(_ web: WKWebView) {
        webView = web
        sensor.webView = web
        if let spel, !startad {
            börja(spel)
        }
    }

    func start(_ spel: SpelPost) {
        self.spel = spel
        Orientering.delad.sätt(spel.orientering.mask)
        UIApplication.shared.isIdleTimerDisabled = true
        vaknaLjud()
        if webView != nil {
            börja(spel)
        }
    }

    func stop() {
        startad = false
        sensor.stop()
        sensor.liv(false)
        volym.taBort()
        HaptikMotor.delad.stoppaAllt()
        UIApplication.shared.isIdleTimerDisabled = false
        Orientering.delad.sätt(.allButUpsideDown)
    }

    func fas(_ fas: ScenePhase) {
        switch fas {
        case .active:
            vaknaLjud()
            if startad {
                sensor.start()
                sensor.liv(true)
                UIApplication.shared.isIdleTimerDisabled = true
                volym.sättPå(HaptikLager.delad.volymknappar)
                volym.parkeraOmKant()
            }
        case .inactive, .background:
            sensor.liv(false)
            sensor.stop()
            HaptikMotor.delad.stoppaAllt()
            UIApplication.shared.isIdleTimerDisabled = false
        @unknown default:
            break
        }
    }

    func synkaVolym() {
        guard startad, let webView else { return }
        volym.montera(i: webView)
        volym.sättPå(HaptikLager.delad.volymknappar)
    }

    func laddaOm() {
        guard let spel else { return }
        fel = nil
        laddar = true
        webView?.load(URLRequest(url: spel.adress))
    }

    func togEmot(_ body: Any) {
        guard let meddelande = ordlista(body) else { return }
        let typ = meddelande["type"] as? String ?? ""
        switch typ {
        case "gyro-start", "bridge-ready":
            sensor.start()
            sensor.liv(true)
        case "gyro-stop":
            break
        case "spel-handelse":
            spela(meddelande, id: meddelande["handelse"] as? String)
        case "haptic":
            let kind = meddelande["kind"] as? String ?? ""
            let namn = (meddelande["handelse"] as? String).flatMap { $0.isEmpty ? nil : $0 }
                ?? HaptikVal.franKind[kind]
                ?? kind
            var kopia = meddelande
            if kopia["niva"] == nil, let strength = tal(meddelande["strength"]) {
                kopia["niva"] = min(1, strength)
            }
            spela(kopia, id: namn)
        default:
            break
        }
    }

    private func spela(_ meddelande: [String: Any], id: String?) {
        guard let id, !id.isEmpty, id != "stopp" else { return }
        let niva = tal(meddelande["niva"]) ?? 1
        let kontinuerlig = ja(meddelande["kontinuerlig"]) ?? (HaptikKatalog.handelse(id)?.kontinuerlig ?? false)
        HaptikMotor.delad.spelaHandelse(id, niva: niva, kontinuerlig: kontinuerlig, pa: ja(meddelande["pa"]))
    }

    private func börja(_ spel: SpelPost) {
        guard let webView else { return }
        startad = true
        vaknaLjud()
        volym.montera(i: webView)
        volym.sättPå(HaptikLager.delad.volymknappar)
        sensor.start()
        laddar = true
        fel = nil
        webView.load(URLRequest(url: spel.adress))
    }

    private func avtryckare(upp: Bool) {
        let js = "window.__gyroAvtryckare && window.__gyroAvtryckare(\(upp ? "true" : "false"));"
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    private func vaknaLjud() {
        let ljud = AVAudioSession.sharedInstance()
        try? ljud.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? ljud.setActive(true)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        laddar = false
        fel = nil
        sensor.start()
        sensor.liv(true)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        visa(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        visa(error)
    }

    private func visa(_ error: Error) {
        let kod = (error as NSError).code
        if kod == NSURLErrorCancelled { return }
        laddar = false
        fel = "Kan inte nå spelen. Kontrollera att telefonen har internet, och tryck Försök igen."
    }

    private func ordlista(_ body: Any) -> [String: Any]? {
        if let dict = body as? [String: Any] { return dict }
        if let text = body as? String,
           let data = text.data(using: .utf8),
           let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return dict
        }
        return nil
    }

    private func tal(_ value: Any?) -> Double? {
        if let number = value as? NSNumber { return number.doubleValue }
        if let text = value as? String { return Double(text) }
        return nil
    }

    private func ja(_ value: Any?) -> Bool? {
        if let number = value as? NSNumber { return number.boolValue }
        return nil
    }
}

struct SpelVy: View {
    let spel: SpelPost
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var fas
    @StateObject private var sida = SpelSida()
    @ObservedObject private var lager = HaptikLager.delad
    @State private var visaHaptik = false

    var body: some View {
        ZStack(alignment: .top) {
            WebbVy(sida: sida)
                .ignoresSafeArea()
            VStack(spacing: 0) {
                HStack(spacing: 10) {
                    knapp("Tillbaka", system: "chevron.left") { dismiss() }
                    Spacer(minLength: 8)
                    knapp("Haptik", system: "waveform") { visaHaptik = true }
                }
                .padding(.horizontal, 12)
                .padding(.top, 8)
                if sida.laddar && sida.fel == nil {
                    Text("Laddar spelet…")
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(.black.opacity(0.45), in: Capsule())
                        .foregroundStyle(SpelFarg.text)
                        .padding(.top, 8)
                }
                Spacer()
                if let fel = sida.fel {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Inget nät")
                            .font(.title3.weight(.bold))
                        Text(fel)
                            .font(.body)
                        Button("Försök igen") { sida.laddaOm() }
                            .font(.body.weight(.bold))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(SpelFarg.accent, in: RoundedRectangle(cornerRadius: 12))
                            .foregroundStyle(.black)
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(SpelFarg.kort, in: RoundedRectangle(cornerRadius: 18))
                    .foregroundStyle(SpelFarg.text)
                    .padding(16)
                }
            }
        }
        .background(Color(SpelFarg.bakgrund))
        .navigationBarBackButtonHidden(true)
        .toolbar(.hidden, for: .navigationBar)
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
        .onAppear { sida.start(spel) }
        .onDisappear { sida.stop() }
        .onChange(of: fas) { _, ny in sida.fas(ny) }
        .onChange(of: lager.volymknappar) { _, _ in sida.synkaVolym() }
        .sheet(isPresented: $visaHaptik) {
            NavigationStack { HaptikVy() }
        }
    }

    private func knapp(_ titel: String, system: String, handling: @escaping () -> Void) -> some View {
        Button(action: handling) {
            Label(titel, systemImage: system)
                .font(.subheadline.weight(.bold))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.black.opacity(0.55), in: Capsule())
                .foregroundStyle(SpelFarg.accent)
        }
        .buttonStyle(.plain)
    }
}
