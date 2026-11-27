(function(){
  "use strict";
  var GRADES=[["A+",4],["A",3.75],["A-",3.5],["B+",3.25],["B",3],["B-",2.75],["C+",2.5],["C",2.25],["D",2],["F",0]];
  var MARKS=[[80,"A+"],[75,"A"],[70,"A-"],[65,"B+"],[60,"B"],[55,"B-"],[50,"C+"],[45,"C"],[40,"D"],[0,"F"]];
  var KEY="cgToolsState3";
  function letter(p){for(var i=0;i<MARKS.length;i++)if(p>=MARKS[i][0])return MARKS[i][1];return"F"}
  function gp(l){for(var i=0;i<GRADES.length;i++)if(GRADES[i][0]===l)return GRADES[i][1];return NaN}
  function minMark(l){for(var i=0;i<MARKS.length;i++)if(MARKS[i][1]===l)return MARKS[i][0];return 0}
  function num(v){var n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:NaN}
  function f2(n){return isFinite(n)?(Math.round(n*100)/100).toFixed(2):"--"}
  function f1(n){return isFinite(n)?String(Math.round(n*100)/100):"--"}
  function isBad(g,o){var a=num(g),b=num(o);return isFinite(a)&&b>0&&a>b}
  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}
  function $(id){return document.getElementById(id)}

  var def={
    cg:{dep:"",sem:0,prev:"",prevc:"",rows:[{n:"",c:"3",g:""},{n:"",c:"3",g:""},{n:"",c:"3",g:""}]},
    inc:{rows:[{n:"Mid",g:"",o:"20"},{n:"CT",g:"",o:"10"},{n:"Attendance",g:"",o:"10"},{n:"Assignment",g:"",o:"10"}],max:"50",fw:"50"},
    ct:{rows:[{g:"",o:""},{g:"",o:""},{g:"",o:""}],best:"",w:"10"},
    mid:{g:"",o:"",w:"20"}
  };
  var S;
  try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(!S||!S.cg||!S.inc||!S.ct||!S.mid)S=JSON.parse(JSON.stringify(def));
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

  /* ---------- generic row list ---------- */
  function gradeSelect(sel){
    var h='<option value=""'+(sel?"":" selected")+'>Grade</option>';
    GRADES.forEach(function(g){h+='<option value="'+g[0]+'"'+(sel===g[0]?" selected":"")+'>'+g[0]+' ('+g[1].toFixed(2)+')</option>'});
    return h;
  }
  var TPL={
    cg:function(r){
      var gsel='<select class="c-g" data-k="g" aria-label="Grade">'+gradeSelect(r.g)+'</select>';
      if(r.lock){
        var nm;
        if(r.slot!=null){
          var o=BUPC.slots(S.cg.dep,S.cg.sem)[r.slot]||{label:"Elective",options:[]};
          nm='<div class="c-n"><select data-k="n" aria-label="'+esc(o.label)+'"><option value="">'+esc(o.label)+' (choose)</option>'+o.options.map(function(c){return '<option value="'+esc(c.name)+'"'+(r.n===c.name?" selected":"")+'>'+esc(c.name)+'</option>'}).join("")+'</select>'+(r.n?'<div class="cn sub">'+esc(r.n)+'</div>':'')+'</div>';
        }else nm='<div class="c-n cn">'+esc(r.n)+'</div>';
        return nm+'<input class="c-c" data-k="c" value="'+esc(r.c)+'" readonly placeholder="Credit" aria-label="Credit">'+gsel;
      }
      return '<textarea class="c-n" data-k="n" rows="1" placeholder="Course name" aria-label="Course name">'+esc(r.n)+'</textarea><input class="c-c" data-k="c" inputmode="decimal" placeholder="Credit" value="'+esc(r.c)+'" aria-label="Credit">'+gsel},
    inc:function(r){return '<input data-k="n" placeholder="Part" value="'+esc(r.n)+'" aria-label="Part name"><input data-k="g" inputmode="decimal" placeholder="Got" value="'+esc(r.g)+'" aria-label="Marks got"><input data-k="o" inputmode="decimal" placeholder="Out of" value="'+esc(r.o)+'" aria-label="Full marks">'},
    ct:function(r,i){return '<span class="rn">'+(i+1)+'</span><input data-k="g" inputmode="decimal" placeholder="Got" value="'+esc(r.g)+'" aria-label="Marks got"><input data-k="o" inputmode="decimal" placeholder="Out of" value="'+esc(r.o)+'" aria-label="Full marks">'}
  };
  var BLANK={cg:function(){return{n:"",c:"3",g:""}},inc:function(){return{n:"",g:"",o:""}},ct:function(){return{g:"",o:""}}};
  var X='<svg class="ic" aria-hidden="true"><use href="#i-x"/></svg>';
  function autoH(t){t.style.height="auto";if(t.scrollHeight>0)t.style.height=t.scrollHeight+"px"}
  function autoAll(){Array.prototype.forEach.call(document.querySelectorAll("#cg-rows textarea"),autoH)}
  function render(kind){
    var rows=S[kind].rows,root=$(kind+"-rows");
    root.innerHTML="";
    rows.forEach(function(r,i){
      var el=document.createElement("div");el.className="row "+kind;
      el.innerHTML=TPL[kind](r,i)+'<button class="del" aria-label="Remove row">'+X+'</button>';
      function mark(){var gi=el.querySelector('[data-k="g"]');if(gi&&(kind==="inc"||kind==="ct"))gi.classList.toggle("cp-bad",isBad(r.g,r.o))}
      mark();
      Array.prototype.forEach.call(el.querySelectorAll("[data-k]"),function(inp){
        inp.addEventListener("input",function(){
          if((kind==="inc"||kind==="ct")&&inp.dataset.k==="g"&&isBad(inp.value,r.o)){
            inp.value=r.o; /* got can never be more than out of */
            inp.classList.add("cp-bad");setTimeout(function(){mark()},500);
          }
          r[inp.dataset.k]=inp.value;
          if(kind==="inc"||kind==="ct")mark();
          if(kind==="cg"&&r.lock&&r.slot!=null&&inp.dataset.k==="n"){
            var c=BUPC.find(inp.value);r.c=c?String(c.credit):"";
            var ci=el.querySelector('[data-k="c"]');if(ci)ci.value=r.c;
            update();render("cg");return;
          }
          if(inp.tagName==="TEXTAREA")autoH(inp);
          update();
        });
      });
      el.querySelector(".del").addEventListener("click",function(){
        rows.splice(i,1);if(!rows.length)rows.push(BLANK[kind]());render(kind);update();
      });
      Array.prototype.forEach.call(el.querySelectorAll("textarea"),function(t){t.addEventListener("keydown",function(e){if(e.key==="Enter")e.preventDefault()})});
      root.appendChild(el);
      Array.prototype.forEach.call(el.querySelectorAll("textarea"),autoH);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-add]"),function(b){
    b.addEventListener("click",function(){var k=b.dataset.add;S[k].rows.push(BLANK[k]());render(k);update()});
  });

  /* ---------- calculations ---------- */
  function calcCG(){
    var cr=0,pts=0;
    S.cg.rows.forEach(function(r){var c=num(r.c),g=gp(r.g);if(c>0&&isFinite(g)){cr+=c;pts+=c*g}});
    var sem=cr>0?pts/cr:NaN;
    var pc=num(S.cg.prevc),pg=num(S.cg.prev),tc=cr,tp=pts;
    if(pc>0&&isFinite(pg)){tc+=pc;tp+=pc*pg}
    $("cg-out").textContent=tc>0?f2(tp/tc):"--";
    $("cg-cr").textContent=f1(tc);
    $("cg-sem").textContent=f2(sem);
  }
  /* ---------- marksheet (Total CG tab) ---------- */
  var msOpen=false;
  function renderMs(){
    var box=$("ms"),btn=$("ms-btn");if(!box||!btn)return;
    btn.textContent=msOpen?"Hide marksheet":"Generate marksheet";
    btn.setAttribute("aria-expanded",msOpen?"true":"false");
    box.hidden=!msOpen;if(!msOpen)return;
    var list=[],cr=0,pts=0;
    S.cg.rows.forEach(function(r,i){
      var c=num(r.c),g=gp(r.g);
      if(c>0&&isFinite(g)){list.push({n:(r.n||"").trim()||"Course "+(i+1),c:c,l:r.g,p:g});cr+=c;pts+=c*g}
    });
    if(!list.length){box.innerHTML='<h3>Marksheet</h3><p class="hint" style="margin:0">অন্তত একটা course-এ credit আর grade দিন।</p>';return}
    var h='<h3>Marksheet</h3>'+(S.cg.sem?'<p class="ms-sub">Semester '+esc(S.cg.sem)+'</p>':'<p class="ms-sub">Course-wise result</p>')
      +'<div class="tbl-wrap"><table class="need ms-t"><thead><tr><th>Course</th><th>Credit</th><th>Grade</th><th>GP</th></tr></thead><tbody>';
    list.forEach(function(x){h+='<tr><td class="g">'+esc(x.n)+'</td><td>'+f1(x.c)+'</td><td>'+esc(x.l)+'</td><td>'+f2(x.p)+'</td></tr>'});
    h+='</tbody></table></div><div class="ms-sum"><div><span>This semester GPA</span><b>'+f2(pts/cr)+'</b></div><div><span>Credits this semester</span><b>'+f1(cr)+'</b></div>';
    var pc=num(S.cg.prevc),pg=num(S.cg.prev),tc=cr,tp=pts;
    if(pc>0&&isFinite(pg)){tc+=pc;tp+=pc*pg;h+='<div><span>Previous CGPA</span><b>'+f2(pg)+'</b></div><div><span>Previous credits</span><b>'+f1(pc)+'</b></div>'}
    h+='<div class="tot"><span>Overall CGPA</span><b>'+f2(tp/tc)+'</b></div><div><span>Total credits</span><b>'+f1(tc)+'</b></div></div>';
    box.innerHTML=h;
  }
  $("ms-btn").addEventListener("click",function(){
    msOpen=!msOpen;renderMs();
    if(msOpen)$("ms").scrollIntoView({behavior:"smooth",block:"nearest"});
  });
  /* ---------- A+ (CG 4.00) card: doodle cat, same doodle style as the home cards ---------- */
  var DROP_P='class="tear thin"';
  var CH={"4":["think",296,422,[[104.3,79.4,20.0,77.2],[210.1,159.8,19.2,67.2]]],"0":["cool",318,425,[[222.7,189.4,19.8,71.1]]],"1":["heart",308,427,[[109.4,92.4,20.7,81.8],[216.4,203.1,19.9,72.2]]],"2":["surprise",308,434,[[101.1,86.7,19.7,77.4],[214.7,180.0,19.9,73.3]]],"3":["cry",360,370,[]]};
  var eyes=[],eyeBox=null;
  function cat(k){
    var c=CH[k]||CH[4],w=c[1],h=c[2],p=c[3];
    eyes=p.map(function(e,i){return{x:e[0],y:e[1],r:e[2],er:e[3],rear:p.length>1&&i===0}});
    return '<div class="ap-char" style="aspect-ratio:'+w+'/'+h+'"><img src="./icons/ap-'+c[0]+'.png" alt="" draggable="false">'
      +p.map(function(e,i){return '<i class="pu" data-i="'+i+'" style="left:'+(e[0]/w*100)+'%;top:'+(e[1]/h*100)+'%;width:'+(e[2]*2/w*100)+'%;height:'+(e[2]*2/h*100)+'%"></i>'}).join('')+'</div>';
  }
  var ptr=null,ptrT=0,eyeRaf=0,scT=0,scV=0,scY=window.pageYOffset||0,wd={x:0,y:0},fo=null,foT=0;
  function still(){return window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches}
  function lookAt(){
    eyeRaf=0;
    var box=document.querySelector("#ap-art .ap-char");if(!box)return;
    var r=box.getBoundingClientRect(),c=CH[apState]||CH[4],sc=r.width/c[1],now=Date.now();
    var vis=!document.hidden&&r.bottom>0&&r.top<(window.innerHeight||0);
    var dx=0,dy=0,more=false;
    if(vis&&!still()){
      if(fo&&document.contains(fo)){
        var q=fo.getBoundingClientRect(),ex=r.left+r.width*.35,ey=r.top+r.height*.3,ux=q.left+q.width/2-ex,uy=q.top+q.height/2-ey,ud=Math.sqrt(ux*ux+uy*uy)||1,uf=Math.min(1,ud/90);
        dx=ux/ud*uf;dy=uy/ud*uf;
        dx=Math.max(-1,Math.min(1,dx));dy=Math.max(-1,Math.min(1,dy));more=true}
      else if(now-scT<450){dy=Math.max(-1,Math.min(1,scV/16))*Math.min(1,(450-(now-scT))/250+.2);dx=Math.sin(now/90)*.18*Math.abs(dy);more=true}
      else if(ptr&&now-ptrT<2500){
        var cx=r.left+r.width*.35,cy=r.top+r.height*.3,vx=ptr.x-cx,vy=ptr.y-cy,d=Math.sqrt(vx*vx+vy*vy)||1,f=Math.min(1,d/120);
        dx=vx/d*f;dy=vy/d*f;more=true}
      else{dx=wd.x;dy=wd.y}
    }
    box.querySelectorAll(".pu").forEach(function(el,i){
      var e=eyes[i];if(!e)return;
      var tr=Math.max(0,e.er-e.r-9)*sc,mx=dx*tr,my=dy*tr;
      if(e.rear){if(mx>0)mx*=.3;if(my>0)my*=.55}
      el.style.transform="translate(-50%,-50%) translate("+mx.toFixed(1)+"px,"+my.toFixed(1)+"px)";
    });
    if(more)eyeRaf=requestAnimationFrame(lookAt);
  }
  function kick(){if(!eyeRaf)eyeRaf=requestAnimationFrame(lookAt)}
  function nudge(e){
    var t=e.touches&&e.touches[0]?e.touches[0]:e;ptr={x:t.clientX,y:t.clientY};ptrT=Date.now();kick();
  }
  ["pointermove","pointerdown","touchmove","touchstart"].forEach(function(n){document.addEventListener(n,nudge,{passive:true})});
  function isInc(t){return t&&t.tagName==="INPUT"&&t.closest&&t.closest("#p-inc")}
  document.addEventListener("focusin",function(e){if(isInc(e.target)){fo=e.target;foT=Date.now();kick()}});
  document.addEventListener("focusout",function(){
    setTimeout(function(){if(!isInc(document.activeElement)){fo=null;ptrT=0;kick()}},1000);
  });
  document.addEventListener("input",function(e){if(fo&&e.target===fo)kick()});
  window.addEventListener("scroll",function(){
    var y=window.pageYOffset||0,d=y-scY;scY=y;if(!d)return;
    scV=scV*.5+d*.5;scT=Date.now();kick();
  },{passive:true});
  setInterval(function(){
    if(still()||document.hidden||fo||Date.now()-ptrT<2500||Date.now()-scT<450)return;
    if(Math.random()<.35){wd={x:0,y:0}}else{wd={x:(Math.random()*1.4-.7),y:(Math.random()*1.0-.5)}}
    kick();
  },1700);
  setInterval(function(){
    if(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches)return;
    var ps=document.querySelectorAll("#ap-art .pu");ps.forEach(function(p){p.classList.add("bl")});
    setTimeout(function(){ps.forEach(function(p){p.classList.remove("bl")})},140);
  },3800);
  var apState=-1;
  function renderAp(req){
    var box=$("ap");if(!box)return;
    var rr=0,k,t,sub;
    if(req==null||!isFinite(req)){k=4;t="marks দিন, দেখি CG 4.00 হয় কিনা";sub="Incourse marks লিখলেই বলে দেব"}
    else{
    rr=req>0?Math.ceil(Math.round(req*1e6)/1e4)/100:0;
    if(req>100){k=3;t="CG 4.00 আর সম্ভব না…";sub="Final-এ ১০০-র বেশি লাগত"}
    else if(rr>=90){k=2;t="Possible আবার Impossible, দুটোই!";sub="Final-এ লাগবে "+f1(rr)+" / 100"}
    else if(rr>=80){k=1;t="একটু কষ্ট করলে হবে!";sub="Final-এ লাগবে "+f1(rr)+" / 100"}
    else if(req<=0){k=0;t="CG 4.00 তো পাকা!";sub="Secured"}
    else{k=0;t="Easily CG 4.00 সম্ভব";sub="Final-এ লাগবে "+f1(rr)+" / 100"}
    }
    if(k!==apState){apState=k;$("ap-art").innerHTML=cat(k);box.dataset.k=k;lookAt()}
    $("ap-t").textContent=t;$("ap-s").textContent=sub;box.hidden=false;
  }
  function calcInc(){
    var g=0,o=0;
    S.inc.rows.forEach(function(r){var a=num(r.g),b=num(r.o);if(isFinite(a)&&b>0&&a<=b){g+=a;o+=b}});
    var mx=num(S.inc.max),fw=num(S.inc.fw);
    $("inc-out").textContent=o>0?f1(g)+" / "+f1(mx>0?mx:o):"--";
    $("inc-pct").textContent=(mx>0&&o>0)?f1(g/mx*100)+"%":"--";
    var hint=$("inc-hint"),body=$("need-body");body.innerHTML="";
    if(!(mx>0&&fw>0)){hint.textContent="Set incourse full marks and final weight above.";renderAp(null);return}
    var warn=(o>0&&Math.abs(o-mx)>0.001)?" Note: your parts add up to "+f1(o)+", not "+f1(mx)+".":"";
    hint.textContent="You have "+f1(g)+" / "+f1(mx)+" in incourse. Final /100 is converted to "+f1(fw)+"."+warn;
    var total=mx+fw;
    renderAp(o>0&&g>0?(minMark("A+")/100*total-g)*100/fw:null);
    GRADES.slice(0,9).forEach(function(gr){
      var t=minMark(gr[0])/100*total,req=(t-g)*100/fw,tr=document.createElement("tr"),cell;
      if(req<=0){cell='<span class="v ok">Secured</span>';tr.className="sure"}
      else if(req>100)cell='<span class="v no">Not possible</span>';
      else cell='<span class="v">'+f1(Math.ceil(Math.round(req*1e6)/1e4)/100)+' / 100</span>';
      tr.innerHTML='<td class="g">'+gr[0]+' <small style="color:var(--muted);font-weight:400">'+gr[1].toFixed(2)+'</small></td><td>'+f1(t)+' / '+f1(total)+'</td><td>'+cell+'</td>';
      body.appendChild(tr);
    });
  }
  function calcCT(){
    var p=[];
    S.ct.rows.forEach(function(r){var a=num(r.g),b=num(r.o);if(isFinite(a)&&b>0&&a<=b)p.push(a/b*100)});
    p.sort(function(a,b){return b-a});
    var n=parseInt(S.ct.best,10);if(!(n>0))n=p.length;
    // Divide by the number the user set (missing CTs count as 0); with no setting, use all entered CTs.
    var sum=p.slice(0,n).reduce(function(a,b){return a+b},0),avg=n>0?sum/n:NaN;
    $("ct-out").textContent=isFinite(avg)?f1(avg)+"%":"--";
    $("ct-cnt").textContent=n>0?"best "+n+(p.length<n?" ("+p.length+" entered)":""):"0";
    var w=num(S.ct.w);
    $("ct-sc").textContent=isFinite(avg)&&w>0?f2(avg/100*w)+" / "+f1(w):"--";
  }
  function calcMid(){
    var g=num(S.mid.g),o=num(S.mid.o),w=num(S.mid.w);
    var ok=isFinite(g)&&o>0&&g<=o;
    var mg=$("mid-g");if(mg)mg.classList.toggle("cp-bad",isBad(S.mid.g,S.mid.o));
    $("mid-out").textContent=ok?f1(g/o*100)+"%":"--";
    $("mid-l").textContent=ok?letter(g/o*100):"--";
    $("mid-sc").textContent=ok&&w>0?f2(g/o*w)+" / "+f1(w):"--";
  }
  function update(){save();calcCG();calcInc();calcCT();calcMid();renderMs()}

  /* ---------- static inputs ---------- */
  function bind(id,obj,key,lim){var el=$(id);el.value=obj[key]||"";el.addEventListener("input",function(){
    if(lim&&isBad(el.value,obj.o))el.value=obj.o; /* got can never be more than out of */
    obj[key]=el.value;update()})}
  bind("cg-prev",S.cg,"prev");bind("cg-prevc",S.cg,"prevc");
  bind("inc-max",S.inc,"max");bind("inc-fw",S.inc,"fw");
  bind("ct-best",S.ct,"best");bind("ct-w",S.ct,"w");
  bind("mid-g",S.mid,"g",true);bind("mid-o",S.mid,"o");bind("mid-w",S.mid,"w");
  var sc=$("scale");
  GRADES.forEach(function(g){var s=document.createElement("span");s.innerHTML="<b>"+g[0]+"</b>"+g[1].toFixed(2)+"<br>"+(g[0]==="F"?"&lt;40":minMark(g[0])+"+");sc.appendChild(s)});

  /* ---------- department + semester picker (Total CG tab) ---------- */
  function hasGrades(){return S.cg.rows.some(function(r){return r.g})}
  function applyMode(){
    var add=document.querySelector('[data-add="cg"]');
    if(add)add.style.display=S.cg.sem?"none":"";
    var h=$("cg-hint");if(h)h.textContent=S.cg.sem?"Course names and credits are fixed for this semester. Choose your grades.":"Course name, credit and grade.";
  }
  function loadSem(){
    var d=S.cg.dep,n=S.cg.sem,rows=[];
    if(n){
      BUPC.courses(d,n).forEach(function(c){rows.push({n:c.name,c:String(c.credit),g:"",lock:1})});
      BUPC.slots(d,n).forEach(function(sl,i){rows.push({slot:i,n:"",c:"",g:"",lock:1})});
    }
    if(!rows.length)rows=JSON.parse(JSON.stringify(def.cg.rows));
    S.cg.rows=rows;render("cg");applyMode();update();
  }
  var depSel=$("cg-dep"),semSel=$("cg-semsel");
  var picked=BUPC.mount(depSel,semSel,function(d,n){
    function go(){S.cg.dep=d;S.cg.sem=n;loadSem()}
    if((d!==S.cg.dep||n!==S.cg.sem)&&hasGrades()){
      askConfirm({title:"Change semester?",text:"The grades you chose will be cleared.",okText:"Change"},go,function(){
        depSel.value=S.cg.dep;semSel.value=String(S.cg.sem||0);BUPC.save(S.cg.dep,S.cg.sem);
      });
      return;
    }
    go();
  });
  var firstRun=!S.cg.sem&&picked.sem>0&&!hasGrades();
  if(S.cg.sem){depSel.value=S.cg.dep;semSel.value=String(S.cg.sem)}
  else if(firstRun){S.cg.dep=picked.dep;S.cg.sem=picked.sem}

  /* ---------- pills ---------- */
  var tabs=Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  function show(name){
    if(!document.getElementById("p-"+name))name="cg";
    tabs.forEach(function(t){t.setAttribute("aria-selected",String(t.dataset.tab===name))});
    ["cg","inc","ct","mid"].forEach(function(k){$("p-"+k).classList.toggle("active",k===name)});
    var rs=$("p-"+name).querySelector(".result"),nv=document.querySelector("nav.pills");
    if(rs&&nv&&rs.nextElementSibling!==nv)rs.parentNode.insertBefore(nv,rs.nextSibling);
    if(location.hash!=="#"+name)history.replaceState(null,"","#"+name);
    autoAll();
  }
  tabs.forEach(function(t,i){
    t.addEventListener("click",function(){show(t.dataset.tab)});
    t.addEventListener("keydown",function(e){
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"){var n=tabs[(i+(e.key==="ArrowRight"?1:tabs.length-1))%tabs.length];n.focus();show(n.dataset.tab)}
    });
  });
  var hl=$("homeLink");if(window.SITE&&SITE.homeUrl)hl.href=SITE.homeUrl;
  if(firstRun)loadSem();
  ["cg","inc","ct"].forEach(render);
  applyMode();
  show((location.hash||"#cg").slice(1));
  update();
})();
