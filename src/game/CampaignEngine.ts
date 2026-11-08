export type BuildingKind = 'farm' | 'lumber' | 'quarry' | 'market';
export type RegionId = 'north' | 'whispering-forest' | 'iron-highlands' | 'mist-coast';
export type QuestStatus = 'active' | 'complete' | 'claimed';
export interface PlacedBuilding { id: string; kind: BuildingKind; x: number; z: number; level: number; }
export interface CampaignState {
  version: 1;
  day: number; gold: number; wood: number; stone: number; food: number;
  happiness: number; population: number; capacity: number; army: number;
  buildings: PlacedBuilding[];
  regions: RegionId[];
  relations: Record<Exclude<RegionId,'north'>, number>;
  quests: Record<string, QuestStatus>;
  victories: number;
  defeats: number;
  ending: 'guardian' | 'unifier' | 'truth-seeker' | null;
}
export const REGION_DATA: Record<RegionId,{name:string;description:string;cost:{gold:number;food:number;wood:number};difficulty:number}> = {
 north:{name:'Kuzey Kalesi',description:'Krallığının merkezi ve güvenli başlangıç bölgesi.',cost:{gold:0,food:0,wood:0},difficulty:0},
 'whispering-forest':{name:'Fısıldayan Orman',description:'Eski yollar, kereste ve unutulmuş bir yemin.',cost:{gold:45,food:20,wood:10},difficulty:1},
 'iron-highlands':{name:'Demir Yaylalar',description:'Taş ocakları ve eski maden geçitleri.',cost:{gold:70,food:25,wood:15},difficulty:2},
 'mist-coast':{name:'Sisli Kıyı',description:'Ticaret limanı ve babanın son seferine dair izler.',cost:{gold:90,food:35,wood:20},difficulty:3},
};
export const QUEST_DATA = [
 {id:'first-harvest',name:'İlk Hasat',description:'Bir çiftlik kur ve krallığın erzak düzenini başlat.',reward:{gold:20,food:35},condition:(s:CampaignState)=>s.buildings.some(b=>b.kind==='farm')},
 {id:'royal-guard',name:'Kraliyet Muhafızları',description:'Ordunu 10 askere ulaştır.',reward:{gold:35,food:15},condition:(s:CampaignState)=>s.army>=10},
 {id:'three-oaths',name:'Üç Kayıp Yemin',description:'Üç kayıp bölgeyi keşfet.',reward:{gold:100,stone:45},condition:(s:CampaignState)=>s.regions.length>=4},
 {id:'trusted-ruler',name:'Güvenilen Hükümdar',description:'Halkın mutluluğunu en az %85 seviyesine çıkar.',reward:{gold:50,food:40},condition:(s:CampaignState)=>s.happiness>=85},
] as const;
export const BUILDING_COSTS:Record<BuildingKind,{gold:number;wood:number}> = {
 farm:{gold:40,wood:25}, lumber:{gold:35,wood:20}, quarry:{gold:45,wood:15}, market:{gold:60,wood:30},
};
export function createInitialCampaign():CampaignState {
 return {version:1,day:1,gold:240,wood:180,stone:140,food:120,happiness:78,population:24,capacity:60,army:8,buildings:[],regions:['north'],relations:{'whispering-forest':0,'iron-highlands':0,'mist-coast':0},quests:{'first-harvest':'active','royal-guard':'active','three-oaths':'active','trusted-ruler':'active'},victories:0,defeats:0,ending:null};
}
export function normalizeCampaign(raw:string|null):CampaignState {
 const initial=createInitialCampaign();
 try {
  if(!raw)return initial;
  const value=JSON.parse(raw) as Partial<CampaignState>;
  if(value.version!==1)return initial;
  const number=(n:unknown,fallback:number,min=0,max=999999)=>typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):fallback;
  const regions=Array.isArray(value.regions)?value.regions.filter((r):r is RegionId=>r in REGION_DATA):['north' as RegionId];
  const buildings=Array.isArray(value.buildings)?value.buildings.filter(b=>b&&typeof b.id==='string'&&b.kind in BUILDING_COSTS&&Number.isFinite(b.x)&&Number.isFinite(b.z)).map(b=>({id:b.id,kind:b.kind,x:number(b.x,0,-24,24),z:number(b.z,0,-24,24),level:number(b.level,1,1,5)})):[];
  const relations=value.relations??initial.relations;
  const quests=value.quests??initial.quests;
  return {...initial,day:number(value.day,1,1),gold:number(value.gold,240),wood:number(value.wood,180),stone:number(value.stone,140),food:number(value.food,120),happiness:number(value.happiness,78,0,100),population:number(value.population,24),capacity:number(value.capacity,60),army:number(value.army,8),buildings,regions:[...new Set(['north',...regions])],relations:{'whispering-forest':number(relations['whispering-forest'],0,-100,100),'iron-highlands':number(relations['iron-highlands'],0,-100,100),'mist-coast':number(relations['mist-coast'],0,-100,100)},quests:{'first-harvest':validQuest(quests['first-harvest']),'royal-guard':validQuest(quests['royal-guard']),'three-oaths':validQuest(quests['three-oaths']),'trusted-ruler':validQuest(quests['trusted-ruler'])},victories:number(value.victories,0),defeats:number(value.defeats,0),ending:value.ending==='guardian'||value.ending==='unifier'||value.ending==='truth-seeker'?value.ending:null};
 } catch { return initial; }
}
function validQuest(value:unknown):QuestStatus { return value==='complete'||value==='claimed'||value==='active'?value:'active'; }
export function advanceCampaignDay(state:CampaignState):string {
 state.day++;
 for(const b of state.buildings){const level=Math.max(1,b.level);if(b.kind==='farm')state.food+=18*level;if(b.kind==='lumber')state.wood+=16*level;if(b.kind==='quarry')state.stone+=14*level;if(b.kind==='market')state.gold+=20*level;}
 state.gold+=8;state.food=Math.max(0,state.food-Math.ceil(state.population*.16)-Math.ceil(state.army*.35));
 state.happiness=Math.max(10,Math.min(100,state.happiness+(state.food>15?1:-4)));
 updateQuests(state);
 return state.food>0?'Yeni gün başladı. Üretim ve erzak hesaplandı.':'Ambarlar boşalıyor. Halkın mutluluğu düşüyor.';
}
export function placeCampaignBuilding(state:CampaignState,kind:BuildingKind,x:number,z:number):string|null {
 const cost=BUILDING_COSTS[kind];if(state.gold<cost.gold||state.wood<cost.wood)return 'Yeterli altın veya odunun yok.';
 if(Math.abs(x)>22||Math.abs(z)>22)return 'Krallık sınırlarının dışına çıkamazsın.';
 if(state.buildings.some(b=>Math.hypot(b.x-x,b.z-z)<3.2))return 'Bu alan dolu.';
 state.gold-=cost.gold;state.wood-=cost.wood;state.buildings.push({id:kind+'-'+state.day+'-'+state.buildings.length,kind,x,z,level:1});updateQuests(state);return null;
}
export function recruitCampaignSoldier(state:CampaignState):string|null {
 if(state.gold<25||state.food<10)return 'Asker eğitimi için 25 altın ve 10 yiyecek gerekir.';
 if(state.population>=state.capacity)return 'Barınak kapasitesi dolu.';
 state.gold-=25;state.food-=10;state.army++;state.population++;updateQuests(state);return null;
}
export function exploreRegion(state:CampaignState,id:Exclude<RegionId,'north'>):string|null {
 if(state.regions.includes(id))return 'Bu bölge zaten keşfedildi.';
 const region=REGION_DATA[id],cost=region.cost;
 if(state.gold<cost.gold||state.food<cost.food||state.wood<cost.wood)return 'Keşif için yeterli kaynak yok.';
 state.gold-=cost.gold;state.food-=cost.food;state.wood-=cost.wood;state.regions.push(id);
 state.happiness=Math.min(100,state.happiness+2);updateQuests(state);return region.name+' keşfedildi!';
}
export function resolveRegionalChallenge(state:CampaignState,id:RegionId,roll:number):{won:boolean;message:string} {
 if(!state.regions.includes(id))return {won:false,message:'Önce bu bölgeyi keşfetmelisin.'};
 if(id==='north')return {won:false,message:'Kuzey Kalesi güvenli merkezindir.'};
 const power=state.army+Math.floor(state.happiness/20)+Math.floor((state.relations[id as Exclude<RegionId,'north'>]??0)/25);
 const won=power+Math.max(1,Math.min(6,Math.floor(roll)))>=REGION_DATA[id].difficulty*5+7;
 if(won){state.victories++;state.gold+=25+REGION_DATA[id].difficulty*10;state.food+=15;state.happiness=Math.min(100,state.happiness+2);state.relations[id as Exclude<RegionId,'north'>]=Math.min(100,(state.relations[id as Exclude<RegionId,'north'>]??0)+8);}
 else {state.defeats++;state.food=Math.max(0,state.food-12);state.happiness=Math.max(10,state.happiness-3);}
 updateQuests(state);return {won,message:won?'Bölge görevi başarıyla tamamlandı. Kaynaklar krallığa ulaştı.':'Görev tamamlanamadı. Orduyu güçlendirip yeniden hazırlan.'};
}
export function improveDiplomacy(state:CampaignState,id:Exclude<RegionId,'north'>):string|null {
 if(state.gold<20)return 'Diplomatik heyet için 20 altın gerekir.';
 state.gold-=20;state.relations[id]=Math.min(100,state.relations[id]+15);state.happiness=Math.min(100,state.happiness+1);return REGION_DATA[id].name+' ile ilişkiler gelişti.';
}
export function claimQuest(state:CampaignState,id:string):string|null {
 const quest=QUEST_DATA.find(q=>q.id===id);if(!quest)return 'Görev bulunamadı.';
 if(state.quests[id]!=='complete')return 'Bu görev henüz tamamlanmadı.';
 state.quests[id]='claimed';for(const [key,value] of Object.entries(quest.reward))state[key as 'gold'|'food'|'wood'|'stone']+=value;return 'Görev ödülü alındı: '+quest.name;
}
export function evaluateEnding(state:CampaignState):CampaignState['ending'] {
 if(state.regions.length===4&&state.victories>=3&&state.happiness>=75)return 'unifier';
 if(state.regions.length===4&&Object.values(state.relations).every(value=>value>=45))return 'guardian';
 if(state.regions.length===4&&state.victories>=1)return 'truth-seeker';
 return null;
}
export function updateQuests(state:CampaignState):void {
 for(const quest of QUEST_DATA)if(state.quests[quest.id]==='active'&&quest.condition(state))state.quests[quest.id]='complete';
}
