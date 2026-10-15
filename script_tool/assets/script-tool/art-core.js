(function(root){
  'use strict';
  var teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
  var labels={townsfolk:'镇民',outsider:'外来者',minion:'爪牙',demon:'恶魔',traveller:'旅行者',fabled:'传奇角色',loric:'奇遇角色'};
  var colors={townsfolk:'#1966ac',outsider:'#14658b',minion:'#852c2b',demon:'#852c2b',traveller:'#986a27',fabled:'#846631',loric:'#668346'};
  var abilityKeywordGroups={
    blue:['善良','存活','处决','外来者'],
    red:['醉酒','中毒','死亡','爪牙','恶魔','邪恶角色','邪恶','不会死亡'],
    purple:['疯狂'],
    townsfolk:['镇民']
  };
  function material(options,id){return (options.decorations||[]).find(function(item){return item.id===id;});}
  function embedded(item){return item&&/^data:image\/(png|jpeg|webp);base64,/.test(item.image||'');}
  function footerHeight(options){var footer=material(options,options.footer);return options.style==='poster'&&options.footer==='print-note'?166:options.style==='poster'&&embedded(footer)?Math.min(220,Math.ceil(864/(Number(footer.aspect)||5.6)))+30:0;}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function wrap(text,width,size,measure,kind){
    var lines=[],line='';
    String(text||'').replace(/\r\n?/g,'\n').split('\n').forEach(function(paragraph){
      line='';Array.from(paragraph).forEach(function(char){
        if(line&&measure(line+char,size,kind)>width){
          var chars=Array.from(line),last=chars[chars.length-1];
          if(chars.length>1&&(/[，。！？；：、）》】」』…,.!?;:%]/.test(char)||/[（《【「『]/.test(last))){lines.push(chars.slice(0,-1).join(''));line=last+char;}
          else {lines.push(line);line=char;}
        }else line+=char;
      });lines.push(line);
    });
    return lines;
  }
  function jinxFor(roles,rules){
    var result=Object.create(null);
    root.ScriptCore.matchJinx(roles,rules).forEach(function(match){
      var owner=match.roles[0],partner=match.roles[1];
      (result[owner.id]||(result[owner.id]=[])).push({partner:partner,text:match.text});
    });return result;
  }
  function notesFor(roles,options){
    var result=jinxFor(roles,options.showJinx===false?[]:options.jinx);
    root.ScriptCore.matchRoleRules(roles,options.roleRules).forEach(function(match){
      (result[match.role.id]||(result[match.role.id]=[])).push({partner:null,label:root.ScriptCore.ruleTitle(match.rule,[match.role]),text:match.text});
    });return result;
  }
  function noteText(note){return (note.partner?'与'+note.partner.n+'相克':note.label||'特殊规则')+'：'+note.text;}
  function layout(roles,options,measure){
    if(!roles.length)throw new Error('请先添加角色。');
    if(roles.some(function(r){return teams.indexOf(r.t==='traveler'?'traveller':r.t)<0;}))throw new Error('存在未知角色类型，请先检查剧本。');
    var columns=Number(options.columns)||2,font=Number(options.font)||24;
    if([1,2,3].indexOf(columns)<0||font<(options._fit?14:18)||font>32)throw new Error('无效的布局设置。');
    var poster=options.style==='poster';if(poster)columns=2;
    if(options.ratio==='fixed'||poster&&options.spacing==='printCompact'){
      if(!root.ScriptArtPrint||!root.ScriptArtPresets)throw new Error('固定画布配置未加载，请刷新页面后重试。');
      return root.ScriptArtPrint.layout(roles,options,measure);
    }
    var ruleBox=null;
    if(options.rules){
      var texturedRules=poster&&!options.pure&&embedded(material(options,'status-panel'));
      var ruleLines=wrap(options.rules,poster?490:1048,18,measure),ruleHeight=texturedRules?Math.max(175,ruleLines.length*27+90):ruleLines.length*27+65;
      ruleBox={x:poster?660:96,y:poster?45:210,width:poster?530:1088,height:ruleHeight,lines:ruleLines,scale:poster&&options.ratio==='reference'?Math.min(1,530/ruleHeight):1};
    }
    var width=1280,margin=96,gap=32,top=260;
    var compact=poster&&(options.ratio==='reference'||options.ratio==='readable');if(compact)top=185;
    // Reserve the actual rendered rule box before laying out any role bands.
    if(ruleBox)top=Math.max(top,ruleBox.y+ruleBox.height*ruleBox.scale+40);
    if(compact&&(options.subtitle||options.players))top=Math.max(top,options.subtitle&&options.players?249:225);
    var visibleColWidth=(width-margin*2-gap*(columns-1))/columns;
    var fittingScale=poster&&options.ratio==='reference'&&options._bodyScale?options._bodyScale:1;
    // Measure in source coordinates so uniformly scaled text still fills each
    // fixed-width column. Column anchors and the gap stay in page coordinates.
    var colWidth=visibleColWidth/fittingScale,lineHeight=font*(compact?1.35:1.5),abilityY=Math.max(66,font+40);
    var rows=[],jinxes=notesFor(roles,options);
    var jinxFont=Math.max(compact?12:16,font-5);
    teams.forEach(function(team){
      roles.filter(function(r){return (r.t==='traveler'?'traveller':r.t)===team;}).forEach(function(role){
        var lines=wrap(role.ab||'暂无能力描述',colWidth-112,font,measure,'body');
        var notes=(jinxes[role.id]||[]).map(function(note){
          var noteLines=wrap(noteText(note),colWidth-148,jinxFont,measure,'body');
          return {partner:note.partner,lines:noteLines,height:Math.max(compact?30:46,noteLines.length*jinxFont*(compact?1.25:1.5)+(compact?10:20))};
        });
        var noteTop=compact?Math.max(112,abilityY+Math.max(0,lines.length-1)*lineHeight+font*.3+6):Math.max(112,abilityY+lines.length*lineHeight);
        rows.push({role:role,team:team,lines:lines,notes:notes,noteTop:noteTop,height:Math.max(compact?72:112,noteTop+notes.reduce(function(n,note){return n+note.height+8;},0))+(compact?20:24)});
      });
    });
    if(poster){
      var items=[],y=top;
      teams.forEach(function(team){
        var supplemental=team==='fabled';if(team==='loric')return;
        var group=rows.filter(function(row){return supplemental?row.team==='fabled'||row.team==='loric':row.team===team;});if(!group.length)return;
        items.push({kind:'heading',x:margin,y:y,team:team,supplemental:supplemental});y+=45;
        var half=Math.ceil(group.length/2),columnsInBand=[group.slice(0,half),group.slice(half)];
        var bandHeight=Math.max.apply(null,columnsInBand.map(function(column){return column.reduce(function(n,row){return n+row.height;},0);}));
        columnsInBand.forEach(function(column,index){
          var used=column.reduce(function(n,row){return n+row.height;},0),extra=bandHeight-used;
          var cy=y,spacing=column.length>1?Math.min(compact?24:48,extra/(column.length-1)):0;
          column.forEach(function(row){items.push({kind:'role',x:(supplemental&&group.length===1?(width-visibleColWidth)/2:margin+index*(visibleColWidth+gap)),y:cy,width:colWidth,team:row.team,role:row.role,lines:row.lines,notes:row.notes,noteTop:row.noteTop});cy+=row.height+spacing;});
        });y+=bandHeight+32;
      });
      var railCount=Math.max((options.first||[]).length,(options.other||[]).length);
      var footerSpace=footerHeight(options);
      var naturalHeight=Math.max(1800,y+112+footerSpace,top+railCount*58+170);
      var targetHeight=compact?Math.round(width*2000/1481):naturalHeight;
      if(options.ratio==='readable')targetHeight=Math.max(targetHeight,Math.ceil(y+100+footerSpace));
      var allowedScale=compact?Math.min(1,(targetHeight-top-90-footerSpace)/Math.max(1,y-top)):1;
      var bodyScale=options._bodyScale?fittingScale:allowedScale;
      if(options.ratio==='reference'&&!options._bodyScale&&bodyScale<0.98&&font>18)return layout(roles,Object.assign({},options,{font:font-1,_fit:true}),measure);
      if(options.ratio==='reference'&&!options._bodyScale&&bodyScale<1){
        // Reflow at each candidate scale rather than shrinking a narrow body
        // around the page centre. Choose the largest scale that fits vertically.
        var lowScale=bodyScale,highScale=1;
        var best=layout(roles,Object.assign({},options,{_bodyScale:lowScale,_fit:true}),measure);
        for(var iteration=0;iteration<14;iteration++){
          var candidateScale=(lowScale+highScale)/2;
          var candidate=layout(roles,Object.assign({},options,{_bodyScale:candidateScale,_fit:true}),measure);
          if(candidate.bodyFits){best=candidate;lowScale=candidateScale;}else highScale=candidateScale;
        }
        return best;
      }
      return {pages:[items],width:width,height:targetHeight,font:font,lineHeight:lineHeight,abilityY:abilityY,ruleBox:ruleBox,bodyScale:bodyScale,bodyFits:bodyScale<=allowedScale,bodyTop:top,railStep:compact?Math.min(58,(targetHeight-420)/Math.max(1,railCount)):58};
    }
    function arrange(capacity){
      var items=[],column=0,y=top,lastTeam='',maxY=top;
      rows.forEach(function(row){
        var heading=lastTeam===row.team?0:54;
        if(y>top&&y-top+heading+row.height>capacity){column++;y=top;lastTeam='';}
        var x=margin+column*(colWidth+gap);
        if(lastTeam!==row.team){items.push({kind:'heading',x:x,y:y,team:row.team});y+=54;lastTeam=row.team;}
        items.push({kind:'role',x:x,y:y,width:colWidth,team:row.team,role:row.role,lines:row.lines,notes:row.notes,noteTop:row.noteTop});
        y+=row.height;maxY=Math.max(maxY,y);
      });
      return {items:items,columns:column+1,bottom:maxY};
    }
    var low=Math.max.apply(null,rows.map(function(row){return row.height+54;}));
    var high=rows.reduce(function(total,row){return total+row.height+54;},0);
    while(low<high){var mid=Math.floor((low+high)/2);if(arrange(mid).columns<=columns)high=mid;else low=mid+1;}
    var result=arrange(Math.max(1400,low));
    return {pages:[result.items],width:width,height:Math.max(1800,Math.ceil(result.bottom+112)),font:font,lineHeight:lineHeight,abilityY:abilityY,ruleBox:ruleBox,bodyTop:top};
  }

  function roleBounds(plan,item){
    var scale=plan.bodyScale||1,top=plan.bodyTop||0;
    var extent=item.extent===undefined?item.noteTop+(item.notes||[]).reduce(function(n,note){return n+note.height+8;},0):item.extent;
    return {x:item.x,y:top+(item.y-top)*scale,width:item.width*scale,height:extent*scale};
  }

  function nightRailGeometry(layout,options,pageIndex){
    var items=layout.pages[pageIndex||0]||[],markers=['minion','demon'].filter(function(team){return items.some(function(item){return item.kind==='role'&&item.team===team;})&&embedded(material(options,'marker-'+team));}).length;
    var top=Number.isFinite(layout.railTop)?layout.railTop:Math.min(340,Math.round(layout.height*.20));
    var count=Math.max((options.first||[]).length+markers,(options.other||[]).length,1);
    var step=Number.isFinite(layout.railStep)?layout.railStep:Math.min(60,(layout.height-top-190)/(count+2));
    return {top:top,step:step,size:Number.isFinite(layout.railSize)?layout.railSize:Math.min(56,step*.93),markers:markers};
  }
  function nightRailBounds(layout,options,pageIndex){
    if(options.style!=='poster')return [];
    var g=nightRailGeometry(layout,options,pageIndex),result=[];
    ['first','other'].forEach(function(night){(options[night]||[]).forEach(function(role,i){result.push({night:night,role:role,index:i,x:(night==='first'?36:1244)-g.size/2,y:g.top+85+(i+(night==='first'?g.markers:0))*g.step,width:g.size,height:g.size});});});return result;
  }
  function iconGeometry(layout,item,iconKey,icon){
    var size=item.iconSize===undefined?(layout.iconSize||96):item.iconSize,x=item.x+(item.iconX||0),y=item.y+(item.iconY||0);
    var result={x:x,y:y,size:size,scale:1,kind:'unchanged'};
    var optics=root.SCRIPT_ART_ICON_OPTICS,source=root.SCRIPT_ART_ICONS,sourceKey=iconKey;
    if(!layout.contentFit||!optics||!optics.items||!source)return result;
    if(optics&&optics.items&&source&&(!optics.items[sourceKey]||source[sourceKey]!==icon))sourceKey=Object.keys(optics.items).find(function(key){return source[key]===icon;});
    var metric=optics&&optics.items&&optics.items[sourceKey];
    // Compensation belongs to the fixed body only. Unknown/replaced rasters,
    // night icons, reminders and every alternate preset retain their frames.
    if(!layout.contentFit||!metric||!source||source[sourceKey]!==icon)return result;
    var visual=metric.box,safe=metric.safe;
    if(!Array.isArray(visual)||!Array.isArray(safe)||visual.length!==4||safe.length!==4||!visual.concat(safe).every(Number.isFinite))return result;
    // A catalog fallback may reuse a padded bitmap under a new ID. Its old
    // renderer uses the full bitmap, so undo only the measured crop coordinates.
    var crop=sourceKey!==iconKey&&root.SCRIPT_ART_ICON_BOUNDS&&root.SCRIPT_ART_ICON_BOUNDS[sourceKey];
    if(crop){var side=Math.max(crop.width,crop.height),view=crop.viewBox;function uncrop(box){return [(view[0]+box[0]*view[2]+(side-crop.width)/2)/side,(view[1]+box[1]*view[3]+(side-crop.height)/2)/side,(view[0]+box[2]*view[2]+(side-crop.width)/2)/side,(view[1]+box[3]*view[3]+(side-crop.height)/2)/side];}visual=uncrop(visual);safe=uncrop(safe);}
    var edge=Math.max(visual[2]-visual[0],visual[3]-visual[1]);
    if(!(edge>0&&metric.factor>0&&optics.targetEdge>0))return result;
    var cx=x+size/2,cy=y+size/2,desired=optics.targetEdge*metric.factor/edge;
    var left=item.x+optics.frameInset,right=item.x+layout.iconSize-optics.frameInset,top=item.y+optics.verticalInset,bottom=item.y+item.extent-optics.verticalInset;
    [[cx-left,.5-safe[0]],[right-cx,safe[2]-.5],[cy-top,.5-safe[1]],[bottom-cy,safe[3]-.5]].forEach(function(limit){if(limit[1]>0)desired=Math.min(desired,limit[0]/limit[1]);});
    if(!(desired>0&&Number.isFinite(desired)))return result;
    return {x:cx-desired/2,y:cy-desired/2,size:desired,scale:desired/size,kind:metric.kind,factor:metric.factor,visualEdge:edge*desired};
  }
  function wrapRules(value,width,font,measure){
    var words=['玩家','角色','死亡','恶魔','爪牙','镇民','外来者','旅行者','醉酒','中毒','处决','存活','私货商人','特殊规则','能力','一次','每个夜晚'],result=[];
    String(value||'').replace(/\r\n?/g,'\n').split('\n').forEach(function(paragraph){
      var chars=Array.from(paragraph),n=chars.length,cache=new Map();
      function measured(text){if(!cache.has(text))cache.set(text,measure(text,font));return cache.get(text);}
      if(!n||measured(paragraph)<=width){result.push(paragraph);return;}
      var allowed=Array(n+1).fill(true),wordPenalty=Array(n+1).fill(0),ascii=/[A-Za-z0-9_.:/%+\-–]/;
      for(var i=1;i<n;i++){
        if(/^[，。！？；：、）》】」』”’…,.!?;:%\]}]/.test(chars[i])||/[（《【「『“‘({\[]/.test(chars[i-1]))allowed[i]=false;
        if(ascii.test(chars[i-1])&&ascii.test(chars[i])){var a=i-1,b=i;while(a>0&&ascii.test(chars[a-1]))a--;while(b<n&&ascii.test(chars[b]))b++;if(measured(chars.slice(a,b).join(''))<=width)allowed[i]=false;}
        if(/\d/.test(chars[i-1])&&/^[名个人次夜天]/.test(chars[i]))allowed[i]=false;
        var prefix=chars.slice(Math.max(0,i-6),i).join(''),suffix=chars.slice(i,i+6).join('');
        if(words.some(function(word){for(var k=1;k<word.length;k++)if(prefix.endsWith(word.slice(0,k))&&suffix.startsWith(word.slice(k)))return true;return false;}))wordPenalty[i]=15;
      }
      var cost=Array(n+1).fill(Infinity),next=Array(n+1);cost[n]=0;
      for(var start=n-1;start>=0;start--){
        if(!allowed[start])continue;
        for(var end=start+1;end<=n;end++){
          var line=chars.slice(start,end).join(''),w=measured(line);if(w>width+.001)break;if(!allowed[end]||!Number.isFinite(cost[end]))continue;
          var tail=end===n,han=(line.match(/\p{Script=Han}/gu)||[]).length,slack=(width-w)/width,score=10000+cost[end]+slack*slack*(tail?2:20);
          if(tail&&start>0&&han>0&&han<=2&&w<=font*4)score+=200;
          if(end<n){score+=wordPenalty[end];if(/[，。；：！？]$/.test(line))score-=3;}
          if(score<cost[start]){cost[start]=score;next[start]=end;}
        }
      }
      if(!Number.isFinite(cost[0])){result=result.concat(wrap(paragraph,width,font,measure));return;}
      for(var at=0;at<n;at=next[at])result.push(chars.slice(at,next[at]).join(''));
    });return result;
  }
  function ruleFrame(layout,options){
    var box=layout.ruleBox;if(!box||!layout.header||!layout.contentFit||options.style!=='poster'||box.scale!==1)return box;
    var shift=Math.max(0,Math.min(box.width*.15,box.x-96-360));
    return Object.assign({},box,{x:box.x-shift,width:box.width+shift,enhanced:true});
  }
  function ruleDisplay(layout,options,measure,titleBounds){
    var base=ruleFrame(layout,options);if(!base)return null;
    function setting(key,fallback,min,max){var v=Number(options[key]);return options[key]===undefined||!Number.isFinite(v)?fallback:Math.max(min,Math.min(max,v));}
    var physicalScale=base.scale||1,baseWidth=base.width*physicalScale,baseHeight=base.height*physicalScale;
    var minimumX=96,maximumX=1190,y=Math.max(8,Math.min(base.y+layout.height*setting('ruleOffsetY',0,-40,40)/100,layout.bodyTop-95)),maxHeight=Math.max(85,layout.bodyTop-y-10);
    var frameChanged=setting('ruleOffset',0,-40,40)!==0||setting('ruleWidth',100,60,160)!==100;
    if(options.style==='poster')minimumX=Math.max(minimumX,frameChanged&&titleBounds?titleBounds.right+24:base.x);
    var width=Math.min(maximumX-minimumX,baseWidth*setting('ruleWidth',100,60,160)/100);
    var height=Math.max(85,Math.min(maxHeight,baseHeight*setting('ruleHeight',100,60,160)/100));
    var x=Math.max(minimumX,Math.min(base.x+(baseWidth-width)/2+1280*setting('ruleOffset',0,-40,40)/100,maximumX-width));
    var font=setting('ruleFont',base.enhanced?21:18,16,28),lines,lineHeight,needed;
    var textured=options.style==='poster'&&!layout.print&&!options.pure&&embedded(material(options,'status-panel')),baseline=textured?87:68;
    while(true){
      // Fit in the frame's original coordinates; legacy reference posters scale
      // the entire rule frame, including its padding and text, as one layer.
      lines=wrapRules(options.rules,width/physicalScale-44,font,measure);lineHeight=font*1.35;needed=(baseline+Math.max(0,lines.length-1)*lineHeight+font*.32+12)*physicalScale;
      if(needed<=height+.01)break;
      if(font>16){font=Math.max(16,font-.25);continue;}
      if(needed<=maxHeight+.01){height=Math.max(height,needed);break;}
      throw new Error('特殊规则框放不下全文，请加宽规则框或恢复规则框调整。');
    }
    return Object.assign({},base,{x:x,y:y,width:width/physicalScale,height:height/physicalScale,scale:physicalScale,font:font,lines:lines,lineHeight:lineHeight,actualOffset:(x+width/2-base.x-baseWidth/2)/1280*100,actualWidth:width/baseWidth*100,actualHeight:height/baseHeight*100});
  }
  function authorAdjustment(layout,options,geometry){
    var base=geometry.original;
    function offset(key){var value=Number(options[key]);return Number.isFinite(value)?Math.max(-40,Math.min(40,value)):0;}
    var dx=offset('authorOffset')*layout.width/100,dy=offset('authorOffsetY')*layout.height/100;
    if(dx||dy){
      dx=Math.max(96-base.x,Math.min(layout.width-96-base.x-base.width,dx));
      dy=Math.max(8-base.y,Math.min(Math.max(base.y,layout.bodyTop-10-base.height)-base.y,dy));
    }
    return {x:base.x+dx,y:base.y+dy,width:base.width,height:base.height,base:base,dx:dx,dy:dy,transform:'translate('+dx+' '+dy+')',adjusted:!!(dx||dy)};
  }
  function titleAdjustment(layout,options,geometry,measure){
    var original=geometry.original,poster=options.style==='poster',box=geometry.ruleBox;
    var requestedScale=Number(options.logoScale),requestedOffset=Number(options.logoOffset),requestedOffsetY=Number(options.logoOffsetY);
    requestedScale=Number.isFinite(requestedScale)?Math.max(.25,Math.min(1.6,requestedScale)):1;
    requestedOffset=Number.isFinite(requestedOffset)?Math.max(-40,Math.min(40,requestedOffset)):0;
    requestedOffsetY=Number.isFinite(requestedOffsetY)?Math.max(-40,Math.min(40,requestedOffsetY)):0;
    var adjusted=requestedScale!==1||requestedOffset!==0||requestedOffsetY!==0;
    if(!adjusted)return {adjusted:false,x:original.x,y:original.y,scale:1,offset:0,transform:''};
    var leftLimit=96,rightLimit=poster&&box?box.x-24:1184,bottomLimit=Math.max(40,layout.bodyTop-10);
    if(!poster&&box)bottomLimit=Math.min(bottomLimit,box.y-10);
    var authorTop=Infinity,authorLeft=1184;
    if(options.author){
      var author='剧本作者：'+String(options.author).slice(0,48),authorSize=geometry.authorSize;
      while(authorSize>14&&measure(author,authorSize)>geometry.titleWidth)authorSize--;
      authorTop=geometry.authorY-authorSize-6;
      authorLeft=poster&&!options.rules?Math.max(96,geometry.metaRight-measure(author,authorSize)):96;
      if(options.rules||!poster)bottomLimit=Math.min(bottomLimit,authorTop-6);
    }
    var scale=Math.min(requestedScale,(rightLimit-leftLimit)/original.width,bottomLimit/original.height);
    var y=Math.max(0,Math.min(original.y+original.height*(1-scale)/2+layout.height*requestedOffsetY/100,bottomLimit-original.height*scale));
    if(options.author&&poster&&!options.rules&&y+original.height*scale>authorTop-6){
      rightLimit=Math.max(leftLimit+24,Math.min(rightLimit,authorLeft-12));scale=Math.min(scale,(rightLimit-leftLimit)/original.width);
      y=Math.max(0,Math.min(original.y+original.height*(1-scale)/2+layout.height*requestedOffsetY/100,bottomLimit-original.height*scale));
    }
    var x=Math.max(leftLimit,Math.min(original.x+original.width*(1-scale)/2+1280*requestedOffset/100,rightLimit-original.width*scale));
    return {adjusted:true,x:x,y:y,scale:scale,offset:(x+original.width*scale/2-original.x-original.width/2)/1280*100,transform:'translate('+x+' '+y+') scale('+scale+') translate('+(-original.x)+' '+(-original.y)+')'};
  }
  function svg(layout,pageIndex,options,icons,measure){
    var themes={cloud:['#f1f5fa','#ffffff','#172b46','#64758b'],paper:['#f5f0e5','#fffcf5','#3e352b','#85755f'],night:['#121b2b','#1b2940','#f3f6ff','#b1c0d7']};
    var poster=options.style==='poster';
    var palette=poster?themes.paper:(themes[options.theme]||themes.cloud);
    if((options.decorations||[]).some(function(item){return item.id===options.backdrop&&item.image;}))palette=themes.paper;
    var print=!!layout.print,inks=root.ScriptArtPresets&&root.ScriptArtPresets.inks;
    var details=print&&root.ScriptArtPresets.printDetails;
    var typography=root.ScriptArtPresets&&root.ScriptArtPresets.bodyTypography;
    var roleColors=print?Object.assign({},colors,{townsfolk:inks.good,outsider:inks.good,minion:inks.evil,demon:inks.evil}):colors;
    var keywordInks={blue:print?inks.good:'#14658b',red:print?inks.evil:'#942f2d',purple:'#765184',townsfolk:print?inks.evil:'#14658b'};
    var keywordGroups=Object.create(null);
    Object.keys(abilityKeywordGroups).forEach(function(group){abilityKeywordGroups[group].forEach(function(word){keywordGroups[word]=group;});});
    var keywordPattern=new RegExp(Object.keys(keywordGroups).sort(function(a,b){return b.length-a.length;}).join('|'),'g');
    function abilityRuns(value){
      var runs=[],cursor=0,match,plainInk=print?(layout.contentFit?inks.body:details.body.ink):'#28231d';
      keywordPattern.lastIndex=0;
      while((match=keywordPattern.exec(value))){
        if(match.index>cursor)runs.push({start:cursor,end:match.index,ink:plainInk,keyword:false});
        cursor=match.index+match[0].length;
        runs.push({start:match.index,end:cursor,ink:keywordInks[keywordGroups[match[0]]],keyword:true});
      }
      if(cursor<value.length)runs.push({start:cursor,end:value.length,ink:plainInk,keyword:false});
      return runs;
    }
    function abilitySpans(line,start,runs){
      var end=start+line.length;
      return runs.filter(function(run){return run.end>start&&run.start<end;}).map(function(run){
        var value=line.slice(Math.max(start,run.start)-start,Math.min(end,run.end)-start);
        var strokeWidth=details&&(run.keyword&&details.body.keywordStrokeWidth!==undefined?details.body.keywordStrokeWidth:details.body.strokeWidth);
        return '<tspan fill="'+run.ink+'"'+(details&&run.keyword?' font-family="'+esc(details.body.keywordFamily||typography.bodyFamily)+'" font-weight="'+details.body.keywordWeight+'"':'')+(strokeWidth?' stroke="'+run.ink+'" stroke-width="'+strokeWidth+'" paint-order="stroke fill"':'')+'>'+esc(value)+'</tspan>';
      }).join('');
    }
    function nameInk(color){
      if(layout.contentFit)return color;
      var tint=typography&&typography.roleNameTint||0;
      if(!tint||!/^#[0-9a-f]{6}$/i.test(color))return color;
      return '#'+[1,3,5].map(function(index){
        var channel=parseInt(color.slice(index,index+2),16);
        return ('0'+Math.round(channel+(255-channel)*tint).toString(16)).slice(-2);
      }).join('');
    }
    if(print)palette=[inks.paper,'#f3e8ce',inks.body,'#79674d'];
    var height=layout.height,iconSize=layout.iconSize||96,exportWidth=layout.outputWidth||1280,exportHeight=layout.outputHeight||height;
    var out=['<svg xmlns="http://www.w3.org/2000/svg" width="'+exportWidth+'" height="'+exportHeight+'" viewBox="0 0 '+exportWidth+' '+exportHeight+'">'];
    var faces=root.ScriptArtFonts&&root.ScriptArtFonts.faces||[];
    if(faces.length)out.push('<style data-body-fonts="embedded">'+faces.filter(function(face){return /^data:(font\/woff2|application\/octet-stream);base64,[A-Za-z0-9+/=]+$/.test(face.data);}).map(function(face){return '@font-face{font-family:"'+face.family+'";src:url("'+face.data+'") format("woff2");font-style:normal;font-weight:'+(face.weight||400)+';}';}).join('')+'</style>');
    if(layout.outputWidth)out.push('<g transform="scale('+(exportWidth/1280)+')">');
    out.push(
      '<rect width="1280" height="'+height+'" fill="'+palette[0]+'"/>');
    if(/^data:image\/(png|jpeg|webp);base64,/.test(options.background||''))out.push('<image href="'+esc(options.background)+'" width="1280" height="'+height+'" preserveAspectRatio="xMidYMid slice" opacity="0.65"/>');
    if(!print)out.push('<rect x="32" y="32" width="1216" height="'+(height-64)+'" rx="24" fill="'+palette[1]+'" fill-opacity="0.88"/>');
    var decorationData=options.decorations||[];
    function chosen(id){return decorationData.find(function(item){return item.id===id;});}
    function sourceMark(role,x,y,size){
      if(options.pure)return;
      var id={yuque:'source-overseas',odyssey:'source-odyssey',stars:'source-stars'}[role.artSource||role.source];
      var mark=chosen(id);if(!embedded(mark))return;
      var extent=size*1.16,pad=(extent-size)/2;
      out.push('<g opacity=".72">');materialImage(mark,x-pad,y-pad,extent,extent);out.push('</g>');
    }
    function materialImage(item,x,y,width,height){if(!embedded(item))return false;out.push('<image data-material="'+esc(item.id)+'" href="'+esc(item.image)+'" x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" preserveAspectRatio="none"/>');return true;}
    var backdrop=chosen(options.backdrop);
    if(backdrop&&/^data:image\/(png|jpeg|webp);base64,/.test(backdrop.image||''))out.push('<image data-background="'+esc(options.backdrop)+'" href="'+esc(backdrop.image)+'" width="1280" height="'+height+'" preserveAspectRatio="none"/>');
    if(print&&!options.pure&&!options.background)out.push('<rect data-paper-tone="warm-paper" width="1280" height="'+height+'" fill="#e5cc91" opacity=".14"/><defs><linearGradient id="paper-edge"><stop stop-color="#735539" stop-opacity=".08"/><stop offset=".14" stop-color="#735539" stop-opacity="0"/><stop offset=".86" stop-color="#735539" stop-opacity="0"/><stop offset="1" stop-color="#735539" stop-opacity=".08"/></linearGradient><pattern id="print-paper" width="83" height="67" patternUnits="userSpaceOnUse"><path d="M3 11l3-1m18 40l4 1m38-26l2-2m-43 0l1 2m34 25l2-1" stroke="#846d49" stroke-width=".6" opacity=".15"/></pattern></defs><rect width="1280" height="'+height+'" fill="url(#paper-edge)"/><rect width="1280" height="'+height+'" fill="url(#print-paper)"/>');
    // Shade the existing supplemental section through the bottom of the paper.
    // Draw below patterns, corner leaves and content; no layout values change.
    var supplementalBackground=print&&details.supplemental&&details.supplemental.background;
    if(supplementalBackground&&!options.pure){
      var supplementalRoles=layout.pages[pageIndex].filter(function(item){return item.kind==='role'&&(item.team==='fabled'||item.team==='loric');});
      if(supplementalRoles.length){
        var supplementalHeading=layout.pages[pageIndex].find(function(item){return item.kind==='heading'&&(item.supplemental||item.team==='fabled'||item.team==='loric');});
        var supplementalY=supplementalHeading?supplementalHeading.y:Math.min.apply(null,supplementalRoles.map(function(item){return item.y;}));
        var supplementalScale=layout.bodyScale||1,supplementalAnchor=layout.bodyTop||0;
        supplementalY=Math.max(0,Math.min(height,supplementalAnchor+(supplementalY+supplementalBackground.topOffset-supplementalAnchor)*supplementalScale));
        out.push('<rect data-supplemental-background="warm-paper" x="'+supplementalBackground.inset+'" y="'+supplementalY+'" width="'+(1280-supplementalBackground.inset*2)+'" height="'+(height-supplementalY)+'" fill="'+supplementalBackground.fill+'" opacity="'+supplementalBackground.opacity+'"/>');
      }
    }
    function bands(id,opacity){
      var item=chosen(id);if(!item)return;
      ['top','bottom'].forEach(function(edge){
        if(!/^data:image\/(png|jpeg|webp);base64,/.test(item[edge]||''))return;
        if(id===options.ornament){
          // Reduce each corner independently, keeping it attached to the edge.
          // Scaling a complete corner sheet would move the opposite corner in.
          var cornerScale=details&&details.ornament?details.ornament.cornerScale:1;
          var cornerWidth=922*cornerScale,cornerHeight=item.height*.72*cornerScale;
          out.push('<g data-material="'+esc(item.id)+'" opacity="'+opacity+'">');
          [0,1].forEach(function(side){out.push('<svg x="'+(side*640)+'" y="'+(edge==='top'?0:height-cornerHeight)+'" width="640" height="'+cornerHeight+'" viewBox="'+(side?cornerWidth-640:0)+' 0 640 '+cornerHeight+'" overflow="hidden"><image href="'+esc(item[edge])+'" width="'+cornerWidth+'" height="'+cornerHeight+'"/></svg>');});
          out.push('</g>');
        }else out.push('<image data-material="'+esc(item.id)+'" href="'+esc(item[edge])+'" x="0" y="'+(edge==='top'?0:height-item.height)+'" width="1280" height="'+item.height+'" opacity="'+opacity+'"/>');
      });
    }
    bands(options.pattern,print?(details.patternOpacity===undefined?0.22:details.patternOpacity):0.35);
    function text(x,y,value,size,color,weight,family,attributes){out.push('<text '+(attributes||'')+'x="'+x+'" y="'+y+'" font-family="'+(family||'system-ui,Microsoft YaHei,sans-serif')+'" font-size="'+size+'" font-weight="'+(weight||400)+'" fill="'+color+'">'+esc(value)+'</text>');}
    // Title geometry stays based on its original reservation. Rule controls
    // operate only on the rule frame, with the final title bounds as a limit.
    var titleRuleBox=ruleFrame(layout,options),displayRuleBox=null;
    var title=String(options.title||'未命名剧本'),header=layout.header;
    var titleWidth=poster&&options.rules?515:1088;
    if(print&&options.topDecoration)titleWidth-=120;
    var logoPresets={
      shards:{font:'SimHei,Microsoft YaHei,sans-serif',inks:['#16769b','#374665','#5c3d71'],outline:'#eee8d8',angles:[-7,5,-4,6],shadow:'#292832'},
      ember:{font:'STKaiti,KaiTi,serif',inks:['#a84728','#862e30','#bf6932'],outline:'#f1dfb7',angles:[-3,3],shadow:'#462c29'},
      obsidian:{font:'STSong,SimSun,serif',inks:['#272733','#403843'],outline:'#ba985a',angles:[0],shadow:'#665d52'},
      jade:{font:'STSong,SimSun,serif',inks:['#246458','#397c68'],outline:'#e9d5a2',angles:[0],shadow:'#28473f'},
      lunar:{font:'STKaiti,KaiTi,serif',inks:['#344765','#514875'],outline:'#e3e2e9',angles:[-2,2],shadow:'#272638'},
      violet:{font:'SimHei,Microsoft YaHei,sans-serif',inks:['#684c87','#423775','#876291'],outline:'#e4d8ec',angles:[-4,4],shadow:'#302b46'}
    };
    var logoPreset=Object.prototype.hasOwnProperty.call(logoPresets,options.titleStyle)?logoPresets[options.titleStyle]:null;
    var titleStyle=['plain','epic','brush','classic','gold','crimson','vintage-crimson'].includes(options.titleStyle)||logoPreset?options.titleStyle:'plain';
    var titleSize=titleStyle==='plain'?48:poster?(header?header.titleFontMax:120):78;while(titleSize>22&&measure(title,titleSize)>titleWidth-16)titleSize--;
    var titleLines=wrap(title,titleWidth,titleSize,measure);
    var titleValue=titleLines[0]+(titleLines.length>1?'…':'');
    var titleFonts={plain:'system-ui,Microsoft YaHei,sans-serif',epic:'Microsoft YaHei,SimHei,sans-serif',brush:'STKaiti,KaiTi,serif',classic:'STSong,SimSun,serif',gold:'STSong,SimSun,serif',crimson:'Microsoft YaHei,SimHei,sans-serif','vintage-crimson':'STSong,SimSun,serif'};
    var titleInk={plain:palette[2],epic:'url(#title-blue)',brush:palette[2],classic:palette[2],gold:'url(#title-gold)',crimson:'#8f2434','vintage-crimson':'#7d2426'};
    out.push('<defs><linearGradient id="title-blue" x2="0" y2="1"><stop stop-color="#087193"/><stop offset=".55" stop-color="#243d60"/><stop offset="1" stop-color="#5a355b"/></linearGradient><linearGradient id="title-gold" x2="0" y2="1"><stop stop-color="#fff0b8"/><stop offset=".45" stop-color="#c5963e"/><stop offset="1" stop-color="#75501c"/></linearGradient></defs>');
    var titleLength=Math.min(titleWidth-16,Math.max(1,measure(titleValue,titleSize)));
    var titleX=poster&&!options.rules?(1280-titleLength)/2+(print&&options.topDecoration?50:0):96+(print&&options.topDecoration?100:0);
    var titleBaseline=header?header.titleBaseline:poster?125:110;
    // Long titles share horizontal space with the author. Keep their descent
    // inside the title band, independent of the selected background layer.
    if(layout.contentFit&&!header&&options.author){
      var authorLeft=options.rules?96:details.metadata.right-measure('剧本作者：'+String(options.author).slice(0,48),details.metadata.authorSize);
      if(titleX+titleLength>authorLeft-12){titleSize=Math.min(titleSize,104);titleLength=Math.min(titleWidth-16,Math.max(1,measure(titleValue,titleSize)));titleX=options.rules?96+(options.topDecoration?100:0):(1280-titleLength)/2+(options.topDecoration?50:0);titleBaseline=94;}
    }
    var logo=options.logo,hasLogo=embedded(logo)&&Number.isFinite(Number(logo.aspect))&&Number(logo.aspect)>0;
    var logoWidth=hasLogo?Math.min(titleWidth-16,(header?header.logoHeight:124)*Number(logo.aspect)):0,logoHeight=hasLogo?logoWidth/Number(logo.aspect):0;
    var logoX=poster&&!options.rules?(1280-logoWidth)/2+(print&&options.topDecoration?50:0):96+(print&&options.topDecoration?100:0);
    var logoBottom=header?header.logoTop+header.logoHeight:132;
    // A larger central logo can share the author's vertical band when their
    // horizontal boxes are separate. Wide logos reserve the author's width.
    if(header&&options.author){
      var headerAuthor='剧本作者：'+String(options.author).slice(0,48),headerAuthorSize=details.metadata.authorSize;
      while(headerAuthorSize>14&&measure(headerAuthor,headerAuthorSize)>titleWidth)headerAuthorSize--;
      var headerAuthorWidth=measure(headerAuthor,headerAuthorSize),headerAuthorLeft=options.rules?96:Math.max(96,details.metadata.right-headerAuthorWidth);
      var headerAuthorTop=header.authorY-headerAuthorSize-6;
      if(hasLogo&&logoBottom>headerAuthorTop&&logoX<headerAuthorLeft+headerAuthorWidth+12&&logoX+logoWidth>headerAuthorLeft-12){
        var logoCenter=logoX+logoWidth/2,freeWidth=2*(headerAuthorLeft-12-logoCenter);
        if(!options.rules&&freeWidth>0){logoWidth=Math.min(logoWidth,freeWidth);logoHeight=logoWidth/Number(logo.aspect);logoX=logoCenter-logoWidth/2;}
        else {logoBottom=headerAuthorTop-6;logoHeight=Math.min(logoHeight,logoBottom-header.logoTop);logoWidth=logoHeight*Number(logo.aspect);logoX=options.rules?96+(print&&options.topDecoration?100:0):(1280-logoWidth)/2+(print&&options.topDecoration?50:0);}
      }
      if(!hasLogo&&titleX<headerAuthorLeft+headerAuthorWidth+12&&titleX+titleLength>headerAuthorLeft-12){
        titleBaseline=Math.min(titleBaseline,headerAuthorTop-titleSize*.25-6);
        titleSize=Math.min(titleSize,titleBaseline/.94);titleLength=Math.min(titleWidth-16,Math.max(1,measure(titleValue,titleSize)));titleX=options.rules?96+(options.topDecoration?100:0):(1280-titleLength)/2+(options.topDecoration?50:0);
      }
    }
    var decorationAnchor=hasLogo?logoX:titleX,decorationTitleAnchor=titleX;
    if(titleRuleBox&&titleRuleBox.enhanced){
      var left=96,right=titleRuleBox.x-24,slot=right-left;
      if(hasLogo){logoWidth=Math.min(logoWidth,slot);logoHeight=logoWidth/Number(logo.aspect);logoX=left+(slot-logoWidth)/2;}
      else {titleLength=Math.min(titleLength,slot);titleX=left+(slot-titleLength)/2;}
    }
    if(print&&options.topDecoration&&!options.pure){
      var decoration=(root.ScriptArtPresets.titleDecorations||{})[options.titleDecoration];
      var decorationX=Math.max(100,decorationAnchor-112);
      if(decoration){
        out.push('<image data-top-decoration="'+esc(options.titleDecoration)+'" href="'+esc(decoration.image)+'" x="'+decorationX+'" y="'+(header?header.ornamentTop:22)+'" width="'+(header?header.ornamentSize:94)+'" height="'+(header?header.ornamentSize:94)+'" preserveAspectRatio="xMidYMid meet"/>');
      }else{
      out.push('<g data-top-decoration="crest">');
      if(!materialImage(chosen('status-emblem'),decorationX,header?header.ornamentTop:32,header?header.ornamentSize:94,header?header.ornamentSize:94))out.push('<path d="M '+(decorationTitleAnchor-94)+' 74 Q '+(decorationTitleAnchor-125)+' 36 '+(decorationTitleAnchor-82)+' 24 Q '+(decorationTitleAnchor-39)+' 36 '+(decorationTitleAnchor-70)+' 74 M '+(decorationTitleAnchor-109)+' 60 l15 10m-17-26l19 10m29 16l15-10m-18-6l19-10" fill="none" stroke="#79674d" stroke-width="3"/><path d="M '+(decorationTitleAnchor-100)+' 43 L '+(decorationTitleAnchor-64)+' 43 L '+(decorationTitleAnchor-64)+' 70 Q '+(decorationTitleAnchor-82)+' 91 '+(decorationTitleAnchor-100)+' 70Z" fill="#e3d1a9" stroke="#7d2426" stroke-width="2"/>');
      out.push('</g>');
      }
    }
    function titleLayer(dx,dy,fill,stroke,width){out.push('<text x="'+(titleX+dx)+'" y="'+(titleBaseline+dy)+'" font-family="'+titleFonts[titleStyle]+'" font-size="'+titleSize+'" font-weight="'+(titleStyle==='classic'?600:900)+'" textLength="'+titleLength+'" lengthAdjust="spacingAndGlyphs" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" paint-order="stroke fill">'+esc(titleValue)+'</text>');}
    // Transform only the title artwork. The body plan, metadata and ornaments
    // keep their existing geometry, and neutral settings keep the original SVG.
    var original={x:hasLogo?logoX:titleX,y:hasLogo?logoBottom-logoHeight:titleBaseline-titleSize*1.1,width:hasLogo?logoWidth:titleLength,height:hasLogo?logoHeight:titleSize*1.4};
    var titleGeometry={original:original,titleWidth:titleWidth,ruleBox:titleRuleBox,authorSize:details&&details.metadata?details.metadata.authorSize:22,authorY:header?header.authorY:details&&details.metadata?details.metadata.authorY:150,metaRight:details&&details.metadata?details.metadata.right:1184};
    if(typeof options.onTitleGeometry==='function')options.onTitleGeometry(titleGeometry);
    var titleChange=titleAdjustment(layout,options,titleGeometry,measure),adjustedTitle=titleChange.adjusted,adjustedX=titleChange.x,appliedScale=titleChange.scale;
    if(adjustedTitle)out.push('<g data-title-adjustment="true" data-applied-scale="'+appliedScale+'" data-applied-offset="'+titleChange.offset+'" transform="'+titleChange.transform+'">');
    if(hasLogo){
      out.push('<image data-title-logo="uploaded" href="'+esc(logo.image)+'" x="'+logoX+'" y="'+(logoBottom-logoHeight)+'" width="'+logoWidth+'" height="'+logoHeight+'" preserveAspectRatio="xMidYMid meet"/>');
    }else{
      out.push('<g data-title-style="'+titleStyle+'"><title>'+esc(titleValue)+'</title>');
      var preset=logoPreset;
      if(preset){
        out.push('<defs><pattern id="logo-hatching" width="11" height="13" patternUnits="userSpaceOnUse"><path d="M-2 13L11 0M4 13L17 0" stroke="#fff7e6" stroke-width="1" opacity=".22"/></pattern></defs>');
        var glyphX=titleX,baseline=header?titleBaseline:110,glyphs=Array.from(titleValue);
        var advances=glyphs.map(function(char){return measure(char,titleSize);}),advanceScale=titleLength/Math.max(1,advances.reduce(function(n,width){return n+width;},0));
        glyphs.forEach(function(char,index){
          var advance=advances[index]*advanceScale,angle=preset.angles[index%preset.angles.length];
          out.push('<g transform="rotate('+angle+' '+(glyphX+advance/2)+' '+(baseline-titleSize*.4)+')">');
          function glyph(dx,dy,fill,stroke,width){out.push('<text x="'+(glyphX+dx)+'" y="'+(baseline+dy)+'" font-family="'+preset.font+'" font-size="'+titleSize+'" font-weight="900" textLength="'+advance+'" lengthAdjust="spacingAndGlyphs" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" paint-order="stroke fill">'+esc(char)+'</text>');}
          glyph(3,5,preset.shadow,preset.shadow,5);glyph(0,0,preset.inks[index%preset.inks.length],preset.outline,3.5);glyph(0,0,'url(#logo-hatching)','none',0);
          out.push('</g>');glyphX+=advance;
        });
      }else if(titleStyle==='epic'){titleLayer(4,6,'#292b37','#292b37',7);titleLayer(0,0,titleInk.epic,'#eee5cc',5);}
      else if(titleStyle==='vintage-crimson'){
        if(details){var titleDetail=details.title;titleLayer(titleDetail.shadowX,titleDetail.shadowY,titleDetail.shadowInk,'#e9dabd',titleDetail.shadowStroke);titleLayer(0,0,titleInk[titleStyle],'#7d2426',titleDetail.stroke);}
        else {titleLayer(1.5,2.5,'#594036','#e9dabd',5);titleLayer(0,0,titleInk[titleStyle],'#7d2426',2.8);}
      }
      else if(titleStyle==='gold'){titleLayer(2,3,'#4d3821','#4d3821',3);titleLayer(0,0,titleInk.gold,'#725527',1.5);}
      else if(titleStyle==='crimson'){titleLayer(2,4,'#34232d','#eadfcd',3);titleLayer(0,0,titleInk.crimson,'#eadfcd',1);}
      else titleLayer(0,0,titleInk[titleStyle],'none',0);
      out.push('</g>');
    }
    if(adjustedTitle)out.push('</g>');
    if(titleRuleBox)displayRuleBox=ruleDisplay(layout,options,measure,{right:(adjustedTitle?adjustedX+original.width*appliedScale:hasLogo?logoX+logoWidth:titleX+titleLength)+(hasLogo?0:12*(adjustedTitle?appliedScale:1))});
    var metadata=details&&details.metadata,metaRight=metadata?metadata.right:1184;
    var meta=options.author?'剧本作者：'+String(options.author).slice(0,48):'',metaSize=metadata?metadata.authorSize:22;
    while(metaSize>14&&measure(meta,metaSize)>titleWidth)metaSize--;
    var authorGeometry=null;
    if(meta){
      var authorX=poster&&!options.rules?Math.max(96,metaRight-measure(meta,metaSize)):96,authorY=header?header.authorY:metadata?metadata.authorY:150;
      authorGeometry={original:{x:authorX,y:authorY-metaSize,width:measure(meta,metaSize),height:metaSize*1.3}};
      var authorChange=authorAdjustment(layout,options,authorGeometry);
      if(authorChange.adjusted)out.push('<g data-author-adjustment="true" transform="'+authorChange.transform+'">');
      text(authorX,authorY,meta,metaSize,'#000000',metadata?metadata.authorWeight:400);
      if(authorChange.adjusted)out.push('</g>');
    }
    if(typeof options.onAuthorGeometry==='function')options.onAuthorGeometry(authorGeometry);
    if(options.version){var versionText=String(options.version).slice(0,18);text(poster&&!options.rules?Math.min(1184-measure(versionText,16),titleX+titleLength+14):96,header?header.versionY:42,versionText,16,palette[2],700);}
    if(options.players){var playerText=String(options.players).slice(0,24),playerSize=metadata?metadata.playersSize:20;while(playerSize>14&&measure(playerText,playerSize)>titleWidth)playerSize--;text(poster&&options.rules?96:metaRight-measure(playerText,playerSize),header?header.playersY:metadata?metadata.playersY:174,playerText,playerSize,'#000000',metadata?metadata.playersWeight:700);}
    var subtitle=String(options.subtitle||'').slice(0,65),subtitleSize=20;
    while(subtitleSize>14&&measure(subtitle,subtitleSize)>titleWidth)subtitleSize--;
    text(96,header?header.subtitleY:options.players?198:174,subtitle,subtitleSize,palette[3]);
    function paintRules(){
      var box=displayRuleBox;if(!box)return;
      out.push('<g data-special-rule-display="'+(box.enhanced?'header':'box')+'" data-rule-box="'+[box.x,box.y,box.width*box.scale,box.height*box.scale].join(' ')+'" data-rule-font="'+(box.font*box.scale)+'" data-rule-settings="'+[box.actualOffset,box.actualWidth,box.actualHeight].join(' ')+'">');
      if(box.scale<1)out.push('<g transform="translate('+(box.x*(1-box.scale))+' '+(box.y*(1-box.scale))+') scale('+box.scale+')">');
      var statusPanel=poster&&!print&&!options.pure&&chosen('status-panel');
      var hasPanel=materialImage(statusPanel,box.x,box.y,box.width,box.height);
      if(hasPanel){
        materialImage(chosen('status-emblem'),box.x+20,box.y+14,36,36);
        text(box.x+65,box.y+41,options.rulesTitle||'特殊规则',24,'#72512f',700);
        materialImage(chosen('status-divider'),box.x+25,box.y+53,box.width-50,24);
      }else{
        out.push('<rect x="'+box.x+'" y="'+box.y+'" width="'+box.width+'" height="'+box.height+'" rx="8" fill="'+(poster?'#eddbb5':palette[0])+'" stroke="'+(poster?'#b59b6e':palette[3])+'"/>');
        text(box.x+25,box.y+33,'❖ '+(options.rulesTitle||'特殊规则')+' ❖',24,poster?'#72512f':palette[2],700);
      }
      box.lines.forEach(function(line,i){text(box.x+(box.enhanced?22:20),box.y+(hasPanel?87:68)+i*(box.lineHeight||27),line,box.font||18,box.enhanced?'#352c21':poster?'#493e31':palette[2],400,undefined,box.enhanced?'data-rule-body="" ':'');});
      if(box.scale<1)out.push('</g>');
      out.push('</g>');
    }
    if(displayRuleBox&&!displayRuleBox.enhanced)paintRules();
    if(poster){
      var railStart=out.length;
      var vintageBorder=options.nightTheme==='vintage-red';
      var nightTheme=chosen(vintageBorder?'night-red':options.nightTheme),hasNight=embedded(nightTheme);
      if(vintageBorder)out.push('<g data-border-style="vintage-red"><rect width="72" height="'+height+'" fill="#651d24"/><rect x="1208" width="72" height="'+height+'" fill="#651d24"/></g>');
      if(hasNight){
        if(vintageBorder&&details)out.push('<g data-border-texture="vintage-red" opacity="'+details.border.textureOpacity+'">');
        materialImage(nightTheme,0,0,1280,height);
        if(vintageBorder&&details)out.push('</g>');
      }
      if(vintageBorder)out.push('<rect width="72" height="'+height+'" fill="#480b16" opacity=".28"/><rect x="1208" width="72" height="'+height+'" fill="#480b16" opacity=".28"/>');
      out.push('<defs><pattern id="night-grain" width="34" height="46" patternUnits="userSpaceOnUse"><rect width="34" height="46" fill="#e4dcc9"/><path d="M-8 18L30 0M5 46L42 23M0 6L34 35M7 0L22 46" stroke="#b9ad91" stroke-opacity=".12" stroke-width=".7"/><path d="M2 15l4 2m17 18l5-3m-14-5l2 4" stroke="#cec3ac" stroke-opacity=".14"/></pattern><linearGradient id="night-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".12" stop-color="white"/><stop offset=".88" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="night-edge-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#night-fade)"/></mask></defs>');
      var hasMinion=layout.pages[pageIndex].some(function(item){return item.kind==='role'&&item.team==='minion';});
      var hasDemon=layout.pages[pageIndex].some(function(item){return item.kind==='role'&&item.team==='demon';});
      var setupMarkers=[];
      if(hasMinion&&embedded(chosen('marker-minion')))setupMarkers.push(chosen('marker-minion'));
      if(hasDemon&&embedded(chosen('marker-demon')))setupMarkers.push(chosen('marker-demon'));
      var railInk=vintageBorder||hasNight&&nightTheme.dark?'#f2e8d7':'#665e4e';
      var geometry=nightRailGeometry(layout,options,pageIndex),railTop=geometry.top,step=geometry.step,size=geometry.size;
      [['first','首个','夜晚',0],['other','其他','夜晚',1208]].forEach(function(rail){
        var list=options[rail[0]]||[],x=rail[3],cx=x+36;
        out.push('<g class="night-rail" aria-label="'+(rail[0]==='first'?'首夜':'其他夜晚')+'">');
        if(!hasNight&&!vintageBorder)out.push('<rect x="'+x+'" width="72" height="'+height+'" fill="url(#night-grain)" opacity=".9" mask="url(#night-edge-mask)"/><path d="M '+(x===0?71:1209)+' 100 V '+(height-100)+'" stroke="#a89a7c" stroke-opacity=".2"/>');
        if(vintageBorder)out.push('<rect x="'+(x+7)+'" y="'+(railTop-30)+'" width="58" height="68" rx="3" fill="#4a151b" fill-opacity=".42" stroke="#e2c6a0" stroke-opacity=".3"/>');
        out.push('<text x="'+cx+'" y="'+railTop+'" text-anchor="middle" font-family="SimSun,serif" font-size="25" font-weight="700" fill="'+railInk+'"><tspan x="'+cx+'">'+rail[1]+'</tspan><tspan x="'+cx+'" dy="29">'+rail[2]+'</tspan></text>');
        var moonY=railTop+59;
        if(!materialImage(chosen('marker-dusk'),cx-17,moonY-17,34,34))out.push('<circle cx="'+cx+'" cy="'+moonY+'" r="15" fill="#d9d1c1" stroke="#aaa08b" stroke-width="1.3"/><path d="M '+(cx+6)+' '+(moonY-10)+' A 11 11 0 1 0 '+(cx+10)+' '+(moonY+5)+' A 9 9 0 0 1 '+(cx+6)+' '+(moonY-10)+'" fill="#777365"/>');
        var markers=rail[0]==='first'?setupMarkers:[];
        var markerSize=Math.min(40,size*.72);
        markers.forEach(function(item,i){materialImage(item,cx-markerSize/2,railTop+85+i*step+(size-markerSize)/2,markerSize,markerSize);});
        list.forEach(function(role,i){
          var icon=icons[role.im]||icons[role.id],y=railTop+85+(i+markers.length)*step;
          out.push('<g data-night="'+rail[0]+'" data-night-role="'+esc(role.id)+'"><title>'+esc((i+1)+'. '+role.n)+'</title>');
          sourceMark(role,cx-size/2,y,size);
          if(/^data:image\/(png|jpeg|webp);base64,/.test(icon||''))out.push('<image href="'+esc(icon)+'" x="'+(cx-size/2)+'" y="'+y+'" width="'+size+'" height="'+size+'"/>');
          else out.push('<text x="'+cx+'" y="'+(y+size*.6)+'" text-anchor="middle" font-size="'+Math.min(15,size*.32)+'" fill="'+railInk+'">'+esc(Array.from(role.n||'?').slice(0,3).join(''))+'</text>');
          out.push('</g>');
        });
        var sunY=railTop+85+(list.length+markers.length)*step+18;
        if(!list.length)text(x+8,sunY-6,'无行动',16,railInk);
        if(!materialImage(chosen('marker-dawn'),cx-17,sunY-17,34,34)&&list.length){
          out.push('<g><title>黎明</title><circle cx="'+cx+'" cy="'+sunY+'" r="12" fill="#b6a173"/>');
          for(var ray=0;ray<12;ray++){var angle=ray*Math.PI/6;out.push('<path d="M '+(cx+15*Math.cos(angle))+' '+(sunY+15*Math.sin(angle))+' L '+(cx+19*Math.cos(angle))+' '+(sunY+19*Math.sin(angle))+'" stroke="#b6a173" stroke-width="2"/>');}out.push('</g>');
        }
        out.push('</g>');
      });
    }
    if(poster&&!hasNight&&['charcoal','midnight'].includes(options.frame)){
      var dark=options.frame==='midnight',railMarkup=out.splice(railStart).join('');
      railMarkup=railMarkup.replace(/#e4dcc9/g,dark?'#252844':'#292827').replace(/#665e4e/g,'#f2e8d7').replace(/#a89a7c/g,dark?'#9b608e':'#ad4b3d').replace(/stroke-opacity=".2"/g,'stroke-opacity=".9" stroke-width="3"');
      out.push(railMarkup);
    }
    // Keep the leaves above the rails, with print-poster roles painted on top.
    if(print)bands(options.ornament,1);
    if(displayRuleBox&&displayRuleBox.enhanced)paintRules();
    layout.pages[pageIndex].forEach(function(item){
      var bodyScale=layout.bodyScale||1;
      if(item.kind==='heading'){
        var headingY=(layout.bodyTop||0)+(item.y-(layout.bodyTop||0))*bodyScale;
        if(!poster)out.push('<rect x="'+item.x+'" y="'+(item.y-26)+'" width="5" height="28" rx="2" fill="'+roleColors[item.team]+'"/>');
        var label=poster?(['townsfolk','outsider'].indexOf(item.team)>=0?'善良阵营 · ':['minion','demon'].indexOf(item.team)>=0?'邪恶阵营 · ':'')+labels[item.team]:labels[item.team];
        if(poster&&item.supplemental){
          var supplementalSize=(layout.headingFontSize||(details?details.heading.size:27))*bodyScale,supplementalLabel='传奇角色 / 奇遇角色';
          out.push('<g data-supplemental-heading="combined"><text x="'+item.x+'" y="'+headingY+'" font-family="STSong,SimSun,serif" font-size="'+supplementalSize+'" font-weight="900" fill="'+roleColors[item.team]+'">'+supplementalLabel+'</text><path data-section-line="supplemental" d="M '+(item.x+measure(supplementalLabel,supplementalSize,'heading')+(details&&details.heading.lineGap!==undefined?details.heading.lineGap*bodyScale:12))+' '+(headingY-9*bodyScale)+' H 1184" stroke="'+(details?(details.heading.supplementalLineInk||details.heading.lineInk):'#a49a87')+'" stroke-width="'+(details?(details.heading.supplementalLineWidth||details.heading.lineWidth):1)+'"'+(details?' opacity="'+details.heading.lineOpacity+'" stroke-linecap="round"':'')+'/></g>');return;
        }
        if(poster&&(item.team==='fabled'||item.team==='loric')){out.push('<path d="M 96 '+(headingY-9*bodyScale)+' H 880" stroke="#a49a87"/><text x="1184" y="'+headingY+'" text-anchor="end" font-family="STSong,SimSun,serif" font-size="'+(27*bodyScale)+'" font-weight="900" fill="'+roleColors[item.team]+'">'+esc(labels[item.team]+(item.team==='fabled'?' · 说书人':''))+'</text>');return;}
        if(poster)out.push('<text x="'+item.x+'" y="'+headingY+'" font-family="STSong,SimSun,serif" font-size="'+((layout.headingFontSize||(details?details.heading.size:27))*bodyScale)+'" font-weight="900" stroke="'+roleColors[item.team]+'" stroke-width="'+(print?.85:.45)+'" paint-order="stroke fill" fill="'+roleColors[item.team]+'">'+esc(label)+'</text>');else text(item.x+16,item.y,label,26,palette[2],700);
        var lineEnd=print&&item.y===layout.bodyTop&&options.players&&!options.rules?1184-measure(playerText,playerSize)-14:1184;
        var lineStart=details&&details.heading.lineGap!==undefined?item.x+measure(label,(layout.headingFontSize||details.heading.size)*bodyScale,'heading')+details.heading.lineGap*bodyScale:item.x+(details?details.heading.lineOffset:265)*bodyScale;
        if(poster&&lineStart<lineEnd)out.push('<path '+(details?'data-section-line="print" ':'')+'d="M '+lineStart+' '+(headingY-9*bodyScale)+' H '+lineEnd+'" stroke="'+(details?details.heading.lineInk:'#a49a87')+'" stroke-width="'+(details?details.heading.lineWidth:print?1.4:1)+'"'+(details?' opacity="'+details.heading.lineOpacity+'" stroke-linecap="round"':'')+'/>');return;
      }
      if(bodyScale<1)out.push('<g transform="translate('+(item.x*(1-bodyScale))+' '+(layout.bodyTop*(1-bodyScale))+') scale('+bodyScale+')">');
      var role=item.role,iconKey=icons[role.im]?role.im:role.id,icon=icons[iconKey];
      var roleIconSize=item.iconSize===undefined?iconSize:item.iconSize;
      var roleIconX=item.x+(item.iconX||0),roleIconY=item.y+(item.iconY||0);
      sourceMark(role,roleIconX,roleIconY,roleIconSize);
      var iconBounds=print&&root.SCRIPT_ART_ICON_BOUNDS&&root.SCRIPT_ART_ICON_BOUNDS[iconKey];
      // Bounds apply only to the exact embedded raster they were built from.
      // Imported/uploaded replacements and all alternate presets keep their
      // established image rendering. Crop in SVG, leaving source pixels intact.
      var normalizeIcon=iconBounds&&root.SCRIPT_ART_ICONS&&root.SCRIPT_ART_ICONS[iconKey]===icon&&Array.isArray(iconBounds.viewBox)&&iconBounds.viewBox.length===4&&iconBounds.viewBox.every(Number.isFinite)&&iconBounds.viewBox[2]>0&&iconBounds.viewBox[3]>0&&iconBounds.width>0&&iconBounds.height>0;
      if(/^data:image\/(png|jpeg|webp);base64,/.test(icon||'')){
        var optical=iconGeometry(layout,item,iconKey,icon),opticalAttributes=optical.kind==='unchanged'?'':' data-icon-optical="'+optical.kind+'" data-icon-scale="'+optical.scale+'"';
        roleIconX=optical.x;roleIconY=optical.y;roleIconSize=optical.size;
        if(normalizeIcon)out.push('<svg data-role-icon="'+esc(role.id)+'"'+opticalAttributes+' data-icon-normalized="true" x="'+roleIconX+'" y="'+roleIconY+'" width="'+roleIconSize+'" height="'+roleIconSize+'" viewBox="'+iconBounds.viewBox.join(' ')+'" preserveAspectRatio="xMidYMid meet" overflow="hidden"><image href="'+esc(icon)+'" width="'+iconBounds.width+'" height="'+iconBounds.height+'"/></svg>');
        else out.push('<image '+(print?'data-role-icon="'+esc(role.id)+'"'+opticalAttributes+' preserveAspectRatio="xMidYMid meet" ':'')+'href="'+esc(icon)+'" x="'+roleIconX+'" y="'+roleIconY+'" width="'+roleIconSize+'" height="'+roleIconSize+'"/>');
      }
      else {out.push('<circle cx="'+(roleIconX+roleIconSize/2)+'" cy="'+(roleIconY+roleIconSize/2)+'" r="'+(roleIconSize*.417)+'" fill="'+roleColors[item.team]+'" opacity="0.16"/>');text(roleIconX+roleIconSize*.323,roleIconY+roleIconSize*.635,Array.from(role.n||'?')[0],roleIconSize*.375,palette[2],600);}
      var nameSize=layout.nameSize||(poster?Math.max(28,layout.font+6):layout.font+4),offset=layout.textOffset||112;
      var nameScale=root.ScriptArtPresets&&root.ScriptArtPresets.bodyTypography?root.ScriptArtPresets.bodyTypography.roleNameScale:1;
      var nameBaseline=layout.nameBaseline===undefined?(print?nameSize:Math.max(32,nameSize)):layout.nameBaseline;
      var nameFontSize=layout.nameFontSize===undefined?(nameSize-(details?details.roleName.fontReduction:0))*nameScale:layout.nameFontSize;
      var name=wrap((role.n||role.id)+(item.continued?'（续）':''),item.width-offset,nameFontSize,measure,'name');
      var nameColor=nameInk(poster?roleColors[item.team]:palette[2]);
      var nameStroke=typography&&typography.roleNameStroke!==undefined?typography.roleNameStroke:print?.85:.45;
      if(poster)(item.nameLines||[name[0]+(name.length>1?'…':'')]).forEach(function(line,index){out.push('<text data-role-name="'+esc(role.id)+'" x="'+(item.x+offset)+'" y="'+(item.y+nameBaseline+index*(item.nameLeading||nameFontSize))+'" font-family="'+(typography?typography.roleNameFamily:'STSong,SimSun,serif')+'" font-size="'+nameFontSize+'" font-weight="'+(typography?typography.roleNameWeight:900)+'" stroke="'+nameColor+'" stroke-width="'+nameStroke+'" paint-order="stroke fill" fill="'+nameColor+'">'+esc(line)+'</text>');});else text(item.x+offset,item.y+nameBaseline,name[0]+(name.length>1?'…':''),nameFontSize,nameColor,typography?typography.roleNameWeight:700,typography&&typography.roleNameFamily);
      // Classify the full ability before wrapping so a keyword retains its
      // color even when a line break falls inside it. Explicit paragraphs do
      // not create artificial matches across their boundary.
      var abilityValue=String(role.ab||'暂无能力描述').replace(/\r\n?/g,'\n');
      var abilityTokens=poster?abilityRuns(abilityValue):[],abilityOffset=0;
      item.lines.forEach(function(line,i){
        var y=item.y+(item.abilityY===undefined?(layout.abilityY||62):item.abilityY)+i*(layout.lineHeight||layout.font*1.5);
        if(!poster){text(item.x+offset,y,line,layout.font,palette[2],typography&&typography.bodyWeight,typography&&typography.bodyFamily);return;}
        while(abilityValue.charAt(abilityOffset)==='\n')abilityOffset++;
        var spans=abilitySpans(line,abilityOffset,abilityTokens);abilityOffset+=line.length;
        out.push('<text '+(print?'data-ability="'+esc(role.id)+'" ':'')+'x="'+(item.x+offset)+'" y="'+y+'" font-family="'+(typography?typography.bodyFamily:'system-ui,Microsoft YaHei,sans-serif')+'" font-size="'+layout.font+'" font-weight="'+(details?details.body.weight:typography?typography.bodyWeight:print?600:500)+'">'+spans+'</text>');
      });
      var noteStyle=details&&details.jinx;
      var noteY=item.y+item.noteTop,noteFont=layout.noteFont||(noteStyle?Math.max(noteStyle.minFont,layout.font-noteStyle.fontReduction)*(noteStyle.fontScale||1):print?Math.max(13,layout.font-5):Math.max(poster&&(options.ratio==='reference'||options.ratio==='readable')?12:16,layout.font-5));
      (item.notes||[]).forEach(function(note){
        var x=item.x+(print?offset:96),partnerIcon=note.partner?(icons[note.partner.im]||icons[note.partner.id]):'';
        if(noteStyle)out.push('<g data-jinx-note="print"><rect x="'+x+'" y="'+noteY+'" width="'+(item.width-offset)+'" height="'+note.height+'" rx="'+noteStyle.radius+'" fill="'+noteStyle.fill+'" fill-opacity="'+noteStyle.fillOpacity+'" stroke="'+noteStyle.stroke+'" stroke-opacity="'+noteStyle.strokeOpacity+'" stroke-width="'+noteStyle.strokeWidth+'"/>');
        else out.push('<rect x="'+x+'" y="'+noteY+'" width="'+(item.width-(print?offset:96))+'" height="'+note.height+'" rx="7" fill="'+(options.theme==='night'&&!poster?'#344259':'#ddd7c9')+'"/>');
        var noteIconSize=noteStyle?noteStyle.iconSize:24;
        if(/^data:image\/(png|jpeg|webp);base64,/.test(partnerIcon||''))out.push('<image href="'+esc(partnerIcon)+'" x="'+(x+5)+'" y="'+(noteY+(noteStyle?(note.height-noteIconSize)/2:7))+'" width="'+noteIconSize+'" height="'+noteIconSize+'"/>');
        note.lines.forEach(function(line,i){text(x+(noteStyle?noteStyle.textOffset:42),noteY+noteFont+(noteStyle?noteStyle.baselinePadding:print?4:poster&&(options.ratio==='reference'||options.ratio==='readable')?4:9)+i*noteFont*(print?1.2:poster&&(options.ratio==='reference'||options.ratio==='readable')?1.25:1.5),line,noteFont,noteStyle?noteStyle.ink:palette[2],400,typography&&typography.bodyFamily);});
        if(noteStyle)out.push('</g>');
        noteY+=note.height+(layout.noteBlockGap===undefined?8:layout.noteBlockGap);
      });
      if(bodyScale<1)out.push('</g>');
    });
    if(poster){
      var footnote=chosen(options.footer),footHeight=footerHeight(options)-30;
      if(options.footer==='print-note'&&!options.pure){
        var footerY=layout.footerTop||height-270;
        var footerDetail=details&&details.footer,footerPadding=footerDetail?footerDetail.padding:20,footerTextX=246+footerPadding;
        var measuredFooter=layout.footerBox;
        out.push('<g data-footer-style="print-note"><rect x="246" y="'+footerY+'" width="788" height="'+(measuredFooter?measuredFooter.height:136)+'" rx="18" fill="'+(footerDetail?footerDetail.fill:'#c6bbae')+'" stroke="#74665a" stroke-width="'+(footerDetail?footerDetail.strokeWidth:3)+'"/>');
        if(measuredFooter){measuredFooter.definitions.forEach(function(def){text(footerTextX,footerY+def.titleY,def.name,24,'#7d2426',900);def.lines.forEach(function(line,i){text(footerTextX,footerY+def.bodyY+i*measuredFooter.lineHeight,line,measuredFooter.font,'#211a17',footerDetail?footerDetail.bodyWeight:600);});});}
        else {
        text(footerTextX,footerY+28,'可能',24,'#7d2426',900);
        text(footerTextX,footerY+51,'某件事“可能”发生，代表说书人决定该事情是否发生。',17,'#211a17',footerDetail?footerDetail.bodyWeight:600);
        text(footerTextX,footerY+79,'中毒 / 醉酒',24,'#7d2426',900);
        artFooterLines('中毒或醉酒的玩家会失去能力，但会认为自己仍具有能力。说书人会做出这些玩家仍具有能力的行为。说书人可能会给出错误信息，中毒的玩家不会得知自己中毒。',788-footerPadding*2,17).forEach(function(line,i){text(footerTextX,footerY+101+i*20,line,17,'#211a17',footerDetail?footerDetail.bodyWeight:600);});
        }
        out.push('</g>');
      }else if(footHeight>0)materialImage(footnote,208,layout.contentFit?layout.footerTop:height-90-footHeight,864,footHeight);
      if(!materialImage(!options.pure&&chosen('footer-night'),536,height-95,208,95))out.push('<path d="M 475 '+(height-57)+' Q 640 '+(height-110)+' 805 '+(height-57)+' L 805 '+height+' H 475 Z" fill="#766d60" opacity=".85"/><text x="640" y="'+(height-34)+'" text-anchor="middle" font-family="STSong,SimSun,serif" font-size="21" font-weight="700" fill="#fff5df">* 代表非首个夜晚</text>');
    }else text(96,height-52,'钟楼资料库 · 剧本制图',18,palette[3]);
    if(!poster)text(980,height-52,'完整剧本 · '+options.total+' 个角色',18,palette[3]);
    // Alternate presets retain their established corner-artwork order.
    if(!print)bands(options.ornament,1);
    if(layout.outputWidth)out.push('</g>');
    out.push('</svg>');return out.join('');
    function artFooterLines(value,width,size){return wrap(value,width,size,measure);}
  }
  root.ScriptArt={layout:layout,svg:svg,wrap:wrap,wrapRules:wrapRules,ruleDisplay:ruleDisplay,titleAdjustment:titleAdjustment,authorAdjustment:authorAdjustment,jinxFor:jinxFor,notesFor:notesFor,noteText:noteText,roleBounds:roleBounds,nightRailBounds:nightRailBounds,iconGeometry:iconGeometry};
})(typeof window==='undefined'?globalThis:window);
