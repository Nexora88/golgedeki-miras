import * as THREE from 'three';
import './style.css';
import { StoryOverlay } from './story/StoryOverlay';
import { AssetCatalog } from './assets/AssetCatalog';
import { gameAssetManifest } from './assets/assetManifest';
import { CampaignPanel } from './game/CampaignPanel';
import { normalizeCampaign, advanceCampaignDay, placeCampaignBuilding, recruitCampaignSoldier, exploreRegion, resolveRegionalChallenge, improveDiplomacy, claimQuest } from './game/CampaignEngine';

const canvas = document.querySelector('#world');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8da18b);
scene.fog = new THREE.Fog(0x8da18b, 34, 78);

const renderer = (() => {
  try { return new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' }); }
  catch (error) {
    const screen = document.querySelector('#loading-screen');
    if (screen) { screen.replaceChildren(); const title=document.createElement('h1'); title.textContent='OYUN BAŞLATILAMADI'; const detail=document.createElement('p'); detail.textContent='Tarayıcıda WebGL desteği açılamadı. Güncel bir tarayıcı ve donanım hızlandırmasıyla yeniden deneyebilirsin.'; screen.append(title,detail); screen.style.opacity='1'; }
    throw error;
  }
})();
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const camera = new THREE.OrthographicCamera(-17, 17, 17, -17, 0.1, 150);
const cameraTarget = new THREE.Vector3(0, 0, 0);
let cameraRadius = 31;
let cameraAngle = Math.PI / 4;
let cameraTilt = 0.72;
function updateCamera() {
  camera.position.set(cameraTarget.x + Math.cos(cameraAngle) * cameraRadius, cameraRadius * cameraTilt, cameraTarget.z + Math.sin(cameraAngle) * cameraRadius);
  camera.lookAt(cameraTarget);
  const aspect = window.innerWidth / window.innerHeight;
  const view = cameraRadius * 0.57;
  camera.left = -view * aspect; camera.right = view * aspect; camera.top = view; camera.bottom = -view;
  camera.updateProjectionMatrix();
}
updateCamera();

scene.add(new THREE.HemisphereLight(0xdce9dc, 0x50543b, 2.0));
const sun = new THREE.DirectionalLight(0xffe5bd, 2.35);
sun.position.set(-18, 28, 12); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -24; sun.shadow.camera.right = 24; sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24;
sun.shadow.bias = -0.00025; scene.add(sun);

const mat = (color, roughness = 1) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
const materials = {
  grass: mat(0x71865a), grass2: mat(0x829465), stone: mat(0x85877e), stoneDark: mat(0x555d58),
  roof: mat(0x67483b), wood: mat(0x72543a), gold: mat(0xb99450), water: new THREE.MeshStandardMaterial({color:0x648d91,roughness:.4}),
  leaf: mat(0x526f48), leaf2: mat(0x718653), soil: mat(0x8c7654), banner: mat(0x8d3930)
};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), materials.grass);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

const world = new THREE.Group(); scene.add(world);
const assetCatalog = new AssetCatalog(world, { baseUrl: import.meta.env.BASE_URL + 'assets/generated' });
const pickables = [];
const buildings = [];
const treeAnimations = [];
const soldierAnimations = [];
const clothAnimations = [];
let cinematic = null;
const boxGeo = new THREE.BoxGeometry(1,1,1);
function box(parent, x,y,z, sx,sy,sz, material, selectable = false, meta = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  if (selectable) { mesh.userData.meta = meta; pickables.push(mesh); }
  return mesh;
}
function cylinder(parent,x,y,z,rt,rb,h,material,segments=7) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);
  mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function createClothBanner(parent,x,y,z,width,height,material) {
  const geometry = new THREE.PlaneGeometry(width,height,8,5);
  const mesh = new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z); mesh.castShadow=true; parent.add(mesh);
  clothAnimations.push({mesh,base:new Float32Array(geometry.attributes.position.array),phase:Math.random()*Math.PI*2,width});
  return mesh;
}
function tree(x,z,scale=1) {
  const g = new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(scale); world.add(g);
  treeAnimations.push({group:g,phase:Math.random()*Math.PI*2,amount:0.012+(scale%0.03)});
  cylinder(g,0,.65,0,.15,.21,1.3,materials.wood,5);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.85,0),materials.leaf); crown.position.y=1.55; crown.scale.set(1,1.25,1); crown.castShadow=true; g.add(crown);
  const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(.57,0),materials.leaf2); crown2.position.set(.28,1.95,.12); crown2.castShadow=true; g.add(crown2);
}
function tower(x,z) {
  const g=new THREE.Group(); g.position.set(x,0,z); world.add(g);
  cylinder(g,0,1.65,0,1.0,1.12,3.3,materials.stone,8);
  cylinder(g,0,3.48,0,1.12,1.12,.28,materials.stoneDark,8);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.12,1.45,8),materials.roof); roof.position.y=4.25; roof.castShadow=true; g.add(roof);
  createClothBanner(g,0,4.25,1.05,0.9,0.65,materials.banner);
}
function wall(x,z,length,rot=0) {
  const m=box(world,x,1.35,z,length,2.7,.72,materials.stone,true,{name:'Kale Surları',description:'Krallığın savunma hattı. Düşman saldırılarına karşı ilk engel.',meta:'Savunma yapısı'});
  m.rotation.y=rot;
  for(let i=-length/2+.5;i<length/2;i+=1.25) box(world,x+Math.cos(rot)*i,2.9,z-Math.sin(rot)*i,.42,.45,.8,materials.stoneDark);
}
function createCastle() {
  const castle = new THREE.Group(); castle.position.set(0,0,0); world.add(castle);
  box(castle,0,.48,0,10,.95,9,materials.stone,true,{name:'Kuzey Kalesi',description:'Atalarından kalan taş kale. Krallığının yönetim merkezi ve son savunma noktası.',meta:'Merkez kale · Seviye 1'});
  box(castle,0,1.65,0,6.8,2.7,6,materials.stone,true,{name:'Kuzey Kalesi',description:'Taş duvarların ardında krallığının geleceği şekilleniyor.',meta:'Merkez kale · Seviye 1'});
  box(castle,0,3.15,0,2.5,.45,2.5,materials.stoneDark);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.1,2.2,4),materials.roof); roof.position.set(0,4.45,0); roof.rotation.y=Math.PI/4; roof.castShadow=true; castle.add(roof);
  for(const [x,z] of [[-4.8,-4.2],[4.8,-4.2],[-4.8,4.2],[4.8,4.2]]) tower(x,z);
  wall(0,-4.3,8.7,0); wall(0,4.3,8.7,0); wall(-4.8,0,8.5,Math.PI/2); wall(4.8,0,8.5,Math.PI/2);
  box(castle,0,1.1,4.65,2.5,2.2,.35,materials.wood,true,{name:'Ana Kapı',description:'Ağır meşe kapılar. Tehlike anında kapatılarak kaleyi korur.',meta:'Giriş · Açık'});
  const flagPole=cylinder(castle,0,5.7,-.2,.055,.055,3.1,materials.gold,6);
  createClothBanner(castle,.55,6.7,-.2,1.15,.8,materials.banner);
}
createCastle();

function createHouse(x,z,scale=1) {
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);world.add(g);
  box(g,0,.85,0,2.5,1.7,2.1,materials.wood,true,{name:'Köylü Evi',description:'Krallık nüfusuna barınak sağlar.',meta:'Konut'});
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.85,1.5,4),materials.roof);roof.position.y=2.35;roof.rotation.y=Math.PI/4;roof.castShadow=true;g.add(roof);
  box(g,0,.65,1.08,.55,1.25,.12,materials.stoneDark);
  buildings.push({type:'house',group:g,name:'Köylü Evi'});
}
createHouse(-8,5,.9); createHouse(8,-5,.9); createHouse(-8,-5,.8);
function createFarm(x,z) {
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  box(g,0,.08,0,4.6,.16,3.6,materials.soil,true,{name:'Çiftlik',description:'Köylüler burada yiyecek üretir. Her gün krallığın ambarına erzak ekler.',meta:'Üretim: +18 yiyecek / gün'});
  for(let i=0;i<5;i++) for(let j=0;j<4;j++){const crop=cylinder(g,-1.7+i*.82,.35,-1.2+j*.75,.07,.09,.55,materials.leaf,4);crop.rotation.z=-.18;}
  buildings.push({type:'farm',group:g,name:'Çiftlik'});
}
function createLumber(x,z) {
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  box(g,0,.12,0,3.5,.24,2.8,materials.soil,true,{name:'Oduncu Kampı',description:'Oduncular çevredeki ormandan kereste toplar.',meta:'Üretim: +16 odun / gün'});
  for(let i=0;i<3;i++)box(g,-.7+i*.7,.38,.2,1.2,.45,.5,materials.wood);
  buildings.push({type:'lumber',group:g,name:'Oduncu Kampı'});
}
function createQuarry(x,z) {
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  box(g,0,.12,0,3.7,.24,3,materials.soil,true,{name:'Taş Ocağı',description:'Ustalar dağ yamacından yapı taşı çıkarır.',meta:'Üretim: +14 taş / gün'});
  for(let i=0;i<5;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.45,0),materials.stone);rock.position.set(-1.2+(i%3)*.9,.55,Math.floor(i/3)*.8);rock.castShadow=true;g.add(rock);}
  buildings.push({type:'quarry',group:g,name:'Taş Ocağı'});
}
function createMarket(x,z) {
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  box(g,0,.75,0,3,1.5,2.5,materials.wood,true,{name:'Pazar Yeri',description:'Tüccarlar burada alışveriş yapar ve krallığa altın kazandırır.',meta:'Üretim: +20 altın / gün'});
  const awning=box(g,0,1.65,0,3.4,.2,2.8,materials.banner);
  box(g,-.65,1.85,0,.12,.2,2.8,materials.gold);box(g,.65,1.85,0,.12,.2,2.8,materials.gold);
  buildings.push({type:'market',group:g,name:'Pazar Yeri'});
}
function createSoldier(x,z) {
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  const torsoPivot=new THREE.Group();torsoPivot.name='Torso';torsoPivot.position.set(0,.85,0);g.add(torsoPivot);
  cylinder(torsoPivot,0,0,0,.28,.32,.82,mat(0x8b5944),7);
  const headPivot=new THREE.Group();headPivot.name='Head';headPivot.position.set(0,.55,0);torsoPivot.add(headPivot);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,7,5),mat(0xc69b75));head.position.y=.13;headPivot.add(head);
  cylinder(headPivot,0,.42,0,.31,.31,.2,materials.stoneDark,7);
  const leftArm=new THREE.Group();leftArm.name='LeftArm';leftArm.position.set(-.32,.28,0);torsoPivot.add(leftArm);
  const rightArm=new THREE.Group();rightArm.name='RightArm';rightArm.position.set(.32,.28,0);torsoPivot.add(rightArm);
  cylinder(leftArm,0,-.28,0,.11,.13,.62,materials.stoneDark,6);
  cylinder(rightArm,0,-.28,0,.11,.13,.62,materials.stoneDark,6);
  const leftLeg=new THREE.Group();leftLeg.name='LeftLeg';leftLeg.position.set(-.14,-.42,0);g.add(leftLeg);
  const rightLeg=new THREE.Group();rightLeg.name='RightLeg';rightLeg.position.set(.14,-.42,0);g.add(rightLeg);
  cylinder(leftLeg,0,-.23,0,.12,.14,.48,materials.wood,6);
  cylinder(rightLeg,0,-.23,0,.12,.14,.48,materials.wood,6);
  cylinder(rightArm,0,-.55,.02,.035,.035,.9,materials.gold,5);
  g.userData.meta={name:'Kraliyet Muhafızı',description:'Kalenin ve halkın güvenliğini sağlayan görevli.',meta:'Birlik · Seviye 1'};
  const times=[0,.5,1,1.5,2];
  const idle=new THREE.AnimationClip('Idle',2,[
   new THREE.NumberKeyframeTrack('Torso.rotation[x]',times,[0,.015,0,-.015,0]),
   new THREE.NumberKeyframeTrack('Head.rotation[y]',times,[0,.08,0,-.08,0]),
   new THREE.NumberKeyframeTrack('LeftArm.rotation[z]',times,[0,.025,0,-.025,0]),
   new THREE.NumberKeyframeTrack('RightArm.rotation[z]',times,[0,-.025,0,.025,0]),
  ]);
  const walk=new THREE.AnimationClip('Walk',1,[
   new THREE.NumberKeyframeTrack('LeftLeg.rotation[x]',[0,.25,.5,.75,1],[.42,0,-.42,0,.42]),
   new THREE.NumberKeyframeTrack('RightLeg.rotation[x]',[0,.25,.5,.75,1],[-.42,0,.42,0,-.42]),
   new THREE.NumberKeyframeTrack('LeftArm.rotation[x]',[0,.25,.5,.75,1],[-.25,0,.25,0,-.25]),
   new THREE.NumberKeyframeTrack('RightArm.rotation[x]',[0,.25,.5,.75,1],[.25,0,-.25,0,.25]),
  ]);
  const guard=new THREE.AnimationClip('Guard',2,[
   new THREE.NumberKeyframeTrack('LeftArm.rotation[x]',[0,1,2],[-.18,-.12,-.18]),
   new THREE.NumberKeyframeTrack('RightArm.rotation[x]',[0,1,2],[-.18,-.12,-.18]),
   new THREE.NumberKeyframeTrack('Head.rotation[y]',[0,1,2],[-.2,.2,-.2]),
  ]);
  const mixer=new THREE.AnimationMixer(g);mixer.clipAction(idle).play();
  pickables.push(g);soldiers.push(g);
  soldierAnimations.push({group:g,mixer,clips:{idle,walk,guard},baseX:x,baseZ:z,phase:Math.random()*Math.PI*2,patrol:soldiers.length%2===0,active:'idle'});
  return g;
}
const soldiers=[];
const enemyUnits=[];
let raidActive=false;
function setSoldierClip(item,name){
  if(item.active===name)return;
  item.mixer.stopAllAction();item.mixer.clipAction(item.clips[name]).play();item.active=name;
}
function spawnRaid(){
  if(raidActive)return;
  raidActive=true;
  for(let i=0;i<3;i++){
    const group=createSoldier(-19-i*.7,-13+i*2.4);
    group.userData.meta={name:'Sınır Baskıncısı',description:'Krallığın sınırına yaklaşan düşman birliği. Savunma hattına ulaşmadan durdurulmalı.',meta:'Düşman · Yapay zekâ birimi'};
    group.traverse(object=>{if(object.isMesh&&object.material?.color){object.material=object.material.clone();object.material.color.setHex(0x70413a);}});
    const animation=soldierAnimations.find(item=>item.group===group);
    if(animation){animation.patrol=false;setSoldierClip(animation,'walk');}
    enemyUnits.push({group,targetX:0,targetZ:6.5,speed:.055});
  }
  toast('Sınır gözcüleri haber verdi: Krallığa yaklaşan bir birlik var!');
}
function finishRaid(){
  if(!enemyUnits.length)return;
  const defended=state.army>=enemyUnits.length*2+2;
  if(defended){state.gold+=30;state.happiness=Math.min(100,state.happiness+2);toast('Savunma başarılı. Halkın güveni arttı. +30 altın.');}
  else{state.food=Math.max(0,state.food-20);state.happiness=Math.max(10,state.happiness-7);toast('Savunma hattı zorlandı. Erzak kaybı yaşandı; ordunu güçlendir.');}
  for(const enemy of enemyUnits){
    world.remove(enemy.group);
    const index=soldiers.indexOf(enemy.group);if(index>=0)soldiers.splice(index,1);
    const animIndex=soldierAnimations.findIndex(item=>item.group===enemy.group);if(animIndex>=0)soldierAnimations.splice(animIndex,1);
    const pickIndex=pickables.indexOf(enemy.group);if(pickIndex>=0)pickables.splice(pickIndex,1);
  }
  enemyUnits.length=0;raidActive=false;renderStats();persistGame();
}
for(const saved of state.buildings){
  if(saved.kind==='farm')createFarm(saved.x,saved.z);
  if(saved.kind==='lumber')createLumber(saved.x,saved.z);
  if(saved.kind==='quarry')createQuarry(saved.x,saved.z);
  if(saved.kind==='market')createMarket(saved.x,saved.z);
  state.buildingCounts[saved.kind]++;
}
for(let i=0;i<4;i++)createSoldier(-2+i*1.3,7.2);
for(let i=0;i<4;i++)createSoldier(3+i*1.1,-7.2);
for(let i=0;i<Math.max(0,state.army-8);i++)createSoldier(-4+(i%5)*1.5,10+Math.floor(i/5)*1.4);

// Decorative terrain: fixed low-poly props, deliberately limited for mobile performance.
for(let i=0;i<30;i++){const x=(i%6)*3.1-22;const z=Math.floor(i/6)*4.2-12;if(Math.abs(x)>7||Math.abs(z)>9)tree(x,z,.72+(i%3)*.12);}
for(let i=0;i<12;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.35+(i%3)*.12,0),materials.stoneDark);rock.position.set(-16+(i%4)*2.2,.25,10+Math.floor(i/4)*2.3);rock.castShadow=true;world.add(rock);}
const stream=new THREE.Mesh(new THREE.PlaneGeometry(5,35),materials.water);stream.rotation.x=-Math.PI/2;stream.rotation.z=-.3;stream.position.set(17,.025,-2);world.add(stream);

// Simple grid points used by the building placement mode.
const grid=new THREE.GridHelper(38,19,0xb79b62,0x65745c);grid.position.y=.035;grid.material.transparent=true;grid.material.opacity=.22;grid.visible=false;world.add(grid);

const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const hitPoint=new THREE.Vector3();
let selectedBuild=null;let selectedObject=null;let dragging=false;let moved=false;let lastX=0,lastY=0;let pointerStartX=0,pointerStartY=0;
const activeSlot = Math.max(1,Math.min(3,Number(localStorage.getItem('gm.active-slot')||1)));
const state = normalizeCampaign(localStorage.getItem('gm.campaign.slot-'+activeSlot));
state.buildingCounts = {farm:0,lumber:0,quarry:0,market:0};
function persistGame(){ try { localStorage.setItem('gm.campaign.slot-'+activeSlot,JSON.stringify(state)); } catch { toast('Kayıt alanı kullanılamıyor.'); } }
const costs={farm:{gold:40,wood:25},lumber:{gold:35,wood:20},quarry:{gold:45,wood:15},market:{gold:60,wood:30}};
const labels={farm:'Çiftlik',lumber:'Oduncu Kampı',quarry:'Taş Ocağı',market:'Pazar Yeri'};
const descriptions={farm:'Köylüler burada yiyecek üretir.',lumber:'Oduncular krallığa kereste sağlar.',quarry:'Taş ustaları yapı malzemesi çıkarır.',market:'Tüccarlar krallığa altın kazandırır.'};
const $=id=>document.getElementById(id);
function renderStats(){
  for(const key of ['gold','wood','stone','food'])$(key).textContent=state[key];
  $('day').textContent=state.day+'. GÜN';$('population').textContent=state.population+' / '+state.capacity;$('army').textContent=state.army;
  $('happiness').textContent=state.happiness+'%';$('happiness-meter').style.width=state.happiness+'%';
}
let toastTimer;
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300);}
function setSelection(meta){selectedObject=meta;$('selection-name').textContent=meta.name;$('selection-description').textContent=meta.description;$('selection-meta').textContent=meta.meta||'Krallık yapısı';$('selection-card').classList.remove('hidden');}
function clearBuild(){selectedBuild=null;grid.visible=false;document.querySelectorAll('.build-option').forEach(b=>b.classList.remove('active'));}
function placeBuilding(point){
  const x=Math.round(point.x/2)*2,z=Math.round(point.z/2)*2;
  if(Math.abs(x)<7&&Math.abs(z)<7){toast('Kale çevresinde inşaat yapılamaz.');return;}
  if(Math.abs(x)>19||Math.abs(z)>19){toast('Krallık sınırlarının dışına çıkamazsın.');return;}
  const occupied=buildings.some(b=>Math.hypot(b.group.position.x-x,b.group.position.z-z)<3.2);
  if(occupied){toast('Bu alan dolu. Başka bir yer seç.');return;}
  const error=placeCampaignBuilding(state,selectedBuild,x,z);if(error){toast(error);return;}
  if(selectedBuild==='farm')createFarm(x,z);if(selectedBuild==='lumber')createLumber(x,z);if(selectedBuild==='quarry')createQuarry(x,z);if(selectedBuild==='market')createMarket(x,z);
  state.buildingCounts[selectedBuild]++;renderStats();persistGame();toast(labels[selectedBuild]+' inşa edildi!');clearBuild();
}
function pointerWorld(event){const rect=canvas.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);}
canvas.addEventListener('pointerdown',e=>{dragging=true;moved=false;lastX=e.clientX;lastY=e.clientY;pointerStartX=e.clientX;pointerStartY=e.clientY;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(e.clientX-pointerStartX)+Math.abs(e.clientY-pointerStartY)>5)moved=true;if(e.buttons===2||e.shiftKey){cameraTarget.x-=dx*.035;cameraTarget.z+=dy*.035;}else{cameraAngle-=dx*.006;cameraTarget.x+=dy*.018*Math.sin(cameraAngle);cameraTarget.z+=dy*.018*Math.cos(cameraAngle);}lastX=e.clientX;lastY=e.clientY;updateCamera();});
canvas.addEventListener('pointerup',e=>{dragging=false;if(moved)return;pointerWorld(e);if(selectedBuild){if(raycaster.ray.intersectPlane(groundPlane,hitPoint))placeBuilding(hitPoint);return;}const hits=raycaster.intersectObjects(pickables,true);let found=null;for(const hit of hits){let obj=hit.object;while(obj&&!obj.userData.meta)obj=obj.parent;if(obj?.userData.meta){found=obj.userData.meta;break;}}if(found)setSelection(found);else $('selection-card').classList.add('hidden');});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{cameraRadius=THREE.MathUtils.clamp(cameraRadius+e.deltaY*.018,18,48);updateCamera();},{passive:true});
canvas.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
document.querySelectorAll('.build-option').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.build;if(selectedBuild===type){clearBuild();toast('İnşaat iptal edildi.');return;}clearBuild();selectedBuild=type;button.classList.add('active');grid.visible=true;$('selection-card').classList.add('hidden');$('bottom-hint').textContent=labels[type]+' için boş bir araziye dokun';toast(labels[type]+' seçildi. Yerleştirmek için araziye dokun.');}));
$('train-soldier').addEventListener('click',()=>{const error=recruitCampaignSoldier(state);if(error){toast(error);return;}createSoldier(1+(Math.random()-.5)*3,9+(Math.random()-.5)*2);renderStats();persistGame();toast('Yeni bir kraliyet muhafızı göreve başladı.');});
$('next-day').addEventListener('click',()=>{const message=advanceCampaignDay(state);renderStats();persistGame();toast('Gün '+state.day+': '+message);if(state.day%5===0)spawnRaid();});
$('zoom-in').addEventListener('click',()=>{cameraRadius=Math.max(18,cameraRadius-3);updateCamera();});
$('zoom-out').addEventListener('click',()=>{cameraRadius=Math.min(48,cameraRadius+3);updateCamera();});
$('reset-camera').addEventListener('click',()=>{cameraTarget.set(0,0,0);cameraAngle=Math.PI/4;cameraRadius=31;updateCamera();});
$('close-selection').addEventListener('click',()=>$('selection-card').classList.add('hidden'));
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;const step=e.shiftKey?2:1;if(e.key==='w'||e.key==='ArrowUp')cameraTarget.z-=step;if(e.key==='s'||e.key==='ArrowDown')cameraTarget.z+=step;if(e.key==='a'||e.key==='ArrowLeft')cameraTarget.x-=step;if(e.key==='d'||e.key==='ArrowRight')cameraTarget.x+=step;if(e.key==='+'||e.key==='=')cameraRadius=Math.max(18,cameraRadius-2);if(e.key==='-')cameraRadius=Math.min(48,cameraRadius+2);if(e.key==='Escape'){clearBuild();$('selection-card').classList.add('hidden');}$('bottom-hint').textContent='WASD / ok tuşları ile hareket · Sürükle ile kamerayı döndür';updateCamera();});
let lastFrame=0;
function animate(time){
  requestAnimationFrame(animate);
  if(time-lastFrame<32)return;
  lastFrame=time;
  const seconds=time*0.001;
  for(const item of treeAnimations){item.group.rotation.z=Math.sin(seconds*0.65+item.phase)*item.amount;}
  for(const item of soldierAnimations){
    const wave=seconds*0.7+item.phase;
    if(item.patrol){
      item.group.position.x=item.baseX+Math.sin(wave)*.72;
      item.group.position.z=item.baseZ+Math.cos(wave)*.42;
      setSoldierClip(item,Math.abs(Math.cos(wave))>.35?'walk':'idle');
    }
    item.mixer.update(0.032);
  }
  for(const enemy of enemyUnits){
    const dx=enemy.targetX-enemy.group.position.x,dz=enemy.targetZ-enemy.group.position.z;
    const distance=Math.hypot(dx,dz);
    if(distance>.65){enemy.group.position.x+=dx/distance*enemy.speed;enemy.group.position.z+=dz/distance*enemy.speed;enemy.group.rotation.y=Math.atan2(dx,dz);}
  }
  if(enemyUnits.length&&enemyUnits.every(enemy=>Math.hypot(enemy.targetX-enemy.group.position.x,enemy.targetZ-enemy.group.position.z)<=.65))finishRaid();
  assetCatalog.update(0.032);
  for(const item of clothAnimations){
    const attr=item.mesh.geometry.attributes.position;
    for(let i=0;i<attr.count;i++){
      const x=item.base[i*3], y=item.base[i*3+1];
      const weight=(x+item.width/2)/item.width;
      attr.setZ(i,item.base[i*3+2]+Math.sin(seconds*3+x*4+y*1.8+item.phase)*0.055*weight);
    }
    attr.needsUpdate=true;
    item.mesh.geometry.computeVertexNormals();
  }
  if(cinematic){
    const progress=Math.min(1,(time-cinematic.start)/cinematic.duration);
    const push=Math.sin(progress*Math.PI);
    cameraRadius=cinematic.baseRadius-5.5*push;
    cameraAngle=cinematic.baseAngle+0.12*push;
    cameraTarget.set(0,0,0);
    updateCamera();
    if(progress>=1)cinematic=null;
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
function resize(){renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));updateCamera();}
window.addEventListener('resize',resize);
window.addEventListener('pagehide',persistGame);
renderStats();
for(const asset of gameAssetManifest){assetCatalog.load(asset).catch(error=>console.warn('Optional game asset could not be loaded:',asset.id,error));}
const campaignPanel = new CampaignPanel({
 state:()=>state,
 explore:(id)=>{const message=exploreRegion(state,id);if(message)toast(message);renderStats();persistGame();},
 challenge:(id)=>{const result=resolveRegionalChallenge(state,id,Math.floor(Math.random()*6)+1);toast(result.message);renderStats();persistGame();},
 diplomacy:(id)=>{const message=improveDiplomacy(state,id);if(message)toast(message);renderStats();persistGame();},
 claim:(id)=>{const message=claimQuest(state,id);if(message)toast(message);renderStats();persistGame();},
 save:(slot)=>{localStorage.setItem('gm.campaign.slot-'+slot,JSON.stringify(state));toast('Kayıt '+slot+' kaydedildi.');},
 load:(slot)=>{if(!localStorage.getItem('gm.campaign.slot-'+slot)){toast('Bu kayıt yuvası boş.');return;}localStorage.setItem('gm.active-slot',String(slot));window.location.reload();},
 chooseEnding:(ending)=>{state.ending=ending;persistGame();toast('Krallığın sonu tarihine kaydedildi.');},
});
const storyOverlay = new StoryOverlay();
$('start-game').addEventListener('click',()=>{
  $('main-menu').classList.add('hidden');
  $('interface').classList.remove('hidden');
  cinematic={start:performance.now(),duration:3200,baseRadius:cameraRadius,baseAngle:cameraAngle};
  storyOverlay.openPrologue();
  toast('Kuzey Kalesi’nde yeni bir dönem başlıyor.');
});
setTimeout(()=>{$('loading-screen').style.opacity='0';setTimeout(()=>$('loading-screen').remove(),550);$('main-menu').classList.remove('hidden');persistGame();},650);
