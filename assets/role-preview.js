(function(){
  'use strict';
  const base=new URL('../',document.currentScript.src);
  let loading,dialog,content,heading,opener,revision=0,showTimer,hideTimer;
  function element(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
  function load(){if(window.WIKI_ROLE_PREVIEWS)return Promise.resolve(window.WIKI_ROLE_PREVIEWS);if(!loading)loading=new Promise((resolve,reject)=>{const script=element('script');script.src=new URL('assets/role-preview-data.js',base).href;script.onload=()=>window.WIKI_ROLE_PREVIEWS?resolve(window.WIKI_ROLE_PREVIEWS):reject(Error('预览资料不完整'));script.onerror=()=>{script.remove();reject(Error('预览资料加载失败，请打开完整页面查看'));};document.head.append(script);}).catch(error=>{loading=null;throw error;});return loading;}
  function create(){
    dialog=element('div');dialog.className='role-preview role-preview-hover';dialog.hidden=true;dialog.setAttribute('role','region');dialog.setAttribute('aria-labelledby','role-preview-heading');
    const header=element('div');header.className='role-preview-header';heading=element('h2');heading.id='role-preview-heading';header.append(heading);
    content=element('div');content.className='role-preview-content';dialog.append(header,content);document.body.append(dialog);
    dialog.addEventListener('mouseenter',()=>{clearTimeout(hideTimer);dialog.classList.remove('is-hiding');});
    dialog.addEventListener('mouseleave',scheduleHide);
  }
  function hide(){clearTimeout(showTimer);clearTimeout(hideTimer);revision++;opener=null;if(!dialog||dialog.hidden)return;if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){dialog.hidden=true;return;}dialog.classList.add('is-hiding');hideTimer=setTimeout(()=>{dialog.hidden=true;dialog.classList.remove('is-hiding');},130);}
  function scheduleHide(){clearTimeout(showTimer);clearTimeout(hideTimer);hideTimer=setTimeout(hide,180);}
  function target(icon){
    const link=icon?.closest('a[href]');if(!link||!link.closest('.gallerybox,.homebrew-card,.role-index .card,.charinfo-img'))return;
    const url=new URL(link.href);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||!url.pathname.endsWith('.html'))return;
    const key=decodeURIComponent(url.pathname.slice(base.pathname.length));if(!key.startsWith('pages/')||key.startsWith('pages/文件'))return;
    return {icon,link,url,key};
  }
  function prepareIcons(){
    document.querySelectorAll('.gallerybox a img,.homebrew-card a img,.charinfo-img img,.role-index .card>img').forEach(image=>{
      let link=image.closest('a[href]');
      if(!link&&image.closest('.role-index .card')){const detail=image.closest('.card').querySelector('a.wiki-detail');if(detail){link=element('a');link.href=detail.href;image.before(link);link.append(image);}}
      if(image.closest('.charinfo-img')&&link)link.href=window.location.href;
      if(!target(image))return;link.removeAttribute('title');if(!link.textContent.trim())link.setAttribute('aria-label',(link.closest('.gallerybox')?.querySelector('.gallerycaption')?.textContent.trim()||image.alt||'角色')+'，打开角色页面');
    });
  }
  prepareIcons();const index=document.querySelector('.role-index');if(index&&typeof MutationObserver!=='undefined')new MutationObserver(prepareIcons).observe(index,{childList:true,subtree:true});
  function position(icon){const box=icon.getBoundingClientRect(),width=Math.min(400,window.innerWidth-24);dialog.style.width=width+'px';dialog.style.left=Math.max(12,Math.min(box.right+12,window.innerWidth-width-12))+'px';dialog.style.top=Math.max(12,Math.min(box.top,window.innerHeight-Math.min(dialog.scrollHeight,window.innerHeight*0.72)-12))+'px';}
  async function show(info){
    if(!dialog)create();opener=info.icon;const token=++revision;heading.textContent=info.link.textContent.trim()||info.icon.alt||'角色预览';content.replaceChildren(element('p','正在加载角色资料…'));
    const {key}=info;clearTimeout(hideTimer);dialog.classList.remove('is-hiding');dialog.hidden=false;position(info.icon);
    try{
      const entries=await load();if(token!==revision||dialog.hidden)return;const data=entries[key];if(!data){content.replaceChildren(element('p','该角色暂未收录预览资料。'));return;}
      const types={townsfolk:'镇民',outsider:'外来者',minion:'爪牙',demon:'恶魔',traveller:'旅行者',traveler:'旅行者',fabled:'传奇角色',loric:'奇遇角色'};
      const name=element('span',data.name);name.className='role-preview-name';
      heading.replaceChildren(name,document.createTextNode((data.englishName?' ('+data.englishName+')':'')+' - '+(types[data.roles[0].team]||data.roles[0].team)));
      content.replaceChildren();
      for(const role of data.roles){const ability=element('p',(data.roles.length>1?role.name+'：':'')+role.ability);ability.className='role-preview-ability';content.append(ability);}
      for(const story of data.background||[]){const paragraph=element('p',story);paragraph.className='role-preview-story';content.append(paragraph);}
      position(info.icon);
    }catch(error){if(token===revision&&!dialog.hidden)content.replaceChildren(element('p',error.message));}
  }
  document.addEventListener('mouseover',event=>{const icon=event.target.closest?.('img,.homebrew-icon'),info=target(icon);if(!info)return;clearTimeout(hideTimer);if(opener===icon)return;clearTimeout(showTimer);showTimer=setTimeout(()=>show(info),250);});
  document.addEventListener('mouseout',event=>{const icon=event.target.closest?.('img,.homebrew-icon');if(!target(icon)||icon.contains(event.relatedTarget))return;if(dialog?.contains(event.relatedTarget))return;scheduleHide();});
  document.addEventListener('focusin',event=>{const info=target(event.target.querySelector?.('img'));if(info){clearTimeout(hideTimer);show(info);}});
  document.addEventListener('focusout',event=>{if(dialog?.contains(event.relatedTarget))return;if(event.target.contains?.(opener)||dialog?.contains(event.target))scheduleHide();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  document.addEventListener('click',event=>{if(!dialog?.contains(event.target))hide();},true);
  window.addEventListener('resize',hide);window.addEventListener('scroll',event=>{if(!dialog?.contains(event.target))hide();},true);
})();
