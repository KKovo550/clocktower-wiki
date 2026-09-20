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
    var width=1280,height=1800,margin=64,gap=32,top=240,bottom=1680;
    var colWidth=(width-margin*2-gap*(columns-1))/columns,lineHeight=font*1.5;
    var pages=[],items=[],column=0,y=top,lastTeam='';
    function next(){column++;y=top;lastTeam='';if(column===columns){pages.push(items);items=[];column=0;if(pages.length>=60)throw new Error('内容过长，请减少角色或说明长度后生成。');}}
    teams.forEach(function(team){
      roles.filter(function(r){return (r.t==='traveler'?'traveller':r.t)===team;}).forEach(function(role){
        var lines=wrap(role.ab||'暂无能力描述',colWidth-100,font,measure),offset=0,continuation=false;
        while(offset<lines.length){
          if(y+150+(lastTeam===team?0:54)>bottom)next();
          var x=margin+column*(colWidth+gap);
          if(lastTeam!==team){items.push({kind:'heading',x:x,y:y,team:team});y+=54;lastTeam=team;}
          var capacity=Math.max(1,Math.floor((bottom-y-70)/lineHeight));
          var fragment=lines.slice(offset,offset+capacity);
          items.push({kind:'role',x:x,y:y,width:colWidth,team:team,role:role,lines:fragment,continued:continuation});
          y+=Math.max(112,62+fragment.length*lineHeight)+24;
          offset+=fragment.length;continuation=true;
          if(offset<lines.length)next();
        }
      });
    });
    if(items.length)pages.push(items);
    return {pages:pages,width:width,height:height,font:font};
  }
  function svg(layout,pageIndex,options,icons,measure){
    var themes={cloud:['#f1f5fa','#ffffff','#172b46','#64758b'],paper:['#f5f0e5','#fffcf5','#3e352b','#85755f'],night:['#121b2b','#1b2940','#f3f6ff','#b1c0d7']};
    var palette=themes[options.theme]||themes.cloud;
    var out=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1800" viewBox="0 0 1280 1800">',
      '<rect width="1280" height="1800" fill="'+palette[0]+'"/>'];
    if(/^data:image\/(png|jpeg|webp);base64,/.test(options.background||''))out.push('<image href="'+esc(options.background)+'" width="1280" height="1800" preserveAspectRatio="xMidYMid slice" opacity="0.65"/>');
    out.push('<rect x="32" y="32" width="1216" height="1736" rx="24" fill="'+palette[1]+'" fill-opacity="0.88"/>');
    function text(x,y,value,size,color,weight){out.push('<text x="'+x+'" y="'+y+'" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="'+size+'" font-weight="'+(weight||400)+'" fill="'+color+'">'+esc(value)+'</text>');}
    var title=String(options.title||'未命名剧本');
    var titleSize=48;while(titleSize>22&&measure(title,titleSize)>1140)titleSize--;
    var titleLines=wrap(title,1140,titleSize,measure);
    text(64,110,titleLines[0]+(titleLines.length>1?'…':''),titleSize,palette[2],700);
    var meta=(options.author?'作者：'+String(options.author).slice(0,48)+'  ·  ':'')+options.total+' 个角色',metaSize=22;
    while(metaSize>14&&measure(meta,metaSize)>1140)metaSize--;
    text(64,155,meta,metaSize,palette[3]);
    var subtitle=String(options.subtitle||'').slice(0,65),subtitleSize=20;
    while(subtitleSize>14&&measure(subtitle,subtitleSize)>1140)subtitleSize--;
    text(64,195,subtitle,subtitleSize,palette[3]);
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
    text(64,1727,'钟楼资料库 · 剧本制图',18,palette[3]);
    text(1100,1727,(pageIndex+1)+' / '+layout.pages.length,18,palette[3]);
    out.push('</svg>');return out.join('');
  }
  root.ScriptArt={layout:layout,svg:svg,wrap:wrap};
})(typeof window==='undefined'?globalThis:window);
