/* Liten länk tillbaka till länksidan.
   På spel med startkort läggs den i kortet, så den försvinner när spelet börjar.
   Annars ligger den i hörnet. */
(function () {
  var aktuell = document.currentScript;
  var href = aktuell && aktuell.src ? new URL('./', aktuell.src).href : 'lankar/';

  function skapa() {
    if (document.querySelector('[data-alla-lankar]')) return;
    var a = document.createElement('a');
    a.setAttribute('data-alla-lankar', '');
    a.href = href;
    a.textContent = 'Alla länkar';
    var start = document.querySelector('#startPanel, #startKort');
    if (start) {
      a.style.cssText = 'display:block;margin-top:12px;text-align:center;min-height:0;border:0;background:transparent;box-shadow:none;color:inherit;opacity:.8;font:600 15px/1.3 -apple-system,system-ui,sans-serif;text-decoration:underline;padding:4px;border-radius:0;touch-action:manipulation';
      start.appendChild(a);
      return;
    }
    a.style.cssText = 'display:inline-block;width:max-content;margin:10px 12px 0;padding:6px 10px;min-height:0;border:0;border-radius:999px;background:#24382c;color:#f6f3ea;font:600 13px/1.2 -apple-system,system-ui,sans-serif;text-decoration:none;box-shadow:none;touch-action:manipulation';
    document.body.insertBefore(a, document.body.firstChild);
  }

  function hall() {
    if (!document.querySelector('[data-alla-lankar]')) skapa();
  }

  function bevaka() {
    hall();
    if (!document.body) return;
    new MutationObserver(hall).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'complete') bevaka();
  else addEventListener('load', bevaka);
})();
