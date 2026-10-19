(function(root){
  'use strict';
  var document=root.document,script=document.currentScript,version=script&&script.getAttribute('data-site-version');
  if(!/^[a-f0-9]{16,64}$/.test(version||''))return;
  var base=new URL('../',script.src),latest='',dismissed='',notice,inFlight,lastCheck=-Infinity;
  function asset(value){
    try{
      var url=new URL(value,document.baseURI);
      if(url.origin!==base.origin||url.protocol!==base.protocol||!url.pathname.startsWith(base.pathname))return value;
      url.searchParams.set('v',version);return url.href;
    }catch(ignore){return value;}
  }
  function updateURL(){var url=new URL(root.location.href);if(latest)url.searchParams.set('_site',latest);return url.href;}
  function show(){
    if(!document.body||latest===dismissed)return;
    if(!notice){
      notice=document.createElement('aside');notice.className='site-update-notice';notice.setAttribute('data-site-update','');notice.setAttribute('aria-label','网站更新');
      var text=document.createElement('p');text.setAttribute('role','status');text.setAttribute('aria-live','polite');
      text.textContent='发现网站新版。请确认编辑内容已保存后更新页面。';
      var refresh=document.createElement('button');refresh.type='button';refresh.textContent='更新页面';refresh.setAttribute('data-site-update-refresh','');
      var dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='稍后';dismiss.setAttribute('data-site-update-dismiss','');
      refresh.onclick=function(){
        if(document.querySelector('dialog[open]')){text.textContent='请先完成或关闭正在进行的操作，再更新页面。';return;}
        if(typeof root.captureDraft==='function'&&typeof root.save==='function'){
          try{if(root.save()===false)throw Error('save failed');}catch(ignore){text.textContent='当前草稿保存失败，请先导出备份，再更新页面。';return;}
        }
        root.location.replace(updateURL());
      };
      dismiss.onclick=function(){dismissed=latest;notice.hidden=true;};
      notice.append(text,refresh,dismiss);document.body.appendChild(notice);
    }
    notice.hidden=false;
  }
  function check(force){
    if(!/^https?:$/.test(root.location.protocol)||typeof root.fetch!=='function'||document.visibilityState==='hidden')return Promise.resolve();
    if(inFlight)return inFlight;
    var now=Date.now();if(!force&&now-lastCheck<60000)return Promise.resolve();lastCheck=now;
    var url=new URL('site-version.json',base);url.searchParams.set('check',String(now));
    var controller=typeof root.AbortController==='function'?new root.AbortController():null;
    var timer=controller?root.setTimeout(function(){controller.abort();},8000):null;
    inFlight=Promise.resolve().then(function(){return root.fetch(url.href,{cache:'no-store',credentials:'same-origin',signal:controller?controller.signal:undefined});}).then(function(response){
      if(!response.ok)throw Error('version unavailable');return response.json();
    }).then(function(value){
      if(!value||!/^[a-f0-9]{16,64}$/.test(value.version||''))return;
      latest=value.version;
      if(latest!==version)show();else if(notice)notice.hidden=true;
    }).catch(function(){/* Offline and temporary deployment failures leave the current page usable. */}).finally(function(){if(timer!==null)root.clearTimeout(timer);inFlight=null;});
    return inFlight;
  }
  root.WikiCache={asset:asset,check:check,updateURL:updateURL};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){check();},{once:true});else check();
  document.addEventListener('visibilitychange',function(){if(document.visibilityState!=='hidden')check();});
  root.addEventListener('pageshow',function(event){check(event.persisted);});
  root.addEventListener('online',function(){check(true);});
  root.addEventListener('focus',function(){check();});
})(window);
