(function(){
  "use strict";
  var S=window.SITE||{};
  var KEY="sdStudent";
  function $(id){return document.getElementById(id)}
  function saved(){try{var o=JSON.parse(localStorage.getItem(KEY));return o&&o.id?o:null}catch(e){return null}}
  function setSaved(o){try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
  function clearSaved(){try{localStorage.removeItem(KEY)}catch(e){}}
  // Session token: kept only for this tab/app session (sessionStorage), sent as an Authorization header.
  var TK="sdToken";
  function getTok(){try{return sessionStorage.getItem(TK)||""}catch(e){return ""}}
  function setTok(t){try{if(t)sessionStorage.setItem(TK,t);else sessionStorage.removeItem(TK)}catch(e){}}
  function api(path,body){
    return fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(body||{})})
      .then(function(r){return r.json().catch(function(){return{}}).then(function(d){d.status=r.status;return d})})
      .catch(function(){return{error:"Can't reach the server. Check your internet and try again.",status:0}});
  }

  // The dashboard is locked every time the app opens or the page is shown again.
  function lock(){setTok("");fetch("/api/logout",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"}).catch(function(){})}
  lock();
  addEventListener("pageshow",function(e){if(e.persisted)lock()});

  var calc=$("calcCard"),dash=$("dashCard"),gate=$("gate");
  var cover=$("coverCard");
  if(cover){
    if(S.coverUrl){cover.href=S.coverUrl}
    else{cover.addEventListener("click",function(e){e.preventDefault();window.toast&&window.toast("Coming soon.")})}
  }
  if(S.calculatorUrl)calc.href=S.calculatorUrl;
  // Inside the portal app (framed) open the calculator in the same view, not a new browser tab.
  try{if(window.top!==window.self)calc.removeAttribute("target")}catch(e){calc.removeAttribute("target")}

  var views=["choice","pin","signin","signup"];
  var cur=null,pin="",busy=false,lastFocus=null;
  function show(name){
    views.forEach(function(v){$("v-"+v).classList.toggle("hidden",v!==name)});
    ["pinErr","siErr","suErr"].forEach(function(id){$(id).textContent=""});
    if(name==="pin"){pin="";dots()}
    var f={signin:"si-id",signup:"su-id"}[name];if(f)setTimeout(function(){$(f).focus()},50);
  }
  function openGate(){
    lastFocus=document.activeElement;
    gate.classList.remove("hidden");document.body.style.overflow="hidden";
    var s=saved();
    if(s){cur=s;$("pinWho").textContent="Hi, "+s.nick;show("pin")}else show("choice");
  }
  function closeGate(){gate.classList.add("hidden");document.body.style.overflow="";pin="";if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  function goDashboard(){
    var url=S.dashboardUrl||"/dashboard/",t=getTok();
    if(!t||url.charAt(0)!=="/"){location.href=url;return}
    // Fetch the protected page with the token, then show it here (works even when cookies are blocked, e.g. inside the portal app).
    fetch(url,{headers:{Authorization:"Bearer "+t},credentials:"same-origin",cache:"no-store"})
      .then(function(r){
        if(!r.ok||(r.headers.get("content-type")||"").indexOf("text/html")<0)throw new Error("locked");
        return r.text();
      })
      .then(function(html){document.open();document.write(html);document.close()})
      .catch(function(){location.href=url});
  }

  dash.addEventListener("click",function(e){e.preventDefault();openGate()});
  $("gateClose").addEventListener("click",closeGate);
  gate.addEventListener("click",function(e){if(e.target===gate)closeGate()});
  Array.prototype.forEach.call(document.querySelectorAll("[data-go]"),function(b){b.addEventListener("click",function(){show(b.dataset.go)})});

  /* ---------- PIN keypad ---------- */
  var kp=$("keypad");
  ["1","2","3","4","5","6","7","8","9","","0","del"].forEach(function(k){
    var b=document.createElement("button");b.type="button";
    if(k===""){b.className="key blank";b.disabled=true;b.setAttribute("aria-hidden","true")}
    else if(k==="del"){b.className="key";b.setAttribute("aria-label","Delete");b.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-back"/></svg>';b.addEventListener("click",function(){press("del")})}
    else{b.className="key";b.textContent=k;b.addEventListener("click",function(){press(k)})}
    kp.appendChild(b);
  });
  function dots(){var d=$("dots").children;for(var i=0;i<4;i++)d[i].className=i<pin.length?"on":""}
  function press(k){
    if(busy)return;
    $("pinErr").textContent="";
    if(k==="del")pin=pin.slice(0,-1);else if(pin.length<4)pin+=k;
    dots();
    if(pin.length===4)submitPin();
  }
  function submitPin(){
    busy=true;
    api("/api/login",{studentId:cur.id,pin:pin}).then(function(d){
      busy=false;
      if(d.ok){setSaved({id:d.studentId,nick:d.nickname});setTok(d.token);goDashboard();return}
      $("pinErr").textContent=d.error||"Something went wrong.";
      var el=$("dots");el.classList.remove("shake");void el.offsetWidth;el.classList.add("shake");
      pin="";dots();
    });
  }
  $("notYou").addEventListener("click",function(){clearSaved();cur=null;show("signin")});
  addEventListener("keydown",function(e){
    if(gate.classList.contains("hidden"))return;
    if(e.key==="Escape"){closeGate();return}
    if($("v-pin").classList.contains("hidden"))return;
    if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==="Backspace")press("del");
  });

  /* ---------- Sign in (new device) ---------- */
  function normId(v){return String(v||"").trim().toUpperCase().replace(/\s+/g,"")}
  $("siGo").addEventListener("click",function(){
    var id=normId($("si-id").value);
    if(!/^[A-Z0-9]{5,20}$/.test(id)){$("siErr").textContent="Enter your Student ID.";return}
    cur={id:id,nick:""};$("pinWho").textContent="Student ID "+id;show("pin");
  });
  $("si-id").addEventListener("keydown",function(e){if(e.key==="Enter")$("siGo").click()});

  /* ---------- Sign up ---------- */
  $("suGo").addEventListener("click",function(){
    if(busy)return;
    var id=normId($("su-id").value),id2=normId($("su-id2").value),nick=$("su-nick").value.trim(),p=$("su-pin").value,p2=$("su-pin2").value,err=$("suErr");
    if(!/^[A-Z0-9]{5,20}$/.test(id)){err.textContent="Enter a valid Student ID.";return}
    if(id!==id2){err.textContent="The two Student IDs do not match.";return}
    if(nick.length<2){err.textContent="Please enter a nickname (at least 2 characters).";return}
    if(!/^[0-9]{4}$/.test(p)){err.textContent="PIN must be exactly 4 digits.";return}
    if(p!==p2){err.textContent="The two PINs do not match.";return}
    busy=true;err.textContent="";$("suGo").disabled=true;
    api("/api/signup",{studentId:id,studentId2:id2,nickname:nick,pin:p,pin2:p2}).then(function(d){
      busy=false;$("suGo").disabled=false;
      if(d.ok){setSaved({id:d.studentId,nick:d.nickname});setTok(d.token);goDashboard();return}
      err.textContent=d.error||"Something went wrong.";
    });
  });

  if(/[?&]unlock=1/.test(location.search)){history.replaceState(null,"",location.pathname);openGate()}
})();
