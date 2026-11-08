/* Synlig väg in i verkstaden från FORMs redan byggda sidor.
   Länken läggs till efter att sidan ritats, så de minifierade vyerna inte ändras.
   På satellitsidan pekar den på världen som just sparades. */
(function () {
  var aktuell = document.currentScript;
  if (!aktuell) return;
  var bas = new URL('./', aktuell.src).href;
  var senasteLandskap = null;
  var lank = null;

  if (!IDBObjectStore.prototype.put.__formVerkstad) {
    var originalPut = IDBObjectStore.prototype.put;
    function put(varde, nyckel) {
      try { notera(varde); } catch (fel) { /* en annan butik ska inte stoppas */ }
      return originalPut.call(this, varde, nyckel);
    }
    put.__formVerkstad = true;
    IDBObjectStore.prototype.put = put;
  }

  function notera(varde) {
    if (!varde || varde.version !== 1 || typeof varde.id !== 'string') return;
    if (typeof varde.image !== 'string' || varde.image.indexOf('data:image/') !== 0) return;
    if (!varde.analysis || !varde.settings || typeof varde.settings.widthMeters !== 'number') return;
    senasteLandskap = varde.id;
    ritaLank();
  }

  function adress() {
    if (senasteLandskap && location.pathname.indexOf('/satellit') !== -1) {
      return bas + '#stall/form/' + encodeURIComponent(senasteLandskap);
    }
    return bas;
  }

  function text() {
    return senasteLandskap && location.pathname.indexOf('/satellit') !== -1
      ? 'Ställ ut den här världen'
      : 'Verkstad';
  }

  function ritaLank() {
    if (!lank) return;
    lank.href = adress();
    lank.textContent = text();
  }

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
      + '</style>'
      + '<a href="' + adress() + '">' + text() + '</a>';
    lank = skugga.querySelector('a');
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
