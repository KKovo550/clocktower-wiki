/* Tesseract.js 6.0.1 is loaded only when image recognition is requested. */
(function (root) {
  'use strict';
  function normalize(text) { return String(text || '').normalize('NFKC').replace(/[\s·・]/g, '').toLowerCase(); }
  function match(text, catalog) {
    var found = [], seen = new Set();
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var value = normalize(line.replace(/^[^\u3400-\u9fff]+/, ''));
      // Match headings, not names mentioned inside another role's ability.
      if (/^(如果|每个|每局|在你|你|当|他们|他会|与)/.test(value)) return;
      var candidates = catalog.filter(function (c) { var name = normalize(c.n), at = value.indexOf(name); return name && at === 0; });
      if (!candidates.length) return;
      var longest = Math.max.apply(null, candidates.map(function (c) { return normalize(c.n).length; }));
      candidates.filter(function (c) { return normalize(c.n).length === longest; }).forEach(function (c) {
        var id = root.ScriptCore.identity(c.id);
        if (!seen.has(id)) { seen.add(id); found.push(c); }
      });
    });
    return found;
  }
  function searchTitles(text,entries){
    var lines=String(text||'').split(/\r?\n/).map(normalize);
    return entries.filter(function(entry){var name=normalize(entry.name);return name.length>=2&&lines.some(function(line){return line===name||(line.length<name.length+12&&line.includes(name));});}).slice(0,12);
  }
  root.ScriptImageImport = { match: match,searchTitles:searchTitles };
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
      '<div id="ocrRoles"></div><div class="foot"><button class="btn pri" id="ocrApply">确认名单并导入</button><button class="btn" id="ocrCancel">取消</button></div>');
    var body = document.getElementById('dlgBody'), dlg = document.getElementById('dlg'), active = true, worker = null, selected = [], busy = false;
    if(inWechat)body.querySelector('h3').after(wechatNotice(false));
    function el(id) { return body.querySelector('#' + id); }
    var catalog = root.CHARS;
    var continueRoles=false,imageRevision=0,paddleController=null;
    var preparedImage,prepareTask=Promise.resolve(),albumPreviewURL='',rotation=0;
    function clearAlbumPreview(){if(albumPreviewURL)URL.revokeObjectURL(albumPreviewURL);albumPreviewURL='';el('ocrImagePreview').removeAttribute('src');el('ocrImagePreview').hidden=true;}
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
      candidates.forEach(function(entry){var row=document.createElement('p'),link=document.createElement('a');link.textContent=entry.name+' · '+entry.author;link.target='_blank';link.rel='noopener';link.href=new URL('../../../../api/v1/'+entry.json,runtimeURL).href;row.append(link);list.append(row);});
      if(!candidates.length)list.textContent='剧本库未找到匹配名称，可修改名称重试。';
      return candidates;
    }
    el('ocrSearch').onclick=async function(){var revision=imageRevision;try{await searchLibrary(el('ocrName').value);}catch(error){if(active&&revision===imageRevision)el('ocrLibrary').textContent=error.message;}};
    el('ocrContinue').onclick=async function(){continueRoles=true;await el('ocrRun').onclick();};
    el('ocrFile').onchange=function(){
      imageRevision++;continueRoles=false;selected=[];
      if(paddleController)paddleController.abort();
      ['ocrText','ocrName','ocrAuthor'].forEach(function(id){el(id).value='';});
      el('ocrStatus').textContent='';el('ocrContinue').hidden=true;el('ocrLibrary').replaceChildren();render();
      rotation=0;['top','bottom','left','right'].forEach(function(side){el('ocrCrop'+side).value=0;});prepareAlbum();
    };
    function changeAlbum(){imageRevision++;continueRoles=false;selected=[];if(paddleController)paddleController.abort();el('ocrText').value='';el('ocrName').value='';el('ocrAuthor').value='';el('ocrLibrary').replaceChildren();el('ocrContinue').hidden=true;render();prepareAlbum();}
    el('ocrRotate').onclick=function(){rotation=(rotation+90)%360;changeAlbum();};
    el('ocrResetImage').onclick=function(){rotation=0;['top','bottom','left','right'].forEach(function(side){el('ocrCrop'+side).value=0;});changeAlbum();};
    ['top','bottom','left','right'].forEach(function(side){el('ocrCrop'+side).addEventListener('change',changeAlbum);el('ocrCrop'+side).addEventListener('input',function(){el('ocrCropValue'+side).textContent=this.value+'%';});});
    catalog.forEach(function (c, i) { var option = document.createElement('option'); option.value = i; option.textContent = c.n + ' · ' + c.t; el('ocrExtra').appendChild(option); });
    function render() {
      var list = el('ocrRoles'); list.replaceChildren();
      var count = document.createElement('p'); count.textContent = '已选 ' + selected.length + ' 个角色（请核对同名角色）'; list.appendChild(count);
      selected.forEach(function (c) { var label = document.createElement('label'), check = document.createElement('input'); check.type = 'checkbox'; check.checked = true;
        check.onchange = function () { selected = selected.filter(function (r) { return r.id !== c.id; }); render(); };
        label.append(check, document.createTextNode(c.n + ' · ' + c.t + ' · ' + String(c.ab || '').slice(0, 45))); label.style.display = 'block'; list.appendChild(label); });
      el('ocrApply').disabled = busy || !selected.length;
    }
    function dispose() { active = false; if(root.ScriptPaddleBrowser&&root.ScriptPaddleBrowser.dispose)root.ScriptPaddleBrowser.dispose(); clearAlbumPreview(); if(paddleController)paddleController.abort(); if (worker) { worker.terminate().catch(function () {}); worker = null; } dlg.removeEventListener('close', dispose); }
    dlg.addEventListener('close', dispose);
    el('ocrCancel').onclick = root.closeDlg;
    el('ocrMatch').onclick = function () { selected = match(el('ocrText').value, catalog); render(); };
    el('ocrAdd').onclick = function () { var c = catalog[Number(el('ocrExtra').value)]; if (!selected.some(function (r) { return root.ScriptCore.identity(r.id) === root.ScriptCore.identity(c.id); })) selected.push(c); render(); };
    el('ocrApply').onclick = function () {
      if (busy || !selected.length) return;
      var data = [{ id: '_meta', name: el('ocrName').value.trim(), author: el('ocrAuthor').value.trim() }].concat(selected.map(function (c) { return c.id; }));
      if (root.doImport(data) !== false) root.closeDlg();
    };
    el('ocrRun').onclick = async function () {
      if (busy) return;
      var file = el('ocrFile').files[0];
      try{if(root.ScriptMobileImages)root.ScriptMobileImages.validate(file);else if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>20*1024*1024)throw new Error('请选择不超过 20 MB 的 PNG、JPEG 或 WebP 图片');}catch(error){el('ocrStatus').textContent=error.message;return;}
      var revision=imageRevision;
      var recognitionOptions={gpu:el('ocrEngine').value==='paddle-gpu',layout:el('ocrLayout').value};
      function current(){return active&&revision===imageRevision&&el('ocrFile').files[0]===file;}
      busy = true; el('ocrRun').disabled = true; render();
      var bitmap, workerURL;
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
            if(candidates.length){selected=[];el('ocrText').value='';render();el('ocrName').value=candidates[0].name;el('ocrAuthor').value=candidates[0].author||'';el('ocrContinue').hidden=false;el('ocrStatus').textContent='剧本库已有候选版本，可点击名称查看 JSON；若不合适，请继续识别角色。';return;}
          }
          el('ocrStatus').textContent='PaddleOCR 正在浏览器中识别…';
          var recognized=await browserEngine.recognize(recognitionFile,recognitionOptions);if(!current())return;
          el('ocrText').value=recognized;selected=match(recognized,catalog);render();
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
        if (bitmap.width * bitmap.height > 32000000) throw new Error('图片尺寸过大，请缩小至 3200 万像素以内');
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
          var canvas = document.createElement('canvas'), x = poster ? bitmap.width * (column ? 0.5 : 0.07) : 0, width = poster ? bitmap.width * 0.43 : bitmap.width;
          var scale = Math.min(2, 2400 / width); canvas.width = Math.round(width * scale); canvas.height = Math.round(bitmap.height * scale);
          canvas.getContext('2d').drawImage(bitmap, x, 0, width, bitmap.height, 0, 0, canvas.width, canvas.height);
          var result = await worker.recognize(canvas); if (!current()) return; text += result.data.text + '\n';
        }
        el('ocrText').value = text; selected = match(text, catalog); render();
        el('ocrStatus').textContent = '识别完成，匹配到 ' + selected.length + ' 个角色。请校对名单并补选遗漏角色。';
      } catch (err) { if (current()) el('ocrStatus').textContent = '识别失败：' + (err && err.message ? err.message : String(err || '识别任务异常，请重试')) + '。你仍可手动粘贴角色名或补选角色。'; }
      finally { if(root.ScriptPaddleBrowser&&root.ScriptPaddleBrowser.dispose)root.ScriptPaddleBrowser.dispose();paddleController=null; if (bitmap) bitmap.close(); if (worker) { await worker.terminate().catch(function () {}); worker = null; } if(workerURL)URL.revokeObjectURL(workerURL); busy = false; if (active) { el('ocrRun').disabled = false; render(); } }
    };
    render();
  };
})(typeof window === 'undefined' ? globalThis : window);
