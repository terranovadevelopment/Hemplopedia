const state={items:[],categories:[],category:null,query:''};
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titleCase=s=>String(s).replace(/\b\w/g,c=>c.toUpperCase());
const icons={"Agricultural":"🌾","Algae":"🧫","Automotive":"🚙","Bamboo":"🎋","Building Materials":"🧱","Business":"🏢","Clothing":"👕","Consumer Textiles":"🧵","Environmental":"🌍","Flax":"🌼","Food":"🥗","Free Energy":"⚡","Fresh Water":"💧","Health Care":"🩺","Housing":"🏡","Industrial Products":"⚙️","Industrial Textiles":"🪢","Information":"📚","Kenaf":"🌿","Legal":"⚖️","Marijuana":"🍃","Other":"🔬","Paper":"📜","Personal Hygiene":"🧼","Pets and Livestock":"🐑","Plastics":"♻️","Processing challenges":"🏭","Uses Flowers":"🌸","Uses Leaves":"🍀","Uses Roots":"🌱","Uses Seeds":"🫘","Uses Stalk":"🎍"};
const iconFor=c=>icons[c]||'🌿';
const palettes=[['#e1f2d9','#679b75'],['#e4f0ec','#448d80'],['#f4eadb','#a58a64'],['#e8e7f3','#8581ad'],['#e5eee1','#638963'],['#e7eef6','#668aa8']];
const paletteFor=s=>palettes[Array.from(s).reduce((a,c)=>a+c.charCodeAt(0),0)%palettes.length];
function art(category,topic='',small=false){
 const [light,dark]=paletteFor(category),icon=iconFor(category);
 const label=topic||category;
 const el=document.createElement('div');el.className='art '+(small?'art-small':'');
 el.style.setProperty('--art-light',light);el.style.setProperty('--art-dark',dark);
 el.innerHTML='<span class="art-orbit"></span><span class="art-icon" aria-hidden="true">'+icon+'</span><span class="art-caption">'+escapeHTML(label)+'</span>';
 el.setAttribute('role','img');el.setAttribute('aria-label','Illustration representing '+label);
 return el;
}
function show(view){for(const el of document.querySelectorAll('[data-view]'))el.hidden=el.dataset.view!==view;window.scrollTo({top:0,behavior:'instant'});}
function renderCategories(){
 const root=$('categoryGrid');root.replaceChildren();
 for(const c of state.categories){const b=document.createElement('button');b.className='category-card';b.append(art(c.name,'',true));
 const name=document.createElement('strong');name.textContent=c.name;const count=document.createElement('span');count.textContent=state.items.filter(x=>x.category===c.name).length+' topics →';b.append(name,count);b.onclick=()=>openCategory(c.name);root.append(b);}
}
function openCategory(name){state.category=name;$('categoryName').textContent=name;const a=state.items.filter(x=>x.category===name);$('categoryCountLabel').textContent=a.length+' topics';$('categoryHero').replaceChildren(art(name));$('topicSearch').value='';renderTopicList();history.replaceState(null,'','#category-'+encodeURIComponent(name));show('category');}
function renderTopicList(){const q=$('topicSearch').value.trim().toLowerCase();const list=state.items.filter(x=>x.category===state.category&&x.topic.toLowerCase().includes(q));const root=$('topicList');root.replaceChildren();for(const r of list){const b=document.createElement('button');b.className='topic-row';b.innerHTML='<span>'+escapeHTML(titleCase(r.topic))+'</span><span class="row-arrow">View article →</span>';b.onclick=()=>openTopic(r.id);root.append(b)}if(!list.length)root.textContent='No matching topics in this category.';}
function docFor(r){const t=titleCase(r.topic);const category=r.category;
 const intro='This Hemplopedia entry introduces '+t+' as a subject within '+category+'. It provides a starting point for understanding the terminology, exploring applications, and finding current research and examples.';
 const questions=['What does '+t+' mean in the context of hemp and related materials?','What processes, products, or applications are associated with this subject?','What scientific, environmental, economic, or regulatory evidence is available?'];
 const specific=r.description_excerpt&&r.description_status!=='generic_original_or_unverified'&&r.description_status!=='not_extracted'?r.description_excerpt:'';
 return '<p>'+escapeHTML(intro)+'</p><h3>Understanding the subject</h3><p>Hemp topics can involve agricultural practices, manufacturing processes, materials, markets, public policy, or historical uses. The relevant definitions and evidence depend on the specific application and location. Use the research links below to explore the subject in more detail.</p>'+(specific?'<h3>From the original catalog</h3><p>'+escapeHTML(specific)+'</p>':'')+'<h3>Questions to explore</h3><ul>'+questions.map(q=>'<li>'+escapeHTML(q)+'</li>').join('')+'</ul><h3>Research and verification</h3><p>This is an introductory encyclopedia document, not a completed scientific review. Claims about performance, health, safety, sustainability, or legal status should be checked against reliable primary sources. The links below lead to independent search results, not Hemplopedia endorsements.</p>';
}
function openTopic(id){const r=state.items.find(x=>x.id===Number(id));if(!r)return;state.category=r.category;
 $('articleCategory').textContent=r.category;$('articleTitle').textContent=titleCase(r.topic);
 $('articleArt').replaceChildren(art(r.category,titleCase(r.topic)));
 $('articleDocument').innerHTML=docFor(r);
 $('articleSource').textContent='Original Hemplopedia book: page '+r.source_page+'. Expanded introductory document; independently verified research is still being developed.';
 const links=$('articleLinks');links.replaceChildren();for(const [key,label] of [['articles_url','Articles ↗'],['images_url','Images ↗'],['videos_url','Videos ↗']]){if(!r[key])continue;const a=document.createElement('a');a.href=r[key];a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
 const related=state.items.filter(x=>x.category===r.category&&x.id!==r.id).slice(0,8);const root=$('relatedLinks');root.replaceChildren();for(const item of related){const b=document.createElement('button');b.textContent=titleCase(item.topic);b.onclick=()=>openTopic(item.id);root.append(b);}
 history.replaceState(null,'','#topic-'+r.id);show('article');}
function goHome(){history.replaceState(null,'','#explore');show('home');document.getElementById('explore').scrollIntoView({behavior:'smooth'});}
$('backToCategories').onclick=goHome;$('backToCategory').onclick=()=>openCategory(state.category);$('topicSearch').oninput=renderTopicList;
document.querySelectorAll('[data-go-home]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();goHome()}));
Promise.all([fetch('data/catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json()}),fetch('data/categories.json').then(r=>{if(!r.ok)throw Error('categories');return r.json()})]).then(([items,categories])=>{state.items=items;state.categories=categories;$('topicCount').textContent=items.length;$('categoryCount').textContent=categories.length;renderCategories();const h=decodeURIComponent(location.hash);if(/^#topic-\d+$/.test(h))openTopic(Number(h.slice(7)));else if(h.startsWith('#category-')&&categories.some(c=>c.name===h.slice(10)))openCategory(h.slice(10));}).catch(e=>{$('categoryGrid').textContent='Unable to load the Hemplopedia catalog. Please refresh or check the data files.';console.error(e)});
