import AVFoundation
import MediaPlayer
import UIKit

/// Lyssnar på volymknapparna via systemets volym, ställer tillbaka samma
/// värde direkt, och döljer volymrutan med ett osynligt MPVolumeView.
/// Egen återställning räknas inte som ett nytt tryck.
@MainActor
final class VolymKnappar: NSObject {
    var onTryck: ((Bool) -> Void)?

    private var vy: MPVolumeView?
    private var observation: NSKeyValueObservation?
    private var bas: Float = 0.5
    private var återställer = false
    private var forsok = 0
    private var senastRiktningUpp = true
    private var senastTid: TimeInterval = 0
    private weak var vard: UIView?
    private(set) var aktiverad = false

    func montera(i view: UIView) {
        vard = view
    }

    func sättPå(_ på: Bool) {
        aktiverad = på
        if på {
            visa()
            parkeraOmKant()
            lyssna()
        } else {
            slutaLyssna()
            gom()
        }
    }

    func parkeraOmKant() {
        guard aktiverad else { return }
        let nu = AVAudioSession.sharedInstance().outputVolume
        if nu < 0.08 || nu > 0.92 {
            bas = 0.5
            återställer = true
            forsok = 0
            skriv(0.5)
            släppSenare()
        } else if !återställer {
            bas = nu
        }
    }

    func taBort() {
        slutaLyssna()
        gom()
        vard = nil
    }

    private func visa() {
        guard vy == nil, let vard else { return }
        let dold = MPVolumeView(frame: CGRect(x: -1200, y: -1200, width: 120, height: 40))
        dold.alpha = 0.01
        dold.isUserInteractionEnabled = false
        dold.showsRouteButton = false
        vard.addSubview(dold)
        vy = dold
    }

    private func gom() {
        vy?.removeFromSuperview()
        vy = nil
    }

    private func lyssna() {
        if observation != nil { return }
        let session = AVAudioSession.sharedInstance()
        observation = session.observe(\.outputVolume, options: [.new]) { [weak self] _, change in
            let ny = change.newValue ?? session.outputVolume
            DispatchQueue.main.async {
                self?.volymÄndrades(ny)
            }
        }
    }

    private func slutaLyssna() {
        observation?.invalidate()
        observation = nil
        återställer = false
    }

    private func volymÄndrades(_ ny: Float) {
        guard aktiverad else {
            bas = ny
            return
        }
        if återställer {
            if abs(ny - bas) < 0.04 {
                återställer = false
                forsok = 0
            }
            return
        }
        if abs(ny - bas) < 0.012 { return }
        let upp = ny > bas
        let nu = CACurrentMediaTime()
        let samma = upp == senastRiktningUpp && nu - senastTid < 0.08
        senastRiktningUpp = upp
        senastTid = nu
        återställer = true
        forsok = 0
        skriv(bas)
        släppSenare()
        if !samma {
            onTryck?(upp)
        }
    }

    private func skriv(_ värde: Float) {
        let mål = min(1, max(0, värde))
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.vy?.layoutIfNeeded()
            guard let slider = self.reglage() else { return }
            slider.setValue(mål, animated: false)
            slider.sendActions(for: .valueChanged)
        }
    }

    private func släppSenare() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.28) { [weak self] in
            guard let self, self.återställer else { return }
            let nu = AVAudioSession.sharedInstance().outputVolume
            if abs(nu - self.bas) < 0.04 {
                self.återställer = false
                self.forsok = 0
                return
            }
            self.forsok += 1
            if self.forsok > 3 {
                self.bas = nu
                self.återställer = false
                self.forsok = 0
                return
            }
            self.skriv(self.bas)
            self.släppSenare()
        }
    }

    private func reglage() -> UISlider? {
        guard let vy else { return nil }
        return hitta(vy)
    }

    private func hitta(_ view: UIView) -> UISlider? {
        if let slider = view as? UISlider { return slider }
        for sub in view.subviews {
            if let slider = hitta(sub) { return slider }
        }
        return nil
    }
}
