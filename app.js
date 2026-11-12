const state={items:[],categories:[],category:null,query:''};
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titleCase=s=>String(s).replace(/\b\w/g,c=>c.toUpperCase());
// Photographic images are retrieved from Wikimedia Commons under their original licenses.
// Search is lazy for category cards and on demand for individual topics.
const photoQueries={
'Agricultural':'industrial hemp field agriculture','Algae':'green algae microscopy photograph','Automotive':'automobile manufacturing factory','Bamboo':'bamboo forest','Building Materials':'hempcrete construction building','Business':'industrial hemp manufacturing','Clothing':'hemp fabric clothing','Consumer Textiles':'natural textile fabric weaving','Environmental':'hemp field nature','Flax':'flax flowers field','Food':'hemp seeds food','Free Energy':'renewable solar wind energy','Fresh Water':'freshwater river landscape','Health Care':'medical research laboratory','Housing':'hempcrete house construction','Industrial Products':'industrial hemp fiber','Industrial Textiles':'industrial textile weaving','Information':'library books research','Kenaf':'kenaf hibiscus cannabinus plant','Legal':'courthouse law','Marijuana':'cannabis plant photograph','Other':'hemp plant','Paper':'handmade paper sheets','Personal Hygiene':'natural soap products','Pets and Livestock':'farm sheep livestock','Plastics':'bioplastic material','Processing challenges':'hemp fiber processing machinery','Uses Flowers':'hemp cannabis flowers','Uses Leaves':'hemp cannabis leaves','Uses Roots':'plant roots soil','Uses Seeds':'hemp seeds closeup','Uses Stalk':'hemp stalk fiber'
};
const photoCache=new Map(), pendingPhotos=new Map();
const badTitle=/\\b(icon|logo|diagram|drawing|illustration|painting|map|symbol|chart|poster|coat of arms|flag|svg|clipart|render|artwork|vector)\\b/i;
function photoQuery(category,topic){if(!topic)return photoQueries[category]||'industrial hemp plant';const t=topic.toLowerCase().replace(/^hemp /,'');return t.includes('hemp')||t.includes('cannabis')?t+' photograph':'hemp '+t+' photograph';}
async function getPhoto(query){
 if(photoCache.has(query))return photoCache.get(query);
 if(pendingPhotos.has(query))return pendingPhotos.get(query);
 const promise=(async()=>{
  try{
   const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+query,gsrnamespace:'6',gsrlimit:'15',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'1100',format:'json',origin:'*'});
   const response=await fetch(url,{mode:'cors'});if(!response.ok)throw Error('photo search');
   const data=await response.json();const pages=Object.values(data.query?.pages||{});
   const matches=pages.filter(p=>{const i=p.imageinfo?.[0];return i&&/^image\\/(jpeg|png|webp)$/.test(i.mime||'')&&!badTitle.test(p.title||'')&&i.thumburl;});
   const match=matches.find(p=>/\\b(photo|hemp|cannabis|field|plant|fiber|bamboo|flax)\\b/i.test(p.title))||matches[0];
   if(!match)throw Error('no suitable photo');
   const info=match.imageinfo[0],metadata=info.extmetadata||{};
   const result={url:info.thumburl,description:match.title.replace(/^File:/,''),source:info.descriptionurl||'https://commons.wikimedia.org/',credit:(metadata.Artist?.value||'').replace(/<[^>]*>/g,'').slice(0,160),license:(metadata.LicenseShortName?.value||'Wikimedia Commons')};
   photoCache.set(query,result);return result;
  }catch(err){photoCache.set(query,null);return null;}
 })();pendingPhotos.set(query,promise);try{return await promise}finally{pendingPhotos.delete(query)}
}
function art(category,topic='',small=false){
 const label=topic||category,query=photoQuery(category,topic);
 const el=document.createElement('div');el.className='art photo-art '+(small?'art-small':'');
 el.setAttribute('role','img');el.setAttribute('aria-label','Photograph related to '+label);
 el.innerHTML='<div class="photo-placeholder" aria-hidden="true"></div><span class="photo-label">'+escapeHTML(label)+'</span>';
 el.dataset.photoQuery=query;el.dataset.category=category;
 return el;
}
async function loadArt(el){
 if(!el||el.dataset.loaded)return;el.dataset.loaded='pending';
 let photo=await getPhoto(el.dataset.photoQuery);
 if(!photo&&el.dataset.photoQuery!==photoQuery(el.dataset.category))photo=await getPhoto(photoQuery(el.dataset.category));
 if(!el.isConnected)return;
 if(photo){const img=document.createElement('img');img.src=photo.url;img.alt=photo.description;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.remove();el.classList.add('photo-unavailable');};el.prepend(img);el.classList.add('has-photo');el.title=photo.description+' — '+photo.license+' (Wikimedia Commons)';}
 else el.classList.add('photo-unavailable');
}
const photoObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){photoObserver.unobserve(entry.target);loadArt(entry.target);}}},{rootMargin:'250px'}):null;
function watchArt(el){if(photoObserver)photoObserver.observe(el);else loadArt(el)}
function show(view){for(const el of document.querySelectorAll('[data-view]'))el.hidden=el.dataset.view!==view;window.scrollTo({top:0,behavior:'instant'});}
function renderCategories(){
 const root=$('categoryGrid');root.replaceChildren();
 for(const c of state.categories){const b=document.createElement('button');b.className='category-card';const picture=art(c.name,'',true);b.append(picture);watchArt(picture);
 const name=document.createElement('strong');name.textContent=c.name;const count=document.createElement('span');count.textContent=state.items.filter(x=>x.category===c.name).length+' topics →';b.append(name,count);b.onclick=()=>openCategory(c.name);root.append(b);}
}
function openCategory(name){state.category=name;$('categoryName').textContent=name;const a=state.items.filter(x=>x.category===name);$('categoryCountLabel').textContent=a.length+' topics';const picture=art(name);$('categoryHero').replaceChildren(picture);watchArt(picture);$('topicSearch').value='';renderTopicList();history.replaceState(null,'','#category-'+encodeURIComponent(name));show('category');}
function renderTopicList(){const q=$('topicSearch').value.trim().toLowerCase();const list=state.items.filter(x=>x.category===state.category&&x.topic.toLowerCase().includes(q));const root=$('topicList');root.replaceChildren();for(const r of list){const b=document.createElement('button');b.className='topic-row';b.innerHTML='<span>'+escapeHTML(titleCase(r.topic))+'</span><span class="row-arrow">View article →</span>';b.onclick=()=>openTopic(r.id);root.append(b)}if(!list.length)root.textContent='No matching topics in this category.';}
function docFor(r){const t=titleCase(r.topic);const category=r.category;
 const intro='This Hemplopedia entry introduces '+t+' as a subject within '+category+'. It provides a starting point for understanding the terminology, exploring applications, and finding current research and examples.';
 const questions=['What does '+t+' mean in the context of hemp and related materials?','What processes, products, or applications are associated with this subject?','What scientific, environmental, economic, or regulatory evidence is available?'];
 const specific=r.description_excerpt&&r.description_status!=='generic_original_or_unverified'&&r.description_status!=='not_extracted'?r.description_excerpt:'';
 return '<p>'+escapeHTML(intro)+'</p><h3>Understanding the subject</h3><p>Hemp topics can involve agricultural practices, manufacturing processes, materials, markets, public policy, or historical uses. The relevant definitions and evidence depend on the specific application and location. Use the research links below to explore the subject in more detail.</p>'+(specific?'<h3>From the original catalog</h3><p>'+escapeHTML(specific)+'</p>':'')+'<h3>Questions to explore</h3><ul>'+questions.map(q=>'<li>'+escapeHTML(q)+'</li>').join('')+'</ul><h3>Research and verification</h3><p>This is an introductory encyclopedia document, not a completed scientific review. Claims about performance, health, safety, sustainability, or legal status should be checked against reliable primary sources. The links below lead to independent search results, not Hemplopedia endorsements.</p>';
}
function openTopic(id){const r=state.items.find(x=>x.id===Number(id));if(!r)return;state.category=r.category;
 $('articleCategory').textContent=r.category;$('articleTitle').textContent=titleCase(r.topic);
 const picture=art(r.category,titleCase(r.topic));$('articleArt').replaceChildren(picture);watchArt(picture);
 $('articleDocument').innerHTML=docFor(r);
 $('articleSource').textContent='Original Hemplopedia book: page '+r.source_page+'. Expanded introductory document; independently verified research is still being developed.';
 const links=$('articleLinks');links.replaceChildren();for(const [key,label] of [['articles_url','Articles ↗'],['images_url','Images ↗'],['videos_url','Videos ↗']]){if(!r[key])continue;const a=document.createElement('a');a.href=r[key];a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
 const related=state.items.filter(x=>x.category===r.category&&x.id!==r.id).slice(0,8);const root=$('relatedLinks');root.replaceChildren();for(const item of related){const b=document.createElement('button');b.textContent=titleCase(item.topic);b.onclick=()=>openTopic(item.id);root.append(b);}
 history.replaceState(null,'','#topic-'+r.id);show('article');}
function goHome(){history.replaceState(null,'','#explore');show('home');document.getElementById('explore').scrollIntoView({behavior:'smooth'});}
$('backToCategories').onclick=goHome;$('backToCategory').onclick=()=>openCategory(state.category);$('topicSearch').oninput=renderTopicList;
document.querySelectorAll('[data-go-home]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();goHome()}));
Promise.all([fetch('data/catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json()}),fetch('data/categories.json').then(r=>{if(!r.ok)throw Error('categories');return r.json()})]).then(([items,categories])=>{state.items=items;state.categories=categories;$('topicCount').textContent=items.length;$('categoryCount').textContent=categories.length;renderCategories();const h=decodeURIComponent(location.hash);if(/^#topic-\d+$/.test(h))openTopic(Number(h.slice(7)));else if(h.startsWith('#category-')&&categories.some(c=>c.name===h.slice(10)))openCategory(h.slice(10));}).catch(e=>{$('categoryGrid').textContent='Unable to load the Hemplopedia catalog. Please refresh or check the data files.';console.error(e)});
