/* Tesseract.js 6.0.1 is loaded only when image recognition is requested. */
(function (root) {
  'use strict';
  function normalize(text) { return String(text || '').normalize('NFKC').replace(/[\s·・]/g, '').toLowerCase(); }
  function scan(text, catalog) {
    var found = [], ambiguous=[],seen = new Set(),names=new Set();
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var value = normalize(line.replace(/^[^\u3400-\u9fff]+/, ''));
      // Match headings, not names mentioned inside another role's ability.
      if (/^(如果|每个|每局|在你|你|当|他们|他会|与)/.test(value)) return;
      var candidates = catalog.filter(function (c) { var name = normalize(c.n), at = value.indexOf(name); return name && at === 0; });
      if (!candidates.length) return;
      var longest = Math.max.apply(null, candidates.map(function (c) { return normalize(c.n).length; }));
      candidates=candidates.filter(function(c,i){return normalize(c.n).length===longest&&candidates.findIndex(function(other){return root.ScriptCore.identity(other.id)===root.ScriptCore.identity(c.id);})===i;});
      if(candidates.length>1){var key=normalize(candidates[0].n);if(!names.has(key)){names.add(key);ambiguous.push({name:candidates[0].n,candidates:candidates,choice:null});}return;}
      candidates.forEach(function (c) {
        var id = root.ScriptCore.identity(c.id);
        if (!seen.has(id)) { seen.add(id); found.push(c); }
      });
    });
    return {matched:found,ambiguous:ambiguous};
  }
  function match(text,catalog){return scan(text,catalog).matched;}
  function searchTitles(text,entries){
    var lines=String(text||'').split(/\r?\n/).map(normalize);
    return entries.filter(function(entry){var name=normalize(entry.name);return name.length>=2&&lines.some(function(line){return line===name||(line.length<name.length+12&&line.includes(name));});}).slice(0,12);
  }
  root.ScriptImageImport = { match: match,scan:scan,searchTitles:searchTitles };
  if (!root.document) return;
  var runtimeURL = new URL('./ocr/', document.currentScript && document.currentScript.src || new URL('assets/script-tool/image-import.js', document.baseURI).href).href;
  var button = document.createElement('button'); button.className = 'btn'; button.id = 'bImageImport'; button.textContent = '导入剧本图片';
  document.getElementById('bImport').after(button);
  var inWechat=/MicroMessenger/i.test(root.navigator.userAgent||'');
  function wechatNotice(dismissible){
    var notice=document.createElement('aside');notice.className='wechat-use-notice';notice.setAttribute('aria-label','微信内使用提示');
    var heading=document.createElement('strong');heading.textContent='你正在微信内打开剧本工具';
    var text=document.createElement('p');text.textContent='图片识别可能受微信内浏览器限制。如果识别失败或页面重新加载，请点右上角“…”选择在浏览器打开，也可复制链接到 Safari 或 Chrome。当前草稿不会自动同步到其他浏览器，请先导出 JSON 备份。';
    var copy=document.createElement('button');copy.type='button';copy.className='btn';copy.textContent='复制页面链接';
    var feedback=document.createElement('p');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    var link=document.createElement('input');link.type='text';link.readOnly=true;link.value=root.location.href;link.hidden=true;link.setAttribute('aria-label','页面链接，长按复制');
    copy.onclick=async function(){
      try{if(!root.navigator.clipboard||!root.navigator.clipboard.writeText)throw new Error('Clipboard unavailable');await root.navigator.clipboard.writeText(link.value);feedback.textContent='链接已复制，请粘贴到浏览器打开。';}
      catch(error){link.hidden=false;link.focus();link.select();feedback.textContent='无法自动复制，请长按下方链接手动复制。';}
    };
    notice.append(heading,text,copy,link,feedback);
    if(dismissible){var close=document.createElement('button');close.type='button';close.className='btn';close.textContent='收起提示';close.onclick=function(){notice.remove();};notice.append(close);}
    return notice;
  }
  if(inWechat){var toolbar=document.querySelector('.script-editor .toolbar');if(toolbar)toolbar.before(wechatNotice(true));}
  var loading;
  var paddleLoading;
  function loadPaddleBrowser(){
    if(root.ScriptPaddleBrowser)return Promise.resolve(root.ScriptPaddleBrowser);
    if(paddleLoading)return paddleLoading;
    paddleLoading=(async function(){
      var base=new URL('../paddle-browser/',runtimeURL).href;
      await Promise.all(['det.js','rec.js','wasm.js','module.js'].map(async function(name){
        await new Promise(function(done,fail){var script=document.createElement('script');script.src=base+name;script.onload=done;script.onerror=function(){script.remove();fail(new Error('浏览器 PaddleOCR 资源加载失败：'+name));};document.head.appendChild(script);});
      }));
      await new Promise(function(done,fail){var script=document.createElement('script');script.src=base+'engine.js';script.onload=done;script.onerror=function(){script.remove();fail(new Error('浏览器 PaddleOCR 初始化资源加载失败'));};document.head.appendChild(script);});
      if(!root.ScriptPaddleBrowser)throw new Error('浏览器 PaddleOCR 初始化失败');
      return root.ScriptPaddleBrowser;
    })().catch(function(error){paddleLoading=null;throw error;});
    return paddleLoading;
  }
  var offlineLoading;
  function loadOfflineWorker() {
    if (root.ScriptOCRWorkerSource) return Promise.resolve(root.ScriptOCRWorkerSource);
    if (offlineLoading) return offlineLoading;
    offlineLoading = new Promise(function (resolve, reject) {
      var script=document.createElement('script'); script.src=runtimeURL+'offline-worker.js';
      script.onload=function(){if(root.ScriptOCRWorkerSource)resolve(root.ScriptOCRWorkerSource);else{offlineLoading=null;reject(new Error('离线识别资源不完整，请重新生成 OCR 资源'));}};
      script.onerror=function(){script.remove();offlineLoading=null;reject(new Error('离线识别资源加载失败，请确认 offline-worker.js 存在'));};
      document.head.appendChild(script);
    });
    return offlineLoading;
  }
  function loadOCR() {
    if (root.Tesseract) return Promise.resolve(root.Tesseract);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var script = document.createElement('script'); script.src = runtimeURL + 'tesseract.min.js';
      script.onload = function () { if (root.Tesseract) resolve(root.Tesseract); else { loading = null; reject(new Error('识别组件加载失败')); } };
      script.onerror = function () { script.remove(); loading = null; reject(new Error('识别组件下载失败，请检查网络后重试')); };
      document.head.appendChild(script);
    });
    return loading;
  }
  button.onclick = function () {
    root.openDlg('<h3>从图片导入剧本</h3><p class="tip">图片在本机识别，首次使用需从本站加载识别组件及中英文模型。艺术字体可能识别不准，请校对角色名单。能力和夜序使用当前角色库的数据。</p>' +
      '<label>从相册选择剧本图片（最多 20 MB）<input id="ocrFile" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"></label>' +
      '<p class="tip">支持 PNG / JPEG / WebP；HEIC / HEIF 取决于浏览器解码支持。照片方向自动处理，可先旋转和裁剪再识别。</p><details id="ocrImageTools"><summary>图片预览 / 旋转 / 裁剪</summary><img id="ocrImagePreview" alt="待识别图片预览" hidden style="max-width:100%;max-height:40vh;object-fit:contain"><button type="button" class="btn" id="ocrRotate">顺时针旋转 90°</button>' +
      ['top','bottom','left','right'].map(function(side,i){return '<label>裁去'+['顶部','底部','左侧','右侧'][i]+' <input id="ocrCrop'+side+'" type="range" min="0" max="40" value="0" step="1"><output id="ocrCropValue'+side+'">0%</output></label>';}).join('')+'<button type="button" class="btn" id="ocrResetImage">恢复完整图片</button></details>' +
      '<label>排版<select id="ocrLayout"><option value="poster">双列海报（忽略两侧夜序）</option><option value="full">整张图片</option></select></label>' +
      '<label>识别引擎<select id="ocrEngine"><option value="paddle-browser">PaddleOCR 浏览器识别（无需服务）</option><option value="paddle-gpu">PaddleOCR GPU 加速（试验）</option><option value="browser">原版离线 OCR</option></select></label>' +
      '<button class="btn pri" id="ocrRun">开始识别</button><p id="ocrStatus" role="status" aria-live="polite"></p>' +
      '<details><summary>识别文字 / 手动粘贴角色名</summary><textarea id="ocrText" placeholder="每行一个角色名，可修改识别文字后重新匹配"></textarea><button class="btn" id="ocrMatch">重新匹配</button></details>' +
      '<label>剧本名称<input id="ocrName" placeholder="请填写剧本名称"></label><label>作者<input id="ocrAuthor"></label>' +
      '<button class="btn" id="ocrSearch">按名称搜索剧本库</button><div id="ocrLibrary"></div><button class="btn" id="ocrContinue" hidden>未找到合适版本，继续识别角色</button>' +
      '<label>补选漏识别角色<select id="ocrExtra"></select></label><button class="btn" id="ocrAdd">添加角色</button>' +
      '<div id="ocrRoles"></div><div class="foot"><button class="btn pri" id="ocrApply">核对名单并预览</button><button class="btn" id="ocrCancel">取消</button></div>');
    var body = document.getElementById('dlgBody'), dlg = document.getElementById('dlg'), active = true, disposed=false,worker = null, selected = [], ambiguous=[],busy = false;
    if(inWechat)body.querySelector('h3').after(wechatNotice(false));
    function el(id) { return body.querySelector('#' + id); }
    var albumImage=el('ocrImagePreview');
    var catalog = root.CHARS;
    var continueRoles=false,imageRevision=0,paddleController=null,candidateController=null;
    var preparedImage,prepareTask=Promise.resolve(),albumPreviewURL='',rotation=0;
    function clearAlbumPreview(){if(albumPreviewURL)URL.revokeObjectURL(albumPreviewURL);albumPreviewURL='';albumImage.removeAttribute('src');albumImage.hidden=true;}
    function previewImport(data,source){
      // Retain the actual file input and controls while the shared dialog shows JSON review.
      active=false;busy=false;dlg.removeEventListener('close',dispose);
      var saved=document.createDocumentFragment();while(body.firstChild)saved.appendChild(body.firstChild);
      root.openJSONImport(data,source,{
        onBack:function(){active=true;body.replaceChildren(saved);dlg.addEventListener('close',dispose);el('ocrRun').disabled=false;body.querySelectorAll('#ocrLibrary button').forEach(function(control){control.disabled=false;});render();el('ocrApply').focus();
          if(el('ocrFile').files.length&&!albumPreviewURL)prepareAlbum();},
        onFinish:dispose
      });
    }
    function prepareAlbum(){
      var file=el('ocrFile').files[0],version=imageRevision;
      clearAlbumPreview();preparedImage=null;if(!file)return;
      if(!root.ScriptMobileImages)return;
      var crop={};['top','bottom','left','right'].forEach(function(side){crop[side]=Number(el('ocrCrop'+side).value);el('ocrCropValue'+side).textContent=crop[side]+'%';});
      var options={rotation:rotation,crop:crop};el('ocrStatus').textContent='正在准备相册图片…';
      preparedImage=prepareTask.catch(function(){}).then(async function(){
        if(!active||version!==imageRevision)return;
        var result=await root.ScriptMobileImages.prepare(file,options);
        if(!active||version!==imageRevision)return;
        albumPreviewURL=URL.createObjectURL(result.blob);el('ocrImagePreview').src=albumPreviewURL;el('ocrImagePreview').hidden=false;el('ocrImageTools').open=true;
        el('ocrStatus').textContent='图片已准备 · '+result.width+' × '+result.height+'，核对方向和裁剪后开始识别。';return result.blob;
      });
      prepareTask=preparedImage;
      preparedImage.catch(function(error){if(active&&version===imageRevision)el('ocrStatus').textContent=error.message;});
    }
    async function searchLibrary(text){
      var searchedRevision=imageRevision;
      if(!root.ScriptImageLibrary)await new Promise(function(resolve,reject){var script=document.createElement('script');script.src=new URL('../image-library.js',runtimeURL).href;script.onload=resolve;script.onerror=function(){script.remove();reject(new Error('剧本库名称索引加载失败'));};document.head.appendChild(script);});
      if(!active||searchedRevision!==imageRevision)return [];
      var candidates=searchTitles(text,root.ScriptImageLibrary),list=el('ocrLibrary');list.replaceChildren();
      candidates.forEach(function(entry){
        var row=document.createElement('div'),link=document.createElement('a'),use=document.createElement('button');row.className='import-library-candidate';
        link.textContent=entry.name+' · '+(entry.author||'未填写作者');link.target='_blank';link.rel='noopener';link.href=new URL('../../../../api/v1/'+entry.json,runtimeURL).href;
        use.type='button';use.className='btn';use.textContent='预览并导入';
        use.onclick=async function(){
          if(busy)return;
          var revision=imageRevision,controller=new AbortController();candidateController=controller;
          busy=true;render();use.disabled=true;el('ocrRun').disabled=true;el('ocrStatus').textContent='正在读取库内剧本…';
          try{
            var response=await fetch(link.href,{signal:controller.signal});
            if(!response.ok)throw new Error('读取剧本失败（HTTP '+response.status+'）');
            var text=await response.text();if(!active||revision!==imageRevision)return;
            var data=root.ScriptCore.parseJSON(text),parsed=root.ScriptCore.parseImport(data,catalog);
            if(!parsed.selected.length&&!parsed.rules.length)throw new Error('这个版本没有可导入的角色或规则，请选择其他版本。');
            previewImport(data,'剧本库：'+entry.name);
          }catch(error){if(active&&revision===imageRevision&&error.name!=='AbortError')el('ocrStatus').textContent=error.message+'，可重试或继续识别角色。';}
          finally{if(candidateController===controller)candidateController=null;busy=false;if(active){use.disabled=false;el('ocrRun').disabled=false;render();}}
        };
        row.append(link,use);list.append(row);
      });
      if(!candidates.length)list.textContent='剧本库未找到匹配名称，可修改名称重试。';
      return candidates;
    }
    el('ocrSearch').onclick=async function(){var revision=imageRevision;try{await searchLibrary(el('ocrName').value);}catch(error){if(active&&revision===imageRevision)el('ocrLibrary').textContent=error.message;}};
    el('ocrContinue').onclick=async function(){continueRoles=true;await el('ocrRun').onclick();};
    el('ocrFile').onchange=function(){
      imageRevision++;continueRoles=false;selected=[];ambiguous=[];
      if(paddleController)paddleController.abort();if(candidateController)candidateController.abort();
      ['ocrText','ocrName','ocrAuthor'].forEach(function(id){el(id).value='';});
      el('ocrStatus').textContent='';el('ocrContinue').hidden=true;el('ocrLibrary').replaceChildren();render();
      rotation=0;['top','bottom','left','right'].forEach(function(side){el('ocrCrop'+side).value=0;});prepareAlbum();
    };
    function changeAlbum(){imageRevision++;continueRoles=false;selected=[];ambiguous=[];if(paddleController)paddleController.abort();if(candidateController)candidateController.abort();el('ocrText').value='';el('ocrName').value='';el('ocrAuthor').value='';el('ocrLibrary').replaceChildren();el('ocrContinue').hidden=true;render();prepareAlbum();}
    el('ocrRotate').onclick=function(){rotation=(rotation+90)%360;changeAlbum();};
    el('ocrResetImage').onclick=function(){rotation=0;['top','bottom','left','right'].forEach(function(side){el('ocrCrop'+side).value=0;});changeAlbum();};
    ['top','bottom','left','right'].forEach(function(side){el('ocrCrop'+side).addEventListener('change',changeAlbum);el('ocrCrop'+side).addEventListener('input',function(){el('ocrCropValue'+side).textContent=this.value+'%';});});
    catalog.forEach(function (c, i) { var option = document.createElement('option'); option.value = i; option.textContent = c.n + ' · ' + c.t; el('ocrExtra').appendChild(option); });
    function render() {
      var list = el('ocrRoles'); list.replaceChildren();
      var pending=ambiguous.filter(function(group){return group.choice===null;}).length;
      var count = document.createElement('p'); count.textContent = '已选 ' + selected.length + ' 个角色'+(pending?' · '+pending+' 个同名角色待选择版本':''); list.appendChild(count);
      ambiguous.forEach(function(group){
        var box=document.createElement('fieldset'),legend=document.createElement('legend'),choose=document.createElement('select'),detail=document.createElement('p');
        box.className='ocr-ambiguity';legend.textContent=group.name+'：请选择版本';choose.setAttribute('aria-label',group.name+'的具体版本');
        var empty=document.createElement('option');empty.value='';empty.textContent='尚未选择版本';choose.appendChild(empty);
        group.candidates.forEach(function(c){var option=document.createElement('option');option.value=c.id;option.textContent=c.n+' · '+(root.SOURCE_LABELS&&root.SOURCE_LABELS[root.roleSource(c)]||'自定义角色')+' · '+(root.TEAMCN&&root.TEAMCN[c.t]||c.t);choose.appendChild(option);});
        var skip=document.createElement('option');skip.value='skip';skip.textContent='暂不导入这个角色';choose.appendChild(skip);choose.value=group.choice||'';
        var chosen=group.candidates.find(function(c){return c.id===group.choice;});detail.textContent=chosen?chosen.ab:'同名角色可能来自不同合集，请选择后继续，也可以暂不导入。';
        choose.onchange=function(){selectVersion(group,this.value||null);render();list.querySelectorAll('.ocr-ambiguity select')[ambiguous.indexOf(group)].focus();};box.append(legend,choose,detail);list.appendChild(box);
      });
      selected.forEach(function (c) { var label = document.createElement('label'), check = document.createElement('input'); check.type = 'checkbox'; check.checked = true;
        check.onchange = function () { selected = selected.filter(function (r) { return r.id !== c.id; });ambiguous.forEach(function(group){if(group.choice===c.id)group.choice='skip';});render(); };
        label.append(check, document.createTextNode(c.n + ' · ' + c.t + ' · ' + String(c.ab || '').slice(0, 45))); label.style.display = 'block'; list.appendChild(label); });
      el('ocrApply').disabled = busy || !selected.length || pending>0;
    }
    function selectVersion(group,value){
      var ids=new Set(group.candidates.map(function(c){return root.ScriptCore.identity(c.id);}));selected=selected.filter(function(c){return !ids.has(root.ScriptCore.identity(c.id));});group.choice=value;
      var chosen=group.candidates.find(function(c){return c.id===value;});if(chosen)selected.push(chosen);
    }
    function review(text){var result=scan(text,catalog);selected=result.matched;ambiguous=result.ambiguous;render();}
    function dispose() { if(disposed)return;disposed=true;active = false; if(root.ScriptPaddleBrowser&&root.ScriptPaddleBrowser.dispose)root.ScriptPaddleBrowser.dispose(); clearAlbumPreview(); if(paddleController)paddleController.abort(); if(candidateController)candidateController.abort(); if (worker) { worker.terminate().catch(function () {}); worker = null; } dlg.removeEventListener('close', dispose); }
    dlg.addEventListener('close', dispose);
    el('ocrCancel').onclick = root.closeDlg;
    el('ocrMatch').onclick = function () { review(el('ocrText').value); };
    el('ocrAdd').onclick = function () { var c = catalog[Number(el('ocrExtra').value)];ambiguous.forEach(function(group){if(group.candidates.some(function(candidate){return candidate.id===c.id;}))selectVersion(group,c.id);});if (!selected.some(function (r) { return root.ScriptCore.identity(r.id) === root.ScriptCore.identity(c.id); })) selected.push(c); render(); };
    el('ocrApply').onclick = function () {
      if (busy || !selected.length || ambiguous.some(function(group){return group.choice===null;})) return;
      var data = [{ id: '_meta', name: el('ocrName').value.trim(), author: el('ocrAuthor').value.trim() }].concat(selected.map(function (c) { return c.id; }));
      previewImport(data,'图片识别名单');
    };
    el('ocrRun').onclick = async function () {
      if (busy) return;
      var file = el('ocrFile').files[0];
      try{if(root.ScriptMobileImages)root.ScriptMobileImages.validate(file);else if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>20*1024*1024)throw new Error('请选择不超过 20 MB 的 PNG、JPEG 或 WebP 图片');}catch(error){el('ocrStatus').textContent=error.message;return;}
      var revision=imageRevision;
      var recognitionOptions={gpu:el('ocrEngine').value==='paddle-gpu',layout:el('ocrLayout').value};
      function current(){return active&&revision===imageRevision&&el('ocrFile').files[0]===file;}
      busy = true; el('ocrRun').disabled = true; render();
      var bitmap, workerURL,canvas;
      try {
        var recognitionFile=preparedImage?await preparedImage:file;if(!current()||!recognitionFile)return;
        if(el('ocrEngine').value==='paddle-browser'||el('ocrEngine').value==='paddle-gpu'){
          paddleController=new AbortController();recognitionOptions.signal=paddleController.signal;
          recognitionOptions.onFallback=function(message){if(current())el('ocrStatus').textContent=message+'，正在使用 CPU 继续识别…';};
          el('ocrStatus').textContent='正在加载浏览器 PaddleOCR，首次加载可能较慢…';
          var browserEngine=await loadPaddleBrowser();if(!current())return;
          if(!continueRoles&&browserEngine.recognizeTitle){
            el('ocrStatus').textContent='正在优先识别剧本名称…';
            var titleText=await browserEngine.recognizeTitle(recognitionFile,recognitionOptions);if(!current())return;
            var candidates;
            try{candidates=await searchLibrary(titleText);}catch(error){if(current())el('ocrLibrary').textContent=error.message;candidates=[];}
            if(!current())return;
            if(candidates.length){selected=[];ambiguous=[];el('ocrText').value='';render();el('ocrName').value=candidates[0].name;el('ocrAuthor').value=candidates[0].author||'';el('ocrContinue').hidden=false;el('ocrStatus').textContent='剧本库已有候选版本，可直接预览并导入，保留完整能力和附加规则；若不合适，请继续识别角色。';return;}
          }
          el('ocrStatus').textContent='PaddleOCR 正在浏览器中识别…';
          var recognized=await browserEngine.recognize(recognitionFile,recognitionOptions);if(!current())return;
          el('ocrText').value=recognized;review(recognized);
          var runtime=browserEngine.lastRuntime;
          var acceleration=runtime?(runtime.detProvider==='webgpu'&&runtime.recProvider==='webgpu'?'（GPU 加速）':runtime.detProvider==='webgpu'||runtime.recProvider==='webgpu'?'（部分 GPU 加速）':'（CPU 兼容模式）'):'';
          el('ocrStatus').textContent='PaddleOCR 识别完成'+acceleration+'，匹配到 '+selected.length+' 个角色条目。请校对名单。';return;
        }
        var offline = new URL(runtimeURL).protocol === 'file:';
        if (!offline) await Promise.all(['worker.min.js', 'tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'chi_sim.traineddata.gz', 'eng.traineddata.gz'].map(async function (name) {
          var response = await fetch(runtimeURL + name, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error('识别资源加载失败：' + name + '（HTTP ' + response.status + '），请确认本站已部署完整 OCR 文件');
          if (/text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('识别资源地址返回了网页：' + name + '，请检查部署路径');
        }));
        if (!current()) return;
        el('ocrStatus').textContent = '正在加载识别组件…';
        var engine = await loadOCR(); if (!current()) return;
        bitmap = await createImageBitmap(recognitionFile); if (!current()) return;
        if (!Number.isFinite(bitmap.width)||!Number.isFinite(bitmap.height)||bitmap.width<=0||bitmap.height<=0||bitmap.width * bitmap.height > 32000000) throw new Error('图片尺寸无效或过大，请缩小至 3200 万像素以内');
        var runtime = runtimeURL;
        var options={ workerPath: runtime + 'worker.min.js', corePath: runtime, langPath: runtime, errorHandler: function () {}, logger: function (m) { if (current()) el('ocrStatus').textContent = '识别中：' + Math.round((m.progress || 0) * 100) + '% · ' + m.status; } };
        if(offline){
          var source=await loadOfflineWorker();if(!current())return;
          workerURL=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
          options.workerPath=workerURL;options.workerBlobURL=false;options.langPath='https://offline-ocr.invalid';options.cacheMethod='none';
        }
        worker = await engine.createWorker('chi_sim+eng', 1, options);
        if (!current()) return;
        var text = '', poster = el('ocrLayout').value === 'poster';
        for (var column = 0; column < (poster ? 2 : 1); column++) {
          canvas = document.createElement('canvas');var x = poster ? bitmap.width * (column ? 0.5 : 0.07) : 0, width = poster ? bitmap.width * 0.43 : bitmap.width;
          var scale = Math.min(2, 2400 / width,8192/bitmap.height,Math.sqrt(16000000/(width*bitmap.height)));
          canvas.width = Math.max(1,Math.floor(width * scale)); canvas.height = Math.max(1,Math.floor(bitmap.height * scale));
          try{
            var context=canvas.getContext('2d');if(!context)throw new Error('浏览器无法分配识别画布，请缩小图片后重试');
            context.drawImage(bitmap, x, 0, width, bitmap.height, 0, 0, canvas.width, canvas.height);
            var result = await worker.recognize(canvas); if (!current()) return; text += result.data.text + '\n';
          }finally{canvas.width=0;canvas.height=0;canvas=null;}
        }
        el('ocrText').value = text; review(text);
        el('ocrStatus').textContent = '识别完成，匹配到 ' + selected.length + ' 个角色。请校对名单并补选遗漏角色。';
      } catch (err) { if (current()) el('ocrStatus').textContent = '识别失败：' + (err && err.message ? err.message : String(err || '识别任务异常，请重试')) + '。你仍可手动粘贴角色名或补选角色。'; }
      finally { if(root.ScriptPaddleBrowser&&root.ScriptPaddleBrowser.dispose)root.ScriptPaddleBrowser.dispose();paddleController=null;if(canvas){canvas.width=0;canvas.height=0;} if (bitmap) bitmap.close(); if (worker) { await worker.terminate().catch(function () {}); worker = null; } if(workerURL)URL.revokeObjectURL(workerURL); busy = false; if (active) { el('ocrRun').disabled = false; render(); } }
    };
    render();
  };
})(typeof window === 'undefined' ? globalThis : window);
