(function(){
  var root=document.documentElement;
  function setTheme(t){root.dataset.theme=t;try{localStorage.setItem("bupTheme",t)}catch(e){}
    var u=document.querySelector("#themeToggle use");if(u)u.setAttribute("href",t==="dark"?"#i-sun":"#i-moon")}
  var cur=root.dataset.theme||"light";setTheme(cur);
  var b=document.getElementById("themeToggle");
  if(b)b.addEventListener("click",function(){setTheme(root.dataset.theme==="dark"?"light":"dark")});
  var tt;window.toast=function(msg){var el=document.getElementById("toast");if(!el)return;el.textContent=msg;el.classList.add("show");clearTimeout(tt);tt=setTimeout(function(){el.classList.remove("show")},2400)};
})();
