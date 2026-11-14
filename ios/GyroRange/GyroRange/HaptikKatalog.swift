import UIKit

enum HaptikMonster: String {
    case kanon, explosion, rotor, kulspruta, landning, motor, rekyl
}

enum HaptikSlag {
    case stot(UIImpactFeedbackGenerator.FeedbackStyle)
    case meddelande(UINotificationFeedbackGenerator.FeedbackType)
    case markering
    case monster(HaptikMonster)
}

struct HaptikVal: Identifiable, Hashable {
    let id: String
    let namn: String
    let text: String
    let slag: HaptikSlag
    var arCoreHaptics: Bool {
        if case .monster = slag { return true }
        return false
    }
    var arSurr: Bool {
        if case .monster(let m) = slag { return m == .rotor || m == .motor }
        return false
    }

    static func == (lhs: HaptikVal, rhs: HaptikVal) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }

    static let alla: [HaptikVal] = [
        HaptikVal(id: "stot-latt", namn: "Stöt, lätt", text: "Kort lätt stöt. Systemets lätta slag, med styrka upp till fullt.", slag: .stot(.light)),
        HaptikVal(id: "stot-medel", namn: "Stöt, medel", text: "Tydlig stöt i mitten. Systemets mellanslag, styrka upp till fullt.", slag: .stot(.medium)),
        HaptikVal(id: "stot-tung", namn: "Stöt, tung", text: "Kraftig stöt. Systemets tunga slag, styrka upp till fullt.", slag: .stot(.heavy)),
        HaptikVal(id: "stot-mjuk", namn: "Stöt, mjuk", text: "Mjuk och rund stöt. Systemets mjuka slag, styrka upp till fullt.", slag: .stot(.soft)),
        HaptikVal(id: "stot-styv", namn: "Stöt, styv", text: "Skarp och hård stöt. Systemets styva slag, styrka upp till fullt.", slag: .stot(.rigid)),
        HaptikVal(id: "meddelande-lyckat", namn: "Meddelande, lyckat", text: "Tre korta tick som betyder att något är klart. Fast systemstyrka.", slag: .meddelande(.success)),
        HaptikVal(id: "meddelande-varning", namn: "Meddelande, varning", text: "Två tick som varnar. Fast systemstyrka.", slag: .meddelande(.warning)),
        HaptikVal(id: "meddelande-fel", namn: "Meddelande, fel", text: "Tre hårda tick som betyder fel. Fast systemstyrka.", slag: .meddelande(.error)),
        HaptikVal(id: "markering", namn: "Markering", text: "Liten knäpp, som när ett reglage flyttar ett steg. Fast systemstyrka.", slag: .markering),
        HaptikVal(id: "kanonsmall", namn: "Kanonsmäll", text: "En enda smäll. Högsta intensitet och skärpa i Core Haptics.", slag: .monster(.kanon)),
        HaptikVal(id: "explosion", namn: "Explosion med efterskakning", text: "Stark smäll och sedan ett skak som klingar av.", slag: .monster(.explosion)),
        HaptikVal(id: "rotorvibration", namn: "Rotorvibration", text: "Jämnt surr som kan hållas igång. Låg skärpa. Styrkan kan följa varv.", slag: .monster(.rotor)),
        HaptikVal(id: "kulspruteserie", namn: "Kulspruteserie", text: "Snabb rad av hårda tick.", slag: .monster(.kulspruta)),
        HaptikVal(id: "landningsduns", namn: "Landningsduns", text: "Tung duns och en kort mjuk efterklang.", slag: .monster(.landning)),
        HaptikVal(id: "motorbuller", namn: "Motorbuller", text: "Djupt surr som kan hållas igång. Styrkan kan följa gas och varvtal.", slag: .monster(.motor)),
        HaptikVal(id: "rekyl", namn: "Rekylstöt", text: "Hård stöt med ett kort drag bakåt.", slag: .monster(.rekyl))
    ]

    static func med(id: String) -> HaptikVal? { alla.first { $0.id == id } }

    /// Gamla kind-namn från js/haptics.js, översatta till händelse-id.
    static let franKind: [String: String] = [
        "gevar": "skott-gevar",
        "karbin": "skott-karbin",
        "kulspruta": "kulspruta",
        "hit": "traff",
        "nedslag": "nedslag",
        "huk": "huk",
        "skott": "puls-skott",
        "kram": "kram",
        "steg": "steg",
        "laddning-klar": "laddning-klar",
        "vibrate": "vibrera"
    ]
}

struct SpelHandelse: Identifiable, Hashable {
    let id: String
    let grupp: String
    let namn: String
    let text: String
    let kontinuerlig: Bool
    let standardTyp: String
    let standardIntensitet: Double
    let standardSkarpa: Double

    var standard: HaptikValj {
        HaptikValj(typ: standardTyp, intensitet: standardIntensitet, skarpa: standardSkarpa, pa: kontinuerlig || standardTyp != "ingen")
    }
}

struct HaptikValj: Codable, Equatable {
    var typ: String
    var intensitet: Double
    var skarpa: Double
    var pa: Bool

    var klampad: HaptikValj {
        HaptikValj(
            typ: typ,
            intensitet: min(1, max(0, intensitet)),
            skarpa: min(1, max(0, skarpa)),
            pa: pa
        )
    }
}

enum HaptikKatalog {
    static let grupper = [
        "Soldat och skjutbanor",
        "Stridsvagn",
        "Helikopter",
        "Flygplan",
        "Labyrint",
        "Bowling",
        "Panorama",
        "Gubbtest",
        "Rörelse"
    ]

    static let handelser: [SpelHandelse] = [
        .init(id: "skott-gevar", grupp: "Soldat och skjutbanor", namn: "Gevärsskott", text: "Prickskyttegeväret avlossas.", kontinuerlig: false, standardTyp: "kanonsmall", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "skott-karbin", grupp: "Soldat och skjutbanor", namn: "Karbinskott", text: "Karbin M1 avlossas.", kontinuerlig: false, standardTyp: "rekyl", standardIntensitet: 0.85, standardSkarpa: 0.7),
        .init(id: "kulspruta", grupp: "Soldat och skjutbanor", namn: "Kulspruta", text: "MG 42, varje skott i salvan.", kontinuerlig: false, standardTyp: "kulspruteserie", standardIntensitet: 1, standardSkarpa: 0.9),
        .init(id: "traff", grupp: "Soldat och skjutbanor", namn: "Träff", text: "Kulan träffar.", kontinuerlig: false, standardTyp: "stot-styv", standardIntensitet: 0.9, standardSkarpa: 1),
        .init(id: "kram", grupp: "Soldat och skjutbanor", namn: "Avtryckare", text: "Avtryckaren trycks in, före skottet.", kontinuerlig: false, standardTyp: "stot-latt", standardIntensitet: 0.7, standardSkarpa: 1),
        .init(id: "steg", grupp: "Soldat och skjutbanor", namn: "Steg", text: "Ett steg när soldaten går.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.8, standardSkarpa: 1),
        .init(id: "huk", grupp: "Soldat och skjutbanor", namn: "Huka", text: "Soldaten hukar sig.", kontinuerlig: false, standardTyp: "stot-mjuk", standardIntensitet: 0.8, standardSkarpa: 1),
        .init(id: "nedslag", grupp: "Soldat och skjutbanor", namn: "Kasta sig ner", text: "Soldaten kastar sig ner.", kontinuerlig: false, standardTyp: "stot-tung", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "puls-skott", grupp: "Soldat och skjutbanor", namn: "Extra puls vid skott", text: "En extra puls ovanpå själva skottet. Av som standard, så det inte dubblas.", kontinuerlig: false, standardTyp: "ingen", standardIntensitet: 0.5, standardSkarpa: 1),
        .init(id: "laddning-klar", grupp: "Soldat och skjutbanor", namn: "Laddning klar", text: "Geväret är redo att skjuta igen.", kontinuerlig: false, standardTyp: "meddelande-lyckat", standardIntensitet: 0.7, standardSkarpa: 1),
        .init(id: "menyklick", grupp: "Soldat och skjutbanor", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "vagn-motor", grupp: "Stridsvagn", namn: "Motor, tomgång och varvtal", text: "Hålls igång. Styrkan följer motorns varv, från tomgång till fullt.", kontinuerlig: true, standardTyp: "motorbuller", standardIntensitet: 1, standardSkarpa: 0.2),
        .init(id: "vagn-band", grupp: "Stridsvagn", namn: "Bandgång", text: "Hålls igång medan banden rullar. Styrkan följer farten.", kontinuerlig: true, standardTyp: "rotorvibration", standardIntensitet: 0.7, standardSkarpa: 0.35),
        .init(id: "vagn-kanon", grupp: "Stridsvagn", namn: "Kanonskott", text: "Egen kanon avfyras.", kontinuerlig: false, standardTyp: "kanonsmall", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "vagn-rekyl", grupp: "Stridsvagn", namn: "Rekyl", text: "Vagnen rycker bakåt av skottet.", kontinuerlig: false, standardTyp: "rekyl", standardIntensitet: 1, standardSkarpa: 0.75),
        .init(id: "vagn-torn", grupp: "Stridsvagn", namn: "Tornvridning", text: "Hålls igång medan tornet vrids. Styrkan följer vridfarten.", kontinuerlig: true, standardTyp: "stot-mjuk", standardIntensitet: 0.45, standardSkarpa: 1),
        .init(id: "vagn-hojd", grupp: "Stridsvagn", namn: "Höjdriktning", text: "Hålls igång medan eldröret höjs eller sänks.", kontinuerlig: true, standardTyp: "stot-latt", standardIntensitet: 0.4, standardSkarpa: 1),
        .init(id: "vagn-traff-egen", grupp: "Stridsvagn", namn: "Träff på egen vagn", text: "En fiendeskott träffar den egna vagnen.", kontinuerlig: false, standardTyp: "explosion", standardIntensitet: 1, standardSkarpa: 0.8),
        .init(id: "vagn-nara", grupp: "Stridsvagn", namn: "Nedslag nära", text: "Ett skott slår ner nära vagnen.", kontinuerlig: false, standardTyp: "stot-tung", standardIntensitet: 0.6, standardSkarpa: 1),
        .init(id: "vagn-genomslag", grupp: "Stridsvagn", namn: "Genomslag", text: "Eget skott slår igenom fiendens pansar.", kontinuerlig: false, standardTyp: "kanonsmall", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "vagn-laddning", grupp: "Stridsvagn", namn: "Laddning klar", text: "Kanonen är laddad och redo.", kontinuerlig: false, standardTyp: "meddelande-lyckat", standardIntensitet: 0.8, standardSkarpa: 1),
        .init(id: "vagn-meny", grupp: "Stridsvagn", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "rotor-slag", grupp: "Helikopter", namn: "Rotorslag", text: "Hålls igång under flygning. Styrkan följer lyft och varv.", kontinuerlig: true, standardTyp: "rotorvibration", standardIntensitet: 1, standardSkarpa: 0.3),
        .init(id: "rotor-robot", grupp: "Helikopter", namn: "Robotavfyrning", text: "En styrd robot lämnar helikoptern.", kontinuerlig: false, standardTyp: "explosion", standardIntensitet: 1, standardSkarpa: 0.85),
        .init(id: "rotor-kanon", grupp: "Helikopter", namn: "Kanon och kulspruta", text: "Automatkanonen skjuter.", kontinuerlig: false, standardTyp: "kulspruteserie", standardIntensitet: 0.9, standardSkarpa: 0.9),
        .init(id: "rotor-landning", grupp: "Helikopter", namn: "Landning och markkontakt", text: "Helikoptern slår i marken.", kontinuerlig: false, standardTyp: "landningsduns", standardIntensitet: 1, standardSkarpa: 0.35),
        .init(id: "rotor-traffad", grupp: "Helikopter", namn: "Träffad", text: "Eld eller en kollision träffar helikoptern.", kontinuerlig: false, standardTyp: "stot-tung", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "rotor-krasch", grupp: "Helikopter", namn: "Krasch", text: "Pansaret tar slut.", kontinuerlig: false, standardTyp: "explosion", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "rotor-meny", grupp: "Helikopter", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "flyg-motor", grupp: "Flygplan", namn: "Motor", text: "Hålls igång medan motorn går. Styrkan följer gasen.", kontinuerlig: true, standardTyp: "motorbuller", standardIntensitet: 1, standardSkarpa: 0.2),
        .init(id: "flyg-kulspruta", grupp: "Flygplan", namn: "Kulsprutor", text: "Vingkulsprutorna skjuter.", kontinuerlig: false, standardTyp: "kulspruteserie", standardIntensitet: 1, standardSkarpa: 0.9),
        .init(id: "flyg-bomb", grupp: "Flygplan", namn: "Bomb", text: "En bomb fälls.", kontinuerlig: false, standardTyp: "explosion", standardIntensitet: 0.8, standardSkarpa: 0.7),
        .init(id: "flyg-bomb-traff", grupp: "Flygplan", namn: "Bombträff", text: "Bomben träffar ett markmål.", kontinuerlig: false, standardTyp: "explosion", standardIntensitet: 1, standardSkarpa: 0.9),
        .init(id: "flyg-landning", grupp: "Flygplan", namn: "Landning", text: "Mjuk sättning med hjulen ute.", kontinuerlig: false, standardTyp: "landningsduns", standardIntensitet: 0.8, standardSkarpa: 0.3),
        .init(id: "flyg-landning-hard", grupp: "Flygplan", namn: "Hård landning", text: "Planet studsar i en hård sättning.", kontinuerlig: false, standardTyp: "landningsduns", standardIntensitet: 1, standardSkarpa: 0.5),
        .init(id: "flyg-stall", grupp: "Flygplan", namn: "Stall-varning", text: "Vingen tappar lyftkraft.", kontinuerlig: false, standardTyp: "meddelande-varning", standardIntensitet: 0.9, standardSkarpa: 1),
        .init(id: "flyg-traff", grupp: "Flygplan", namn: "Träff", text: "Egen eld träffar fiende eller ballong.", kontinuerlig: false, standardTyp: "stot-styv", standardIntensitet: 0.8, standardSkarpa: 1),
        .init(id: "flyg-traffad", grupp: "Flygplan", namn: "Bli träffad", text: "Fienden träffar det egna planet.", kontinuerlig: false, standardTyp: "stot-tung", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "flyg-krasch", grupp: "Flygplan", namn: "Krasch", text: "Planet slår i marken.", kontinuerlig: false, standardTyp: "explosion", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "flyg-meny", grupp: "Flygplan", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "labyrint-studs", grupp: "Labyrint", namn: "Studs mot vägg", text: "Kulan stöter i en vägg. Styrkan följer stöten.", kontinuerlig: false, standardTyp: "stot-latt", standardIntensitet: 0.7, standardSkarpa: 1),
        .init(id: "labyrint-hal", grupp: "Labyrint", namn: "Hål", text: "Kulan faller i ett hål.", kontinuerlig: false, standardTyp: "stot-tung", standardIntensitet: 0.8, standardSkarpa: 1),
        .init(id: "labyrint-mal", grupp: "Labyrint", namn: "Mål", text: "Kulan når målet.", kontinuerlig: false, standardTyp: "meddelande-lyckat", standardIntensitet: 1, standardSkarpa: 1),
        .init(id: "labyrint-meny", grupp: "Labyrint", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "bowling-slapp", grupp: "Bowling", namn: "Släpp", text: "Klotet släpps. Styrkan följer farten.", kontinuerlig: false, standardTyp: "stot-medel", standardIntensitet: 0.9, standardSkarpa: 1),
        .init(id: "bowling-traff", grupp: "Bowling", namn: "Träff på käglor", text: "Klotet träffar käglorna.", kontinuerlig: false, standardTyp: "explosion", standardIntensitet: 0.8, standardSkarpa: 0.6),
        .init(id: "bowling-ranna", grupp: "Bowling", namn: "Ränna", text: "Klotet går i rännan.", kontinuerlig: false, standardTyp: "stot-mjuk", standardIntensitet: 0.5, standardSkarpa: 1),
        .init(id: "bowling-meny", grupp: "Bowling", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "panorama-skott", grupp: "Panorama", namn: "Skott", text: "Ett skott från panoramat.", kontinuerlig: false, standardTyp: "stot-medel", standardIntensitet: 0.9, standardSkarpa: 1),
        .init(id: "panorama-traff", grupp: "Panorama", namn: "Träff", text: "En soldat träffas.", kontinuerlig: false, standardTyp: "stot-styv", standardIntensitet: 0.8, standardSkarpa: 1),
        .init(id: "panorama-meny", grupp: "Panorama", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "gubbe-steg", grupp: "Gubbtest", namn: "Steg", text: "Gubben tar ett steg.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.6, standardSkarpa: 1),
        .init(id: "gubbe-skak", grupp: "Gubbtest", namn: "Sikte skakar", text: "Siktet är ostadigt.", kontinuerlig: false, standardTyp: "stot-latt", standardIntensitet: 0.4, standardSkarpa: 1),
        .init(id: "gubbe-meny", grupp: "Gubbtest", namn: "Menyklick", text: "Ett tryck i menyn.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.5, standardSkarpa: 1),

        .init(id: "rorelse-markering", grupp: "Rörelse", namn: "Markering", text: "En knackning när inspelaren markerar något.", kontinuerlig: false, standardTyp: "markering", standardIntensitet: 0.6, standardSkarpa: 1),
        .init(id: "rorelsetest-puls", grupp: "Rörelse", namn: "Testpuls", text: "När rörelsetestet ber om en vibration.", kontinuerlig: false, standardTyp: "stot-medel", standardIntensitet: 0.8, standardSkarpa: 1),
        .init(id: "vibrera", grupp: "Rörelse", namn: "Vibration från sidan", text: "En sida anropar navigator.vibrate och har inget eget namn.", kontinuerlig: false, standardTyp: "stot-medel", standardIntensitet: 0.7, standardSkarpa: 1)
    ]

    static func handelse(_ id: String) -> SpelHandelse? { handelser.first { $0.id == id } }

    static var standardVal: [String: HaptikValj] {
        Dictionary(uniqueKeysWithValues: handelser.map { ($0.id, $0.standard) })
    }
}
