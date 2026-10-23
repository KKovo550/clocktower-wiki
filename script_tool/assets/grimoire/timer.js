/* Page-local discussion timer; deadlines keep background tabs from slowing the clock. */
(function(root){
 'use strict';
 function create({app,node,button,viewport=()=>({top:0,bottom:root.innerHeight}),measure=n=>n.getBoundingClientRect()}){
  const modes={public:{name:'公聊',duration:300000},private:{name:'私聊',duration:180000}};
  const stateKey='botc_grimoire_timer_state_v1';let savedTimer;try{savedTimer=JSON.parse(root.sessionStorage.getItem(stateKey));}catch{}
  const centerKey='botc_grimoire_timer_center_v1';let showCenter=true;
  try{const saved=JSON.parse(root.localStorage.getItem(centerKey));if(typeof saved==='boolean')showCenter=saved;}catch{}
  let mode='public',remaining=modes.public.duration,deadline=0,running=false,finished=false,started=false,interval=null,audio;
  const center=node('div',undefined,'g-timer-center g-glass-surface'),centerDisplay=node('output','','g-timer-center-display'),hourglass=document.createElementNS('http://www.w3.org/2000/svg','svg');center.id='gTimerCenter';center.hidden=true;centerDisplay.id='gTimerCenterDisplay';centerDisplay.setAttribute('role','timer');centerDisplay.setAttribute('aria-live','off');
  hourglass.setAttribute('viewBox','0 0 24 28');hourglass.setAttribute('aria-hidden','true');hourglass.setAttribute('focusable','false');hourglass.classList.add('g-timer-hourglass');
  const outline=document.createElementNS(hourglass.namespaceURI,'path');outline.setAttribute('d','M5 2h14M5 26h14M7 3v4c0 4 5 5 5 7s-5 3-5 7v4M17 3v4c0 4-5 5-5 7s5 3 5 7v4');outline.setAttribute('fill','none');outline.setAttribute('stroke','currentColor');outline.setAttribute('stroke-width','2.5');outline.setAttribute('stroke-linecap','round');
  const sand=document.createElementNS(hourglass.namespaceURI,'path');sand.setAttribute('d','M8 6h8l-4 5ZM8 23l4-5 4 5Z');sand.setAttribute('fill','currentColor');hourglass.append(outline,sand);center.append(hourglass,centerDisplay);app.querySelector('#gBoard').append(center);
  const panel=node('section',undefined,'g-timer-panel'),rail=button('',toggle,'g-rail-button g-timer-rail'),railLabel=node('span','计时'),mini=node('span','','g-timer-mini');
  panel.id='gTimerPanel';panel.hidden=true;panel.setAttribute('aria-labelledby','gTimerTitle');
  rail.id='gTimer';rail.setAttribute('aria-controls',panel.id);rail.setAttribute('aria-expanded','false');rail.append(railLabel,mini);
  const head=node('div',undefined,'g-timer-heading'),title=node('h2','倒计时'),close=button('×',()=>setOpen(false),'subtle');title.id='gTimerTitle';close.id='gTimerClose';close.setAttribute('aria-label','收起计时工具');head.append(title,close);
  const tabs=node('div',undefined,'g-timer-modes'),modeButtons={};tabs.setAttribute('aria-label','计时用途');
  for(const [key,value]of Object.entries(modes)){const b=button(value.name,()=>{if(running)return;mode=key;remaining=value.duration;finished=false;started=false;fields();status.textContent='可设置'+value.name+'时间';paint();},'subtle');b.id='gTimerMode_'+key;modeButtons[key]=b;tabs.append(b);}
  const display=node('output','','g-timer-display'),progress=node('progress');display.id='gTimerDisplay';display.setAttribute('role','timer');display.setAttribute('aria-live','off');progress.max=1;progress.setAttribute('aria-label','剩余时间比例');
  const inputs=node('div',undefined,'g-timer-inputs'),minutes=node('input'),seconds=node('input');
  for(const [input,id,label,max]of [[minutes,'gTimerMinutes','分钟',180],[seconds,'gTimerSeconds','秒',59]]){input.type='number';input.id=id;input.min='0';input.max=String(max);input.step='1';input.inputMode='numeric';input.setAttribute('aria-label',label);const wrap=node('label',label);wrap.append(input);inputs.append(wrap);input.onchange=changeDuration;}
  const presets=node('div',undefined,'g-timer-presets');presets.setAttribute('aria-label','快捷时长');
  for(const value of [1,3,5,10]){const b=button(value+' 分钟',()=>{if(running)return;modes[mode].duration=remaining=value*60000;finished=false;started=false;fields();status.textContent='已设为 '+value+' 分钟';paint();},'subtle');b.dataset.minutes=String(value);presets.append(b);}
  const actions=node('div',undefined,'g-timer-actions'),start=button('开始',()=>{if(running){remaining=Math.max(0,deadline-Date.now());if(!remaining){expire();return;}stop();status.textContent='已暂停';announce();paint();return;}if(!changeDuration(false))return;if(!remaining)remaining=modes[mode].duration;unlockAudio();deadline=Date.now()+remaining;running=true;finished=false;started=true;interval=root.setInterval(tick,200);status.textContent='正在'+modes[mode].name+'计时';announce();paint();},'primary'),reset=button('重置',()=>{stop();remaining=modes[mode].duration;finished=false;started=false;fields();status.textContent='已重置';announce();paint();},'subtle');
  start.id='gTimerStart';reset.id='gTimerReset';actions.append(start,reset);
  const sound=node('input'),soundLabel=node('label','到时提示音','g-timer-sound'),status=node('p','设置时间后点击开始','g-timer-status'),announcement=node('p','','g-sr-only');sound.type='checkbox';sound.id='gTimerSound';sound.checked=true;soundLabel.prepend(sound);status.id='gTimerStatus';announcement.id='gTimerAnnouncement';announcement.setAttribute('role','status');
  const centerToggle=node('input'),centerLabel=node('label','中央显示倒计时','g-timer-sound'),options=node('div',undefined,'g-timer-options');centerToggle.type='checkbox';centerToggle.id='gTimerShowCenter';centerToggle.checked=showCenter;centerLabel.prepend(centerToggle);options.append(soundLabel,centerLabel);
  centerToggle.onchange=()=>{showCenter=centerToggle.checked;paint();try{root.localStorage.setItem(centerKey,JSON.stringify(showCenter));}catch{status.textContent='显示设置已更新，但浏览器暂时无法保存。';announce();}};
  sound.onchange=()=>{if(sound.checked&&running)unlockAudio();persist();};panel.append(head,tabs,display,progress,inputs,presets,actions,options,status);app.querySelector('.g-left-tools').append(rail);app.append(panel,announcement);
  function format(ms){const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
  function fields(){const total=modes[mode].duration/1000;minutes.value=String(Math.floor(total/60));seconds.value=String(total%60);}
  function announce(){announcement.textContent=modes[mode].name+'：'+status.textContent;}
  function stop(){running=false;if(interval!==null)root.clearInterval(interval);interval=null;}
  function changeDuration(resetRemaining=true){
   if(running)return false;const m=Number(minutes.value),s=Number(seconds.value),total=m*60+s;
   if(!minutes.value.trim()||!seconds.value.trim()||!Number.isInteger(m)||!Number.isInteger(s)||m<0||m>180||s<0||s>59||total<1||total>10800){status.textContent='请输入 1 秒至 180 分钟的时长，秒数为 0–59。';announce();return false;}
   const value=total*1000;if(resetRemaining||value!==modes[mode].duration){modes[mode].duration=remaining=value;finished=false;started=false;status.textContent='时长已更新';paint();}return true;
  }
  let persistedTimer='';function persist(){try{const raw=JSON.stringify({version:1,mode,durations:Object.fromEntries(Object.entries(modes).map(([k,v])=>[k,v.duration])),remaining:running?modes[mode].duration:remaining,deadline,running,finished,started,open:!panel.hidden,sound:sound.checked});if(raw!==persistedTimer){root.sessionStorage.setItem(stateKey,raw);persistedTimer=raw;}}catch{}}
  function paint(){
   persist();const text=format(remaining);display.textContent=text;display.setAttribute('aria-label',modes[mode].name+'剩余 '+text);mini.textContent=finished?'时间到':text;rail.setAttribute('aria-label',(panel.hidden?'展开':'收起')+'计时工具，'+modes[mode].name+(finished?'时间到':'剩余 '+text));rail.title=modes[mode].name+' · '+(finished?'时间到':running?'剩余 '+text:'已暂停 '+text);rail.classList.toggle('is-running',running);rail.classList.toggle('is-finished',finished);panel.classList.toggle('is-finished',finished);progress.value=Math.min(1,remaining/modes[mode].duration);start.textContent=running?'暂停':finished?'重新开始':remaining<modes[mode].duration?'继续':'开始';
   minutes.disabled=seconds.disabled=running;for(const [key,b]of Object.entries(modeButtons)){b.disabled=running;b.setAttribute('aria-pressed',String(key===mode));}for(const b of presets.children)b.disabled=running;
   center.hidden=!showCenter||!started;center.classList.toggle('is-running',running);center.classList.toggle('is-animating',running&&showCenter&&!document.hidden);center.classList.toggle('is-finished',finished);center.classList.toggle('is-paused',started&&!running&&!finished);if(centerDisplay.textContent!==text)centerDisplay.textContent=text;centerDisplay.setAttribute('aria-label',modes[mode].name+'剩余 '+text+(finished?'，时间到':!running?'，已暂停':''));
  }
  function tick(){if(!running)return;remaining=Math.max(0,deadline-Date.now());if(!remaining){expire();return;}paint();}
  function expire(){stop();remaining=0;finished=true;status.textContent='时间到';announce();paint();if(sound.checked)ring();}
  function unlockAudio(){if(!sound.checked)return;try{const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;audio||=new Audio();audio.resume().catch(()=>{});}catch{}}
  function ring(){try{if(!audio||audio.state!=='running')return;for(const offset of [0,.45]){const oscillator=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+offset;oscillator.frequency.value=660;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.16,at+.02);gain.gain.exponentialRampToValueAtTime(.001,at+.3);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.32);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}}catch{}}
  function position(){if(panel.hidden)return;const top=measure(app).top,anchor=measure(rail).top-top,v=viewport();panel.style.top=Math.max(v.top-top+8,Math.min(anchor,v.bottom-top-panel.offsetHeight-8))+'px';}
  function positionCenter({x,y,logoHeight=0}){center.style.left=x+'px';center.style.top=(y+(logoHeight?logoHeight*.24+8:0))+'px';}
  function setOpen(value){panel.hidden=!value;rail.setAttribute('aria-expanded',String(value));tick();paint();position();if(value)start.focus({preventScroll:true});else rail.focus({preventScroll:true});}
  function toggle(){setOpen(panel.hidden);}
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);}});
  root.document.addEventListener('visibilitychange',tick);root.addEventListener('focus',tick);root.addEventListener('pagehide',()=>{if(audio)audio.close().catch(()=>{});audio=undefined;});
  if(root.ResizeObserver)new root.ResizeObserver(position).observe(panel);
  if(savedTimer?.version===1&&Object.hasOwn(modes,savedTimer.mode)&&Object.values(savedTimer.durations||{}).length===2&&['public','private'].every(k=>Number.isFinite(savedTimer.durations[k])&&savedTimer.durations[k]>=1000&&savedTimer.durations[k]<=10800000)&&Number.isFinite(savedTimer.remaining)&&savedTimer.remaining>=0&&savedTimer.remaining<=10800000&&Number.isFinite(savedTimer.deadline)){mode=savedTimer.mode;for(const k of Object.keys(modes))modes[k].duration=savedTimer.durations[k];remaining=savedTimer.remaining;deadline=savedTimer.deadline;started=savedTimer.started===true;running=started&&savedTimer.running===true;finished=started&&savedTimer.finished===true;sound.checked=savedTimer.sound!==false;panel.hidden=savedTimer.open!==true;rail.setAttribute('aria-expanded',String(!panel.hidden));if(running){remaining=Math.min(10800000,Math.max(0,deadline-Date.now()));if(remaining)interval=root.setInterval(tick,200);else{running=false;finished=true;}}status.textContent=finished?'时间到':running?'正在'+modes[mode].name+'计时':started?'已暂停':'设置时间后点击开始';}
  fields();paint();position();return {toggle,position,positionCenter};
 }
 root.GrimoireTimer={create};
})(globalThis);
