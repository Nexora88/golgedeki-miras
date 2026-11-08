import {
  REGION_DATA, QUEST_DATA, evaluateEnding, type CampaignState, type RegionId,
} from './CampaignEngine';

export interface CampaignPanelActions {
  state: () => CampaignState;
  explore: (id: Exclude<RegionId,'north'>) => void;
  challenge: (id: RegionId) => void;
  diplomacy: (id: Exclude<RegionId,'north'>) => void;
  claim: (id: string) => void;
  save: (slot: number) => void;
  load: (slot: number) => void;
  chooseEnding: (ending: NonNullable<CampaignState['ending']>) => void;
}
const REGIONS:RegionId[]=['north','whispering-forest','iron-highlands','mist-coast'];
const RELATION_IDS:Exclude<RegionId,'north'>[]=['whispering-forest','iron-highlands','mist-coast'];
function element<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string,text?:string):HTMLElementTagNameMap[K]{
 const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;
}
export class CampaignPanel {
 private root:HTMLElement;
 private panel:HTMLElement;
 constructor(private readonly actions:CampaignPanelActions){
  this.root=element('section','campaign-overlay hidden');this.root.setAttribute('aria-modal','true');this.root.setAttribute('role','dialog');
  this.panel=element('div','campaign-panel');this.root.append(this.panel);document.querySelector('#app')?.append(this.root);
  const trigger=element('button','campaign-open','SEFER DEFTERİ');trigger.type='button';trigger.addEventListener('click',()=>this.open());
  document.querySelector('#interface')?.append(trigger);
  this.root.addEventListener('click',event=>{if(event.target===this.root)this.close();});
 }
 open(){this.render();this.root.classList.remove('hidden');}
 close(){this.root.classList.add('hidden');}
 private actionButton(label:string,handler:()=>void,disabled=false,secondary=false){
  const button=element('button',secondary?'campaign-action secondary':'campaign-action',label);button.type='button';button.disabled=disabled;button.addEventListener('click',()=>{handler();this.render();});return button;
 }
 private render(){
  const state=this.actions.state();this.panel.replaceChildren();
  const header=element('header','campaign-header');
  const title=element('div','campaign-heading');title.append(element('small','', 'KUZEY KRALLIĞI · YÖNETİM KONSEYİ'),element('h2','','Sefer Defteri'));
  const close=this.actionButton('KAPAT',()=>this.close(),false,true);header.append(title,close);this.panel.append(header);
  const stats=element('div','campaign-stats');
  for(const [label,value] of [['GÜN',String(state.day)],['ALTIN',String(state.gold)],['ODUN',String(state.wood)],['TAŞ',String(state.stone)],['YİYECEK',String(state.food)],['HALK',state.happiness+'%'],['ORDU',String(state.army)]]){
   const item=element('div','campaign-stat');item.append(element('small','',label),element('b','',value));stats.append(item);
  }
  this.panel.append(stats);
  const grid=element('div','campaign-columns');
  const regions=element('section','campaign-section');regions.append(element('h3','','KAYIP BÖLGELER'));
  for(const id of REGIONS){
   const region=REGION_DATA[id],unlocked=state.regions.includes(id),card=element('article','campaign-card');
   const info=element('div','');info.append(element('b','',region.name),element('p','',region.description));
   const meta=element('small','campaign-muted',unlocked?'KEŞFEDİLDİ':'KEŞİF BEKLİYOR');card.append(info,meta);
   if(!unlocked)card.append(this.actionButton('KEŞFET · '+region.cost.gold+' ALTIN',()=>this.actions.explore(id as Exclude<RegionId,'north'>),id==='north'));
   else if(id!=='north')card.append(this.actionButton('BÖLGE GÖREVİ',()=>this.actions.challenge(id)));
   regions.append(card);
  }
  grid.append(regions);
  const quests=element('section','campaign-section');quests.append(element('h3','','GÖREV PANOSU'));
  for(const quest of QUEST_DATA){
   const status=state.quests[quest.id],card=element('article','campaign-card');
   card.append(element('b','',quest.name),element('p','',quest.description),element('small','campaign-muted',status==='claimed'?'ÖDÜL ALINDI':status==='complete'?'TAMAMLANDI':'DEVAM EDİYOR'));
   if(status==='complete')card.append(this.actionButton('ÖDÜLÜ AL',()=>this.actions.claim(quest.id)));
   quests.append(card);
  }
  grid.append(quests);this.panel.append(grid);
  const diplomacy=element('section','campaign-section');diplomacy.append(element('h3','','DİPLOMASİ'));
  for(const id of RELATION_IDS){
   const row=element('div','campaign-diplomacy');row.append(element('span','',REGION_DATA[id].name),element('b','',state.relations[id]+'/100'));
   row.append(this.actionButton('ELÇİ GÖNDER · 20 ALTIN',()=>this.actions.diplomacy(id),state.gold<20));diplomacy.append(row);
  }
  this.panel.append(diplomacy);
  const ending=evaluateEnding(state);
  if(ending){
   const endingBox=element('section','campaign-ending');endingBox.append(element('small','','SON YEMİN'),element('h3','',ending==='unifier'?'Birleştirici Hükümdar':ending==='guardian'?'Halkın Koruyucusu':'Gerçeğin İzinde'),element('p','', 'Üç bölgenin kaderi artık senin kararlarınla birleşiyor. Bu sonu krallık tarihine kaydet.'));
   endingBox.append(this.actionButton('BU SONU KAYDET',()=>this.actions.chooseEnding(ending),state.ending===ending));
   this.panel.append(endingBox);
  }
  const saves=element('section','campaign-section');saves.append(element('h3','','KRALLIK KAYITLARI'));
  const slots=element('div','campaign-slots');
  for(let slot=1;slot<=3;slot++){
   const group=element('div','campaign-slot');group.append(element('b','', 'KAYIT '+slot));
   group.append(this.actionButton('KAYDET',()=>this.actions.save(slot)));
   group.append(this.actionButton('YÜKLE',()=>this.actions.load(slot),false,true));slots.append(group);
  }
  saves.append(slots);this.panel.append(saves);
  this.panel.append(element('p','campaign-footnote','Kayıtlar bu tarayıcıda saklanır. Farklı cihazlarla otomatik eşitlenmez.'));
 }
}
