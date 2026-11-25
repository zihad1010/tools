/* BUP course catalog: Department -> Semester -> Courses (name + credit are fixed here).
   The same file is used by the ClassRoom portal and the Student Tools site.
   To add another department, copy the "ICT" block and change the ids, names and courses.
   Course row: [code, name, credit, "L"]  ("L" = lab / non-theory credit; leave it out for theory). */
(function (root) {
  "use strict";

  var IT_ELECTIVE = [
    ["ICE-4211", "Machine Learning", 3], ["ICE-4212", "Machine Learning Laboratory", 1.5, "L"],
    ["ICE-4213", "Data Warehousing and Data Mining", 3], ["ICE-4214", "Data Warehousing and Data Mining Laboratory", 1.5, "L"],
    ["ICE-4215", "Internet of Things (IOT)", 3], ["ICE-4216", "Internet of Things (IOT) Laboratory", 1.5, "L"],
    ["ICE-4217", "Web Technologies", 3], ["ICE-4218", "Web Technologies Laboratory", 1.5, "L"]
  ];
  var COMM_ELECTIVE = [
    ["ICE-4221", "Cellular and Mobile Communication", 3], ["ICE-4222", "Cellular and Mobile Communication Laboratory", 1.5, "L"],
    ["ICE-4223", "Wireless Communication", 3], ["ICE-4224", "Wireless Communication Laboratory", 1.5, "L"],
    ["ICE-4225", "Information Theory and Coding", 3], ["ICE-4226", "Information Theory and Coding Laboratory", 1.5, "L"],
    ["ICE-4227", "Robotics and Embedded Systems", 3], ["ICE-4228", "Robotics and Embedded Systems Laboratory", 1.5, "L"]
  ];

  var DEPTS = [{
    id: "ICT",
    name: "Information and Communication Technology",
    sems: [
      { n: 1, label: "1st Semester", courses: [
        ["ICE-1103", "Electrical Circuits", 3],
        ["ICE-1104", "Electrical Circuits Laboratory", 1.5, "L"],
        ["PHY-1105", "Engineering Physics", 3],
        ["PHY-1106", "Engineering Physics Laboratory", 0.75, "L"],
        ["MATH-1107", "Mathematics-I (Differential and Integral Calculus)", 3],
        ["CHEM-1109", "Chemistry", 3],
        ["GED-1111", "Bangladesh Studies", 3],
        ["GED-1113", "Financial and Managerial Accounting", 3]
      ] },
      { n: 2, label: "2nd Semester", courses: [
        ["ICE-1203", "Electronic Devices and Circuit", 3],
        ["ICE-1204", "Electronic Devices and Circuit Laboratory", 1.5, "L"],
        ["ICE-1205", "Structured Programming", 3],
        ["ICE-1206", "Structured Programming Laboratory", 1.5, "L"],
        ["MATH-1205", "Mathematics-II (Ordinary and Partial Differential Equations)", 3],
        ["LANG-1207", "Foreign Language", 3],
        ["ICE-1207", "Discrete Mathematics", 3],
        ["ENG-1202", "Communicative English", 1.5, "L"],
        ["GED-1203", "Statistics and Probability", 3]
      ] },
      { n: 3, label: "3rd Semester", courses: [
        ["ICE-2109", "Object Oriented Design and Programming-I", 3],
        ["ICE-2110", "Object Oriented Design and Programming-I Laboratory", 1.5, "L"],
        ["ICE-2103", "Communication Theory", 3],
        ["ICE-2104", "Communication Theory Laboratory", 0.75, "L"],
        ["ICE-2105", "Digital Logic Design", 3],
        ["ICE-2106", "Digital Logic Design Laboratory", 0.75, "L"],
        ["ICE-2107", "Data Communication", 3],
        ["ICE-2108", "Data Communication Laboratory", 1.5, "L"],
        ["ENG-2102", "Presentation Skill Development", 1, "L"],
        ["MATH-2109", "Mathematics-III (Linear Algebra and Fourier Analysis)", 3]
      ] },
      { n: 4, label: "4th Semester", courses: [
        ["ICE-2201", "Data Structure", 3],
        ["ICE-2202", "Data Structure Laboratory", 1.5, "L"],
        ["ICE-2203", "Database Management System", 3],
        ["ICE-2204", "Database Management System Laboratory", 1.5, "L"],
        ["ICE-2206", "Object Oriented Design and Programming-II Laboratory", 1.5, "L"],
        ["ICE-2205", "Signals and Systems", 3],
        ["MATH-2207", "Mathematics-IV (Vector Analysis and Complex Variables)", 3],
        ["ICE-2207", "Computer Network", 3],
        ["ICE-2208", "Computer Network Laboratory", 0.75, "L"]
      ] },
      { n: 5, label: "5th Semester", courses: [
        ["ICE-3101", "Analysis and Design of Algorithm", 3],
        ["ICE-3102", "Analysis and Design of Algorithm Laboratory", 1.5, "L"],
        ["ICE-3103", "Operating System", 3],
        ["ICE-3104", "Operating System Laboratory", 0.75, "L"],
        ["ICE-3105", "Internet Protocol (IP) Networking", 3],
        ["ICE-3106", "Internet Protocol (IP) Networking Laboratory", 0.75, "L"],
        ["ICE-3107", "Digital Signal Processing", 3],
        ["ICE-3108", "Digital Signal Processing Laboratory", 1.5, "L"],
        ["ICE-3109", "Telecommunication Systems", 3],
        ["ICE-3110", "Telecommunication Systems Laboratory", 1.5, "L"]
      ] },
      { n: 6, label: "6th Semester", courses: [
        ["ICE-3201", "Microprocessor and Microcontroller", 3],
        ["ICE-3202", "Microprocessor and Microcontroller Laboratory", 0.75, "L"],
        ["ICE-3203", "Microwave Engineering and Antenna", 3],
        ["ICE-3204", "Microwave Engineering and Antenna Laboratory", 1.5, "L"],
        ["ICE-3206", "Software Testing and Quality Assurance Laboratory", 1.5, "L"],
        ["ICE-3207", "Software Engineering", 3],
        ["ICE-3208", "Software Engineering Laboratory", 0.75, "L"],
        ["ICE-3209", "Satellite Communication", 3],
        ["ICE-3212", "Technical Report Writing", 1.5, "L"],
        ["GED-3201", "Professional Ethics and Environmental Protection", 3]
      ] },
      { n: 7, label: "7th Semester", courses: [
        ["ICE-4000", "Thesis/Research Project", 3],
        ["ICE-4103", "Information, Network and Software Security", 3],
        ["ICE-4104", "Information, Network and Software Security Laboratory", 0.75, "L"],
        ["ICE-4105", "Optical Communication", 3],
        ["ICE-4106", "Optical Communication Laboratory", 1.5, "L"],
        ["ICE-4107", "Artificial Intelligence", 3],
        ["ICE-4108", "Artificial Intelligence Laboratory", 1.5, "L"],
        ["ICE-4109", "Cloud Computing", 3],
        ["ICE-4110", "Cloud Computing Laboratory", 0.75, "L"]
      ] },
      { n: 8, label: "8th Semester", courses: [
        ["ICE-4000", "Thesis/Research Project", 3],
        ["ICE-4200", "Internship", 3, "L"]
      ], slots: [
        { label: "Communication Elective", lab: false, options: COMM_ELECTIVE },
        { label: "Communication Elective Laboratory", lab: true, options: COMM_ELECTIVE },
        { label: "IT Elective", lab: false, options: IT_ELECTIVE },
        { label: "IT Elective Laboratory", lab: true, options: IT_ELECTIVE }
      ] }
    ]
  }];

  function mk(r) { return { code: r[0], name: r[1], credit: r[2], lab: r[3] === "L" }; }
  function dept(id) { for (var i = 0; i < DEPTS.length; i++) if (DEPTS[i].id === id) return DEPTS[i]; return null; }
  function sem(d, n) { var x = dept(d); if (!x) return null; for (var i = 0; i < x.sems.length; i++) if (x.sems[i].n === +n) return x.sems[i]; return null; }

  var KEY = "bupDeptSem";
  var BUPC = {
    departments: function () { return DEPTS.map(function (d) { return { id: d.id, name: d.name }; }); },
    semesters: function (d) { var x = dept(d); return x ? x.sems.map(function (s) { return { n: s.n, label: s.label }; }) : []; },
    /* Fixed courses of one semester (electives are NOT included, see slots()). */
    courses: function (d, n) { var s = sem(d, n); return s ? s.courses.map(mk) : []; },
    /* Elective slots of one semester: [{label, lab, options:[course,...]}] */
    slots: function (d, n) {
      var s = sem(d, n); if (!s || !s.slots) return [];
      return s.slots.map(function (sl) {
        return { label: sl.label, lab: sl.lab, options: sl.options.filter(function (o) { return (o[3] === "L") === sl.lab; }).map(mk) };
      });
    },
    /* Every pickable course of one semester (fixed + all elective options), no duplicates. */
    pickable: function (d, n) {
      var out = BUPC.courses(d, n), seen = {};
      out.forEach(function (c) { seen[c.name] = 1; });
      BUPC.slots(d, n).forEach(function (sl) { sl.options.forEach(function (c) { if (!seen[c.name]) { seen[c.name] = 1; out.push(c); } }); });
      return out;
    },
    /* Find a course by its exact name in any department/semester (used to lock saved rows). */
    find: function (name) {
      var key = String(name || "").trim(), hit = null;
      if (!key) return null;
      DEPTS.forEach(function (d) { d.sems.forEach(function (s) {
        if (hit) return;
        s.courses.forEach(function (r) { if (!hit && r[1] === key) hit = mk(r); });
        (s.slots || []).forEach(function (sl) { sl.options.forEach(function (r) { if (!hit && r[1] === key) hit = mk(r); }); });
      }); });
      return hit;
    },
    label: function (d, n) { var s = sem(d, n); return s ? s.label : ""; },
    /* Remembered choice on this device */
    saved: function () {
      var o = {}; try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
      if (o.dep === "ICE") o.dep = "ICT"; // the department was called ICE before
      var d = dept(o.dep) ? o.dep : (DEPTS.length === 1 ? DEPTS[0].id : "");
      return { dep: d, sem: sem(d, o.sem) ? +o.sem : 0 };
    },
    save: function (d, n) { try { localStorage.setItem(KEY, JSON.stringify({ dep: d || "", sem: +n || 0 })); } catch (e) {} },
    /* Fill two <select> elements and keep them in sync with the saved choice.
       opts.anySemester: add an "All semesters" entry (value 0). Calls onChange(dep, sem) after every change. */
    mount: function (depSel, semSel, onChange, opts) {
      opts = opts || {};
      var st = BUPC.saved();
      depSel.innerHTML = '<option value="">Department</option>' + DEPTS.map(function (d) { return '<option value="' + d.id + '">' + d.id + " - " + d.name + "</option>"; }).join("");
      function fillSem() {
        var list = BUPC.semesters(depSel.value);
        semSel.innerHTML = '<option value="0">' + (opts.anySemester ? "All semesters" : "Semester") + "</option>" + list.map(function (s) { return '<option value="' + s.n + '">' + s.label + "</option>"; }).join("");
        semSel.disabled = !depSel.value;
      }
      depSel.value = st.dep; fillSem(); semSel.value = String(st.sem || 0);
      if (semSel.value !== String(st.sem || 0)) semSel.value = "0";
      depSel.addEventListener("change", function () { fillSem(); BUPC.save(depSel.value, 0); if (onChange) onChange(depSel.value, 0); });
      semSel.addEventListener("change", function () { BUPC.save(depSel.value, semSel.value); if (onChange) onChange(depSel.value, +semSel.value); });
      return st;
    }
  };
  root.BUPC = BUPC;
})(window);
