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
  function layout(roles,options,measure){
    if(!roles.length)throw new Error('请先添加角色。');
    if(roles.some(function(r){return teams.indexOf(r.t==='traveler'?'traveller':r.t)<0;}))throw new Error('存在未知角色类型，请先检查剧本。');
    var columns=Number(options.columns)||2,font=Number(options.font)||24;
    if([1,2,3].indexOf(columns)<0||font<18||font>32)throw new Error('无效的布局设置。');
    var width=1280,margin=96,gap=32,top=260;
    var colWidth=(width-margin*2-gap*(columns-1))/columns,lineHeight=font*1.5;
    var rows=[];
    teams.forEach(function(team){
      roles.filter(function(r){return (r.t==='traveler'?'traveller':r.t)===team;}).forEach(function(role){
        var lines=wrap(role.ab||'暂无能力描述',colWidth-100,font,measure);
        rows.push({role:role,team:team,lines:lines,height:Math.max(112,62+lines.length*lineHeight)+24});
      });
    });
    function arrange(capacity){
      var items=[],column=0,y=top,lastTeam='',maxY=top;
      rows.forEach(function(row){
        var heading=lastTeam===row.team?0:54;
        if(y>top&&y-top+heading+row.height>capacity){column++;y=top;lastTeam='';}
        var x=margin+column*(colWidth+gap);
        if(lastTeam!==row.team){items.push({kind:'heading',x:x,y:y,team:row.team});y+=54;lastTeam=row.team;}
        items.push({kind:'role',x:x,y:y,width:colWidth,team:row.team,role:row.role,lines:row.lines});
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
    var palette=themes[options.theme]||themes.cloud;
    if((options.decorations||[]).some(function(item){return item.id===options.backdrop&&item.image;}))palette=themes.paper;
    var height=layout.height;
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
    var titleSize=48;while(titleSize>22&&measure(title,titleSize)>1088)titleSize--;
    var titleLines=wrap(title,1088,titleSize,measure);
    text(96,110,titleLines[0]+(titleLines.length>1?'…':''),titleSize,palette[2],700);
    var meta=(options.author?'作者：'+String(options.author).slice(0,48)+'  ·  ':'')+options.total+' 个角色',metaSize=22;
    while(metaSize>14&&measure(meta,metaSize)>1088)metaSize--;
    text(96,155,meta,metaSize,palette[3]);
    var subtitle=String(options.subtitle||'').slice(0,65),subtitleSize=20;
    while(subtitleSize>14&&measure(subtitle,subtitleSize)>1088)subtitleSize--;
    text(96,195,subtitle,subtitleSize,palette[3]);
    layout.pages[pageIndex].forEach(function(item){
      if(item.kind==='heading'){
        out.push('<rect x="'+item.x+'" y="'+(item.y-26)+'" width="5" height="28" rx="2" fill="'+colors[item.team]+'"/>');
        text(item.x+16,item.y,labels[item.team],26,palette[2],700);return;
      }
      var role=item.role,icon=icons[role.im]||icons[role.id];
      if(/^data:image\/(png|jpeg|webp);base64,/.test(icon||''))out.push('<image href="'+esc(icon)+'" x="'+item.x+'" y="'+item.y+'" width="80" height="80"/>');
      else {out.push('<circle cx="'+(item.x+40)+'" cy="'+(item.y+40)+'" r="32" fill="'+colors[item.team]+'" opacity="0.16"/>');text(item.x+25,item.y+51,Array.from(role.n||'?')[0],30,palette[2],600);}
      var name=wrap((role.n||role.id)+(item.continued?'（续）':''),item.width-100,layout.font,measure);
      text(item.x+100,item.y+24,name[0]+(name.length>1?'…':''),layout.font,palette[2],700);
      item.lines.forEach(function(line,i){text(item.x+100,item.y+62+i*layout.font*1.5,line,layout.font,palette[2]);});
    });
    text(96,height-52,'钟楼资料库 · 剧本制图',18,palette[3]);
    text(980,height-52,'完整剧本 · '+options.total+' 个角色',18,palette[3]);
    out.push('</svg>');return out.join('');
  }
  root.ScriptArt={layout:layout,svg:svg,wrap:wrap};
})(typeof window==='undefined'?globalThis:window);
