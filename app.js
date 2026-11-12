'use strict';
const $=id=>document.getElementById(id), state={items:[],categories:[],category:null};
const title=s=>String(s||'').replace(/\b\w/g,c=>c.toUpperCase());
const photoQueries={'Agricultural':'industrial hemp field','Algae':'algae microscope','Automotive':'automotive manufacturing','Bamboo':'bamboo forest','Building Materials':'hempcrete building','Business':'hemp processing factory','Clothing':'hemp clothing','Consumer Textiles':'fabric weaving','Environmental':'natural green landscape','Flax':'flax flowers field','Food':'hemp seeds food','Free Energy':'wind turbines solar panels','Fresh Water':'fresh water river','Health Care':'medical laboratory','Housing':'hempcrete house','Industrial Products':'hemp fibre industrial','Industrial Textiles':'industrial weaving textile','Information':'library books','Kenaf':'kenaf plant','Legal':'courthouse','Marijuana':'cannabis plant','Other':'hemp plant','Paper':'handmade paper','Personal Hygiene':'natural soap','Pets and Livestock':'farm sheep','Plastics':'bioplastics','Processing challenges':'hemp fiber processing','Uses Flowers':'hemp flowers','Uses Leaves':'hemp leaves','Uses Roots':'plant roots soil','Uses Seeds':'hemp seeds','Uses Stalk':'hemp stalks'};
const overrides={
'hemp animal bedding':'cow resting on straw bedding barn',
'hemp agricultural':'industrial hemp cultivation field',
'hemp botany':'cannabis sativa botanical plant',
'hemp compost':'compost soil organic matter',
'hemp crop rotation':'agricultural crop rotation field',
'hemp decortication':'hemp bast fibre processing',
'hemp fields':'industrial hemp plants field',
'hemp greenhouses':'greenhouse growing plants',
'hemp harvesting':'hemp harvest farm machinery',
'hemp irrigation':'agricultural irrigation field',
'hemp mulch':'mulch garden soil',
'hemp pollen isolation':'cannabis male pollen flower',
'hemp soil aeration':'soil cultivation plough',
'hemp soil improvement':'healthy agricultural soil',
'hemp weed suppression':'hemp field crop canopy',
'hemp planting':'planting hemp seeds',
'hemp watering':'watering plants field',
'hemp roots':'cannabis roots',
'hemp stems':'hemp stalk fibre',
'hemp leaves':'cannabis sativa leaves',
'algae biofuel production':'algae bioreactor',
'algae wastewater treatment':'algae wastewater treatment pond',
'algae water purification':'algae water filtration',
'hemp automotive biocomposite panels':'natural fibre composite car interior',
'hemp automotive body parts':'automotive composite car body',
'hemp automotive cabin insulation':'automotive interior insulation'
};
const cache=new Map(),pending=new Map(),curated=new Map(),writtenArticles=new Map();
const irrelevant=/(icon|logo|diagram|drawing|painting|map|poster|symbol|flag|svg|historic building|church|temple|castle|monument|portrait|statue|coat of arms|book cover)/i;
const common=new Set(['hemp','photograph','photo','industrial','natural','plant','plants','the','and','with','production','product','products','material','materials']);
function query(category,topic){
 if(!topic)return photoQueries[category]||'hemp plant';
 const t=topic.toLowerCase().trim();
 if(overrides[t])return overrides[t];
 const base=t.replace(/^hemp /,'').replace(/\b(uses|use of|applications of)\b/g,'').trim();
 if(category==='Algae')return 'algae '+base;
 if(category==='Bamboo')return 'bamboo '+base;
 if(category==='Flax')return 'flax '+base;
 if(category==='Kenaf')return 'kenaf '+base;
 if(category==='Marijuana')return 'cannabis '+base;
 return (base==='hemp'?'industrial hemp':base+' hemp').trim();
}
function keywords(q){return q.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>3&&!common.has(w))}
async function photo(q){
 if(cache.has(q))return cache.get(q);
 if(pending.has(q))return pending.get(q);
 const p=(async()=>{
  try{
   const words=keywords(q);
   const searches=[q,words.join(' ')];
   for(const search of [...new Set(searches)]){
    if(!search)continue;
    const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+search,gsrnamespace:'6',gsrlimit:'30',prop:'imageinfo',iiprop:'url|mime',iiurlwidth:'650',format:'json',origin:'*'});
    const res=await fetch(url,{mode:'cors'});if(!res.ok)continue;
    const data=await res.json();
    const matches=Object.values(data.query?.pages||{}).filter(x=>x.imageinfo?.[0]?.thumburl&&/^image\/(jpeg|png|webp)$/.test(x.imageinfo[0].mime)&&!irrelevant.test(x.title));
    const scored=matches.map(x=>{const t=x.title.toLowerCase().replace(/[_-]/g,' ');const hits=words.filter(w=>t.includes(w)).length;const score=hits*5+(t.includes('hemp')&&q.includes('hemp')?2:0)-(t.includes('building')&&!/build|house|architect|construct/.test(q)?8:0);return {x,score,hits}}).sort((a,b)=>b.score-a.score);
    const best=scored.find(v=>v.hits>0&&v.score>=5);
    if(best)return best.x.imageinfo[0].thumburl;
   }
  }catch(err){console.warn('Photo lookup unavailable',q,err)}
  return null;
 })();
 pending.set(q,p);try{const result=await p;cache.set(q,result);return result}finally{pending.delete(q)}
}
function art(category,topic='',small=false,id=null){const box=document.createElement('div');box.className='photo '+(small?'small':'');const label=document.createElement('span');label.textContent=topic||category;box.append(label);box.dataset.query=query(category,topic);box.dataset.fallback=query(category);if(id!==null)box.dataset.topicId=String(id);return box}
async function loadPhoto(box){if(box.dataset.loaded)return;box.dataset.loaded='1';const approved=curated.get(Number(box.dataset.topicId));const url=approved?.photo_url||await photo(box.dataset.query)||(box.classList.contains('small')?null:await photo(box.dataset.fallback));if(!url||!box.isConnected)return;const img=document.createElement('img');img.alt=box.querySelector('span')?.textContent||'Hemp subject';img.loading='lazy';img.src=url;img.onerror=()=>img.remove();box.prepend(img)}
const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);loadPhoto(e.target)}}),{rootMargin:'250px'}):null;
function watch(el){if(observer)observer.observe(el);else loadPhoto(el)}
function view(which){for(const id of ['homeView','categoryView','articleView'])$(id).hidden=id!==which;window.scrollTo(0,0)}
function home(){view('homeView');history.replaceState(null,'','#explore');$('explore').scrollIntoView()}
function renderCategories(){const grid=$('categoryGrid');grid.replaceChildren();for(const c of state.categories){const b=document.createElement('button');b.className='category-card';const image=art(c.name,'',true);b.append(image);const name=document.createElement('strong');name.textContent=c.name;const count=document.createElement('span');count.textContent=state.items.filter(x=>x.category===c.name).length+' topics →';b.append(name,count);b.onclick=()=>category(c.name);grid.append(b);watch(image)}}
function category(name){state.category=name;$('categoryName').textContent=name;$('categoryCountLabel').textContent=state.items.filter(x=>x.category===name).length+' topics';const a=art(name);$('categoryHero').replaceChildren(a);$('topicSearch').value='';renderTopics();view('categoryView');watch(a);history.replaceState(null,'','#category-'+encodeURIComponent(name))}
function renderTopics(){const root=$('topicList');root.replaceChildren();const q=$('topicSearch').value.trim().toLowerCase();for(const t of state.items.filter(x=>x.category===state.category&&x.topic.toLowerCase().includes(q))){const b=document.createElement('button');b.className='topic-row';const image=art(t.category,title(t.topic),true,t.id);const text=document.createElement('strong');text.textContent=title(t.topic);const arrow=document.createElement('span');arrow.textContent='Read topic →';b.append(image,text,arrow);b.onclick=()=>article(t.id);root.append(b);watch(image)}}
function article(id){const t=state.items.find(x=>x.id===Number(id));if(!t)return;state.category=t.category;$('articleCategory').textContent=t.category;$('articleTitle').textContent=title(t.topic);const image=art(t.category,title(t.topic),false,t.id);$('articleArt').replaceChildren(image);const d=$('articleDocument');d.replaceChildren();const written=writtenArticles.get(t.id);if(written){const heading=document.createElement('h2');heading.textContent=written.heading;d.append(heading);for(const paragraph of written.paragraphs){const p=document.createElement('p');p.textContent=paragraph;d.append(p)}}else{const p=document.createElement('p');p.textContent='A full, subject-specific article for '+title(t.topic)+' is being prepared. This topic is included in the original Hemplopedia catalog, but its expanded encyclopedia article has not yet been published.';d.append(p);const note=document.createElement('p');note.textContent='In the meantime, use the Articles, Images, and Videos research links below to explore this subject.';d.append(note);}$('articleSource').textContent=written?'Original Hemplopedia book: page '+t.source_page+'. New subject-specific editorial article; additional source verification is ongoing.':'Original Hemplopedia book: page '+t.source_page+'. Expanded article pending.';const links=$('articleLinks');links.replaceChildren();for(const [key,label] of [['articles_url','Articles ↗'],['images_url','Images ↗'],['videos_url','Videos ↗']]){const a=document.createElement('a');a.href=t[key];a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;links.append(a)}const related=$('relatedLinks');related.replaceChildren();for(const r of state.items.filter(x=>x.category===t.category&&x.id!==t.id).slice(0,8)){const b=document.createElement('button');b.textContent=title(r.topic);b.onclick=()=>article(r.id);related.append(b)}view('articleView');watch(image);history.replaceState(null,'','#topic-'+t.id)}
$('backToCategories').onclick=home;$('backToCategory').onclick=()=>category(state.category);$('topicSearch').oninput=renderTopics;document.querySelector('.logo').onclick=e=>{e.preventDefault();home()};
Promise.all([fetch('data/catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json()}),fetch('data/categories.json').then(r=>{if(!r.ok)throw Error('categories');return r.json()}),fetch('data/image-catalog.json').then(r=>r.ok?r.json():{entries:[]}).catch(()=>({entries:[]})),fetch('data/articles-clothing.json').then(r=>r.ok?r.json():{articles:{}}).catch(()=>({articles:{}})),fetch('data/articles-agricultural.json').then(r=>r.ok?r.json():{articles:{}}).catch(()=>({articles:{}})),fetch('data/articles-algae.json').then(r=>r.ok?r.json():{articles:{}}).catch(()=>({articles:{}})),fetch('data/articles-automotive.json').then(r=>r.ok?r.json():{articles:{}}).catch(()=>({articles:{}})),fetch('data/articles-bamboo.json').then(r=>r.ok?r.json():{articles:{}}).catch(()=>({articles:{}})),fetch('data/articles-building-materials.json').then(r=>r.ok?r.json():{articles:{}}).catch(()=>({articles:{}}))]).then(([items,categories,images,articles,agricultural,algae,automotive,bamboo,buildingMaterials])=>{for(const collection of [articles,agricultural,algae,automotive,bamboo,buildingMaterials])for(const [id,entry] of Object.entries(collection.articles||{}))writtenArticles.set(Number(id),entry);for(const entry of images.entries||[]){if(entry.status==='approved'&&/^https:\/\//.test(entry.photo_url||'')&&entry.source_url&&entry.license)curated.set(Number(entry.id),entry)}state.items=items;state.categories=categories;$('topicCount').textContent=items.length;$('categoryCount').textContent=categories.length;renderCategories();photo('industrial hemp field').then(url=>{if(url)document.querySelector('.hero').style.setProperty('--hero-photo','url("'+url+'")')});const hash=decodeURIComponent(location.hash);if(/^#topic-\d+$/.test(hash))article(Number(hash.slice(7)));else if(hash.startsWith('#category-')&&categories.some(c=>c.name===hash.slice(10)))category(hash.slice(10))}).catch(e=>{$('categoryGrid').textContent='Unable to load the Hemplopedia catalog. Check the data folder.';console.error(e)});
