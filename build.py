import json,csv,collections,pathlib,re,urllib.parse,shutil
src=pathlib.Path('/mnt/data/hemplopedia_phase1');out=pathlib.Path(__file__).parent
old=json.loads((src/'catalog.json').read_text()); entries=[]; legal={}; corrections=[]
for r in old:
 r=r.copy();r['original_topic']=r['topic'];r['link_provenance']='original_or_normalized'
 if r['category']=='Legal':
  m=re.match(r'^(hemp legal .+?) hemp (all|images|videos)$',r['topic'],re.I)
  if m:
   name=m.group(1);kind={'all':'articles','images':'images','videos':'videos'}[m.group(2).lower()]
   key=name.casefold()
   if key not in legal:
    legal[key]={**r,'topic':name,'articles_url':'','images_url':'','videos_url':'','original_topic':name,'link_provenance':'normalized_from_pdf'}
    entries.append(legal[key])
   legal[key][kind+'_url']=r[kind+'_url'];continue
 entries.append(r)
for r in entries:
 for kind in ('articles','images','videos'):
  k=kind+'_url'
  if not r.get(k):
   query=urllib.parse.quote_plus(r['topic']);base='https://duckduckgo.com/?q='+query
   r[k]=base+({'articles':'','images':'&iax=images&ia=images','videos':'&ia=videos&iax=videos'}[kind]);r['link_provenance']='includes_generated_search_fallback'
  elif r['category']=='Legal':
   # Original legal PDF links accidentally include "hemp all/images/videos" as query terms. Keep them in original_links separately and provide cleaned working searches.
   r.setdefault('original_links',{})[kind]=r[k]
   query=urllib.parse.quote_plus(r['topic']);base='https://duckduckgo.com/?q='+query
   r[k]=base+({'articles':'','images':'&iax=images&ia=images','videos':'&ia=videos&iax=videos'}[kind]);r['link_provenance']='normalized_from_pdf'
 r['editorial_status']='Original catalog entry — research pending';r['description_excerpt']=r.get('description_excerpt') or ''
for i,r in enumerate(entries,1):r['id']=i
cats=[]
for name in dict.fromkeys(r['category'] for r in entries):
 a=[r for r in entries if r['category']==name];cats.append({'name':name,'count':len(a),'source_page':min(r['source_page'] for r in a)})
(out/'data').mkdir(exist_ok=True)
(out/'data/catalog.json').write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':')),encoding='utf8')
(out/'data/categories.json').write_text(json.dumps(cats,ensure_ascii=False,indent=2),encoding='utf8')
with (out/'data/catalog.csv').open('w',newline='',encoding='utf-8-sig') as f:
 cols=['id','category','topic','source_page','description_excerpt','editorial_status','link_provenance','articles_url','images_url','videos_url'];w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore');w.writeheader();w.writerows(entries)
shutil.copy('/mnt/data/Hemplopedia.pdf',out/'Hemplopedia_Original_Book.pdf')
print('entries',len(entries),'categories',len(cats),'legal',len(legal),'fallback',sum('fallback' in r['link_provenance'] for r in entries))
