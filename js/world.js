// Overworld engine (SNES-style): 16px tiles shown at 2x, scrolling camera, procedural pixel sprites.
const TS=16,DIRS=[[0,1],[-1,0],[1,0],[0,-1]],K="#3a3355",NEED={animals:0,food:4,nature:8},MP={w:32,h:28,cx:16,cy:13.5,rx:14.8,ry:12.6};
const BLD=[{n:"Home",x:13,y:3,c:"#e8496c",go:"home"},{n:"Shop",x:4,y:8,c:"#4fb0e8",go:"shop"},{n:"Museum",x:22,y:8,c:"#9a7bd8",go:"museum"},{n:"Tea House",x:22,y:16,c:"#3fae6e",go:"tea"}];
const NPC0=[{n:"Pip",k:"cat",th:"animals",x:15,y:16},{n:"Momo",k:"bear",th:"food",x:9,y:14},{n:"Finn",k:"frog",th:"nature",x:20,y:21},{n:"Bun",k:"rabbit",x:8,y:5},{n:"Pinky",k:"pig",x:25,y:5},{n:"Bao",k:"panda",x:11,y:19},{n:"Dumpling",k:"duck",x:18,y:23},{n:"Lucky",k:"dog",x:26,y:14}];
const hs=(x,y)=>(Math.imul(x*31+y*17+7,2654435761)>>>0)%97,mx=(h,t,f)=>"#"+[1,3,5].map(i=>Math.round(parseInt(h.substr(i,2),16)*(1-f)+t*f).toString(16).padStart(2,"0")).join("");
let FC=null;const r=(g,x,y,w,h,c)=>{g.fillStyle=FC||c;g.fillRect(x,y,w,h)};
function outline(g,fn){for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){g.save();g.translate(dx,dy);FC=K;fn();FC=null;g.restore()}fn()}
const T=Array.from({length:MP.h},(_,y)=>Array.from({length:MP.w},(_,x)=>{const a=(x-MP.cx)/MP.rx,b=(y-MP.cy)/MP.ry,d=a*a+b*b;return d>1?"~":d>.8?"s":"g"}));
[[14,6,14,20],[5,11,23,11],[23,11,23,19],[12,13,16,15]].forEach(([a,b,c,d])=>{for(let y=b;y<=d;y++)for(let x=a;x<=c;x++)if(T[y][x]!=="~")T[y][x]="p"});
for(let y=22;y<=24;y++)for(let x=19;x<=24;x++)T[y][x]="~";
const fp=(x,y)=>BLD.some(b=>x>=b.x&&x<b.x+4&&y>=b.y&&y<b.y+3),zone=(x,y)=>BLD.some(b=>x>=b.x-1&&x<=b.x+4&&y>=b.y-1&&y<=b.y+4);
const nearP=(x,y)=>{for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(T[y+j]&&T[y+j][x+i]==="p")return 1;return 0};
const TREES=[];for(let y=1;y<MP.h-1;y++)for(let x=1;x<MP.w-1;x++)if(T[y][x]==="g"&&hs(x,y)%9===0&&!nearP(x,y)&&!zone(x,y)&&!NPC0.some(n=>Math.abs(n.x-x)<3&&Math.abs(n.y-y)<3)&&!(x>=18&&x<=25&&y>=21&&y<=25))TREES.push([x,y]);
const TSET=new Set(TREES.map(t=>t.join()));
const mk=o=>Object.assign({tx:o.x,ty:o.y,p:0,mv:0,f:0,tm:1+Math.random()*2},o),PL=mk({x:14,y:14}),NP=NPC0.map(o=>mk(Object.assign({hx:o.x,hy:o.y},o)));
let WR=0,WD=0,WL=0,WDIR=[0,0],WPATH=[],WWANT=null,WPET,Dlg=false,SC,X,ST,TRI,CX=0,CY=0,VW=11,VH=14;const BI={};
const occ=(x,y,me)=>[PL,...NP].some(o=>o!==me&&((o.x===x&&o.y===y)||(o.mv&&o.tx===x&&o.ty===y)));
const pass=(x,y,me)=>x>=0&&y>=0&&x<MP.w&&y<MP.h&&T[y][x]!=="~"&&!TSET.has(x+","+y)&&!fp(x,y)&&!occ(x,y,me);
function step(m,dx,dy){m.f=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);if(!pass(m.x+dx,m.y+dy,m))return 0;m.tx=m.x+dx;m.ty=m.y+dy;m.p=0;m.mv=1;return 1}
const adv=(m,dt,sp)=>{if(!m.mv)return 0;m.p+=dt*sp;if(m.p>=1){m.x=m.tx;m.y=m.ty;m.p=0;m.mv=0;return 1}return 0};
const ex=m=>m.x+(m.tx-m.x)*(m.mv?m.p:0),ey=m=>m.y+(m.ty-m.y)*(m.mv?m.p:0);
function route(tx,ty){const g=pass(tx,ty,PL)?[[tx,ty]]:DIRS.map(d=>[tx+d[0],ty+d[1]]).filter(p=>pass(p[0],p[1],PL));if(!g.length)return null;const sx=PL.mv?PL.tx:PL.x,sy=PL.mv?PL.ty:PL.y,q=[[sx,sy]],pr={[sx+","+sy]:null};
while(q.length){const[x,y]=q.shift();if(g.some(p=>p[0]===x&&p[1]===y)){const o=[];let k=x+","+y;while(pr[k]){o.unshift(pr[k][1]);k=pr[k][0]}return o}
for(const d of DIRS){const nx=x+d[0],ny=y+d[1],k=nx+","+ny;if(!(k in pr)&&pass(nx,ny,PL)){pr[k]=[x+","+y,d];q.push([nx,ny])}}}return null}
function tapAt(e){if(Dlg)return;const rc=SC.getBoundingClientRect(),tx=Math.floor((CX+(e.clientX-rc.left)/rc.width*VW*TS)/TS),ty=Math.floor((CY+(e.clientY-rc.top)/rc.height*VH*TS)/TS);
const b=BLD.find(b=>tx>=b.x&&tx<b.x+4&&ty>=b.y&&ty<b.y+3),n=NP.find(o=>(o.x===tx&&o.y===ty)||(o.mv&&o.tx===tx&&o.ty===ty));
WWANT=n||null;const p=route(b?b.x+1:tx,b?b.y+3:ty);if(p){WPATH=p;WDIR=[0,0]}else toast("Can’t walk there!")}
function arrive(){const b=BLD.find(b=>PL.x===b.x+1&&PL.y===b.y+3);if(b){PL.x=PL.tx=b.x+1;PL.y=PL.ty=b.y+4;WPATH=[];WWANT=null;go(b.go)}}
function face(a,b){a.f=DIRS.findIndex(d=>d[0]===b.x-a.x&&d[1]===b.y-a.y)}
function talk(n){Dlg=true;WDIR=[0,0];WPATH=[];face(n,PL);const L=DLG[n.n],ln=L[(n.li=n.li||0)%L.length].split("|"),need=n.th?NEED[n.th]:0,lk=n.th&&learned()<need;n.li++;
const t=ln[0]+(ln[1]?`<br><b class="zh">${ln[1]}</b> <small>${ln[2]||""}</small>`:"")+(lk?`<br>🔒 Learn ${need} words to unlock my quest!`:"");if(ln[1])speak(ln[1]);
const b=`<button class="btn g" onclick="talkAgain('${n.n}')">Chat</button>`+(n.th?(lk?`<button class="btn" disabled>🔒</button>`:`<button class="btn" onclick="WGO('${n.th}')">Quest!</button>`):"")+`<button class="btn g" onclick="WCL()">Bye</button>`;
const d=$("#dlg");d.innerHTML=`<div class="bub"><em><canvas data-npc="${n.k}" width="20" height="26"></canvas><small>${n.n}</small></em><div>${t}</div></div><div class="dr">${b}</div>`;d.querySelectorAll("canvas[data-npc]").forEach(c=>animal(c.getContext("2d"),2,5,c.dataset.npc,0,0));d.style.display="block"}
function talkAgain(nm){talk(NP.find(n=>n.n===nm))}
function WCL(){Dlg=false;$("#dlg").style.display="none"}
function WGO(th){Dlg=false;begin(th)}
function action(){if(Dlg||PL.mv)return;const f=DIRS[PL.f],n=NP.find(o=>o.x===PL.x+f[0]&&o.y===PL.y+f[1])||NP.find(o=>Math.abs(o.x-PL.x)+Math.abs(o.y-PL.y)===1);if(n){face(PL,n);talk(n)}else toast("Walk up to a villager and tap A!")}
function tick(ts){if(!WR)return;const dt=Math.min(.05,(ts-WL)/1000||0);WL=ts;WD=ts;
if(!Dlg){if(!PL.mv){const d=(WDIR[0]||WDIR[1])?WDIR:WPATH.shift();if(d){const px=PL.x,py=PL.y;if(step(PL,d[0],d[1])){WPET.tx=px;WPET.ty=py}else WPATH=[]}}
if(adv(PL,dt,5.5)){arrive();if(!WR)return}
if(!PL.mv&&WWANT&&!WPATH.length){const n=WWANT;WWANT=null;if(Math.abs(n.x-PL.x)+Math.abs(n.y-PL.y)===1){face(PL,n);talk(n)}}}
NP.forEach(n=>{if(!Dlg&&!n.mv){n.tm-=dt;if(n.tm<=0){n.tm=1+Math.random()*2.5;const d=rnd(DIRS),nx=n.x+d[0],ny=n.y+d[1];if(Math.abs(nx-n.hx)<=3&&Math.abs(ny-n.hy)<=3)step(n,d[0],d[1])}}adv(n,dt,2.2)});
const q=WPET,dx=q.tx-q.x,dy=q.ty-q.y,dd=Math.hypot(dx,dy);if(dd>.05){const s=Math.min(dd,5*dt);q.x+=dx/dd*s;q.y+=dy/dd*s}
CX=Math.max(0,Math.min(MP.w*TS-VW*TS,Math.round(ex(PL)*TS+8-VW*TS/2)));CY=Math.max(0,Math.min(MP.h*TS-VH*TS,Math.round(ey(PL)*TS+8-VH*TS/2)));
draw();WR=requestAnimationFrame(tick)}
function drawChar(g,ox,oy,f,fr,eq){const h=I(eq.hair||"hair0"),tp=I(eq.top||"top0"),sk="#ffd9b8",s=tp.s,lt=s==="qipao"?20:19,lf=fr===1,rt=fr===2,hat=eq.hat?I(eq.hat).k:"",gl=eq.glass?I(eq.glass).k:"",bw=eq.bow?I(eq.bow).k:"";
outline(g,()=>{
if(h.k==="long")r(g,ox+2,oy+4,12,14,h.c);else r(g,ox+3,oy+1,10,9,h.c);
if(h.k==="pig"){r(g,ox,oy+7,3,6,h.c);r(g,ox+13,oy+7,3,6,h.c)}if(h.k==="buns"){r(g,ox+1,oy-1,4,4,h.c);r(g,ox+11,oy-1,4,4,h.c)}
r(g,ox+5,oy+lt,2,21-lt,sk);r(g,ox+9,oy+lt,2,21-lt,sk);r(g,ox+4,oy+(lf?20:21),3,1,"#6b3d3d");r(g,ox+9,oy+(rt?20:21),3,1,"#6b3d3d");
if(s==="qipao")r(g,ox+4,oy+10,8,10,tp.c);else if(s==="dress"){r(g,ox+4,oy+10,8,4,tp.c);r(g,ox+3,oy+14,10,5,tp.c)}else{r(g,ox+4,oy+10,8,6,tp.c);r(g,ox+4,oy+16,8,3,tp.c2)}
r(g,ox+2,oy+11+(lf?1:0),2,4,sk);r(g,ox+12,oy+11+(rt?1:0),2,4,sk);r(g,ox+3,oy+3,10,6,sk);r(g,ox+4,oy+2,8,8,sk);
if(f===3)r(g,ox+3,oy+1,10,9,h.c);else{r(g,ox+3,oy+1,10,4,h.c);r(g,ox+3,oy+5,1,3,h.c);r(g,ox+12,oy+5,1,3,h.c)}
if(hat==="sun"){r(g,ox,oy+2,16,2,"#f2d27a");r(g,ox+4,oy-1,8,4,"#f2d27a");r(g,ox+4,oy+2,8,1,"#e8496c")}
if(hat==="crown"){r(g,ox+4,oy,8,3,"#ffd23f");[4,7,10].forEach(x=>r(g,ox+x,oy-2,2,2,"#ffd23f"))}
if(hat==="cap"){r(g,ox+3,oy,10,4,"#e84a4a");if(f!==3)r(g,ox+3,oy+4,10,1,"#b83030")}
if(hat==="panda"){r(g,ox+2,oy-2,4,4,K);r(g,ox+10,oy-2,4,4,K)}
if(bw==="ribbon"){r(g,ox+9,oy,2,3,"#ff6f9a");r(g,ox+12,oy,2,3,"#ff6f9a");r(g,ox+11,oy+1,1,1,"#e8496c")}
if(bw==="flower"){r(g,ox+10,oy,3,3,"#ff9fce");r(g,ox+11,oy+1,1,1,"#ffd23f")}});
r(g,ox+2,oy+11,2,2,tp.c);r(g,ox+12,oy+11,2,2,tp.c);
if(s==="qipao"){r(g,ox+4,oy+19,8,1,tp.c2);r(g,ox+6,oy+10,4,1,tp.c2);r(g,ox+7,oy+11,2,1,tp.c2);r(g,ox+6,oy+13,1,1,tp.c2);r(g,ox+9,oy+16,1,1,tp.c2)}
if(s==="dress")r(g,ox+3,oy+18,10,1,tp.c2);
if(f!==3){const e=x=>r(g,ox+x,oy+6,1,2,K);if(f===0){e(5);e(10);r(g,ox+4,oy+8,2,1,"#ffa0b0");r(g,ox+10,oy+8,2,1,"#ffa0b0")}else e(f===1?4:11);
if(gl==="round"&&f===0)[4,9].forEach(x=>{r(g,ox+x,oy+5,4,1,K);r(g,ox+x,oy+8,4,1,K);r(g,ox+x,oy+5,1,4,K);r(g,ox+x+3,oy+5,1,4,K)});
if(gl==="shades"&&f===0)r(g,ox+4,oy+5,8,3,K)}}
const ANI={cat:["#f0a24a","#fff1d0"],bear:["#b07a4c","#e8c7a0"],frog:["#6fc84f","#d8f0a0"],rabbit:["#fff","#ffc0d0"],pig:["#ffb0c8","#ff8aaa"],panda:["#fff","#3a3355"],duck:["#ffe14a","#ff9a2a"],dog:["#d9a066","#f4dcb8"]};
function animal(g,ox,oy,k,f,fr){const[c,c2]=ANI[k],lf=fr===1,rt=fr===2;
outline(g,()=>{if(k==="rabbit"){r(g,ox+4,oy-5,3,8,c);r(g,ox+9,oy-5,3,8,c)}if(k==="cat"||k==="pig"){r(g,ox+3,oy,3,3,c);r(g,ox+10,oy,3,3,c)}
if(k==="bear"||k==="panda"){const e=k==="panda"?c2:c;r(g,ox+3,oy+1,3,3,e);r(g,ox+10,oy+1,3,3,e)}if(k==="dog"){r(g,ox+2,oy+3,3,7,"#8a5a32");r(g,ox+11,oy+3,3,7,"#8a5a32")}
r(g,ox+3,oy+4,10,8,c);r(g,ox+4,oy+2,8,10,c);r(g,ox+4,oy+12,8,6,c);r(g,ox+2,oy+13,2,4,c);r(g,ox+12,oy+13,2,4,c);r(g,ox+4,oy+18,3,2-(lf?1:0),c);r(g,ox+9,oy+18,3,2-(rt?1:0),c)});
r(g,ox+5,oy+13,6,4,k==="panda"?"#fff":k==="duck"?"#fff08a":c2);
if(f!==3){const pw=k==="panda"?"#fff":K,e=x=>r(g,ox+x,oy+6,1,2,pw);
if(k==="panda"&&f===0){r(g,ox+4,oy+5,3,3,K);r(g,ox+9,oy+5,3,3,K)}
if(k==="frog"){r(g,ox+4,oy+1,3,3,"#fff");r(g,ox+9,oy+1,3,3,"#fff");r(g,ox+5,oy+2,1,1,K);r(g,ox+10,oy+2,1,1,K);r(g,ox+5,oy+10,6,1,"#3f8a2f")}else if(f===0){e(5);e(10)}else e(f===1?4:11);
if(f===0){if(k==="duck")r(g,ox+6,oy+9,4,2,c2);else if(k!=="frog"){r(g,ox+6,oy+8,4,3,c2);r(g,ox+7,oy+8,2,1,K)}}}}
function mkStatic(){const o=document.createElement("canvas");o.width=MP.w*TS;o.height=MP.h*TS;const g=o.getContext("2d");
for(let y=0;y<MP.h;y++)for(let x=0;x<MP.w;x++){const t=T[y][x],X0=x*TS,Y=y*TS,h=hs(x,y);
r(g,X0,Y,TS,TS,t==="~"?"#58b8e8":t==="s"?"#f3dea0":t==="p"?"#e9d0a0":"#7bd36b");
if(t==="g"){r(g,X0+(h%9)+2,Y+(h%5)+3,1,3,"#5fb552");r(g,X0+((h*3)%9)+3,Y+((h*7)%6)+8,1,2,"#5fb552");if(h%9===1){r(g,X0+9,Y+9,2,2,["#fff","#ffb3d1","#ffe14a"][h%3]);r(g,X0+9,Y+10,1,1,"#e8496c")}}
if(t==="s"&&h%3===0)r(g,X0+(h%10)+2,Y+(h%8)+3,2,1,"#e0c77e");if(t==="p"&&h%3===0)r(g,X0+(h%9)+2,Y+(h%7)+3,2,2,"#cdb27a");
if(t==="~")[[0,-1,0,0,TS,1],[0,1,0,15,TS,1],[-1,0,0,0,1,TS],[1,0,15,0,1,TS]].forEach(([dx,dy,a,b,w,hh])=>{const n=T[y+dy]&&T[y+dy][x+dx];if(n&&n!=="~")r(g,X0+a,Y+b,w,hh,"#d8f4ff")})}
BLD.forEach(b=>r(g,(b.x+1)*TS+2,(b.y+3)*TS+4,12,8,"#e8496c"));return o}
function mkTree(){const c=document.createElement("canvas");c.width=20;c.height=28;const g=c.getContext("2d");g.translate(1,1);
outline(g,()=>{r(g,7,18,4,8,"#8b5a3c");r(g,1,8,16,10,"#3f9e4a");r(g,3,3,12,7,"#3f9e4a");r(g,6,0,6,4,"#3f9e4a")});r(g,5,5,3,3,"#6fcf6a");r(g,4,11,3,2,"#6fcf6a");r(g,11,13,4,2,"#2f7e3a");return c}
function mkB(b){const c=document.createElement("canvas");c.width=66;c.height=64;const g=c.getContext("2d");g.translate(1,0);const dk=mx(b.c,0,.25);
outline(g,()=>{r(g,0,30,64,34,"#fff3d6");for(let i=0;i<20;i++){const w=44+i;r(g,(64-w)>>1,13+i,w,1,i%5<3?b.c:dk)}});
r(g,0,32,64,2,dk);r(g,16,41,16,23,"#8b5a3c");r(g,17,42,14,22,"#a9744a");r(g,28,53,2,2,"#ffd23f");
[4,36,50].forEach(x=>{r(g,x-1,39,12,12,"#8b5a3c");r(g,x,40,10,10,"#bfe8ff");r(g,x+4,40,2,10,"#fff");r(g,x,44,10,2,"#fff")});
g.font="bold 8px monospace";g.textAlign="center";const tw=Math.ceil(g.measureText(b.n).width)+8,x0=Math.round(33-tw/2);r(g,x0-1,0,tw+2,12,K);r(g,x0,1,tw,10,"#fff4f8");g.fillStyle=K;g.fillText(b.n,33,9);return c}
function draw(){const g=X;g.imageSmoothingEnabled=false;g.drawImage(ST,CX,CY,VW*TS,VH*TS,0,0,VW*TS,VH*TS);g.save();g.translate(-CX,-CY);
const x0=Math.floor(CX/TS),y0=Math.floor(CY/TS),sh=Math.floor(WD/450)%3;
for(let y=y0;y<=y0+VH&&y<MP.h;y++)for(let x=x0;x<=x0+VW&&x<MP.w;x++)if(T[y][x]==="~"&&(x+y+sh)%3===0)r(g,x*TS+4,y*TS+7,6,1,"#a8e0ff");
const L=[],vis=(x,y)=>x>=x0-3&&x<=x0+VW+3&&y>=y0-3&&y<=y0+VH+3;
TREES.forEach(([x,y])=>vis(x,y)&&L.push([(y+1)*TS,()=>g.drawImage(TRI,x*TS-2,(y+1)*TS-27)]));
BLD.forEach(b=>L.push([(b.y+3)*TS-1,()=>g.drawImage(BI[b.n],b.x*TS-1,b.y*TS-16)]));
NP.forEach(n=>L.push([(ey(n)+1)*TS,()=>{const ox=Math.round(ex(n)*TS),oy=Math.round((ey(n)+1)*TS)-20;animal(g,ox,oy,n.k,n.f,n.mv?1+(Math.floor(WD/160)%2):0);if(n.th){const b=Math.floor(WD/300)%2,c=learned()<NEED[n.th]?"#9a9ab0":"#ffd23f";r(g,ox+7,oy-10-b,2,5,c);r(g,ox+7,oy-4-b,2,2,c)}}]));
L.push([(ey(PL)+1)*TS,()=>drawChar(g,Math.round(ex(PL)*TS),Math.round((ey(PL)+1)*TS)-22,PL.f,PL.mv?1+(Math.floor(WD/130)%2):0,S.eq)]);
if(S.eq.pet)L.push([(WPET.y+1)*TS-1,()=>{const x=Math.round((WPET.x+.5)*TS),y=Math.round((WPET.y+1)*TS)-2;r(g,x-4,y,8,2,"rgba(58,51,85,.35)");g.font="12px serif";g.textAlign="center";g.fillText(I(S.eq.pet).e,x,y-(Math.hypot(WPET.tx-WPET.x,WPET.ty-WPET.y)>.05&&Math.floor(WD/120)%2?2:0))}]);
L.sort((a,b)=>a[0]-b[0]).forEach(l=>l[1]());g.restore();g.fillStyle=tint();g.fillRect(0,0,VW*TS,VH*TS)}
function fit(){const bar=$(".bar"),aw=$(".scr").clientWidth-12,ah=$("#app").clientHeight-(bar?bar.offsetHeight:0)-56;VW=Math.max(7,Math.min(14,Math.floor(aw/32)));VH=Math.max(8,Math.min(20,Math.floor(ah/32)));SC.width=VW*TS;SC.height=VH*TS;SC.style.width=VW*32+"px";SC.style.height=VH*32+"px";$("#wd").style.width=VW*32+8+"px";X=SC.getContext("2d");X.imageSmoothingEnabled=false}
function mountWorld(){SC=$("#wc");fit();ST=ST||mkStatic();TRI=TRI||mkTree();BLD.forEach(b=>BI[b.n]=BI[b.n]||mkB(b));
Dlg=false;WDIR=[0,0];WPATH=[];WWANT=null;[PL,...NP].forEach(m=>{m.mv=0;m.p=0;m.x=m.tx;m.y=m.ty});WPET={x:PL.x,y:PL.y,tx:PL.x,ty:PL.y};SC.onpointerdown=tapAt;
const dp=$(".dp");dp.onpointerdown=e=>{const b=e.target.closest("button");if(!b)return;WDIR=b.dataset.d.split(",").map(Number);WPATH=[];WWANT=null;dp.setPointerCapture(e.pointerId)};dp.onpointerup=dp.onpointercancel=()=>{WDIR=[0,0]};
$("#ab").onclick=action;cancelAnimationFrame(WR);WL=performance.now();WR=requestAnimationFrame(tick)}
function stopWorld(){cancelAnimationFrame(WR);WR=0}
const KM={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
addEventListener("keydown",e=>{if(!WR)return;const d=KM[e.key];if(d){WDIR=d;WPATH=[];e.preventDefault()}else if(e.key==="Enter"||e.key===" "){action();e.preventDefault()}});
addEventListener("keyup",e=>{if(KM[e.key]&&WDIR===KM[e.key])WDIR=[0,0]});
addEventListener("resize",()=>{if(WR)fit()});
