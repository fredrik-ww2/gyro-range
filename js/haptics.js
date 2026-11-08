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
    // Ett steg. Appen får en egen puls via samma WebView-brygga som skotten.
    impact(kraft=1){
      if(!settings.brytare.haptik)return;
      const tung=kraft>1;
      if(native()){window.ReactNativeWebView.postMessage(JSON.stringify({type:'haptic',kind:tung?'nedslag':'huk',strength:Math.max(.5,strength())*(tung?1.35:1)}));return;}
      if(typeof navigator.vibrate==='function')navigator.vibrate(tung?[14,24,18]:16);
    },
    step(){
      if(!settings.brytare.haptik)return;
      if(native()){window.ReactNativeWebView.postMessage(JSON.stringify({type:'haptic',kind:'steg',strength:Math.max(0.35,strength())}));return;}
      if(typeof navigator.vibrate==='function')navigator.vibrate(12);
    },
    sync(){if(native())window.ReactNativeWebView.postMessage(JSON.stringify({type:'haptic-settings',strength:strength(),enabled:!!settings.brytare.haptik}));},
    mode: native()?'apphaptik':typeof navigator.vibrate==='function'?'vibrate':'verkligt switch-tryck, om stött'
  };
}
