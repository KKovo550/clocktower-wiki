(function(){
  'use strict';
  var root=document.documentElement,header=document.querySelector('.site-header'),hero=document.querySelector('.home-hero');
  var reduced=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):{matches:true};
  var pointer=window.matchMedia?window.matchMedia('(hover: hover) and (pointer: fine)'):{matches:false};
  var observer,scrollFrame=0,pointerFrame=0,latestPointer,surface,active=true;
  function revealAll(){
    if(observer)observer.disconnect();observer=null;root.classList.remove('motion-ready');
    document.querySelectorAll('[data-reveal]').forEach(function(node){node.removeAttribute('data-reveal');node.style.removeProperty('--reveal-delay');});
  }
  function revealSections(){
    if(reduced.matches||!window.IntersectionObserver)return;
    try{
      var currentObserver=new IntersectionObserver(function(entries){if(!active||reduced.matches||observer!==currentObserver)return;entries.forEach(function(entry){if(entry.isIntersecting){entry.target.dataset.reveal='visible';currentObserver.unobserve(entry.target);}});},{threshold:.08,rootMargin:'0px 0px -24px 0px'});
      observer=currentObserver;
      root.classList.add('motion-ready');
      var sections=document.querySelectorAll('.home-section,.role-index .filter-panel,.library-filters,.library-results-panel,.library-detail-panel,.cert-card');
      Array.from(sections).slice(0,32).forEach(function(node,index){
        // Above-fold and anchor-target content is immediately readable.
        var anchor=window.location.hash?document.getElementById(decodeURIComponent(window.location.hash.slice(1))):null;
        if(node.getBoundingClientRect().top<window.innerHeight-40||anchor&&node.contains(anchor))return;
        node.dataset.reveal='pending';node.style.setProperty('--reveal-delay',(index%3*35)+'ms');observer.observe(node);
      });
    }catch(error){revealAll();}
  }
  function updateScroll(){
    scrollFrame=0;if(!active||!header)return;
    var distance=Math.max(0,root.scrollHeight-window.innerHeight),position=Math.max(0,window.scrollY||0);
    header.classList.toggle('is-scrolled',position>16);
    header.style.setProperty('--reading-progress',distance?String(Math.min(1,position/distance)):'0');
  }
  function scheduleScroll(){if(active&&!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}
  function resetPointer(){
    if(surface){surface.style.removeProperty('--pointer-x');surface.style.removeProperty('--pointer-y');surface=null;}
    if(hero){hero.style.removeProperty('--dial-x');hero.style.removeProperty('--dial-y');}
    latestPointer=null;
  }
  function updatePointer(){
    pointerFrame=0;if(!active||reduced.matches||!pointer.matches||!latestPointer)return;
    var event=latestPointer;latestPointer=null;
    var next=event.target.closest?event.target.closest('.home-shortcuts>a'):null;
    if(surface&&surface!==next){surface.style.removeProperty('--pointer-x');surface.style.removeProperty('--pointer-y');}surface=next;
    if(surface){var box=surface.getBoundingClientRect();surface.style.setProperty('--pointer-x',(event.x-box.left)+'px');surface.style.setProperty('--pointer-y',(event.y-box.top)+'px');}
    if(hero&&hero.contains(event.target)){var cover=hero.getBoundingClientRect();hero.style.setProperty('--dial-x',((event.x-cover.left)/cover.width-.5)*12+'px');hero.style.setProperty('--dial-y',((event.y-cover.top)/cover.height-.5)*8+'px');}
    else if(hero){hero.style.removeProperty('--dial-x');hero.style.removeProperty('--dial-y');}
  }
  function movePointer(event){if(!active||reduced.matches||!pointer.matches)return;latestPointer={x:event.clientX,y:event.clientY,target:event.target};if(!pointerFrame)pointerFrame=requestAnimationFrame(updatePointer);}
  function motionChanged(){
    if(pointerFrame)cancelAnimationFrame(pointerFrame);pointerFrame=0;resetPointer();revealAll();if(active)revealSections();
  }
  window.addEventListener('scroll',scheduleScroll,{passive:true});window.addEventListener('resize',scheduleScroll,{passive:true});
  if(hero){document.addEventListener('pointermove',movePointer,{passive:true});document.addEventListener('pointerleave',resetPointer);}
  if(reduced.addEventListener)reduced.addEventListener('change',motionChanged);
  if(pointer.addEventListener)pointer.addEventListener('change',motionChanged);
  window.addEventListener('pagehide',function(){active=false;if(scrollFrame)cancelAnimationFrame(scrollFrame);if(pointerFrame)cancelAnimationFrame(pointerFrame);scrollFrame=pointerFrame=0;resetPointer();revealAll();});
  window.addEventListener('pageshow',function(event){if(event.persisted){active=true;updateScroll();revealSections();}});
  updateScroll();revealSections();
})();
