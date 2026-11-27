(function(){
  var root=document.documentElement;
  function setTheme(t){root.dataset.theme=t;try{localStorage.setItem("bupTheme",t)}catch(e){}
    var u=document.querySelector("#themeToggle use");if(u)u.setAttribute("href",t==="dark"?"#i-sun":"#i-moon")}
  var cur=root.dataset.theme||"light";setTheme(cur);
  var b=document.getElementById("themeToggle");
  if(b)b.addEventListener("click",function(){setTheme(root.dataset.theme==="dark"?"light":"dark")});
  var tt,IC={info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',success:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',err:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>'},TT={info:"Information",success:"Success",warn:"Warning",err:"Error"};
  function kindOf(m){
    if(/could not|couldn't|fail|error|wrong|invalid|try again|can't|cannot|unable/i.test(m))return"err";
    if(/^(at most|allow|use |fill|enter|choose|add |select|please)|only|limit|not enough/i.test(m))return"warn";
    if(/loaded|saved|copied|done|cleared|updated|generated|downloaded|success/i.test(m))return"success";
    return"info";
  }
  window.toast=function(msg,type){
    var el=document.getElementById("toast");
    if(!el){el=document.createElement("div");el.id="toast";el.className="toast";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.appendChild(el)}
    var k=type||kindOf(String(msg));
    el.className="toast t-"+k;
    el.innerHTML='<span class="t-ic"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg></span><div class="t-tx"><b>'+TT[k]+'</b><span></span></div><button type="button" class="t-x" aria-label="Close"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
    el.querySelector(".t-tx span").textContent=msg;
    el.querySelector(".t-x").addEventListener("click",function(){el.classList.remove("show")});
    void el.offsetWidth;el.classList.add("show");
    clearTimeout(tt);tt=setTimeout(function(){el.classList.remove("show")},3200);
  };
  /* bottom-sheet confirm: askConfirm({title,text,okText},onOk,onCancel) */
  window.askConfirm=function(o,ok,cancel){
    var prev=document.activeElement,ov=document.createElement("div");ov.className="gate cf";
    ov.innerHTML='<div class="sheet cf-sheet" role="alertdialog" aria-modal="true"><div class="cf-ic"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg></div><h2></h2><p class="gsub"></p><button type="button" class="btn" data-ok></button><button type="button" class="btn ghost" data-no>Cancel</button></div>';
    ov.querySelector("h2").textContent=o.title||"Are you sure?";
    ov.querySelector(".gsub").textContent=o.text||"";
    ov.querySelector("[data-ok]").textContent=o.okText||"Confirm";
    function close(){document.removeEventListener("keydown",key);ov.remove();if(prev&&prev.focus)try{prev.focus()}catch(e){}}
    function no(){close();if(cancel)cancel()}
    function key(e){if(e.key==="Escape")no()}
    ov.addEventListener("click",function(e){if(e.target===ov)no()});
    ov.querySelector("[data-no]").addEventListener("click",no);
    ov.querySelector("[data-ok]").addEventListener("click",function(){close();if(ok)ok()});
    document.addEventListener("keydown",key);
    document.body.appendChild(ov);ov.querySelector("[data-no]").focus();
  };
})();
