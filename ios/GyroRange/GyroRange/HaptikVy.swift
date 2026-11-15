import SwiftUI

struct HaptikVy: View {
    @ObservedObject private var lager = HaptikLager.delad
    @Environment(\.dismiss) private var dismiss
    @State private var fråga = false

    var body: some View {
        List {
            Section {
                Toggle("Volymknappar som avtryckare", isOn: Binding(
                    get: { lager.volymknappar },
                    set: { lager.volym($0) }
                ))
                Text("Volym upp skjuter. Volym ner släpper. Volymen hoppar tillbaka så rutan på skärmen inte stannar. Stäng av om du vill använda volymen som vanligt.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("Alla haptikval") {
                Text("\(HaptikVal.alla.count) val. Testa spelar varje val på full styrka.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                ForEach(HaptikVal.alla) { val in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(val.namn).font(.body.weight(.semibold))
                        Text(val.text).font(.footnote).foregroundStyle(.secondary)
                        Button("Testa") { HaptikMotor.delad.testaVal(val.id) }
                            .buttonStyle(.bordered)
                    }
                    .padding(.vertical, 4)
                }
            }

            ForEach(HaptikKatalog.grupper, id: \.self) { grupp in
                Section(grupp) {
                    let rader = HaptikKatalog.handelser.filter { $0.grupp == grupp }
                    ForEach(rader) { post in
                        handelseRad(post)
                    }
                }
            }

            Section {
                Button("Återställ till standard", role: .destructive) { fråga = true }
                Text("\(HaptikKatalog.handelser.count) händelser. Varje kan få valfritt haptikval, eller Ingen.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Haptik")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Klar") { dismiss() }
            }
        }
        .alert("Återställ haptik?", isPresented: $fråga) {
            Button("Återställ", role: .destructive) { lager.återställ() }
            Button("Avbryt", role: .cancel) {}
        } message: {
            Text("Alla val, styrkor och volymknappen går tillbaka till startläget.")
        }
    }

    @ViewBuilder
    private func handelseRad(_ post: SpelHandelse) -> some View {
        let vald = lager.för(post.id)
        VStack(alignment: .leading, spacing: 8) {
            Text(post.namn).font(.body.weight(.semibold))
            Text(post.text).font(.footnote).foregroundStyle(.secondary)
            Picker("Känsla", selection: Binding(
                get: { vald.typ },
                set: { nytt in lager.sätt(post.id) { $0.typ = nytt } }
            )) {
                Text("Ingen").tag("ingen")
                ForEach(HaptikVal.alla) { val in
                    Text(val.namn).tag(val.id)
                }
            }
            .pickerStyle(.menu)
            Text("Styrka \(Int((vald.intensitet * 100).rounded())) %")
                .font(.footnote)
            Slider(value: Binding(
                get: { vald.intensitet },
                set: { nytt in lager.sätt(post.id) { $0.intensitet = nytt } }
            ), in: 0...1)
            if HaptikVal.med(id: vald.typ)?.arCoreHaptics == true {
                Text("Skärpa \(Int((vald.skarpa * 100).rounded())) %")
                    .font(.footnote)
                Slider(value: Binding(
                    get: { vald.skarpa },
                    set: { nytt in lager.sätt(post.id) { $0.skarpa = nytt } }
                ), in: 0...1)
            } else if vald.typ != "ingen" {
                Text("Det här systemvalet har ingen skärpa. 0 % styrka stänger av det.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            if post.kontinuerlig {
                Toggle("På under spelet", isOn: Binding(
                    get: { vald.pa },
                    set: { nytt in lager.sätt(post.id) { $0.pa = nytt } }
                ))
                Text("Styrkan följer spelets varv eller fart, upp till reglaget.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Button("Testa") { HaptikMotor.delad.testaHandelse(post.id) }
                .buttonStyle(.bordered)
                .disabled(vald.typ == "ingen" || vald.intensitet <= 0.001)
        }
        .padding(.vertical, 6)
    }
}
