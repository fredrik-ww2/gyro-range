/* Synlig väg in i verkstaden från FORMs redan byggda sidor.
   Länken läggs till efter att sidan ritats, så de minifierade vyerna inte ändras. */
(function () {
  var aktuell = document.currentScript;
  if (!aktuell) return;
  var href = new URL('./', aktuell.src).href;

  function skapa() {
    if (document.getElementById('verkstad-ingang-host')) return;
    var vart = document.body;
    if (!vart) return;
    var host = document.createElement('div');
    host.id = 'verkstad-ingang-host';
    var skugga = host.attachShadow({ mode: 'open' });
    skugga.innerHTML = ''
      + '<style>'
      + 'a{pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 22px;border-radius:999px;background:#263f32;color:#f7f6ef;font:700 18px/1 Arial,Helvetica,sans-serif;text-decoration:none;box-shadow:0 10px 28px rgba(20,30,24,.28)}'
      + 'a small{font-weight:600;opacity:.82;font-size:13px}'
      + '</style>'
      + '<a href="' + href + '">Verkstad</a>';
    host.style.cssText = 'position:fixed;z-index:2147483000;left:0;right:0;bottom:0;display:flex;justify-content:flex-end;pointer-events:none;padding:0 16px calc(14px + env(safe-area-inset-bottom));';
    vart.appendChild(host);
  }

  function bevaka() {
    skapa();
    if (!document.body) return;
    new MutationObserver(skapa).observe(document.body, { childList: true });
  }

  addEventListener('load', function () { setTimeout(bevaka, 250); });
})();
