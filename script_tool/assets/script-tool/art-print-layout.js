(function(root){
  'use strict';
  var teams=['townsfolk','outsider','minion','demon','traveller','fabled','loric'];
  // Keep the established renderer's design coordinates; exported coordinates
  // are derived from the measured reference image, including fractional ratios.
  function layout(roles,options,measure){
    var config=root.ScriptArtPresets,reference=config.reference,art=root.ScriptArt;
    var width=1280,height=reference.height*width/reference.width;
    var fixed=options.ratio!=='readable'&&options.ratio!=='auto',print=options.spacing==='printCompact',poster=options.style==='poster';
    var base=config.spacing[options.spacing]||config.spacing.printCompact;
    var profile=Object.assign({},base),selectedFont=Number(options.font)||24;
    var calibration=print&&config.bodyCalibration&&config.bodyCalibration[options.spacing],referenceLayout=null,referenceIcons=null;
    var distribution=print&&poster&&fixed&&config.sectionDistribution&&config.sectionDistribution[options.spacing],townGap=0,demonRoleGap=0;
    var jinxes=art.jinxFor(roles,options.showJinx===false?[]:options.jinx);
    var footer=poster&&!options.pure&&options.footer==='print-note'?136:0;
    var material=(options.decorations||[]).find(function(item){return item.id===options.footer;});
    if(poster&&!options.pure&&material&&/^data:image\//.test(material.image||''))footer=Math.min(220,Math.ceil(864/(Number(material.aspect)||5.6)))+30;
    var footerGap=footer?profile.footerGap:0;
    var footerOffset=fixed&&print&&footer&&options.footer==='print-note'?config.printDetails.footer.offsetY||0:0;
    function arrange(){
      var font=referenceLayout?referenceLayout.font*calibration.bodyFontScale:Math.max(18,selectedFont-(profile.fontReduction||0));
      var lineHeight=font*(referenceLayout?referenceLayout.lineHeight/referenceLayout.font*calibration.lineHeightScale:profile.lineHeight);
      var count=poster?2:Number(options.columns)||2;
      var margin=92,gap=26,colWidth=(width-2*margin-gap*(count-1))/count;
      var iconFrameWidth=referenceLayout?calibration.iconFrameWidth:profile.iconSize;
      var offset=referenceLayout?iconFrameWidth+calibration.iconTextGap:profile.textOffset;
      var bodyTextWidth=(colWidth-offset)*(referenceLayout?calibration.bodyWidthScale:profile.bodyWidthScale||1);
      var nameScale=config.bodyTypography.roleNameScale;
      var nameFontSize=referenceLayout?referenceLayout.nameFontSize*calibration.roleNameScale:(profile.nameSize-(print?config.printDetails.roleName.fontReduction:0))*nameScale;
      var bodyNameSize=referenceLayout&&calibration.nameBaselineScale?referenceLayout.nameFontSize*calibration.nameBaselineScale:nameFontSize;
      var bodyNameBaseline=referenceLayout?referenceLayout.nameBaseline*(calibration.nameBaselineScale||calibration.roleNameScale):print?profile.nameSize*nameScale:Math.max(32,profile.nameSize);
      var nameBaseline=bodyNameBaseline-(nameFontSize-bodyNameSize)*.15;
      // Reserve the name's descent as well as its baseline. Both columns use
      // the same text anchors, independent of an icon's intrinsic dimensions.
      // Enlarge names around their existing baseline without shifting the body.
      var abilityY=Math.max(profile.abilityY,font+bodyNameBaseline+bodyNameSize*.15+(profile.nameBodyGap||3));
      var top=poster?profile.bodyTop:260,ruleBox=null;
      if(options.subtitle)top+=28;
      if(options.rules){
        var ruleLines=art.wrap(options.rules,poster?486:1048,18,measure);
        ruleBox={x:poster?660:96,y:poster?24:210,width:poster?530:1088,height:ruleLines.length*27+65,lines:ruleLines,scale:1};
        top=Math.max(top,ruleBox.y+ruleBox.height+28);
      }
      var rows=roles.map(function(role){
        var lines=art.wrap(role.ab||'暂无能力描述',bodyTextWidth,font,measure,'body');
        var noteStyle=print&&config.printDetails.jinx;
        var noteFont=Math.max(noteStyle?noteStyle.minFont:13,(referenceLayout?referenceLayout.font:font)-(noteStyle?noteStyle.fontReduction:5))*(noteStyle&&noteStyle.fontScale||1);
        var notes=(jinxes[role.id]||[]).map(function(note){
          var lines=art.wrap('与'+note.partner.n+'相克：'+note.text,colWidth-offset-(noteStyle?noteStyle.textOffset:42),noteFont,measure,'body');
          return {partner:note.partner,lines:lines,height:Math.max(noteStyle?noteStyle.minHeight:30,lines.length*noteFont*1.2+(noteStyle?noteStyle.verticalPadding:10))};
        });
        var abilityBottom=abilityY+(lines.length-1)*lineHeight+font*.3;
        // Match the icon to the name + ability, excluding jinx notes. Keep a
        // fixed text anchor and cap long abilities at the existing icon cell.
        var textTop=nameBaseline-nameFontSize;
        var textHeight=abilityBottom-textTop;
        var maxIconSize=Math.min(profile.iconSize*(profile.maxIconScale||1),2*(offset-(profile.iconTextGap||0))-profile.iconSize);
        var iconSize=referenceLayout?Math.min(iconFrameWidth,abilityBottom,referenceIcons.get(role.id)*calibration.iconScale):profile.iconSizing==='text-block'?Math.min(maxIconSize,Math.max(profile.minIconSize||40,textHeight)):profile.iconSize;
        var iconX=(iconFrameWidth-iconSize)/2;
        var iconY=referenceLayout||profile.iconSizing==='text-block'?Math.max(0,textTop+(textHeight-iconSize)/2):0;
        var noteGap=profile.noteBlockGap===undefined?8:profile.noteBlockGap;
        // Notes belong to the text column: they can sit beside the bottom of
        // the icon instead of reserving an empty full-width row below it.
        var noteTop=notes.length?abilityBottom+(profile.noteInlineGap===undefined?8:profile.noteInlineGap):abilityBottom+(profile.bodyBottomGap||0);
        var noteHeight=notes.reduce(function(n,note){return n+note.height;},0)+Math.max(0,notes.length-1)*noteGap;
        var extent=Math.max(iconY+iconSize,noteTop+noteHeight);
        return {role:role,team:role.t==='traveler'?'traveller':role.t,lines:lines,notes:notes,noteTop:noteTop,iconSize:iconSize,iconX:iconX,iconY:iconY,extent:extent,height:extent+profile.roleGap};
      });
      var items=[],y=top,lastSectionGap=profile.sectionGap;
      teams.forEach(function(team){
        var supplemental=poster&&team==='fabled';
        if(poster&&team==='loric')return;
        // Share one poster section without changing either role's actual type.
        var group=rows.filter(function(row){return supplemental?row.team==='fabled'||row.team==='loric':row.team===team;});if(!group.length)return;
        var mainSection=['townsfolk','outsider','minion','demon'].indexOf(team)>=0;
        var distribute=referenceLayout&&distribution&&mainSection;
        var sectionRoleGap=profile.roleGap+(distribute&&team==='townsfolk'?townGap:0);
        if(distribute&&!footer&&team==='demon')sectionRoleGap=Math.max(sectionRoleGap,demonRoleGap);
        var sectionGap=distribute&&team!=='townsfolk'?Math.min(profile.sectionGap,distribution.lowerSectionGap):profile.sectionGap;
        items.push({kind:'heading',x:margin,y:y,team:team,supplemental:supplemental});y+=profile.headingGap;
        var split=Math.ceil(group.length/count);
        // Keep a sparse three-role section in reading order: top-left,
        // top-right, then bottom-left. Supplemental sections stay unchanged.
        var leftHeavy=poster&&!supplemental&&count===2&&group.length===3&&profile.threeRoleFlow==='left-heavy';
        // The following section already owns its title clearance. Reclaim
        // the unused trailing role gap instead of compressing ability lines.
        function sum(list){return distribute?list.reduce(function(n,row){return n+row.extent;},0)+Math.max(0,list.length-1)*sectionRoleGap:list.reduce(function(n,row){return n+row.height;},0);}
        if(!leftHeavy&&profile.balanced&&count===2&&group.length>1){
          var best=Infinity;
          for(var i=1;i<group.length;i++){
            var cost=Math.max(sum(group.slice(0,i)),sum(group.slice(i)));
            if(cost<best){best=cost;split=i;}
          }
        }
        var columns=leftHeavy?[[group[0],group[2]],[group[1]]]:count===2?[group.slice(0,split),group.slice(split)]:Array.from({length:count},function(_,i){return group.slice(i*split,(i+1)*split);});
        if(leftHeavy&&profile.nameBodyGap<base.nameBodyGap){
          // At the existing tightest fit, keep two roles on the left but
          // choose the least-tall pairing rather than rejecting a dense script.
          var candidates=[columns,[[group[0],group[1]],[group[2]]],[[group[1],group[2]],[group[0]]]],least=Infinity;
          candidates.forEach(function(pair){var height=Math.max(sum(pair[0]),sum(pair[1]));if(height<least){least=height;columns=pair;}});
        }
        var band=Math.max.apply(null,columns.map(sum));
        columns.forEach(function(column,index){
          var cy=y;
          // Spread the shorter column's spare room between its roles instead
          // of leaving a large blank tail. Do not stretch single-role columns.
          var extraGap=profile.balanceRoleGaps&&column.length>1?Math.min(Math.max(0,base.roleGap-profile.roleGap),Math.max(0,band-sum(column))/(column.length-1)):0;
          // Give a shorter main column some of its own unused tail space.
          // The section's height and first role stay fixed; single-role and
          // supplemental columns keep their existing placement.
          if(distribute&&!footer&&column.length>1&&distribution.shortColumnFill){
            extraGap=Math.min(distribution.shortColumnMaxExtraGap,Math.max(0,band-sum(column))*distribution.shortColumnFill/(column.length-1));
          }
          column.forEach(function(row,rowIndex){
            var gapAfter=sectionRoleGap+(rowIndex<column.length-1?extraGap:0);
            // Nudge a one-line ability within existing spare space, never
            // pushing the next role or increasing the section/canvas height.
            var room=rowIndex<column.length-1?gapAfter:band-(cy-y)-row.extent;
            var shortOffset=!supplemental&&profile.shortRoleOffset&&row.lines.length===1&&!row.notes.length?Math.min(profile.shortRoleOffset,lineHeight/2,Math.max(0,room-(profile.shortRoleClearance||0))):0;
            items.push(Object.assign({},row,{kind:'role',height:row.extent+gapAfter,x:(group.length===1&&(supplemental||team==='fabled'||team==='loric'))?(width-colWidth)/2:margin+index*(colWidth+gap),y:cy+shortOffset,shortOffset:shortOffset,width:colWidth,gapAfter:gapAfter,baseRoleGap:sectionRoleGap,extraGapAfter:gapAfter-sectionRoleGap}));
            cy+=row.extent+gapAfter;
          });
        });y+=band+sectionGap+27;lastSectionGap=sectionGap;
      });
      return {pages:[items],width:width,height:height,outputWidth:reference.width,outputHeight:reference.height,
        font:font,lineHeight:lineHeight,abilityY:abilityY,bodyTextWidth:bodyTextWidth,bodyScale:1,bodyTop:top,ruleBox:ruleBox,
        print:print,spacing:Object.assign({},profile),iconSize:iconFrameWidth,nameSize:profile.nameSize,nameFontSize:nameFontSize,nameBaseline:nameBaseline,textOffset:offset,
        headingFontSize:print?config.printDetails.heading.size*(referenceLayout?calibration.headingScale:1):undefined,
        noteFont:referenceLayout?Math.max(config.printDetails.jinx.minFont,referenceLayout.font-config.printDetails.jinx.fontReduction)*(config.printDetails.jinx.fontScale||1):undefined,
        noteBlockGap:profile.noteBlockGap===undefined?8:profile.noteBlockGap,
        bodyBottom:y-lastSectionGap-27,footerHeight:footer,footerTop:height-profile.bottom-footer-footerGap+(referenceLayout?footerOffset:0),
        fixedCanvas:fixed};
    }
    var result=arrange(),stage=0;
    function fits(){return result.bodyBottom<=result.footerTop-12;}
    while(fixed&&!fits()&&stage<config.fitStages.length){Object.assign(profile,config.fitStages[stage++]);result=arrange();}
    if(fixed&&!fits())throw new Error('内容过多，固定参考图尺寸无法在可读字号下容纳。请精简说明，或手动选择“允许自动加长”。');
    // Minimise the shorter column's empty space without adding artificial
    // inter-role whitespace. Each column keeps the script's relative order.
    profile.balanced=true;result=arrange();
    if(fixed&&print&&!footer){
      // Reuse only the room above the existing bottom decoration clearance.
      // Restore reading rhythm without enlarging names, icons or the canvas.
      var fitted=Object.assign({},profile),low=0,high=1;
      function relax(amount){
        ['roleGap','headingGap','sectionGap','lineHeight'].forEach(function(key){
          profile[key]=fitted[key]+Math.max(0,base[key]-fitted[key])*amount;
        });
        return arrange();
      }
      result=relax(1);
      if(!fits()){
        for(var step=0;step<16;step++){
          var mid=(low+high)/2;result=relax(mid);
          if(fits())low=mid;else high=mid;
        }
        result=relax(low);
      }
    }
    if(fixed&&print&&footer&&profile.roleGap<base.roleGap){
      // Fitting stages leave a small remainder. Give it back to inter-role
      // spacing, keeping the fitted type sizes and footer clearance intact.
      var minimumGap=profile.roleGap,gapLow=minimumGap,gapHigh=base.roleGap;
      profile.roleGap=gapHigh;result=arrange();
      if(!fits()){
        for(var gapStep=0;gapStep<16;gapStep++){
          profile.roleGap=(gapLow+gapHigh)/2;result=arrange();
          if(fits())gapLow=profile.roleGap;else gapHigh=profile.roleGap;
        }
        profile.roleGap=gapLow;result=arrange();
      }
    }
    if(calibration){
      // Calibrate the already-fitted body, so a smaller font is never enlarged
      // again by fitting. Freeze both columns' grid and increase relative
      // leading; title, rails, footer and canvas continue using their own sizes.
      referenceLayout=result;
      referenceIcons=new Map(result.pages[0].filter(function(item){return item.kind==='role';}).map(function(item){return [item.role.id,item.iconSize];}));
      result=arrange();
      if(distribution){
        if(!footer&&distribution.noFooterHeadingGap){
          profile.headingGap=Math.min(profile.headingGap,distribution.noFooterHeadingGap);
          result=arrange();
        }
        var contentLimit=Math.min(result.footerTop-12,footer?Infinity:height-distribution.bottomDecorationClearance);
        // Larger type takes precedence over restored empty inter-role space.
        // Reclaim only the necessary gap, preserving line height and the grid.
        if(!footer&&result.bodyBottom>contentLimit&&profile.roleGap>distribution.minRoleGap){
          var gapLow=distribution.minRoleGap,gapHigh=profile.roleGap;
          profile.roleGap=gapLow;result=arrange();
          if(result.bodyBottom<=contentLimit){
            for(var clearanceStep=0;clearanceStep<16;clearanceStep++){
              profile.roleGap=(gapLow+gapHigh)/2;result=arrange();
              if(result.bodyBottom<=contentLimit)gapLow=profile.roleGap;else gapHigh=profile.roleGap;
            }
            profile.roleGap=gapLow;result=arrange();
          }
        }
        // Give the demon section first use of the newly released bottom room,
        // then distribute the remainder to all main roles. Clamp the target
        // rather than growing the canvas or changing fitted text sizes.
        if(!footer&&distribution.noFooterDemonRoleGap&&result.bodyBottom<contentLimit){
          var demonLow=0,demonHigh=distribution.noFooterDemonRoleGap;
          demonRoleGap=demonHigh;result=arrange();
          if(result.bodyBottom>contentLimit){
            for(var demonStep=0;demonStep<16;demonStep++){
              demonRoleGap=(demonLow+demonHigh)/2;result=arrange();
              if(result.bodyBottom<=contentLimit)demonLow=demonRoleGap;else demonHigh=demonRoleGap;
            }
            demonRoleGap=demonLow;result=arrange();
          }
        }
        // Reuse the omitted footer's space between all roles, with one gap for
        // both columns. Freeze fitted type and wrapping, and clear the night legend.
        if(!footer&&distribution.noFooterRoleGap>profile.roleGap&&result.bodyBottom<contentLimit){
          var airLow=profile.roleGap,airHigh=distribution.noFooterRoleGap;
          profile.roleGap=airHigh;result=arrange();
          if(result.bodyBottom>contentLimit){
            for(var airStep=0;airStep<16;airStep++){
              profile.roleGap=(airLow+airHigh)/2;result=arrange();
              if(result.bodyBottom<=contentLimit)airLow=profile.roleGap;else airHigh=profile.roleGap;
            }
            profile.roleGap=airLow;result=arrange();
          }
        }
        var towns=result.pages[0].filter(function(item){return item.kind==='role'&&item.team==='townsfolk';});
        var townHeading=result.pages[0].find(function(item){return item.kind==='heading'&&item.team==='townsfolk';});
        var nextHeading=townHeading&&result.pages[0].find(function(item){return item.kind==='heading'&&item.y>townHeading.y;});
        if(towns.length>=distribution.minTownsfolk&&nextHeading){
          var targetHeight=(contentLimit-result.bodyTop)*distribution.townsfolkShare;
          var needed=Math.max(0,targetHeight-(nextHeading.y-townHeading.y));
          var free=Math.max(0,contentLimit-result.bodyBottom);
          var slots=Math.max.apply(null,[0,1].map(function(column){return towns.filter(function(item){return item.x===92+column*(towns[0].width+26);}).length-1;}));
          townGap=Math.max(0,Math.min(needed,free)/Math.max(1,slots));
          townGap=Math.min(townGap,Math.max(0,distribution.maxRoleGap-profile.roleGap));
          var gapLow=0,gapHigh=townGap;result=arrange();
          if(result.bodyBottom>contentLimit){
            for(var spaceStep=0;spaceStep<16;spaceStep++){
              townGap=(gapLow+gapHigh)/2;result=arrange();
              if(result.bodyBottom<=contentLimit)gapLow=townGap;else gapHigh=townGap;
            }
            townGap=gapLow;result=arrange();
          }
        }
        result.townsfolkRoleGap=profile.roleGap+townGap;
        result.demonRoleGap=Math.max(profile.roleGap,demonRoleGap);
      }
      if(fixed&&!fits())throw new Error('正文在固定画布内无法完整排版，请精简过长说明。');
    }
    if(!fixed){
      height=Math.max(height,Math.ceil(result.bodyBottom+profile.bottom+footer+footerGap+12));
      result=arrange();result.outputHeight=Math.ceil(height*reference.width/width);
      // Ensure the exported dimensions and the scaled SVG coordinate system agree.
      result.height=result.outputHeight*width/reference.width;
      result.footerTop=result.height-profile.bottom-footer-footerGap;
    }
    result.fitStage=stage;
    result.railCount=Math.max((options.first||[]).length+2,(options.other||[]).length,1);
    result.railHeader=88;
    result.railTop=Math.min(440,Math.round(result.height*.27));
    result.railStep=Math.min(43,(result.height-result.railTop-205)/(result.railCount+2));
    result.railSize=Math.min(43,result.railStep*.91);
    return result;
  }
  root.ScriptArtPrint={layout:layout};
})(typeof window==='undefined'?globalThis:window);
