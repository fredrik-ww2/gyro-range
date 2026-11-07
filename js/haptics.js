// Android: varaktighet används, styrka kan inte väljas med Vibrate API.
// Framtida native-app: styrka + varaktighet kan mappas till Core Haptics.
// iOS Safari ger bara en fast systemknackning per verkligt tryck på label/switch.
// Vi anropar aldrig label.click(): schemalagda salvskott kan inte ge iOS-knackningar.
export function createHaptics(styles, settings) {
  return {
    shot(style) {
      if (!settings.brytare.haptik) return;
      const p=styles[settings.hapticStyle==='auto'?style:settings.hapticStyle] || styles.medel;
      if (typeof navigator.vibrate==='function') navigator.vibrate(Math.round(p.varaktighet_ms));
    },
    mode: typeof navigator.vibrate==='function' ? 'vibrate' : 'verkligt switch-tryck, om stött'
  };
}
