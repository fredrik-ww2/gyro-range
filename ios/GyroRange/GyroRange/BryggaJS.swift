import Foundation

/// Skript som körs före sidans egen kod. Det låtsas vara den brygga
/// sidorna redan känner (`ReactNativeWebView` och `ww2-native-gyro`)
/// och tar emot anrop från `shared/ios-brygga.js`.
enum BryggaJS {
    static let kalla = #"""
    (function () {
      if (window.__gyroRangeInstallerad) return;
      window.__gyroRangeInstallerad = true;

      function posta(msg) {
        try { window.webkit.messageHandlers.gyroRange.postMessage(msg); } catch (e) {}
      }

      window.GyroRange = {
        handelse: function (namn, detalj) {
          var msg = { type: "spel-handelse", handelse: String(namn || "") };
          if (detalj && typeof detalj === "object") {
            for (var k in detalj) {
              if (Object.prototype.hasOwnProperty.call(detalj, k)) msg[k] = detalj[k];
            }
          }
          posta(msg);
        }
      };

      window.ReactNativeWebView = {
        postMessage: function (text) {
          var msg;
          try { msg = JSON.parse(text); }
          catch (e) { msg = { type: "raw", text: String(text) }; }
          posta(msg);
        }
      };

      function bevilja() { return Promise.resolve("granted"); }
      try {
        if (window.DeviceOrientationEvent) window.DeviceOrientationEvent.requestPermission = bevilja;
        if (window.DeviceMotionEvent) window.DeviceMotionEvent.requestPermission = bevilja;
      } catch (e) {}

      try {
        Object.defineProperty(navigator, "vibrate", {
          configurable: true,
          writable: true,
          value: function (monster) {
            if (monster === 0 || (monster && monster.length === 0)) return true;
            var ms = 0;
            if (typeof monster === "number") ms = monster;
            else if (monster && monster.length) {
              for (var i = 0; i < monster.length; i++) ms += Number(monster[i]) || 0;
            }
            var vag = location.pathname || "";
            var namn = vag.indexOf("/rorelse-test") >= 0 ? "rorelsetest-puls" : "vibrera";
            posta({ type: "haptic", kind: "vibrate", handelse: namn, niva: Math.max(0.25, Math.min(1, (ms || 16) / 40)) });
            return true;
          }
        });
      } catch (e) {}

      function falt(obj, nyckel, varde) {
        try { Object.defineProperty(obj, nyckel, { configurable: true, enumerable: true, value: varde }); }
        catch (e) { try { obj[nyckel] = varde; } catch (e2) {} }
      }

      function skickaOrientering(d) {
        var ev;
        try { ev = new DeviceOrientationEvent("deviceorientation", { alpha: d.alpha, beta: d.beta, gamma: d.gamma, absolute: false }); }
        catch (e) { ev = new Event("deviceorientation"); }
        if (ev.alpha == null) { falt(ev, "alpha", d.alpha); falt(ev, "beta", d.beta); falt(ev, "gamma", d.gamma); }
        falt(ev, "webkitCompassHeading", (360 - d.alpha) % 360);
        falt(ev, "webkitCompassAccuracy", 15);
        window.dispatchEvent(ev);
      }

      function skickaRorelse(d) {
        var G = 9.80665;
        var acc = { x: d.ax * G, y: d.ay * G, z: d.az * G };
        var med = { x: (d.ax + d.gx) * G, y: (d.ay + d.gy) * G, z: (d.az + d.gz) * G };
        var rr = { alpha: d.z * 180 / Math.PI, beta: d.x * 180 / Math.PI, gamma: d.y * 180 / Math.PI };
        var ev;
        try {
          ev = new DeviceMotionEvent("devicemotion", {
            acceleration: acc,
            accelerationIncludingGravity: med,
            rotationRate: rr,
            interval: d.intervall || 12.5
          });
        } catch (e) { ev = new Event("devicemotion"); }
        if (!ev.acceleration) falt(ev, "acceleration", acc);
        if (!ev.accelerationIncludingGravity) falt(ev, "accelerationIncludingGravity", med);
        if (!ev.rotationRate) falt(ev, "rotationRate", rr);
        if (!ev.interval) falt(ev, "interval", d.intervall || 12.5);
        window.dispatchEvent(ev);
      }

      window.__gyroMata = function (d) {
        if (!d || !isFinite(d.t)) return;
        window.dispatchEvent(new CustomEvent("ww2-native-gyro", { detail: { x: d.x, y: d.y, z: d.z, t: d.t } }));
        window.dispatchEvent(new CustomEvent("ww2-native-motion", { detail: d }));
        skickaOrientering(d);
        skickaRorelse(d);
      };

      window.__gyroStatus = function (tillganglig) {
        window.dispatchEvent(new CustomEvent("ww2-native-status", { detail: { available: !!tillganglig } }));
      };

      window.__gyroLiv = function (aktiv) {
        window.dispatchEvent(new CustomEvent("ww2-native-lifecycle", { detail: { active: !!aktiv } }));
      };

      function peka(id, nere) {
        var el = document.getElementById(id);
        if (!el) return false;
        var r = el.getBoundingClientRect();
        var x = r.left + Math.max(1, r.width) / 2;
        var y = r.top + Math.max(1, r.height) / 2;
        var gem = { bubbles: true, cancelable: true, pointerId: 1, pointerType: "touch", isPrimary: true, button: 0, buttons: nere ? 1 : 0, clientX: x, clientY: y };
        el.dispatchEvent(new PointerEvent(nere ? "pointerdown" : "pointerup", gem));
        return true;
      }

      function klick(id) {
        var el = document.getElementById(id);
        if (!el) return false;
        el.click();
        return true;
      }

      function tangent(id, nere) {
        var el = document.getElementById(id);
        if (!el) return false;
        el.dispatchEvent(new KeyboardEvent(nere ? "keydown" : "keyup", { code: "Space", key: " ", bubbles: true, cancelable: true }));
        return true;
      }

      window.__gyroAvtryckare = function (upp) {
        var nere = !!upp;
        document.dispatchEvent(new CustomEvent("ww2-sidoknapp", { detail: { knapp: nere ? "upp" : "ner", nere: nere } }));
        var vag = location.pathname || "";
        if (vag.indexOf("/rotor") >= 0) { peka("gun", nere); return; }
        if (vag.indexOf("/flyg") >= 0) { peka("fire", nere); return; }
        if (vag.indexOf("/vagn-test") >= 0) { if (nere) klick("eld"); return; }
        if (vag.indexOf("/panorama") >= 0) { if (nere) klick("skjut"); return; }
        if (document.getElementById("trigger")) { tangent("trigger", nere); return; }
        if (nere) klick("fire") || klick("gun") || klick("eld") || klick("skjut");
      };

      function menyNamn() {
        var vag = location.pathname || "";
        if (vag.indexOf("/vagn-test") >= 0) return "vagn-meny";
        if (vag.indexOf("/rotor") >= 0) return "rotor-meny";
        if (vag.indexOf("/flyg") >= 0) return "flyg-meny";
        if (vag.indexOf("/labyrint") >= 0) return "labyrint-meny";
        if (vag.indexOf("/bowling") >= 0) return "bowling-meny";
        if (vag.indexOf("/panorama") >= 0) return "panorama-meny";
        if (vag.indexOf("/gubbe-test") >= 0) return "gubbe-meny";
        return "menyklick";
      }

      var senMeny = 0;
      document.addEventListener("click", function (e) {
        var el = e.target && e.target.closest ? e.target.closest("button, a, summary") : null;
        if (!el) return;
        var id = el.id || "";
        if (id === "fire" || id === "gun" || id === "eld" || id === "trigger" || id === "skjut") return;
        if (el.closest("#fire, #gun, #eld, #trigger, #skjut, #fireWrap, #eldWrap")) return;
        var box = el.closest("#menu, #settings, #meny, nav, .flygmeny, #startKort, #briefing, #startPanel, #startKnappar, dialog");
        var menyId = /menu|meny|settings|start|stang|close/i.test(id);
        if (!box && !menyId && el.tagName !== "SUMMARY") return;
        var nu = performance.now();
        if (nu - senMeny < 140) return;
        senMeny = nu;
        window.GyroRange.handelse(menyNamn(), { niva: 0.45 });
      }, true);

      function lasVy() {
        var stil = document.createElement("style");
        stil.textContent = "html,body{overscroll-behavior:none;touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}";
        (document.head || document.documentElement).appendChild(stil);
        var m = document.querySelector('meta[name="viewport"]');
        if (!m) {
          m = document.createElement("meta");
          m.setAttribute("name", "viewport");
          (document.head || document.documentElement).appendChild(m);
        }
        m.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover");
      }
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lasVy);
      else lasVy();

      document.addEventListener("gesturestart", function (e) { e.preventDefault(); }, { passive: false });
      document.addEventListener("gesturechange", function (e) { e.preventDefault(); }, { passive: false });
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
      window.__gyroStatus(true);
    })();
    """#
}
