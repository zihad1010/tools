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
  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}
  function $(id){return document.getElementById(id)}

  var def={
    cg:{prev:"",prevc:"",rows:[{n:"",c:"3",g:""},{n:"",c:"3",g:""},{n:"",c:"3",g:""}]},
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
    cg:function(r){return '<input data-k="n" placeholder="Course" value="'+esc(r.n)+'" aria-label="Course name"><input data-k="c" inputmode="decimal" placeholder="Credit" value="'+esc(r.c)+'" aria-label="Credit"><select data-k="g" aria-label="Grade">'+gradeSelect(r.g)+'</select>'},
    inc:function(r){return '<input data-k="n" placeholder="Part" value="'+esc(r.n)+'" aria-label="Part name"><input data-k="g" inputmode="decimal" placeholder="Got" value="'+esc(r.g)+'" aria-label="Marks got"><input data-k="o" inputmode="decimal" placeholder="Out of" value="'+esc(r.o)+'" aria-label="Full marks">'},
    ct:function(r,i){return '<span class="rn">'+(i+1)+'</span><input data-k="g" inputmode="decimal" placeholder="Got" value="'+esc(r.g)+'" aria-label="Marks got"><input data-k="o" inputmode="decimal" placeholder="Out of" value="'+esc(r.o)+'" aria-label="Full marks">'}
  };
  var BLANK={cg:function(){return{n:"",c:"3",g:""}},inc:function(){return{n:"",g:"",o:""}},ct:function(){return{g:"",o:""}}};
  var X='<svg class="ic" aria-hidden="true"><use href="#i-x"/></svg>';
  function render(kind){
    var rows=S[kind].rows,root=$(kind+"-rows");
    root.innerHTML="";
    rows.forEach(function(r,i){
      var el=document.createElement("div");el.className="row "+kind;
      el.innerHTML=TPL[kind](r,i)+'<button class="del" aria-label="Remove row">'+X+'</button>';
      Array.prototype.forEach.call(el.querySelectorAll("[data-k]"),function(inp){
        inp.addEventListener("input",function(){r[inp.dataset.k]=inp.value;update()});
      });
      el.querySelector(".del").addEventListener("click",function(){
        rows.splice(i,1);if(!rows.length)rows.push(BLANK[kind]());render(kind);update();
      });
      root.appendChild(el);
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
  /* ---------- A+ (CG 4.00) card: doodle cat, same doodle style as the home cards ---------- */
  var DROP_P='class="tear thin"';
  function cat(k){
    var mouth,extra="",wine=k<3,sp="";
    if(k===0){
      mouth='<path class="thin" d="M85 78q6 5 12 0"/>';
      sp='<path d="M150 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path class="sp" d="M20 104l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path class="sp s2" d="M140 100l2.500 6 6 2.500-6 2.500-2.500 6-2.500-6-6-2.500 6-2.500z"/><path class="thin" d="M126 124c7-9 14 9 21 0"/>';
    }else if(k===1){
      mouth='<path class="thin" d="M86 80h11"/>';
      extra='<path '+DROP_P+' d="M128 34q7 10 0 15q-7-5 0-15z"/>';
      sp='<path d="M150 74l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path class="sp s3" d="M16 108l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path class="thin" d="M126 124c7-9 14 9 21 0"/>';
    }else if(k===2){
      mouth='<rect class="fill thin" x="83" y="77" width="17" height="9" rx="3"/><path class="thin" d="M88.500 77v9M94.500 77v9"/>';
      extra='<path '+DROP_P+' d="M128 38q7 10 0 15q-7-5 0-15z"/><path '+DROP_P+' d="M58 38q6 9 0 13q-6-4 0-13z"/><path class="thin" d="M122 18l6-7M132 26l9-3M112 10l1-9"/>';
      sp='<path class="sp s2" d="M16 108l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path class="thin" d="M126 124c7-9 14 9 21 0"/>';
    }else if(k===4){
      mouth='<path class="thin" d="M85 79q6 3 12 0"/>';
      sp='<path d="M152 24l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path class="sp s2" d="M156 80l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path class="sp s3" d="M12 96l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path class="sp s2" d="M140 114l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path class="sp s3" d="M8 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path class="thin" d="M126 124c7-9 14 9 21 0"/>';
    }else{
      mouth='<path d="M84 86q7-10 14 0q-7-3-14 0z" style="fill:var(--ink)"/>';
      extra='<path class="thin" stroke="#3fa9f5" style="stroke-width:4" d="M74 72q-4 10 0 22M110 72q4 10 0 22"/>';
      sp='<path class="thin" d="M128 30l-4 8M138 36l-4 8M148 30l-4 8"/><path class="thin" d="M126 124c7 9 14-9 21 0"/>';
    }
    var glass=
      '<g class="'+(k===2?"shake":"")+'">'
      +'<path class="fill" d="M24 20h24c0 16-4 27-12 29-8-2-12-13-12-29z"/>'
      +(wine?'<path d="M25.500 30h21c-1 10-4 16-10.500 18-6.500-2-9.500-8-10.500-18z" fill="#c2415f" stroke="none"/>':k===4?'<path d="M25.500 30h21c-1 10-4 16-10.500 18-6.500-2-9.500-8-10.500-18z" fill="#8f98e3" stroke="none"/>':'')
      +'<path d="M36 49v18M27 68h18"/>'
      +'<circle class="fill" cx="36" cy="62" r="7.500"/></g>';
    return '<svg viewBox="0 0 170 140" class="doodle" aria-hidden="true">'
      +'<g class="bob">'
      +'<path class="fill" d="M64 128c-12-16-8-38 8-46h42c16 8 22 30 14 46z"/>'
      +'<path fill="none" stroke="var(--ink)" stroke-width="14" d="M72 100Q50 98 38 66"/><path fill="none" style="stroke:var(--f1)" stroke-width="8" d="M72 100Q50 98 38 66"/>'
      +'<path class="fill" d="M62 52L58 24l24 14z"/><path class="fill" d="M102 38l24-14-2 30z"/>'
      +'<path class="fill2 thin" d="M63 44l-2-12 11 6z"/><path class="fill2 thin" d="M108 39l11-7-1 12z"/>'
      +'<ellipse class="fill" cx="92" cy="64" rx="36" ry="29"/>'
      +'<rect x="67" y="56" width="22" height="15" rx="6" style="fill:var(--ink)"/><rect x="95" y="56" width="22" height="15" rx="6" style="fill:var(--ink)"/>'
      +'<path class="thin" d="M89 60h6M117 59l13-3"/>'
      +'<path d="M72 61l4-3M100 61l4-3" stroke="#fff" stroke-width="2" opacity=".55"/>'
      +'<circle cx="91" cy="75" r="1.800" style="fill:var(--ink);stroke:none"/>'
      +mouth
      +'<ellipse class="fill" cx="98" cy="124" rx="12" ry="7"/><path class="thin" d="M94 120v4M99 120v4"/>'
      +glass
      +extra
      +'</g>'+sp+'</svg>';
  }
  var apState=-1;
  function renderAp(req){
    var box=$("ap");if(!box)return;
    var rr=0,k,t,sub;
    if(req==null||!isFinite(req)){k=4;t="ভাই, marks দিন, দেখি CG 4.00 হয় কিনা";sub="Incourse marks লিখলেই বলে দেব"}
    else{
    rr=req>0?Math.ceil(Math.round(req*1e6)/1e4)/100:0;
    if(req>100){k=3;t="ভাই, CG 4.00 আর সম্ভব না…";sub="Final-এ ১০০-র বেশি লাগত"}
    else if(rr>=90){k=2;t="ভাই, প্রায় perfect লাগবে!";sub="Final-এ লাগবে "+f1(rr)+" / 100"}
    else if(rr>=80){k=1;t="ভাই, একটু কষ্ট করলে হবে!";sub="Final-এ লাগবে "+f1(rr)+" / 100"}
    else if(req<=0){k=0;t="ভাই, CG 4.00 তো পাকা!";sub="Secured"}
    else{k=0;t="ভাই, Easily CG 4.00 সম্ভব";sub="Final-এ লাগবে "+f1(rr)+" / 100"}
    }
    if(k!==apState){$("ap-art").innerHTML=cat(k);box.dataset.k=k;apState=k}
    $("ap-t").textContent=t;$("ap-s").textContent=sub;box.hidden=false;
  }
  function calcInc(){
    var g=0,o=0;
    S.inc.rows.forEach(function(r){var a=num(r.g),b=num(r.o);if(isFinite(a)&&b>0){g+=a;o+=b}});
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
    S.ct.rows.forEach(function(r){var a=num(r.g),b=num(r.o);if(isFinite(a)&&b>0)p.push(a/b*100)});
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
    var ok=isFinite(g)&&o>0;
    $("mid-out").textContent=ok?f1(g/o*100)+"%":"--";
    $("mid-l").textContent=ok?letter(g/o*100):"--";
    $("mid-sc").textContent=ok&&w>0?f2(g/o*w)+" / "+f1(w):"--";
  }
  function update(){save();calcCG();calcInc();calcCT();calcMid()}

  /* ---------- static inputs ---------- */
  function bind(id,obj,key){var el=$(id);el.value=obj[key]||"";el.addEventListener("input",function(){obj[key]=el.value;update()})}
  bind("cg-prev",S.cg,"prev");bind("cg-prevc",S.cg,"prevc");
  bind("inc-max",S.inc,"max");bind("inc-fw",S.inc,"fw");
  bind("ct-best",S.ct,"best");bind("ct-w",S.ct,"w");
  bind("mid-g",S.mid,"g");bind("mid-o",S.mid,"o");bind("mid-w",S.mid,"w");
  var sc=$("scale");
  GRADES.forEach(function(g){var s=document.createElement("span");s.innerHTML="<b>"+g[0]+"</b>"+g[1].toFixed(2)+"<br>"+(g[0]==="F"?"&lt;40":minMark(g[0])+"+");sc.appendChild(s)});

  /* ---------- pills ---------- */
  var tabs=Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  function show(name){
    if(!document.getElementById("p-"+name))name="cg";
    tabs.forEach(function(t){t.setAttribute("aria-selected",String(t.dataset.tab===name))});
    ["cg","inc","ct","mid"].forEach(function(k){$("p-"+k).classList.toggle("active",k===name)});
    if(location.hash!=="#"+name)history.replaceState(null,"","#"+name);
  }
  tabs.forEach(function(t,i){
    t.addEventListener("click",function(){show(t.dataset.tab)});
    t.addEventListener("keydown",function(e){
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"){var n=tabs[(i+(e.key==="ArrowRight"?1:tabs.length-1))%tabs.length];n.focus();show(n.dataset.tab)}
    });
  });
  var hl=$("homeLink");if(window.SITE&&SITE.homeUrl)hl.href=SITE.homeUrl;
  ["cg","inc","ct"].forEach(render);
  show((location.hash||"#cg").slice(1));
  update();
})();
