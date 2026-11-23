(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "sdCover";
  var SAVED = ["student", "section", "roll", "semester", "group"]; // remembered on this phone only

  var STUDENT = [
    { k: "student", l: "Student Name", full: 1, max: 40 },
    { k: "section", l: "Section", max: 10 },
    { k: "roll", l: "Roll", max: 20 },
    { k: "semester", l: "Semester", max: 20 },
    { k: "group", l: "Group", max: 10 }
  ];
  var TYPES = {
    assignment: {
      title: "Assignment", file: "templates/assignment.pdf",
      fields: [
        { k: "course", l: "Course Title", p: "e.g. Data Structures", full: 1, max: 70 },
        { k: "no", l: "Assignment No", p: "e.g. 01", full: 1, max: 20 },
        { k: "instructor", l: "Name of Instructor", p: "Name and designation", full: 1, area: 1, max: 120 }
      ].concat(STUDENT, [
        { k: "d1", l: "Date of Assignment", t: "date" },
        { k: "d2", l: "Date of Submission", t: "date" }
      ])
    },
    lab: {
      title: "Lab Report", file: "templates/lab-report.pdf",
      fields: [
        { k: "course", l: "Course Title", p: "e.g. Digital Logic Design Lab", full: 1, max: 70 },
        { k: "no", l: "No of Experiment", p: "e.g. 04", full: 1, max: 20 },
        { k: "instructor", l: "Name of Experiment", p: "Title of the experiment", full: 1, area: 1, max: 120 }
      ].concat(STUDENT, [
        { k: "d1", l: "Exp. Date", t: "date" },
        { k: "d2", l: "Submission date", t: "date" }
      ])
    }
  };

  var cur = "assignment", vals = {}, url = "", blob = null, fileName = "";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); SAVED.forEach(function (k) { if (typeof o[k] === "string") vals[k] = o[k]; }); } catch (e) {} }
  function save() { try { var o = {}; SAVED.forEach(function (k) { if (vals[k]) o[k] = vals[k]; }); localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  function collect() {
    TYPES[cur].fields.forEach(function (f) { var el = $("f-" + f.k); if (el) vals[f.k] = el.value; });
  }
  function render() {
    var t = TYPES[cur];
    $("cpTitle").textContent = t.title + " cover page";
    var h = '<div class="grid2">';
    t.fields.forEach(function (f) {
      var id = "f-" + f.k, v = esc(vals[f.k] || ""), span = f.full ? ' style="grid-column:1/-1"' : "";
      var input = f.area
        ? '<textarea id="' + id + '" rows="2" maxlength="' + f.max + '" placeholder="' + esc(f.p || "") + '">' + v + "</textarea>"
        : f.t === "date"
          ? '<input id="' + id + '" type="date" value="' + v + '">'
          : '<input id="' + id + '" maxlength="' + f.max + '" autocomplete="off" placeholder="' + esc(f.p || "") + '" value="' + v + '">';
      h += '<div class="field"' + span + '><label for="' + id + '">' + esc(f.l) + "</label>" + input + "</div>";
    });
    $("cpForm").innerHTML = h + "</div>";
    $("cpForm").querySelectorAll("input,textarea").forEach(function (el) {
      el.addEventListener("input", function () { el.classList.remove("cp-bad"); });
    });
  }
  function hideDone() { $("cpDone").classList.add("hidden"); }
  function setType(t) {
    if (t === cur) return;
    collect(); cur = t; hideDone();
    document.querySelectorAll(".pills button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.type === t ? "true" : "false"); });
    render();
  }

  function safe(s) { return String(s || "").replace(/[^A-Za-z0-9_-]+/g, "").slice(0, 24); }
  function openTab() {
    var w = window.open(url, "_blank");
    if (!w && window.toast) window.toast("Allow pop-ups, or use the Download button.");
  }
  function showResult(bytes) {
    if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
    blob = new Blob([bytes], { type: "application/pdf" });
    url = URL.createObjectURL(blob);
    fileName = TYPES[cur].title.replace(/\s+/g, "") + "-CoverPage" + (safe(vals.roll) ? "-" + safe(vals.roll) : "") + ".pdf";
    $("cpName").textContent = fileName;
    var a = $("cpDl"); a.href = url; a.setAttribute("download", fileName);
    $("cpDone").classList.remove("hidden");
    $("cpDone").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function generate() {
    collect();
    var bad = CoverPDF.invalid(vals);
    if (bad.length) {
      bad.forEach(function (k) { var el = $("f-" + k); if (el) el.classList.add("cp-bad"); });
      if (window.toast) window.toast("Use English letters and numbers only.");
      return;
    }
    var any = TYPES[cur].fields.some(function (f) { return String(vals[f.k] || "").trim(); });
    if (!any) { if (window.toast) window.toast("Fill in at least one detail."); return; }
    var btn = $("cpGo"); btn.disabled = true; btn.textContent = "Making PDF...";
    fetch(TYPES[cur].file, { cache: "force-cache" })
      .then(function (r) { if (!r.ok) throw new Error("template"); return r.arrayBuffer(); })
      .then(function (buf) { return CoverPDF.build(cur, vals, buf); })
      .then(function (bytes) { save(); showResult(bytes); })
      .catch(function () { if (window.toast) window.toast("Could not make the PDF. Check your internet and try again."); })
      .then(function () { btn.disabled = false; btn.textContent = "Generate PDF"; });
  }
  function share() {
    if (!blob) return;
    try {
      var file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: fileName }).catch(function (e) { if (!e || e.name !== "AbortError") openTab(); });
        return;
      }
    } catch (e) {}
    openTab();
  }

  var hl = $("homeLink"); if (S.homeUrl) hl.href = S.homeUrl;
  document.querySelectorAll(".pills button").forEach(function (b) { b.addEventListener("click", function () { setType(b.dataset.type); }); });
  $("cpGo").addEventListener("click", generate);
  $("cpShare").addEventListener("click", share);
  $("cpClear").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    SAVED.forEach(function (k) { vals[k] = ""; var el = $("f-" + k); if (el) el.value = ""; });
    if (window.toast) window.toast("Saved details cleared.");
  });
  load(); render();
})();
