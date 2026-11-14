import CoreHaptics
import UIKit

/// Spelar ett haptikval, eller håller ett surr igång och låter styrkan följa varvtalet.
@MainActor
final class HaptikMotor {
    static let delad = HaptikMotor()

    private var motor: CHHapticEngine?
    private var stotar: [UIImpactFeedbackGenerator.FeedbackStyle: UIImpactFeedbackGenerator] = [:]
    private let meddelande = UINotificationFeedbackGenerator()
    private let markering = UISelectionFeedbackGenerator()
    private var surr: [String: CHHapticAdvancedPatternPlayer] = [:]
    private var surrTid: [String: TimeInterval] = [:]
    private var puls: [String: Puls] = [:]
    private var timer: Timer?

    private struct Puls {
        var typ: String
        var niva: Double
        var skarpa: Double
        var senast: TimeInterval
        var nasta: TimeInterval
    }

    private init() {
        for stil in [UIImpactFeedbackGenerator.FeedbackStyle.light, .medium, .heavy, .soft, .rigid] {
            stotar[stil] = UIImpactFeedbackGenerator(style: stil)
        }
        meddelande.prepare()
        markering.prepare()
    }

    func spelaHandelse(_ id: String, niva: Double, kontinuerlig: Bool, pa: Bool?) {
        guard HaptikKatalog.handelse(id) != nil else { return }
        let val = HaptikLager.delad.för(id)
        if val.typ == "ingen" || val.intensitet <= 0.001 {
            stoppa(id)
            return
        }
        let andel = min(1, max(0, niva))
        if kontinuerlig || (HaptikKatalog.handelse(id)?.kontinuerlig == true) {
            if pa == false || !val.pa || andel <= 0.001 {
                stoppa(id)
                return
            }
            håll(id, typ: val.typ, intensitet: val.intensitet * andel, skarpa: val.skarpa)
            return
        }
        enGang(typ: val.typ, intensitet: val.intensitet * max(andel, 0.15), skarpa: val.skarpa)
    }

    func testaVal(_ id: String) {
        guard let val = HaptikVal.med(id: id) else { return }
        if val.arSurr {
            håll("__test", typ: id, intensitet: 1, skarpa: 1)
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 1_200_000_000)
                self.stoppa("__test")
            }
        } else {
            enGang(typ: id, intensitet: 1, skarpa: 1)
        }
    }

    func testaHandelse(_ id: String) {
        guard let post = HaptikKatalog.handelse(id) else { return }
        let val = HaptikLager.delad.för(id)
        guard val.typ != "ingen", val.intensitet > 0.001 else { return }
        if post.kontinuerlig {
            håll("__prov-" + id, typ: val.typ, intensitet: val.intensitet, skarpa: val.skarpa)
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 1_200_000_000)
                self.stoppa("__prov-" + id)
            }
        } else {
            enGang(typ: val.typ, intensitet: val.intensitet, skarpa: val.skarpa)
        }
    }

    func stoppaAllt() {
        for id in Array(surr.keys) + Array(puls.keys) {
            stoppa(id)
        }
    }

    private func håll(_ id: String, typ: String, intensitet: Double, skarpa: Double) {
        let nu = CACurrentMediaTime()
        guard let val = HaptikVal.med(id: typ) else { return }
        if val.arSurr {
            puls[id] = nil
            surrTid[id] = nu
            if surr[id] == nil {
                surr[id] = startaSurr(skarpa: Float(skarpa))
            }
            if let player = surr[id] {
                let i = CHHapticDynamicParameter(parameterID: .hapticIntensityControl, value: Float(intensitet), relativeTime: 0)
                let s = CHHapticDynamicParameter(parameterID: .hapticSharpnessControl, value: Float(skarpa), relativeTime: 0)
                try? player.sendParameters([i, s], atTime: CHHapticTimeImmediate)
            }
            seTillTimer()
            return
        }
        if surr[id] != nil { stoppaSurr(id) }
        var post = puls[id] ?? Puls(typ: typ, niva: intensitet, skarpa: skarpa, senast: nu, nasta: 0)
        post.typ = typ
        post.niva = intensitet
        post.skarpa = skarpa
        post.senast = nu
        if nu >= post.nasta {
            enGang(typ: typ, intensitet: intensitet, skarpa: skarpa)
            post.nasta = nu + intervall(for: intensitet)
        }
        puls[id] = post
        seTillTimer()
    }

    private func intervall(for intensitet: Double) -> TimeInterval {
        0.46 - 0.32 * min(1, max(0, intensitet))
    }

    private func seTillTimer() {
        if timer != nil { return }
        let timer = Timer(timeInterval: 0.05, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick() }
        }
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }

    private func tick() {
        let nu = CACurrentMediaTime()
        for id in Array(surrTid.keys) where !id.hasPrefix("__") {
            if let tid = surrTid[id], nu - tid > 0.45 { stoppa(id) }
        }
        for id in Array(puls.keys) {
            guard var post = puls[id] else { continue }
            if !id.hasPrefix("__"), nu - post.senast > 0.45 {
                stoppa(id)
                continue
            }
            guard nu >= post.nasta, post.typ != "ingen" else { continue }
            enGang(typ: post.typ, intensitet: post.niva, skarpa: post.skarpa)
            post.nasta = nu + intervall(for: post.niva)
            puls[id] = post
        }
        if puls.isEmpty && surr.isEmpty {
            timer?.invalidate()
            timer = nil
        }
    }

    private func stoppa(_ id: String) {
        stoppaSurr(id)
        surrTid[id] = nil
        puls[id] = nil
    }

    private func stoppaSurr(_ id: String) {
        try? surr[id]?.stop(atTime: CHHapticTimeImmediate)
        surr[id] = nil
    }

    private func enGang(typ: String, intensitet: Double, skarpa: Double) {
        guard intensitet > 0.02, let val = HaptikVal.med(id: typ) else { return }
        let i = Float(min(1, max(0, intensitet)))
        let s = Float(min(1, max(0, skarpa)))
        switch val.slag {
        case .stot(let stil):
            let generator = stotar[stil] ?? UIImpactFeedbackGenerator(style: stil)
            stotar[stil] = generator
            generator.prepare()
            generator.impactOccurred(intensity: CGFloat(i))
            generator.prepare()
        case .meddelande(let sort):
            meddelande.prepare()
            meddelande.notificationOccurred(sort)
            meddelande.prepare()
        case .markering:
            markering.prepare()
            markering.selectionChanged()
            markering.prepare()
        case .monster(let monster):
            spelaMonster(monster, intensitet: i, skarpa: s)
        }
    }

    private func spelaMonster(_ monster: HaptikMonster, intensitet: Float, skarpa: Float) {
        guard seTillMotor(), let motor else {
            stotar[.heavy]?.impactOccurred(intensity: CGFloat(intensitet))
            return
        }
        let handelser = monsterHandelser(monster, intensitet: intensitet, skarpa: skarpa)
        do {
            let pattern = try CHHapticPattern(events: handelser, parameters: [])
            let spelare = try motor.makePlayer(with: pattern)
            try spelare.start(atTime: CHHapticTimeImmediate)
        } catch {
            stotar[.heavy]?.impactOccurred(intensity: CGFloat(intensitet))
        }
    }

    private func startaSurr(skarpa: Float) -> CHHapticAdvancedPatternPlayer? {
        guard seTillMotor(), let motor else { return nil }
        let intensitet = CHHapticEventParameter(parameterID: .hapticIntensity, value: 1)
        let sk = CHHapticEventParameter(parameterID: .hapticSharpness, value: max(0.05, skarpa))
        let handelse = CHHapticEvent(eventType: .hapticContinuous, parameters: [intensitet, sk], relativeTime: 0, duration: 30)
        do {
            let pattern = try CHHapticPattern(events: [handelse], parameters: [])
            let spelare = try motor.makeAdvancedPlayer(with: pattern)
            spelare.loopEnabled = true
            try spelare.start(atTime: CHHapticTimeImmediate)
            return spelare
        } catch {
            return nil
        }
    }

    private func monsterHandelser(_ monster: HaptikMonster, intensitet: Float, skarpa: Float) -> [CHHapticEvent] {
        func transient(_ tid: TimeInterval, _ i: Float, _ s: Float) -> CHHapticEvent {
            CHHapticEvent(
                eventType: .hapticTransient,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: min(1, max(0, i))),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: min(1, max(0, s)))
                ],
                relativeTime: tid
            )
        }
        func surr(_ tid: TimeInterval, _ langd: TimeInterval, _ i: Float, _ s: Float) -> CHHapticEvent {
            CHHapticEvent(
                eventType: .hapticContinuous,
                parameters: [
                    CHHapticEventParameter(parameterID: .hapticIntensity, value: min(1, max(0, i))),
                    CHHapticEventParameter(parameterID: .hapticSharpness, value: min(1, max(0, s)))
                ],
                relativeTime: tid,
                duration: langd
            )
        }
        switch monster {
        case .kanon:
            return [transient(0, intensitet, max(skarpa, 0.85))]
        case .explosion:
            return [
                transient(0, intensitet, skarpa),
                surr(0.03, 0.55, intensitet * 0.85, skarpa * 0.28)
            ]
        case .rotor:
            return [surr(0, 0.35, intensitet, max(0.08, skarpa * 0.4))]
        case .kulspruta:
            return (0..<8).map { n in
                transient(TimeInterval(n) * 0.055, intensitet, skarpa)
            }
        case .landning:
            return [
                transient(0, intensitet, min(skarpa, 0.45)),
                surr(0.04, 0.28, intensitet * 0.7, skarpa * 0.2)
            ]
        case .motor:
            return [surr(0, 0.4, intensitet, max(0.05, skarpa * 0.25))]
        case .rekyl:
            return [
                transient(0, intensitet, skarpa),
                surr(0.02, 0.16, intensitet * 0.8, skarpa * 0.45)
            ]
        }
    }

    @discardableResult
    private func seTillMotor() -> Bool {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return false }
        if motor != nil { return true }
        do {
            let ny = try CHHapticEngine()
            ny.isAutoShutdownEnabled = true
            ny.resetHandler = { [weak self] in
                Task { @MainActor in try? self?.motor?.start() }
            }
            ny.stoppedHandler = { [weak self] _ in
                Task { @MainActor in self?.surr.removeAll() }
            }
            try ny.start()
            motor = ny
            return true
        } catch {
            motor = nil
            return false
        }
    }
}
