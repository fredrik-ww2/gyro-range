import Foundation

@MainActor
final class HaptikLager: ObservableObject {
    static let delad = HaptikLager()
    private static let nyckel = "GyroRange.haptik.v1"

    @Published private(set) var volymknappar: Bool
    @Published private(set) var handelser: [String: HaptikValj]

    private struct Blob: Codable {
        var volymknappar: Bool
        var handelser: [String: HaptikValj]
    }

    private init() {
        if let data = UserDefaults.standard.data(forKey: Self.nyckel),
           let blob = try? JSONDecoder().decode(Blob.self, from: data) {
            volymknappar = blob.volymknappar
            var fylld = HaptikKatalog.standardVal
            for (id, val) in blob.handelser where fylld[id] != nil {
                fylld[id] = val.klampad
            }
            handelser = fylld
        } else {
            volymknappar = true
            handelser = HaptikKatalog.standardVal
        }
    }

    func för(_ id: String) -> HaptikValj {
        handelser[id] ?? HaptikKatalog.handelse(id)?.standard ?? HaptikValj(typ: "ingen", intensitet: 0, skarpa: 1, pa: false)
    }

    func volym(_ på: Bool) {
        volymknappar = på
        spara()
    }

    func sätt(_ id: String, _ ändra: (inout HaptikValj) -> Void) {
        var val = för(id)
        ändra(&val)
        handelser[id] = val.klampad
        spara()
    }

    func återställ() {
        volymknappar = true
        handelser = HaptikKatalog.standardVal
        spara()
    }

    private func spara() {
        let blob = Blob(volymknappar: volymknappar, handelser: handelser)
        if let data = try? JSONEncoder().encode(blob) {
            UserDefaults.standard.set(data, forKey: Self.nyckel)
        }
    }
}
