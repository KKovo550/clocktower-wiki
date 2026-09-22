(function(root){
  'use strict';
  var teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
  var labels={townsfolk:'镇民',outsider:'外来者',minion:'爪牙',demon:'恶魔',traveller:'旅行者',fabled:'传奇角色',loric:'奇遇角色'};
  var colors={townsfolk:'#1966ac',outsider:'#28857e',minion:'#ac4c35',demon:'#a53349',traveller:'#986a27',fabled:'#846631',loric:'#7654a0'};
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function wrap(text,width,size,measure){
    var lines=[],line='';
    String(text||'').replace(/\r\n?/g,'\n').split('\n').forEach(function(paragraph){
      line='';Array.from(paragraph).forEach(function(char){
        if(line&&measure(line+char,size)>width){lines.push(line);line=char;}else line+=char;
      });lines.push(line);
    });
    return lines;
  }
  function jinxFor(roles,rules){
    var result=Object.create(null),seen=new Set();
    (rules||[]).forEach(function(rule){
      var names=String(rule.name||'').split(/&|与/).map(function(n){return n.trim();});
      var ids=Array.isArray(rule.roleIds)&&rule.roleIds.length===2?rule.roleIds:null;
      if((!ids&&names.length!==2)||!rule.ability)return;
      var pair=ids?ids.map(function(id){return roles.filter(function(r){return r.id===id;});}):names.map(function(n){return roles.filter(function(r){return r.n===n;});});
      if(pair.some(function(matches){return matches.length!==1;}))return;
      var key=pair.map(function(matches){return matches[0].id;}).sort().join('&')+'|'+rule.ability.trim();if(seen.has(key))return;seen.add(key);
      var owner=pair[0][0],partner=pair[1][0];
      (result[owner.id]||(result[owner.id]=[])).push({partner:partner,text:rule.ability.trim()});
    });return result;
  }
  function layout(roles,options,measure){
    if(!roles.length)throw new Error('请先添加角色。');
    if(roles.some(function(r){return teams.indexOf(r.t==='traveler'?'traveller':r.t)<0;}))throw new Error('存在未知角色类型，请先检查剧本。');
    var columns=Number(options.columns)||2,font=Number(options.font)||24;
    if([1,2,3].indexOf(columns)<0||font<(options._fit?14:18)||font>32)throw new Error('无效的布局设置。');
    var poster=options.style==='poster';if(poster)columns=2;
    var ruleLines=poster&&options.rules?wrap(options.rules,490,18,measure):[];
    var width=1280,margin=96,gap=32,top=Math.max(260,ruleLines.length*27+125);
    var compact=poster&&options.ratio==='reference';if(compact)top=options.rules?Math.min(top,650):225;
    var colWidth=(width-margin*2-gap*(columns-1))/columns,lineHeight=font*(compact?1.2:1.5),abilityY=compact?40:62;
    var rows=[],jinxes=jinxFor(roles,options.showJinx===false?[]:options.jinx);
    var jinxFont=Math.max(compact?12:16,font-5);
    teams.forEach(function(team){
      roles.filter(function(r){return (r.t==='traveler'?'traveller':r.t)===team;}).forEach(function(role){
        var lines=wrap(role.ab||'暂无能力描述',colWidth-100,font,measure);
        var notes=(jinxes[role.id]||[]).map(function(note){
          var noteLines=wrap('与'+note.partner.n+'相克：'+note.text,colWidth-148,jinxFont,measure);
          return {partner:note.partner,lines:noteLines,height:Math.max(46,noteLines.length*jinxFont*1.5+20)};
        });
        var noteTop=Math.max(compact?64:100,abilityY+lines.length*lineHeight);
        rows.push({role:role,team:team,lines:lines,notes:notes,noteTop:noteTop,height:Math.max(compact?72:112,noteTop+notes.reduce(function(n,note){return n+note.height+8;},0))+(compact?8:24)});
      });
    });
    if(poster){
      var items=[],y=top;
      teams.forEach(function(team){
        var group=rows.filter(function(row){return row.team===team;});if(!group.length)return;
        items.push({kind:'heading',x:margin,y:y,team:team});y+=compact?32:45;
        var half=Math.ceil(group.length/2),columnsInBand=[group.slice(0,half),group.slice(half)];
        var bandHeight=Math.max.apply(null,columnsInBand.map(function(column){return column.reduce(function(n,row){return n+row.height;},0);}));
        columnsInBand.forEach(function(column,index){
          var used=column.reduce(function(n,row){return n+row.height;},0),extra=bandHeight-used;
          var cy=y+(column.length===1?extra/2:0),spacing=column.length>1?extra/(column.length-1):0;
          column.forEach(function(row){items.push({kind:'role',x:margin+index*(colWidth+gap),y:cy,width:colWidth,team:team,role:row.role,lines:row.lines,notes:row.notes,noteTop:row.noteTop});cy+=row.height+spacing;});
        });y+=bandHeight+(compact?10:28);
      });
      var railCount=Math.max((options.first||[]).length,(options.other||[]).length);
      var naturalHeight=Math.max(1800,y+112,top+railCount*58+170);
      var targetHeight=compact?Math.round(width*2000/1481):naturalHeight;
      var bodyScale=compact?Math.min(1,(targetHeight-top-90)/Math.max(1,y-top)):1;
      if(compact&&bodyScale<0.98&&font>14)return layout(roles,Object.assign({},options,{font:font-1,_fit:true}),measure);
      return {pages:[items],width:width,height:targetHeight,font:font,lineHeight:lineHeight,abilityY:abilityY,bodyScale:bodyScale,bodyTop:top,railStep:compact?Math.min(58,(targetHeight-420)/Math.max(1,railCount)):58};
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
    return {pages:[result.items],width:width,height:Math.max(1800,Math.ceil(result.bottom+112)),font:font};
  }

  function svg(layout,pageIndex,options,icons,measure){
    var themes={cloud:['#f1f5fa','#ffffff','#172b46','#64758b'],paper:['#f5f0e5','#fffcf5','#3e352b','#85755f'],night:['#121b2b','#1b2940','#f3f6ff','#b1c0d7']};
    var poster=options.style==='poster';
    var palette=poster?themes.paper:(themes[options.theme]||themes.cloud);
    if((options.decorations||[]).some(function(item){return item.id===options.backdrop&&item.image;}))palette=themes.paper;
    var height=layout.height,iconSize=poster&&options.ratio==='reference'?64:80;
    var out=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="'+height+'" viewBox="0 0 1280 '+height+'">',
      '<rect width="1280" height="'+height+'" fill="'+palette[0]+'"/>'];
    if(/^data:image\/(png|jpeg|webp);base64,/.test(options.background||''))out.push('<image href="'+esc(options.background)+'" width="1280" height="'+height+'" preserveAspectRatio="xMidYMid slice" opacity="0.65"/>');
    out.push('<rect x="32" y="32" width="1216" height="'+(height-64)+'" rx="24" fill="'+palette[1]+'" fill-opacity="0.88"/>');
    var decorationData=options.decorations||[];
    function chosen(id){return decorationData.find(function(item){return item.id===id;});}
    var backdrop=chosen(options.backdrop);
    if(backdrop&&/^data:image\/(png|jpeg|webp);base64,/.test(backdrop.image||''))out.push('<image href="'+esc(backdrop.image)+'" width="1280" height="'+height+'" preserveAspectRatio="none"/>');
    [options.pattern,options.ornament].forEach(function(id){
      var item=chosen(id);if(!item)return;
      ['top','bottom'].forEach(function(edge){if(/^data:image\/(png|jpeg|webp);base64,/.test(item[edge]||''))out.push('<image href="'+esc(item[edge])+'" x="0" y="'+(edge==='top'?0:height-item.height)+'" width="1280" height="'+item.height+'" opacity="0.35"/>');});
    });
    function text(x,y,value,size,color,weight){out.push('<text x="'+x+'" y="'+y+'" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="'+size+'" font-weight="'+(weight||400)+'" fill="'+color+'">'+esc(value)+'</text>');}
    var title=String(options.title||'未命名剧本');
    var titleWidth=poster&&options.rules?515:1088;
    var titleSize=48;while(titleSize>22&&measure(title,titleSize)>titleWidth)titleSize--;
    var titleLines=wrap(title,titleWidth,titleSize,measure);
    text(96,110,titleLines[0]+(titleLines.length>1?'…':''),titleSize,palette[2],700);
    var meta=(options.author?'作者：'+String(options.author).slice(0,48)+'  ·  ':'')+options.total+' 个角色',metaSize=22;
    while(metaSize>14&&measure(meta,metaSize)>titleWidth)metaSize--;
    text(96,155,meta,metaSize,palette[3]);
    var subtitle=String(options.subtitle||'').slice(0,65),subtitleSize=20;
    while(subtitleSize>14&&measure(subtitle,subtitleSize)>titleWidth)subtitleSize--;
    text(96,195,subtitle,subtitleSize,palette[3]);
    if(poster&&options.rules){
      var ruleLines=wrap(options.rules,490,18,measure),boxHeight=ruleLines.length*27+65;
      var ruleScale=options.ratio==='reference'?Math.min(1,530/boxHeight):1;
      if(ruleScale<1)out.push('<g transform="translate('+(660*(1-ruleScale))+' '+(45*(1-ruleScale))+') scale('+ruleScale+')">');
      out.push('<rect x="660" y="45" width="530" height="'+boxHeight+'" rx="8" fill="#eddbb5" stroke="#b59b6e"/>');
      text(685,78,'❖ 特殊规则 ❖',24,'#72512f',700);
      ruleLines.forEach(function(line,i){text(680,113+i*27,line,18,'#493e31');});
      if(ruleScale<1)out.push('</g>');
    }
    if(poster){
      out.push('<defs><pattern id="night-grain" width="34" height="46" patternUnits="userSpaceOnUse"><rect width="34" height="46" fill="#e4dcc9"/><path d="M-8 18L30 0M5 46L42 23M0 6L34 35M7 0L22 46" stroke="#b9ad91" stroke-opacity=".12" stroke-width=".7"/><path d="M2 15l4 2m17 18l5-3m-14-5l2 4" stroke="#cec3ac" stroke-opacity=".14"/></pattern><linearGradient id="night-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".12" stop-color="white"/><stop offset=".88" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="night-edge-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#night-fade)"/></mask></defs>');
      var railTop=Math.min(440,Math.round(height*.27)),maxCount=Math.max((options.first||[]).length,(options.other||[]).length,1);
      var step=Math.min(47,(height-railTop-190)/(maxCount+2)),size=Math.min(50,step*.94);
      [['first','首个','夜晚',0],['other','其他','夜晚',1208]].forEach(function(rail){
        var list=options[rail[0]]||[],x=rail[3],cx=x+36;
        out.push('<g class="night-rail" aria-label="'+(rail[0]==='first'?'首夜':'其他夜晚')+'"><rect x="'+x+'" width="72" height="'+height+'" fill="url(#night-grain)" opacity=".9" mask="url(#night-edge-mask)"/><path d="M '+(x===0?71:1209)+' 100 V '+(height-100)+'" stroke="#a89a7c" stroke-opacity=".2"/>');
        out.push('<text x="'+cx+'" y="'+railTop+'" text-anchor="middle" font-family="SimSun,serif" font-size="25" font-weight="700" fill="#665e4e"><tspan x="'+cx+'">'+rail[1]+'</tspan><tspan x="'+cx+'" dy="29">'+rail[2]+'</tspan></text>');
        var moonY=railTop+59;
        out.push('<circle cx="'+cx+'" cy="'+moonY+'" r="15" fill="#d9d1c1" stroke="#aaa08b" stroke-width="1.3"/><path d="M '+(cx+6)+' '+(moonY-10)+' A 11 11 0 1 0 '+(cx+10)+' '+(moonY+5)+' A 9 9 0 0 1 '+(cx+6)+' '+(moonY-10)+'" fill="#777365"/>');
        list.forEach(function(role,i){
          var icon=icons[role.im]||icons[role.id],y=railTop+85+i*step;
          out.push('<g><title>'+esc((i+1)+'. '+role.n)+'</title>');
          if(/^data:image\/(png|jpeg|webp);base64,/.test(icon||''))out.push('<image href="'+esc(icon)+'" x="'+(cx-size/2)+'" y="'+y+'" width="'+size+'" height="'+size+'"/>');
          else out.push('<text x="'+cx+'" y="'+(y+size*.6)+'" text-anchor="middle" font-size="'+Math.min(15,size*.32)+'" fill="#665e4e">'+esc(Array.from(role.n||'?').slice(0,3).join(''))+'</text>');
          out.push('</g>');
        });
        var sunY=railTop+85+list.length*step+18;
        if(!list.length)text(x+8,sunY-6,'无行动',16,'#665e4e');
        else{
          out.push('<g><title>黎明</title><circle cx="'+cx+'" cy="'+sunY+'" r="12" fill="#b6a173"/>');
          for(var ray=0;ray<12;ray++){var angle=ray*Math.PI/6;out.push('<path d="M '+(cx+15*Math.cos(angle))+' '+(sunY+15*Math.sin(angle))+' L '+(cx+19*Math.cos(angle))+' '+(sunY+19*Math.sin(angle))+'" stroke="#b6a173" stroke-width="2"/>');}out.push('</g>');
        }
        out.push('</g>');
      });
    }
    if(layout.bodyScale&&layout.bodyScale<1)out.push('<g transform="translate('+(640*(1-layout.bodyScale))+' '+(layout.bodyTop*(1-layout.bodyScale))+') scale('+layout.bodyScale+')">');
    layout.pages[pageIndex].forEach(function(item){
      if(item.kind==='heading'){
        out.push('<rect x="'+item.x+'" y="'+(item.y-26)+'" width="5" height="28" rx="2" fill="'+colors[item.team]+'"/>');
        var label=poster?(['townsfolk','outsider'].indexOf(item.team)>=0?'善良阵营 · ':['minion','demon'].indexOf(item.team)>=0?'邪恶阵营 · ':'')+labels[item.team]:labels[item.team];
        text(item.x+16,item.y,label,26,poster?colors[item.team]:palette[2],700);
        if(poster)out.push('<path d="M '+(item.x+265)+' '+(item.y-9)+' H 1184" stroke="#a49a87"/>');return;
      }
      var role=item.role,icon=icons[role.im]||icons[role.id];
      if(/^data:image\/(png|jpeg|webp);base64,/.test(icon||''))out.push('<image href="'+esc(icon)+'" x="'+item.x+'" y="'+item.y+'" width="'+iconSize+'" height="'+iconSize+'"/>');
      else {out.push('<circle cx="'+(item.x+40)+'" cy="'+(item.y+40)+'" r="32" fill="'+colors[item.team]+'" opacity="0.16"/>');text(item.x+25,item.y+51,Array.from(role.n||'?')[0],30,palette[2],600);}
      var nameSize=poster?Math.max(20,layout.font+2):layout.font;
      var name=wrap((role.n||role.id)+(item.continued?'（续）':''),item.width-100,nameSize,measure);
      text(item.x+100,item.y+24,name[0]+(name.length>1?'…':''),nameSize,poster?colors[item.team]:palette[2],700);
      item.lines.forEach(function(line,i){text(item.x+100,item.y+(layout.abilityY||62)+i*(layout.lineHeight||layout.font*1.5),line,layout.font,palette[2]);});
      var noteY=item.y+item.noteTop,noteFont=Math.max(options.ratio==='reference'?12:16,layout.font-5);
      (item.notes||[]).forEach(function(note){
        var x=item.x+96,partnerIcon=icons[note.partner.im]||icons[note.partner.id];
        out.push('<rect x="'+x+'" y="'+noteY+'" width="'+(item.width-96)+'" height="'+note.height+'" rx="7" fill="'+(options.theme==='night'&&!poster?'#344259':'#ddd7c9')+'"/>');
        if(/^data:image\/(png|jpeg|webp);base64,/.test(partnerIcon||''))out.push('<image href="'+esc(partnerIcon)+'" x="'+(x+5)+'" y="'+(noteY+7)+'" width="32" height="32"/>');
        note.lines.forEach(function(line,i){text(x+42,noteY+noteFont+9+i*noteFont*1.5,line,noteFont,palette[2]);});
        noteY+=note.height+8;
      });
    });
    if(layout.bodyScale&&layout.bodyScale<1)out.push('</g>');
    text(96,height-52,'钟楼资料库 · 剧本制图',18,palette[3]);
    text(980,height-52,'完整剧本 · '+options.total+' 个角色',18,palette[3]);
    out.push('</svg>');return out.join('');
  }
  root.ScriptArt={layout:layout,svg:svg,wrap:wrap,jinxFor:jinxFor};
})(typeof window==='undefined'?globalThis:window);
