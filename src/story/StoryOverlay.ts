export interface StoryChoice {
  id: string;
  label: string;
}
interface StoryChapter {
  id: string; kicker: string; title: string; paragraphs: string[];
  dialogue?: { speaker: string; line: string }[];
  choices?: StoryChoice[]; continueLabel?: string;
}
interface StoryProgress { chapter: number; choices: Record<string, string>; }
const STORAGE_KEY = 'golgedeki-miras.story.v1';
const chapters: StoryChapter[] = [
 { id:'last-night', kicker:'ÖNSÖZ · KUZEY TOPRAKLARI', title:'Kuzey’de Son Gece',
   paragraphs:[
    'Kuzey Kalesi’nin surlarında gece yarısı çanları çaldığında savaş çoktan kapıya dayanmıştı. Sis, ovayı ve düşman sancaklarını birbirinden ayırıyordu.',
    'Baban, yüzünü miğferinin gölgesinde saklayarak sana eski krallık mührünü uzattı. Mirasın yalnızca toprak ve taştan ibaret olmadığını söyledi.',
    '“Bir gün bu kale sana kalırsa, duvarları değil, içindeki insanları koru. Kuzey kapısının ardındaki gerçeği öğrenmeden kimseye güvenme.”'
   ],
   dialogue:[{speaker:'Baban',line:'Miras, sahip olduğun şey değil; uğruna sorumluluk aldığın şeydir.'}],
   choices:[
    {id:'protect-people',label:'Halkı kaleye sığınmaya çağır'},
    {id:'seek-truth',label:'Kuzey kapısındaki gerçeğin peşine düş'}
   ]
 },
 {id:'ash-dawn',kicker:'BÖLÜM I · KÜLLERİN SABAHI',title:'Sessiz Surlar',
  paragraphs:[
   'Gün doğduğunda savaşın sesi kesilmişti. Kale ayaktaydı ama eski düzen yok olmuştu. Taht salonunda yalnızca mühür, yarım kalmış bir harita ve boş bir komutan koltuğu duruyordu.',
   'Danışmanlar senden hemen tahta oturmanı istedi. Halk ise önce ambarların açılmasını ve ailelerin barınmasını bekliyordu.'
  ],
  dialogue:[{speaker:'Başdanışman',line:'Bir hükümdar ilk kararında kim olduğunu belli eder. Taç mı, halk mı?'}],
  continueLabel:'Konseyin huzuruna çık'
 },
 {id:'first-oath',kicker:'BÖLÜM II · İLK YEMİN',title:'Taş ve Ekmek',
  paragraphs:[
   'Konsey toplandığında iki mesele önündeydi: surların onarılması ve kış gelmeden ambarların doldurulması. Her karar krallığın kaynaklarını ve halkın sana duyduğu güveni etkileyecekti.',
   'Mührün üzerindeki eski işaret, haritadaki üç kayıp bölgeyle aynıydı. Babanın bıraktığı sır, krallığın sınırlarının çok ötesine uzanıyordu.'
  ],
  dialogue:[{speaker:'Yaşlı Kâtip',line:'Kuzey’in üç yemini bozuldu. Onları birleştirmeden bu topraklarda huzur kurulamaz.'}],
  choices:[
   {id:'repair-walls',label:'Önce surları onar ve savunmayı güçlendir'},
   {id:'feed-people',label:'Önce ambarları doldur ve halka yardım et'}
  ]
 },
 {id:'banner-oath',kicker:'BÖLÜM III · SANCAK',title:'Sancağın Altında',
  paragraphs:[
   'Kuzey Kalesi’nin avlusunda yeni sancak yükseldi. Artık kararların yalnızca bugünü değil, yıllar sonra anlatılacak mirası da belirleyecekti.',
   'Uzak bölgelerden haberler gelmeye başladı. Kayıp mühür parçaları, eski müttefikler ve babanın son seferine dair çelişkili tanıklıklar seni bekliyordu.'
  ],
  dialogue:[{speaker:'Kâtip',line:'Hikâyen burada bitmiyor. Her bölge, verdiğin kararları hatırlayacak.'}],
  continueLabel:'Krallığı yönetmeye devam et'
 }
];
export function normalizeStoryProgress(raw: string | null): StoryProgress {
 try {
  if(!raw)return {chapter:0,choices:{}};
  const parsed=JSON.parse(raw) as Partial<StoryProgress>;
  return {chapter:Number.isInteger(parsed.chapter)?Math.max(0,Math.min(chapters.length-1,parsed.chapter as number)):0,choices:parsed.choices&&typeof parsed.choices==='object'?parsed.choices:{}};
 } catch { return {chapter:0,choices:{}}; }
}
function readProgress(): StoryProgress {
 try { return normalizeStoryProgress(localStorage.getItem(STORAGE_KEY)); }
 catch { return {chapter:0,choices:{}}; }
}
export class StoryOverlay {
 private progress=readProgress();
 private root:HTMLElement;
 private panel:HTMLElement;
 constructor(){
  this.root=document.createElement('section');this.root.className='story-overlay hidden';
  this.root.setAttribute('aria-modal','true');this.root.setAttribute('role','dialog');this.root.setAttribute('aria-labelledby','story-title');
  this.panel=document.createElement('div');this.panel.className='story-panel';this.root.append(this.panel);
  document.querySelector('#app')?.append(this.root);
  const book=document.createElement('button');book.className='story-book-button';book.type='button';book.textContent='HİKÂYE';
  book.addEventListener('click',()=>this.open());document.querySelector('#interface')?.append(book);
  this.root.addEventListener('click',event=>{if(event.target===this.root)this.close();});
 }
 openPrologue(){this.progress=readProgress();this.open();}
 open(){this.render();this.root.classList.remove('hidden');}
 close(){this.root.classList.add('hidden');}
 private persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(this.progress));}catch{/* session-only fallback */}}
 private advance(){this.progress.chapter=Math.min(this.progress.chapter+1,chapters.length-1);this.persist();this.render();}
 private choose(choice:StoryChoice,chapterId:string){this.progress.choices[chapterId]=choice.id;this.advance();}
 private render(){
  const chapter=chapters[this.progress.chapter];this.panel.replaceChildren();
  const kicker=document.createElement('div');kicker.className='story-kicker';kicker.textContent=chapter.kicker;
  const title=document.createElement('h2');title.id='story-title';title.textContent=chapter.title;this.panel.append(kicker,title);
  const paragraphs=chapter.paragraphs.slice();
  if(chapter.id==='ash-dawn'){
   const first=this.progress.choices['last-night'];
   if(first==='protect-people')paragraphs.push('Halkı önceleyen kararın, avluda toplanan ailelerin sana umutla bakmasını sağladı.');
   if(first==='seek-truth')paragraphs.push('Kuzey kapısının ardındaki gerçeği arama kararın, kâtibin haritasındaki işaretleri daha anlamlı kıldı.');
  }
  for(const value of paragraphs){const p=document.createElement('p');p.className='story-paragraph';p.textContent=value;this.panel.append(p);}
  for(const line of chapter.dialogue??[]){const quote=document.createElement('blockquote');const speaker=document.createElement('strong');speaker.textContent=line.speaker;const text=document.createElement('span');text.textContent='“'+line.line+'”';quote.append(speaker,text);this.panel.append(quote);}
  if(chapter.choices?.length){
   const choices=document.createElement('div');choices.className='story-choices';
   for(const choice of chapter.choices){const button=document.createElement('button');button.type='button';button.className='story-choice';button.textContent=choice.label;button.addEventListener('click',()=>this.choose(choice,chapter.id));choices.append(button);}
   this.panel.append(choices);
  } else {
   const next=document.createElement('button');next.type='button';next.className='story-continue';next.textContent=chapter.continueLabel??'Devam et';
   next.addEventListener('click',()=>{if(this.progress.chapter>=chapters.length-1)this.close();else this.advance();});this.panel.append(next);
  }
  const footer=document.createElement('div');footer.className='story-footer';
  const progress=document.createElement('span');progress.textContent='BÖLÜM '+(this.progress.chapter+1)+' / '+chapters.length;
  const close=document.createElement('button');close.type='button';close.className='story-close';close.textContent='ŞİMDİLİK KAPAT';close.addEventListener('click',()=>this.close());
  footer.append(progress,close);this.panel.append(footer);
 }
}
