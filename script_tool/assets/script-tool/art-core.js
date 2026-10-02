(function(root){
  'use strict';
  var teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
  var labels={townsfolk:'镇民',outsider:'外来者',minion:'爪牙',demon:'恶魔',traveller:'旅行者',fabled:'传奇角色',loric:'奇遇角色'};
  var colors={townsfolk:'#1966ac',outsider:'#14658b',minion:'#852c2b',demon:'#852c2b',traveller:'#986a27',fabled:'#846631',loric:'#668346'};
  function material(options,id){return (options.decorations||[]).find(function(item){return item.id===id;});}
  function embedded(item){return item&&/^data:image\/(png|jpeg|webp);base64,/.test(item.image||'');}
  function footerHeight(options){var footer=material(options,options.footer);return options.style==='poster'&&embedded(footer)?Math.min(220,Math.ceil(864/(Number(footer.aspect)||5.6)))+30:0;}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function wrap(text,width,size,measure){
    var lines=[],line='';
    String(text||'').replace(/\r\n?/g,'\n').split('\n').forEach(function(paragraph){
      line='';Array.from(paragraph).forEach(function(char){
        if(line&&measure(line+char,size)>width){
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
  function layout(roles,options,measure){
    if(!roles.length)throw new Error('请先添加角色。');
    if(roles.some(function(r){return teams.indexOf(r.t==='traveler'?'traveller':r.t)<0;}))throw new Error('存在未知角色类型，请先检查剧本。');
    var columns=Number(options.columns)||2,font=Number(options.font)||24;
    if([1,2,3].indexOf(columns)<0||font<(options._fit?14:18)||font>32)throw new Error('无效的布局设置。');
    var poster=options.style==='poster';if(poster)columns=2;
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
    var colWidth=visibleColWidth/fittingScale,lineHeight=font*(compact?1.35:1.5),abilityY=poster?Math.max(58,font+36):62;
    var rows=[],jinxes=jinxFor(roles,options.showJinx===false?[]:options.jinx);
    var jinxFont=Math.max(compact?12:16,font-5);
    teams.forEach(function(team){
      roles.filter(function(r){return (r.t==='traveler'?'traveller':r.t)===team;}).forEach(function(role){
        var lines=wrap(role.ab||'暂无能力描述',colWidth-(poster?86:100),font,measure);
        var notes=(jinxes[role.id]||[]).map(function(note){
          var noteLines=wrap('与'+note.partner.n+'相克：'+note.text,colWidth-148,jinxFont,measure);
          return {partner:note.partner,lines:noteLines,height:Math.max(compact?30:46,noteLines.length*jinxFont*(compact?1.25:1.5)+(compact?10:20))};
        });
        var noteTop=compact?Math.max(72,abilityY+Math.max(0,lines.length-1)*lineHeight+font*.3+6):Math.max(100,abilityY+lines.length*lineHeight);
        rows.push({role:role,team:team,lines:lines,notes:notes,noteTop:noteTop,height:Math.max(compact?72:112,noteTop+notes.reduce(function(n,note){return n+note.height+8;},0))+(compact?20:24)});
      });
    });
    if(poster){
      var items=[],y=top;
      teams.forEach(function(team){
        var group=rows.filter(function(row){return row.team===team;});if(!group.length)return;
        items.push({kind:'heading',x:margin,y:y,team:team});y+=45;
        var half=Math.ceil(group.length/2),columnsInBand=[group.slice(0,half),group.slice(half)];
        var bandHeight=Math.max.apply(null,columnsInBand.map(function(column){return column.reduce(function(n,row){return n+row.height;},0);}));
        columnsInBand.forEach(function(column,index){
          var used=column.reduce(function(n,row){return n+row.height;},0),extra=bandHeight-used;
          var cy=y,spacing=column.length>1?Math.min(compact?24:48,extra/(column.length-1)):0;
          column.forEach(function(row){items.push({kind:'role',x:((team==='fabled'||team==='loric')&&group.length===1?(width-visibleColWidth)/2:margin+index*(visibleColWidth+gap)),y:cy,width:colWidth,team:team,role:row.role,lines:row.lines,notes:row.notes,noteTop:row.noteTop});cy+=row.height+spacing;});
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
    return {pages:[result.items],width:width,height:Math.max(1800,Math.ceil(result.bottom+112)),font:font,ruleBox:ruleBox,bodyTop:top};
  }

  function roleBounds(plan,item){
    var scale=plan.bodyScale||1,top=plan.bodyTop||0;
    return {x:item.x,y:top+(item.y-top)*scale,width:item.width*scale,height:(item.noteTop+(item.notes||[]).reduce(function(n,note){return n+note.height+8;},0))*scale};
  }

  function svg(layout,pageIndex,options,icons,measure){
    var themes={cloud:['#f1f5fa','#ffffff','#172b46','#64758b'],paper:['#f5f0e5','#fffcf5','#3e352b','#85755f'],night:['#121b2b','#1b2940','#f3f6ff','#b1c0d7']};
    var poster=options.style==='poster';
    var palette=poster?themes.paper:(themes[options.theme]||themes.cloud);
    if((options.decorations||[]).some(function(item){return item.id===options.backdrop&&item.image;}))palette=themes.paper;
    var height=layout.height,iconSize=poster&&(options.ratio==='reference'||options.ratio==='readable')?72:80;
    var out=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="'+height+'" viewBox="0 0 1280 '+height+'">',
      '<rect width="1280" height="'+height+'" fill="'+palette[0]+'"/>'];
    if(/^data:image\/(png|jpeg|webp);base64,/.test(options.background||''))out.push('<image href="'+esc(options.background)+'" width="1280" height="'+height+'" preserveAspectRatio="xMidYMid slice" opacity="0.65"/>');
    out.push('<rect x="32" y="32" width="1216" height="'+(height-64)+'" rx="24" fill="'+palette[1]+'" fill-opacity="0.88"/>');
    var decorationData=options.decorations||[];
    function chosen(id){return decorationData.find(function(item){return item.id===id;});}
    function materialImage(item,x,y,width,height){if(!embedded(item))return false;out.push('<image data-material="'+esc(item.id)+'" href="'+esc(item.image)+'" x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" preserveAspectRatio="none"/>');return true;}
    var backdrop=chosen(options.backdrop);
    if(backdrop&&/^data:image\/(png|jpeg|webp);base64,/.test(backdrop.image||''))out.push('<image href="'+esc(backdrop.image)+'" width="1280" height="'+height+'" preserveAspectRatio="none"/>');
    function bands(id,opacity){
      var item=chosen(id);if(!item)return;
      ['top','bottom'].forEach(function(edge){
        if(!/^data:image\/(png|jpeg|webp);base64,/.test(item[edge]||''))return;
        if(id===options.ornament){
          // Reduce each corner independently, keeping it attached to the edge.
          // Scaling a complete corner sheet would move the opposite corner in.
          var cornerWidth=922,cornerHeight=item.height*.72;
          out.push('<g data-material="'+esc(item.id)+'" opacity="'+opacity+'">');
          [0,1].forEach(function(side){out.push('<svg x="'+(side*640)+'" y="'+(edge==='top'?0:height-cornerHeight)+'" width="640" height="'+cornerHeight+'" viewBox="'+(side?cornerWidth-640:0)+' 0 640 '+cornerHeight+'" overflow="hidden"><image href="'+esc(item[edge])+'" width="'+cornerWidth+'" height="'+cornerHeight+'"/></svg>');});
          out.push('</g>');
        }else out.push('<image data-material="'+esc(item.id)+'" href="'+esc(item[edge])+'" x="0" y="'+(edge==='top'?0:height-item.height)+'" width="1280" height="'+item.height+'" opacity="'+opacity+'"/>');
      });
    }
    bands(options.pattern,0.35);
    function text(x,y,value,size,color,weight){out.push('<text x="'+x+'" y="'+y+'" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="'+size+'" font-weight="'+(weight||400)+'" fill="'+color+'">'+esc(value)+'</text>');}
    var title=String(options.title||'未命名剧本');
    var titleWidth=poster&&options.rules?515:1088;
    var logoPresets={
      shards:{font:'SimHei,Microsoft YaHei,sans-serif',inks:['#16769b','#374665','#5c3d71'],outline:'#eee8d8',angles:[-7,5,-4,6],shadow:'#292832'},
      ember:{font:'STKaiti,KaiTi,serif',inks:['#a84728','#862e30','#bf6932'],outline:'#f1dfb7',angles:[-3,3],shadow:'#462c29'},
      obsidian:{font:'STSong,SimSun,serif',inks:['#272733','#403843'],outline:'#ba985a',angles:[0],shadow:'#665d52'},
      jade:{font:'STSong,SimSun,serif',inks:['#246458','#397c68'],outline:'#e9d5a2',angles:[0],shadow:'#28473f'},
      lunar:{font:'STKaiti,KaiTi,serif',inks:['#344765','#514875'],outline:'#e3e2e9',angles:[-2,2],shadow:'#272638'},
      violet:{font:'SimHei,Microsoft YaHei,sans-serif',inks:['#684c87','#423775','#876291'],outline:'#e4d8ec',angles:[-4,4],shadow:'#302b46'}
    };
    var logoPreset=Object.prototype.hasOwnProperty.call(logoPresets,options.titleStyle)?logoPresets[options.titleStyle]:null;
    var titleStyle=['plain','epic','brush','classic','gold','crimson'].includes(options.titleStyle)||logoPreset?options.titleStyle:'plain';
    var titleSize=titleStyle==='plain'?48:poster?120:78;while(titleSize>22&&measure(title,titleSize)>titleWidth-16)titleSize--;
    var titleLines=wrap(title,titleWidth,titleSize,measure);
    var titleValue=titleLines[0]+(titleLines.length>1?'…':'');
    var titleFonts={plain:'system-ui,Microsoft YaHei,sans-serif',epic:'Microsoft YaHei,SimHei,sans-serif',brush:'STKaiti,KaiTi,serif',classic:'STSong,SimSun,serif',gold:'STSong,SimSun,serif',crimson:'Microsoft YaHei,SimHei,sans-serif'};
    var titleInk={plain:palette[2],epic:'url(#title-blue)',brush:palette[2],classic:palette[2],gold:'url(#title-gold)',crimson:'#8f2434'};
    out.push('<defs><linearGradient id="title-blue" x2="0" y2="1"><stop stop-color="#087193"/><stop offset=".55" stop-color="#243d60"/><stop offset="1" stop-color="#5a355b"/></linearGradient><linearGradient id="title-gold" x2="0" y2="1"><stop stop-color="#fff0b8"/><stop offset=".45" stop-color="#c5963e"/><stop offset="1" stop-color="#75501c"/></linearGradient></defs>');
    var titleLength=Math.min(titleWidth-16,Math.max(1,measure(titleValue,titleSize)));
    var titleX=poster&&!options.rules?(1280-titleLength)/2:96;
    function titleLayer(dx,dy,fill,stroke,width){out.push('<text x="'+(titleX+dx)+'" y="'+((poster?125:110)+dy)+'" font-family="'+titleFonts[titleStyle]+'" font-size="'+titleSize+'" font-weight="'+(titleStyle==='classic'?600:900)+'" textLength="'+titleLength+'" lengthAdjust="spacingAndGlyphs" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" paint-order="stroke fill">'+esc(titleValue)+'</text>');}
    var logo=options.logo,hasLogo=embedded(logo)&&Number.isFinite(Number(logo.aspect))&&Number(logo.aspect)>0;
    if(hasLogo){
      var logoWidth=Math.min(titleWidth-16,124*Number(logo.aspect)),logoHeight=logoWidth/Number(logo.aspect);
      out.push('<image data-title-logo="uploaded" href="'+esc(logo.image)+'" x="'+(poster&&!options.rules?(1280-logoWidth)/2:96)+'" y="'+(132-logoHeight)+'" width="'+logoWidth+'" height="'+logoHeight+'" preserveAspectRatio="xMidYMid meet"/>');
    }else{
      out.push('<g data-title-style="'+titleStyle+'"><title>'+esc(titleValue)+'</title>');
      var preset=logoPreset;
      if(preset){
        out.push('<defs><pattern id="logo-hatching" width="11" height="13" patternUnits="userSpaceOnUse"><path d="M-2 13L11 0M4 13L17 0" stroke="#fff7e6" stroke-width="1" opacity=".22"/></pattern></defs>');
        var glyphX=titleX,baseline=110,glyphs=Array.from(titleValue);
        var advances=glyphs.map(function(char){return measure(char,titleSize);}),advanceScale=titleLength/Math.max(1,advances.reduce(function(n,width){return n+width;},0));
        glyphs.forEach(function(char,index){
          var advance=advances[index]*advanceScale,angle=preset.angles[index%preset.angles.length];
          out.push('<g transform="rotate('+angle+' '+(glyphX+advance/2)+' '+(baseline-titleSize*.4)+')">');
          function glyph(dx,dy,fill,stroke,width){out.push('<text x="'+(glyphX+dx)+'" y="'+(baseline+dy)+'" font-family="'+preset.font+'" font-size="'+titleSize+'" font-weight="900" textLength="'+advance+'" lengthAdjust="spacingAndGlyphs" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="round" paint-order="stroke fill">'+esc(char)+'</text>');}
          glyph(3,5,preset.shadow,preset.shadow,5);glyph(0,0,preset.inks[index%preset.inks.length],preset.outline,3.5);glyph(0,0,'url(#logo-hatching)','none',0);
          out.push('</g>');glyphX+=advance;
        });
      }else if(titleStyle==='epic'){titleLayer(4,6,'#292b37','#292b37',7);titleLayer(0,0,titleInk.epic,'#eee5cc',5);}
      else if(titleStyle==='gold'){titleLayer(2,3,'#4d3821','#4d3821',3);titleLayer(0,0,titleInk.gold,'#725527',1.5);}
      else if(titleStyle==='crimson'){titleLayer(2,4,'#34232d','#eadfcd',3);titleLayer(0,0,titleInk.crimson,'#eadfcd',1);}
      else titleLayer(0,0,titleInk[titleStyle],'none',0);
      out.push('</g>');
    }
    var meta=(options.author?'剧本作者：'+String(options.author).slice(0,48)+'  ·  ':'')+options.total+' 个角色',metaSize=22;
    while(metaSize>14&&measure(meta,metaSize)>titleWidth)metaSize--;
    text(poster&&!options.rules?Math.max(96,1184-measure(meta,metaSize)):96,150,meta,metaSize,options.author?'#000000':palette[3]);
    if(options.version){var versionText=String(options.version).slice(0,18);text(poster&&!options.rules?Math.min(1184-measure(versionText,16),titleX+titleLength+14):96,42,versionText,16,palette[2],700);}
    if(options.players){var playerText=String(options.players).slice(0,24),playerSize=20;while(playerSize>14&&measure(playerText,playerSize)>titleWidth)playerSize--;text(poster&&options.rules?96:1184-measure(playerText,playerSize),174,playerText,playerSize,'#000000',700);}
    var subtitle=String(options.subtitle||'').slice(0,65),subtitleSize=20;
    while(subtitleSize>14&&measure(subtitle,subtitleSize)>titleWidth)subtitleSize--;
    text(96,options.players?198:174,subtitle,subtitleSize,palette[3]);
    if(layout.ruleBox){
      var box=layout.ruleBox;
      if(box.scale<1)out.push('<g transform="translate('+(box.x*(1-box.scale))+' '+(box.y*(1-box.scale))+') scale('+box.scale+')">');
      var statusPanel=poster&&!options.pure&&chosen('status-panel');
      var hasPanel=materialImage(statusPanel,box.x,box.y,box.width,box.height);
      if(hasPanel){
        materialImage(chosen('status-emblem'),box.x+20,box.y+14,36,36);
        text(box.x+65,box.y+41,'特殊规则',24,'#72512f',700);
        materialImage(chosen('status-divider'),box.x+25,box.y+53,box.width-50,24);
      }else{
        out.push('<rect x="'+box.x+'" y="'+box.y+'" width="'+box.width+'" height="'+box.height+'" rx="8" fill="'+(poster?'#eddbb5':palette[0])+'" stroke="'+(poster?'#b59b6e':palette[3])+'"/>');
        text(box.x+25,box.y+33,'❖ 特殊规则 ❖',24,poster?'#72512f':palette[2],700);
      }
      box.lines.forEach(function(line,i){text(box.x+20,box.y+(hasPanel?87:68)+i*27,line,18,poster?'#493e31':palette[2]);});
      if(box.scale<1)out.push('</g>');
    }
    if(poster){
      var railStart=out.length;
      var nightTheme=chosen(options.nightTheme),hasNight=embedded(nightTheme);
      if(hasNight)materialImage(nightTheme,0,0,1280,height);
      out.push('<defs><pattern id="night-grain" width="34" height="46" patternUnits="userSpaceOnUse"><rect width="34" height="46" fill="#e4dcc9"/><path d="M-8 18L30 0M5 46L42 23M0 6L34 35M7 0L22 46" stroke="#b9ad91" stroke-opacity=".12" stroke-width=".7"/><path d="M2 15l4 2m17 18l5-3m-14-5l2 4" stroke="#cec3ac" stroke-opacity=".14"/></pattern><linearGradient id="night-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".12" stop-color="white"/><stop offset=".88" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="night-edge-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#night-fade)"/></mask></defs>');
      var hasMinion=layout.pages[pageIndex].some(function(item){return item.kind==='role'&&item.team==='minion';});
      var hasDemon=layout.pages[pageIndex].some(function(item){return item.kind==='role'&&item.team==='demon';});
      var setupMarkers=[];
      if(hasMinion&&embedded(chosen('marker-minion')))setupMarkers.push(chosen('marker-minion'));
      if(hasDemon&&embedded(chosen('marker-demon')))setupMarkers.push(chosen('marker-demon'));
      var railInk=hasNight&&nightTheme.dark?'#f2e8d7':'#665e4e';
      var railTop=Math.min(440,Math.round(height*.27)),maxCount=Math.max((options.first||[]).length+setupMarkers.length,(options.other||[]).length,1);
      var step=Math.min(47,(height-railTop-190)/(maxCount+2)),size=Math.min(50,step*.94);
      [['first','首个','夜晚',0],['other','其他','夜晚',1208]].forEach(function(rail){
        var list=options[rail[0]]||[],x=rail[3],cx=x+36;
        out.push('<g class="night-rail" aria-label="'+(rail[0]==='first'?'首夜':'其他夜晚')+'">');
        if(!hasNight)out.push('<rect x="'+x+'" width="72" height="'+height+'" fill="url(#night-grain)" opacity=".9" mask="url(#night-edge-mask)"/><path d="M '+(x===0?71:1209)+' 100 V '+(height-100)+'" stroke="#a89a7c" stroke-opacity=".2"/>');
        out.push('<text x="'+cx+'" y="'+railTop+'" text-anchor="middle" font-family="SimSun,serif" font-size="25" font-weight="700" fill="'+railInk+'"><tspan x="'+cx+'">'+rail[1]+'</tspan><tspan x="'+cx+'" dy="29">'+rail[2]+'</tspan></text>');
        var moonY=railTop+59;
        if(!materialImage(chosen('marker-dusk'),cx-17,moonY-17,34,34))out.push('<circle cx="'+cx+'" cy="'+moonY+'" r="15" fill="#d9d1c1" stroke="#aaa08b" stroke-width="1.3"/><path d="M '+(cx+6)+' '+(moonY-10)+' A 11 11 0 1 0 '+(cx+10)+' '+(moonY+5)+' A 9 9 0 0 1 '+(cx+6)+' '+(moonY-10)+'" fill="#777365"/>');
        var markers=rail[0]==='first'?setupMarkers:[];
        markers.forEach(function(item,i){materialImage(item,cx-size/2,railTop+85+i*step,size,size);});
        list.forEach(function(role,i){
          var icon=icons[role.im]||icons[role.id],y=railTop+85+(i+markers.length)*step;
          out.push('<g><title>'+esc((i+1)+'. '+role.n)+'</title>');
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
    layout.pages[pageIndex].forEach(function(item){
      var bodyScale=layout.bodyScale||1;
      if(item.kind==='heading'){
        var headingY=(layout.bodyTop||0)+(item.y-(layout.bodyTop||0))*bodyScale;
        if(!poster)out.push('<rect x="'+item.x+'" y="'+(item.y-26)+'" width="5" height="28" rx="2" fill="'+colors[item.team]+'"/>');
        var label=poster?(['townsfolk','outsider'].indexOf(item.team)>=0?'善良阵营 · ':['minion','demon'].indexOf(item.team)>=0?'邪恶阵营 · ':'')+labels[item.team]:labels[item.team];
        if(poster&&(item.team==='fabled'||item.team==='loric')){out.push('<path d="M 96 '+(headingY-9*bodyScale)+' H 880" stroke="#a49a87"/><text x="1184" y="'+headingY+'" text-anchor="end" font-family="STSong,SimSun,serif" font-size="'+(27*bodyScale)+'" font-weight="900" fill="'+colors[item.team]+'">'+esc(labels[item.team]+(item.team==='fabled'?' · 说书人':''))+'</text>');return;}
        if(poster)out.push('<text x="'+item.x+'" y="'+headingY+'" font-family="STSong,SimSun,serif" font-size="'+(27*bodyScale)+'" font-weight="900" stroke="'+colors[item.team]+'" stroke-width="0.45" paint-order="stroke fill" fill="'+colors[item.team]+'">'+esc(label)+'</text>');else text(item.x+16,item.y,label,26,palette[2],700);
        if(poster)out.push('<path d="M '+(item.x+265*bodyScale)+' '+(headingY-9*bodyScale)+' H 1184" stroke="#a49a87"/>');return;
      }
      if(bodyScale<1)out.push('<g transform="translate('+(item.x*(1-bodyScale))+' '+(layout.bodyTop*(1-bodyScale))+') scale('+bodyScale+')">');
      var role=item.role,icon=icons[role.im]||icons[role.id];
      if(/^data:image\/(png|jpeg|webp);base64,/.test(icon||''))out.push('<image href="'+esc(icon)+'" x="'+item.x+'" y="'+item.y+'" width="'+iconSize+'" height="'+iconSize+'"/>');
      else {out.push('<circle cx="'+(item.x+40)+'" cy="'+(item.y+40)+'" r="32" fill="'+colors[item.team]+'" opacity="0.16"/>');text(item.x+25,item.y+51,Array.from(role.n||'?')[0],30,palette[2],600);}
      var nameSize=poster?Math.max(24,layout.font+4):layout.font,offset=poster?86:100;
      var name=wrap((role.n||role.id)+(item.continued?'（续）':''),item.width-offset,nameSize,measure);
      if(poster)out.push('<text x="'+(item.x+offset)+'" y="'+(item.y+24)+'" font-family="STSong,SimSun,serif" font-size="'+nameSize+'" font-weight="900" stroke="'+colors[item.team]+'" stroke-width="0.45" paint-order="stroke fill" fill="'+colors[item.team]+'">'+esc(name[0]+(name.length>1?'…':''))+'</text>');else text(item.x+offset,item.y+24,name[0]+(name.length>1?'…':''),nameSize,palette[2],700);
      item.lines.forEach(function(line,i){
        var y=item.y+(layout.abilityY||62)+i*(layout.lineHeight||layout.font*1.5);
        if(!poster){text(item.x+offset,y,line,layout.font,palette[2]);return;}
        var spans=line.split(/(不会死亡|邪恶|恶魔|爪牙|死亡|处决|中毒|醉酒|善良|镇民|外来者|存活)/g).map(function(part){var ink=/^(不会死亡|善良|镇民|外来者|存活)$/.test(part)?'#14658b':/^(邪恶|恶魔|爪牙|死亡|处决|中毒|醉酒)$/.test(part)?'#942f2d':'#28231d';return '<tspan fill="'+ink+'">'+esc(part)+'</tspan>';}).join('');
        out.push('<text x="'+(item.x+offset)+'" y="'+y+'" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="'+layout.font+'" font-weight="500">'+spans+'</text>');
      });
      var noteY=item.y+item.noteTop,noteFont=Math.max(poster&&(options.ratio==='reference'||options.ratio==='readable')?12:16,layout.font-5);
      (item.notes||[]).forEach(function(note){
        var x=item.x+96,partnerIcon=icons[note.partner.im]||icons[note.partner.id];
        out.push('<rect x="'+x+'" y="'+noteY+'" width="'+(item.width-96)+'" height="'+note.height+'" rx="7" fill="'+(options.theme==='night'&&!poster?'#344259':'#ddd7c9')+'"/>');
        if(/^data:image\/(png|jpeg|webp);base64,/.test(partnerIcon||''))out.push('<image href="'+esc(partnerIcon)+'" x="'+(x+5)+'" y="'+(noteY+7)+'" width="24" height="24"/>');
        note.lines.forEach(function(line,i){text(x+42,noteY+noteFont+(poster&&(options.ratio==='reference'||options.ratio==='readable')?4:9)+i*noteFont*(poster&&(options.ratio==='reference'||options.ratio==='readable')?1.25:1.5),line,noteFont,palette[2]);});
        noteY+=note.height+8;
      });
      if(bodyScale<1)out.push('</g>');
    });
    if(poster){
      var footnote=chosen(options.footer),footHeight=footerHeight(options)-30;
      if(footHeight>0)materialImage(footnote,208,height-90-footHeight,864,footHeight);
      if(!materialImage(!options.pure&&chosen('footer-night'),536,height-95,208,95))out.push('<path d="M 475 '+(height-57)+' Q 640 '+(height-110)+' 805 '+(height-57)+' L 805 '+height+' H 475 Z" fill="#766d60" opacity=".85"/><text x="640" y="'+(height-34)+'" text-anchor="middle" font-family="STSong,SimSun,serif" font-size="21" font-weight="700" fill="#fff5df">* 代表非首个夜晚</text>');
    }else text(96,height-52,'钟楼资料库 · 剧本制图',18,palette[3]);
    if(!poster)text(980,height-52,'完整剧本 · '+options.total+' 个角色',18,palette[3]);
    // Corner leaves are opaque foreground artwork, not a translucent texture.
    // Their alpha channel leaves the role text clear while overlapping rails.
    bands(options.ornament,1);
    out.push('</svg>');return out.join('');
  }
  root.ScriptArt={layout:layout,svg:svg,wrap:wrap,jinxFor:jinxFor,roleBounds:roleBounds};
})(typeof window==='undefined'?globalThis:window);
