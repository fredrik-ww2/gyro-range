// Native-bryggan används bara inne i appen. Safari behåller sitt switch-tick.
export function createHaptics(styles, settings) {
  const native=()=>typeof window.ReactNativeWebView?.postMessage==='function';
  const strength=()=>Math.max(0,Math.min(2,Number(settings.skottkansla)||0));
  const send=(kind)=>{if(!settings.brytare.haptik||!strength())return;window.ReactNativeWebView.postMessage(JSON.stringify({type:'haptic',kind,strength:strength()}));};
  return {
    shot(style,kind='gevar') {
      if (!settings.brytare.haptik) return;
      if(native()){send(kind);return;}
      const p=styles[settings.hapticStyle==='auto'?style:settings.hapticStyle] || styles.medel;
      if (typeof navigator.vibrate==='function') navigator.vibrate(Math.round(p.varaktighet_ms));
    },
    hit(){if(native())send('hit');},
    sync(){if(native())window.ReactNativeWebView.postMessage(JSON.stringify({type:'haptic-settings',strength:strength(),enabled:!!settings.brytare.haptik}));},
    mode: native()?'apphaptik':typeof navigator.vibrate==='function'?'vibrate':'verkligt switch-tryck, om stött'
  };
}
