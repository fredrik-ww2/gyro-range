import UIKit

enum SpelOrientering {
    case staende
    case alla

    var mask: UIInterfaceOrientationMask {
        switch self {
        case .staende: return .portrait
        case .alla: return .allButUpsideDown
        }
    }

    var hint: String? {
        switch self {
        case .staende: return "Telefonen ställs stående."
        case .alla: return nil
        }
    }
}

struct SpelPost: Identifiable, Hashable {
    let id: String
    let namn: String
    let text: String
    let sokvag: String
    let orientering: SpelOrientering

    var adress: URL {
        URL(string: SpelLista.bas + sokvag)!
    }
}

/// Samma spel som gruppen "Gyrobaserade tester" i lankar/lankar.json.
enum SpelLista {
    static let bas = "https://fredrik-ww2.github.io/gyro-range/"

    static let alla: [SpelPost] = [
        SpelPost(id: "skjutbana", namn: "Skjutbana", text: "Sikta och skjut med telefonens lutning.", sokvag: "index.html", orientering: .staende),
        SpelPost(id: "flyg", namn: "Flygplan", text: "Flyg med telefonen som spak.", sokvag: "flyg/", orientering: .alla),
        SpelPost(id: "rotor", namn: "Rotor Strike", text: "Flyg en helikopter. Luta telefonen och sikta i vindrutan.", sokvag: "rotor/", orientering: .alla),
        SpelPost(id: "panorama", namn: "Panorama", text: "Se dig om på ett fält i Normandie.", sokvag: "panorama/", orientering: .alla),
        SpelPost(id: "gubbe", namn: "Gubbtest", text: "Gå och sikta med en soldat.", sokvag: "gubbe-test/", orientering: .alla),
        SpelPost(id: "vagn", namn: "Vagntest", text: "Kör en stridsvagn med telefonen som ratt.", sokvag: "vagn-test/", orientering: .staende),
        SpelPost(id: "labyrint", namn: "Kul-labyrint", text: "Luta telefonen och rulla stålkulan genom trälabyrinten.", sokvag: "labyrint/", orientering: .alla),
        SpelPost(id: "rorelse-test", namn: "Rörelsetest", text: "Mät gyro, acceleration och vibration.", sokvag: "rorelse-test/", orientering: .alla),
        SpelPost(id: "rorelse", namn: "Rörelseinspelare", text: "Spela in en rörelse och lägg den i en kategori.", sokvag: "rorelse/", orientering: .alla),
        SpelPost(id: "bowling", namn: "Bowling", text: "Kasta ett klot med telefonen som arm.", sokvag: "bowling/", orientering: .alla)
    ]
}
