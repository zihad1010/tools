/* Share buttons for the CG Calculator and Cover Page Generator cards. */
(function () {
  "use strict";
  function say(msg) { if (window.toast) window.toast(msg); }

  var buttons = Array.prototype.slice.call(document.querySelectorAll(".share-btn"));

  // Browsers without a share sheet (some desktop browsers) get no button at all instead of a dead one.
  if (!navigator.share) {
    buttons.forEach(function (b) { b.hidden = true; });
    return;
  }

  function onShare(btn) {
    var card = document.getElementById(btn.getAttribute("data-share"));
    var title = btn.getAttribute("data-title") || document.title;
    if (!card) return;
    var href = card.getAttribute("href");
    // Cover card without a link yet (still "Coming soon"): nothing to share.
    if (!href || href === "#") { say("Coming soon."); return; }
    var url;
    try { url = new URL(href, location.href).href; } catch (e) { return; }

    navigator.share({ title: title, url: url }).catch(function (err) {
      if (err && err.name === "AbortError") return;   // person closed the share sheet
      say("Sharing isn't available here.");           // blocked, e.g. inside a frame
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); onShare(btn); });
  });
})();
