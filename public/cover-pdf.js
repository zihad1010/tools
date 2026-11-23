/* Cover page maker: writes the student's details onto the two PDF templates.
   Needs the global PDFLib (vendor/pdf-lib.min.js). Runs fully in the browser. */
(function (root) {
  "use strict";

  var INK = [0.05, 0.05, 0.08];
  var FONT_SIZE = 12;
  var MIN_SIZE = 7.5;
  var BASE_SHIFT = 2.6; // label bottom -> text baseline (pt)

  // Positions are in PDF points measured from the TOP-left of the A4 page.
  // x = where the text starts, b = bottom of the label line, max = right limit of the white box.
  var LAYOUT = {
    assignment: {
      course:     { x: 122, b: 413, max: 552 },
      no:         { x: 136, b: 453, max: 552 },
      instructor: { x: 160, b: 492, max: 552, x2: 54, lh: 16, lines: 2 },
      student:    { x: 133, b: 557, max: 552 },
      section:    { x: 98,  b: 599, max: 290 },
      roll:       { x: 360, b: 597, max: 552 },
      semester:   { x: 106, b: 636, max: 290 },
      group:      { x: 374, b: 636, max: 552 },
      d1: { date: true, base: 670.3, c: [181.4, 221.1, 263.1], w: [33, 35, 35] },
      d2: { date: true, base: 670.3, c: [454.5, 495.3, 534.6], w: [40, 31, 37] }
    },
    lab: {
      course:     { x: 122, b: 415, max: 552 },
      no:         { x: 150, b: 455, max: 552 },
      instructor: { x: 169, b: 494, max: 552, x2: 54, lh: 16, lines: 2 },
      student:    { x: 134, b: 559, max: 552 },
      section:    { x: 98,  b: 601, max: 290 },
      roll:       { x: 360, b: 599, max: 552 },
      semester:   { x: 106, b: 639, max: 290 },
      group:      { x: 375, b: 638, max: 552 },
      d1: { date: true, base: 673.0, c: [130.9, 170.5, 212.6], w: [32, 32, 32] },
      d2: { date: true, base: 673.0, c: [439.4, 478.7, 518.1], w: [34, 29, 34] }
    }
  };

  // Standard PDF fonts only handle Latin letters, so anything else is rejected up front.
  var BAD = /[^\x20-\x7E\u00A0-\u00FF]/;
  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function invalid(values) {
    var bad = [];
    Object.keys(values || {}).forEach(function (k) {
      if (k.charAt(0) === "d" && /^d\d$/.test(k)) return; // dates are generated from the calendar
      if (BAD.test(clean(values[k]))) bad.push(k);
    });
    return bad;
  }

  function prefix(font, str, size, w) {
    var lo = 0, hi = str.length;
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      if (font.widthOfTextAtSize(str.slice(0, mid), size) <= w) lo = mid; else hi = mid - 1;
    }
    return str.slice(0, lo);
  }
  function ellipsize(font, str, size, w) {
    if (font.widthOfTextAtSize(str, size) <= w) return str;
    var dots = "...", base = str;
    while (base.length > 1 && font.widthOfTextAtSize(base + dots, size) > w) base = base.slice(0, -1);
    return base + dots;
  }
  function wrap(font, text, size, w1, w2) {
    var words = text.split(" "), line1 = "", i = 0;
    while (i < words.length) {
      var t = line1 ? line1 + " " + words[i] : words[i];
      if (font.widthOfTextAtSize(t, size) <= w1) { line1 = t; i++; } else break;
    }
    var rest;
    if (!line1) { // first word alone is too long: split by letters
      line1 = prefix(font, words[0], size, w1);
      rest = (words[0].slice(line1.length) + " " + words.slice(1).join(" ")).trim();
    } else rest = words.slice(i).join(" ");
    return [line1, rest, font.widthOfTextAtSize(rest, size) <= w2];
  }

  function parseDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
    return m ? [m[3], m[2], m[1]] : null;
  }

  function build(type, values, templateBytes) {
    var L = LAYOUT[type];
    if (!L) return Promise.reject(new Error("Unknown cover page type"));
    var P = root.PDFLib;
    if (!P) return Promise.reject(new Error("PDF library did not load"));
    return P.PDFDocument.load(templateBytes).then(function (doc) {
      return doc.embedFont(P.StandardFonts.TimesRoman).then(function (font) {
        var page = doc.getPages()[0], H = page.getHeight(), color = P.rgb(INK[0], INK[1], INK[2]);
        function put(text, x, baseTop, size) {
          if (!text) return;
          page.drawText(text, { x: x, y: H - baseTop, size: size, font: font, color: color });
        }
        Object.keys(L).forEach(function (key) {
          var f = L[key], val = clean(values[key]);
          if (f.date) {
            var d = parseDate(values[key]);
            if (!d) return;
            for (var i = 0; i < 3; i++) {
              var size = FONT_SIZE - 1, w = f.w[i];
              while (size > MIN_SIZE && font.widthOfTextAtSize(d[i], size) > w) size -= 0.25;
              put(d[i], f.c[i] - font.widthOfTextAtSize(d[i], size) / 2, f.base, size);
            }
            return;
          }
          if (!val) return;
          var baseTop = f.b - BASE_SHIFT;
          if (f.lines === 2) {
            var w1 = f.max - f.x, w2 = f.max - f.x2, sz = FONT_SIZE, parts = wrap(font, val, sz, w1, w2);
            while (!parts[2] && sz > 9) { sz -= 0.5; parts = wrap(font, val, sz, w1, w2); }
            put(parts[0], f.x, baseTop, sz);
            put(ellipsize(font, parts[1], sz, w2), f.x2, baseTop + f.lh, sz);
            return;
          }
          var s = FONT_SIZE, maxW = f.max - f.x;
          while (s > MIN_SIZE && font.widthOfTextAtSize(val, s) > maxW) s -= 0.25;
          put(ellipsize(font, val, s, maxW), f.x, baseTop, s);
        });
        doc.setTitle(type === "lab" ? "Lab Report Cover Page" : "Assignment Cover Page");
        return doc.save();
      });
    });
  }

  root.CoverPDF = { build: build, invalid: invalid, LAYOUT: LAYOUT };
})(typeof window !== "undefined" ? window : globalThis);
