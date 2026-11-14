import SwiftUI

struct StartVy: View {
    @State private var visaHaptik = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Gyrospel")
                    .font(.largeTitle.weight(.bold))
                Text("Välj ett spel. Det hämtas från nätet, så du alltid får den senaste versionen.")
                    .font(.body)
                    .foregroundStyle(SpelFarg.svag)
                Button {
                    visaHaptik = true
                } label: {
                    Label("Haptik", systemImage: "waveform")
                        .font(.body.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(SpelFarg.kort, in: RoundedRectangle(cornerRadius: 14))
                        .foregroundStyle(SpelFarg.accent)
                }
                .buttonStyle(.plain)

                ForEach(SpelLista.alla) { spel in
                    NavigationLink(value: spel) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(spel.namn)
                                .font(.title3.weight(.bold))
                                .foregroundStyle(SpelFarg.text)
                            Text(spel.text)
                                .font(.body)
                                .foregroundStyle(SpelFarg.svag)
                            if let hint = spel.orientering.hint {
                                Text(hint)
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(SpelFarg.accent)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(16)
                        .background(SpelFarg.kort, in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .background(Color(SpelFarg.bakgrund).ignoresSafeArea())
        .navigationDestination(for: SpelPost.self) { spel in
            SpelVy(spel: spel)
        }
        .sheet(isPresented: $visaHaptik) {
            NavigationStack { HaptikVy() }
        }
    }
}
