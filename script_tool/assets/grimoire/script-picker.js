/* Script browsing reads the library and editor stores; only this tool's recent imports are written. */
(function (root) {
    'use strict';
    const recentKey = 'botc_grimoire_scripts_v1', maxRecentBytes = 2 * 1024 * 1024;
    const normalize = value => String(value || '').replace(/\\/g, '/').toLocaleLowerCase();
    function create(ui) {
        const { C, G, $, node, button, open, dialog, fetchJSON, newScript, getState, getRevision, toast, onViewChange = () => {} } = ui;
        let directoryPromise, recent = [], recentWarning = '', recentBlocked = false;
        const localLoads = new Map(), fileMode = root.location.protocol === 'file:';
        function localData(path, readValue) {
            const cached = readValue();
            if (cached) return Promise.resolve(cached);
            if (localLoads.has(path)) return localLoads.get(path);
            const request = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const timer = setTimeout(() => finish(Error('本地剧本资料读取超时，请重试')), 20000);
                function finish(error) {
                    clearTimeout(timer); script.onload = script.onerror = null; script.remove();
                    if (error) { reject(error); return; }
                    const value = readValue();
                    if (!value) { reject(Error('本地剧本资料无效，请重新生成资料')); return; }
                    resolve(value);
                }
                script.onload = () => finish();
                script.onerror = () => finish(Error('本地剧本资料缺失，请重新生成资料'));
                script.src = new URL(path, document.baseURI).href;
                document.head.append(script);
            });
            localLoads.set(path, request);
            request.then(() => localLoads.delete(path), () => localLoads.delete(path));
            return request;
        }
        async function original(entry) {
            if (!fileMode) return fetchJSON('../api/v1/' + entry.json);
            const key = entry.localOriginal;
            if (typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key))
                throw Error('此剧本缺少本地原文索引，请重新生成资料');
            const value = await localData('../script_lib/assets/data/originals/' + key + '.js', () => {
                const cache = root.SCRIPT_ORIGINALS;
                return cache && Object.prototype.hasOwnProperty.call(cache, key) && cache[key];
            });
            if (typeof value.t !== 'string' || value.t.length > 8 * 1024 * 1024)
                throw Error('本地剧本原文无效或超过 8 MB');
            return root.ScriptCore.parseJSON(value.t);
        }
        const read = (key, fallback) => { try {
            const value = JSON.parse(root.localStorage.getItem(key));
            return value && typeof value === 'object' ? value : fallback;
        }
        catch {
            return fallback;
        } };
        try {
            const raw = root.localStorage.getItem(recentKey);
            if (raw) {
                if (raw.length > maxRecentBytes)
                    throw Error('记录过大');
                const value = JSON.parse(raw);
                if (value.version !== 1 || !Array.isArray(value.items) || value.items.length > 10)
                    throw Error('格式无效');
                recent = value.items.map(item => { if (!item || typeof item.logo !== 'string' || item.logo.length > 10000)
                    throw Error('资料无效'); return { script: G.create(item.script, 5).script, logo: item.logo }; });
            }
        }
        catch {
            recentBlocked = true;
            recentWarning = '最近导入记录无法读取，原记录已保留；仍可选择或导入剧本。';
        }
        function persistRecent() {
            if (recentBlocked)
                return;
            try {
                const items = recent.slice();
                let value = JSON.stringify({ version: 1, items });
                while (new Blob([value]).size > maxRecentBytes && items.length > 1) {
                    items.pop();
                    value = JSON.stringify({ version: 1, items });
                }
                if (new Blob([value]).size > maxRecentBytes)
                    throw Error('记录过大');
                root.localStorage.setItem(recentKey, value);
                recentWarning = '';
            }
            catch {
                recentWarning = '最近导入暂未保存，仅在本次页面中可用。';
            }
        }
        function remember(script, logo) {
            const signature = JSON.stringify(script);
            recent = [{ script, logo: typeof logo === 'string' && logo.length <= 10000 ? logo : '' }, ...recent.filter(item => JSON.stringify(item.script) !== signature)].slice(0, 10);
            persistRecent();
            if (recentWarning)
                toast(recentWarning);
        }
        function directory() {
            if (!directoryPromise)
                directoryPromise = (fileMode ? localData('assets/grimoire/script-directory.js', () => root.GrimoireScriptDirectory) : fetchJSON('../api/v1/scripts.json')).then(data => { if (!Array.isArray(data.items))
                    throw Error('剧本库目录格式无效'); return data.items; }).catch(e => { directoryPromise = null; throw e; });
            return directoryPromise;
        }
        function safeLogo(value, base = document.baseURI) {
            if (typeof value !== 'string' || !value.trim())
                return '';
            try {
                if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(value) && value.length <= 10000)
                    return value;
                const url = new URL(value, base);
                return ['http:', 'https:'].includes(url.protocol) || fileMode && url.protocol === 'file:' && url.href.startsWith(new URL('../', document.baseURI).href) ? url.href : '';
            }
            catch {
                return '';
            }
        }
        function logoURL(entry, overrides) {
            const saved = overrides && Object.prototype.hasOwnProperty.call(overrides, entry.path) && overrides[entry.path], valid = saved && saved.imageDir === entry.imageDir && saved.roles && typeof saved.roles === 'object' && (saved.explicit || Object.keys(saved.roles).length), file = valid ? saved.roles.logo : entry.pictureRoles?.logo;
            if (file && Array.isArray(entry.images) && entry.images.includes(file) && entry.logoImages?.[file])
                return safeLogo(entry.logoImages[file], new URL('../api/v1/', document.baseURI));
            return safeLogo(valid ? entry.metadataLogo : entry.logo, new URL('../api/v1/', document.baseURI));
        }
        function logo(src) { const img = node('img'); img.className = 'g-script-logo'; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.src = src || 'theme/custom.png'; img.onerror = () => { img.onerror = null; img.src = 'theme/custom.png'; }; return img; }
        function plain(value) { return String(value || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').slice(0, 12000); }
        function candidates(value, fallback = '') {
            const bundle = Array.isArray(value) && value.length && value.every(item => item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'json'));
            if (bundle && value.length > 200)
                throw Error('一次最多读取 200 份剧本');
            return (bundle ? value : [{ name: fallback, json: value }]).map((item, i) => { try {
                const raw = typeof item.json === 'string' ? root.ScriptCore.parseJSON(item.json) : item.json, script = C.parse(raw), meta = Array.isArray(raw) && raw.find(e => e && typeof e === 'object' && e.id === '_meta');
                if (script.name === '未命名剧本' && item.name)
                    script.name = String(item.name).slice(0, 200);
                return { script: G.create(script, 5).script, logo: safeLogo(meta?.logo) };
            }
            catch (e) {
                throw Error((bundle ? '第 ' + (i + 1) + ' 份「' + String(item.name || '未命名').slice(0, 100) + '」：' : '') + e.message);
            } });
        }
        async function readURL(value) {
            const url = new URL(value, document.baseURI);
            if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
                throw Error('请填写 HTTP 或 HTTPS JSON 地址');
            const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);
            try {
                const response = await fetch(url.href, { credentials: 'omit', signal: controller.signal });
                if (!response.ok)
                    throw Error('请求失败（' + response.status + '）');
                if (Number(response.headers.get('content-length')) > 8 * 1024 * 1024)
                    throw Error('JSON 超过 8 MB');
                const text = await response.text();
                if (new Blob([text]).size > 8 * 1024 * 1024)
                    throw Error('JSON 超过 8 MB');
                root.ScriptCore.parseJSON(text);
                return text;
            }
            finally {
                clearTimeout(timer);
            }
        }
        function show(opener = $('gScript')) {
            if (!dialog.open)
                opener.focus({ preventScroll: true });
            open('选择剧本', host => {
                const revision = getRevision(), overrides = read('scriptlib-picture-roles', {}), personal = read('scriptlib-personal', {});
                let active = 'official', selection = 0, importJob = 0, entries = [], shown = 24, libraryLoaded = false, importName = '';
                const current = tab => getRevision() === revision && dialog.open && active === tab;
                const tabs = node('div', undefined, 'g-script-nav'), views = node('div', undefined, 'g-script-views'), panels = {}, tabButtons = {};
                tabs.setAttribute('role', 'tablist');
                tabs.setAttribute('aria-label', '选择剧本来源');
                host.append(tabs, views);
                const say = (target, text) => { target.textContent = text; target.hidden = !text; };
                const choose = (item, tab, saveRecent = false) => { if (!current(tab))
                    return; try {
                    const src=safeLogo(item.logo||item.script.logo),base=new URL('.',document.baseURI).href;
                    if (newScript({...item.script,logo:src.startsWith(base)?src.slice(base.length):src}) && saveRecent)
                        remember(item.script, item.logo);
                }
                catch (e) {
                    say(status[tab], '载入失败：' + e.message);
                } };
                for (const [key, title] of [['official', '官方剧本'], ['library', '剧本库'], ['custom', '自定义剧本']]) {
                    const panel = node('section', undefined, 'g-script-view');
                    panel.id = 'gScriptView_' + key;
                    panel.setAttribute('role', 'tabpanel');
                    panel.setAttribute('aria-labelledby', 'gScriptTab_' + key);
                    panel.hidden = key !== active;
                    panels[key] = panel;
                    views.append(panel);
                    const b = button(title, () => activate(key), 'subtle');
                    b.id = 'gScriptTab_' + key;
                    b.setAttribute('role', 'tab');
                    b.setAttribute('aria-selected', String(key === active));
                    b.setAttribute('aria-controls', panel.id);
                    b.tabIndex = key === active ? 0 : -1;
                    tabButtons[key] = b;
                    tabs.append(b);
                    b.onkeydown = e => { const keys = Object.keys(tabButtons), index = keys.indexOf(key); let next; if (e.key === 'ArrowRight')
                        next = keys[(index + 1) % 3]; if (e.key === 'ArrowLeft')
                        next = keys[(index + 2) % 3]; if (e.key === 'Home')
                        next = 'official'; if (e.key === 'End')
                        next = 'custom'; if (next) {
                        e.preventDefault();
                        activate(next);
                        tabButtons[next].focus();
                    } };
                }
                const status = {};
                for (const key of Object.keys(panels)) {
                    status[key] = node('p', '', 'g-script-status');
                    status[key].setAttribute('role', 'status');
                    status[key].hidden = true;
                    panels[key].append(status[key]);
                }
                const officialCards = node('div', undefined, 'g-script-presets');
                officialCards.id = 'gPresetCards';
                panels.official.prepend(node('p', '点击剧本图案即可选择；展开简介可先了解剧本。', 'g-script-help'));
                panels.official.append(officialCards);
                const order = ['暗流涌动', '黯月初升', '梦殒春宵', '无上愉悦', '窃窃私语'];
                const presetCards = [];
                for (const [index, preset] of [...root.PRESETS.entries()].sort((a, b) => order.indexOf(a[1].name) - order.indexOf(b[1].name))) {
                    const range = { '暗流涌动': '5–15', '黯月初升': '7–15', '梦殒春宵': '7–15', '无上愉悦': '5–6', '窃窃私语': '5–6' }[preset.name];
                    const card = node('article', undefined, 'g-script-card'), pick = button('', () => choose({ script: C.preset(index),logo:img.src }, 'official'), 'g-script-preset'), img = logo(C.presetLogo(preset.name)), title = node('strong', preset.name), small = node('span', range ? '支持 ' + range + ' 人' : '', 'g-script-players'), details = node('details', undefined, 'g-script-intro'), summary = node('summary', '剧本简介'), copy = node('p', '可在剧本库查看原始角色配置与说明。');
                    pick.dataset.preset = String(index);
                    pick.setAttribute('aria-label', '选择' + preset.name);
                    pick.append(img, title, small);
                    details.append(summary, copy);
                    card.append(pick, details);
                    officialCards.append(card);
                    presetCards.push({ preset, img, copy, small });
                }
                directory().then(data => { if (getRevision() !== revision)
                    return; for (const card of presetCards) {
                    const entry = data.find(e => e.name === card.preset.name && e.category === '官方已发行剧本');
                    if (entry) {
                        card.img.src = logoURL(entry, overrides) || 'theme/custom.png';
                        card.copy.textContent = plain(entry.description) || '当前剧本包含 ' + entry.roleCount + ' 个角色，可点击图案选择。';
                    }
                } officialCards.dataset.loaded = 'true'; }).catch(() => { if (getRevision() === revision)
                    officialCards.dataset.loaded = 'true'; });
                const libraryControls = node('div', undefined, 'g-script-library-tools'), search = node('input');
                search.type = 'search';
                search.id = 'gLibrarySearch';
                search.placeholder = '搜索剧本名称、作者或分类…';
                search.setAttribute('aria-label', '搜索剧本库');
                libraryControls.append(search);
                let source = '', composition = '', sort = 'catalog', category = '';
                const flags = entry => { const records = [entry.path, ...(entry.aliases || [])].map(path => personal[normalize(path)]).filter(r => r && typeof r === 'object'); return { favorite: records.some(r => r.favorite === true), recommended: records.some(r => r.recommended === true) }; };
                function filterRow(label, key, options, onPick) { const row = node('div', undefined, 'g-script-filter'); row.append(node('span', label)); for (const [value, text] of options) {
                    const b = button(text, () => { onPick(value); for (const peer of row.querySelectorAll('button'))
                        peer.setAttribute('aria-pressed', String(peer === b)); shown = 24; drawLibrary(); }, 'subtle');
                    b.dataset[key] = value;
                    b.setAttribute('aria-pressed', String(value === ''));
                    row.append(b);
                } return row; }
                libraryControls.append(filterRow('来源', 'source', [['', '不限'], ['official', '官方'], ['community', '社区'], ['favorite', '我的收藏'], ['recommended', '我的推荐']], v => source = v), filterRow('成分', 'composition', [['', '不限'], ['official', '纯官方角色'], ['custom', '包含自制']], v => composition = v));
                const lower = node('div', undefined, 'g-script-library-sort'), categorySelect = node('select'), sortSelect = node('select');
                categorySelect.id = 'gLibraryCategory';
                categorySelect.setAttribute('aria-label', '剧本库分类');
                categorySelect.append(new Option('全部分类', ''));
                sortSelect.id = 'gLibrarySort';
                sortSelect.setAttribute('aria-label', '剧本排序');
                sortSelect.append(new Option('目录顺序', 'catalog'), new Option('名称', 'name'), new Option('角色数量', 'count'));
                lower.append(categorySelect, sortSelect);
                libraryControls.append(lower);
                const librarySummary = node('p', '', 'g-script-help'), results = node('div', undefined, 'g-script-results'), more = button('显示更多', () => { shown += 24; drawLibrary(); }, 'subtle');
                librarySummary.id = 'gLibraryCount';
                results.id = 'gLibraryResults';
                more.id = 'gLibraryMore';
                more.hidden = true;
                panels.library.prepend(libraryControls, librarySummary);
                panels.library.append(results, more);
                async function loadEntry(entry, b) { const job = ++selection; b.disabled = true; say(status.library, '正在读取「' + entry.name + '」的 JSON…'); try {
                    const value = await original(entry);
                    if (!current('library') || job !== selection)
                        return;
                    const parsed = candidates(value, entry.name)[0];
                    parsed.logo=logoURL(entry,overrides)||parsed.logo;
                    choose(parsed, 'library');
                }
                catch (e) {
                    if (current('library') && job === selection)
                        say(status.library, '读取失败：' + e.message + '。当前对局未改变。');
                }
                finally {
                    b.disabled = false;
                } }
                function drawLibrary() {
                    selection++;
                    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
                    const matches = entries.filter(e => terms.every(q => (e.name + ' ' + e.author + ' ' + e.category).toLocaleLowerCase().includes(q)) && (!category || e.category === category) && (!source || (source === 'official' ? e.category === '官方已发行剧本' : source === 'community' ? e.category !== '官方已发行剧本' : flags(e)[source])) && (!composition || (composition === 'official' ? e.customCount === 0 : typeof e.customCount === 'number' && e.customCount > 0)));
                    if (sort === 'name')
                        matches.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
                    if (sort === 'count')
                        matches.sort((a, b) => b.roleCount - a.roleCount || a.name.localeCompare(b.name, 'zh-CN'));
                    results.replaceChildren();
                    for (const entry of matches.slice(0, shown)) {
                        const b = button('', () => loadEntry(entry, b), 'g-script-library-item g-library-item'), copy = node('span', undefined, 'g-script-library-copy'), title = node('strong', entry.name), detail = node('small', (entry.author || '佚名') + ' · ' + entry.roleCount + ' 个角色' + (entry.customCount === null ? '' : entry.customCount ? ' · ' + entry.customCount + ' 个自制' : ' · 纯官方角色')), cat = node('span', entry.category, 'g-script-library-category');
                        copy.append(title, detail, cat);
                        b.append(logo(logoURL(entry, overrides)), copy);
                        b.dataset.scriptId = entry.id;
                        b.title = entry.name + ' · ' + entry.category;
                        results.append(b);
                    }
                    librarySummary.textContent = '可读取 JSON ' + entries.length + ' 份 · 匹配 ' + matches.length + ' 份 · 已显示 ' + Math.min(shown, matches.length) + ' 份';
                    more.hidden = shown >= matches.length;
                    if (!matches.length)
                        results.append(node('p', '没有匹配的 JSON 剧本，可调整筛选或前往自定义剧本导入。', 'g-script-empty'));
                }
                async function loadLibrary() { if (libraryLoaded)
                    return; say(status.library, '正在读取你的剧本库…'); try {
                    const data = await directory();
                    if (getRevision() !== revision)
                        return;
                    entries = data.filter(e => e.kind === 'json' && typeof e.json === 'string' && /^scripts\/[a-f0-9]{64}\.json$/.test(e.json));
                    libraryLoaded = true;
                    for (const value of [...new Set(entries.map(e => e.category))].sort((a, b) => a.localeCompare(b, 'zh-CN')))
                        categorySelect.append(new Option(value, value));
                    say(status.library, '');
                    drawLibrary();
                }
                catch (e) {
                    if (current('library')) {
                        say(status.library, '目录读取失败：' + e.message);
                        const retry = button('重试读取', () => { retry.remove(); loadLibrary(); }, 'subtle');
                        status.library.after(retry);
                    }
                } }
                search.oninput = () => { shown = 24; drawLibrary(); };
                categorySelect.onchange = () => { category = categorySelect.value; shown = 24; drawLibrary(); };
                sortSelect.onchange = () => { sort = sortSelect.value; drawLibrary(); };
                const currentScript=getState().script,banner = node('div', undefined, 'g-script-current'),bannerCopy=node('span','当前使用「'+currentScript.name+'」 · '+currentScript.roles.length+' 个角色'),officialShortcut=button('查看官方剧本',()=>{activate('official');tabButtons.official.focus();},'subtle');banner.id='gScriptCurrent';officialShortcut.id='gScriptOfficialShortcut';banner.append(bannerCopy,officialShortcut);
                const recentBox = node('div', undefined, 'g-script-recent'), file = node('input'), fileButton = button('选择文件', () => file.click(), 'subtle'), example = button('填入示例', () => { importJob++; importName = ''; text.value = JSON.stringify([{ id: '_meta', name: '我的剧本' }, 'washerwoman', 'chef', 'empath', 'monk', 'ravenkeeper', 'slayer', 'mayor', 'drunk', 'saint', 'poisoner', 'imp'], null, 2); preview.replaceChildren(); say(status.custom, '已填入示例，点“载入剧本”使用。'); }, 'subtle'), draft = button('读取草稿', () => { try {
                    choose({ script: C.draft(), logo: '' }, 'custom', true);
                }
                catch (e) {
                    say(status.custom, '草稿读取失败：' + e.message);
                } }, 'subtle'), fileTools = node('div', undefined, 'g-script-file-tools'), editor = node('a', '打开剧本工具', 'g-script-editor-link');
                example.id='gScriptExample';draft.id='gScriptDraft';draft.title='读取剧本编辑器当前草稿';editor.textContent='剧本工具 ↗';editor.href = '剧本工具.html';
                editor.target = '_blank';
                editor.rel = 'noopener';
                file.type = 'file';
                file.id = 'gScriptFile';
                file.accept = '.json,application/json';
                file.multiple = true;
                file.hidden = true;
                fileButton.id = 'gScriptFileButton';
                fileTools.append(fileButton, example, draft, editor, file);
                const urlRow = node('div', undefined, 'g-script-url-row'), urlInput = node('input'), fetchButton = button('拉取', async () => { const job = ++importJob; fetchButton.disabled = true; say(status.custom, '正在读取 JSON 地址…'); try {
                    const value = await readURL(urlInput.value.trim());
                    if (!current('custom') || job !== importJob)
                        return;
                    candidates(root.ScriptCore.parseJSON(value));
                    importName = '';
                    text.value = value;
                    preview.replaceChildren();
                    say(status.custom, 'JSON 已读取，点“载入剧本”确认。');
                }
                catch (e) {
                    if (current('custom') && job === importJob)
                        say(status.custom, '读取失败：' + e.message + '。跨站地址需要允许浏览器跨域读取，也可下载后选择文件。');
                }
                finally {
                    fetchButton.disabled = false;
                } }, 'subtle');
                urlInput.type = 'url';
                urlInput.id = 'gScriptURL';
                urlInput.placeholder = '或粘贴 JSON 网址，回车拉取';
                urlInput.setAttribute('aria-label', '剧本 JSON 地址');
                fetchButton.id = 'gScriptFetch';
                urlRow.append(urlInput, fetchButton);
                urlInput.onkeydown = e => { if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchButton.click();
                } };
                const text = node('textarea');
                text.id = 'gScriptJSON';
                text.maxLength = 8 * 1024 * 1024;
                text.spellcheck = false;
                text.placeholder = '粘贴剧本 JSON，例如 [{"id":"_meta","name":"我的剧本"},"washerwoman","imp"]';
                text.setAttribute('aria-label', '剧本 JSON 内容');
                const preview = node('div', undefined, 'g-script-import-preview'), load = button('载入剧本', () => { importJob++;try {
                    if (new Blob([text.value]).size > 8 * 1024 * 1024)
                        throw Error('JSON 超过 8 MB');
                    const items = candidates(root.ScriptCore.parseJSON(text.value), importName);
                    if (items.length === 1)
                        choose(items[0], 'custom', true);
                    else
                        renderCandidates(items);
                }
                catch (e) {
                    say(status.custom, '导入失败：' + e.message + '。当前对局未改变。');
                } }, 'primary');
                load.id = 'gScriptLoad';
                preview.id = 'gScriptImportList';
                text.onkeydown=e=>{if(!e.isComposing&&e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();load.click();}};
                function renderCandidates(items) { preview.replaceChildren(node('p', '已读取 ' + items.length + ' 份剧本，选择一份载入：', 'g-script-help')); for (const item of items) {
                    const b = button('', () => choose(item, 'custom', true), 'g-script-import-item');
                    b.append(logo(item.logo), node('span', item.script.name + ' · ' + item.script.roles.length + ' 个角色'));
                    preview.append(b);
                } say(status.custom, '');preview.scrollIntoView?.({block:'nearest'}); }
                function drawRecent() { recentBox.replaceChildren();recentBox.append(node('h3', '最近导入 · ' + recent.length)); if (recent.length) {
                    const chips = node('div', undefined, 'g-script-recent-chips');
                    for (const [index, item] of recent.entries()) {
                        const wrap = node('span', undefined, 'g-script-recent-chip'), b = button('', () => choose(item, 'custom'), 'subtle'), remove = button('', () => { recent.splice(index, 1); persistRecent(); drawRecent(); say(status.custom, recentWarning); }, 'subtle');
                        b.append(node('span',item.script.name,'g-script-recent-name'),node('small',' · '+item.script.roles.length));b.title=item.script.name+' · '+item.script.roles.length+' 个角色';b.setAttribute('aria-label','载入最近剧本 '+item.script.name+'，'+item.script.roles.length+' 个角色');
                        const shape=s=>JSON.stringify({...s,logo:''});if(shape(item.script)===shape(currentScript)){wrap.classList.add('is-current');b.setAttribute('aria-current','true');}
                        const icon=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(icon.namespaceURI,'path');icon.setAttribute('viewBox','0 0 20 20');icon.setAttribute('aria-hidden','true');path.setAttribute('d','M3 5h14M7 5V2h6v3M5 5l1 13h8l1-13M8 8v7m4-7v7');icon.append(path);remove.append(icon);
                        b.dataset.recent = String(index);
                        remove.setAttribute('aria-label', '从最近导入移除' + item.script.name);
                        wrap.append(b, remove);
                        chips.append(wrap);
                    }
                    recentBox.append(chips);
                }else recentBox.append(node('p','导入并载入剧本后，会在这里保留最近 10 本。','g-script-recent-empty')); }
                file.onchange = async () => { const job = ++importJob; try {
                    const files = [...file.files];
                    if (!files.length)
                        return;
                    if (files.reduce((n, f) => n + f.size, 0) > 8 * 1024 * 1024)
                        throw Error('所选 JSON 总大小超过 8 MB');
                    const values = await Promise.all(files.map(async (f) => ({ name: f.name.replace(/\.json$/i, ''), json: root.ScriptCore.parseJSON(await f.text()) })));
                    if (!current('custom') || job !== importJob)
                        return;
                    importName = files.length === 1 ? values[0].name : '';
                    if (files.length === 1) {
                        candidates(values[0].json, values[0].name);
                        text.value = JSON.stringify(values[0].json, null, 2);
                    }
                    else {
                        values.flatMap(v => candidates(v.json, v.name));
                        text.value = JSON.stringify(values.flatMap(v => Array.isArray(v.json) && v.json.every(e => e && typeof e === 'object' && 'json' in e) ? v.json : [v]));
                    }
                    preview.replaceChildren();
                    say(status.custom, '已读取 ' + files.length + ' 个文件，点“载入剧本”确认。');
                }
                catch (e) {
                    if (current('custom') && job === importJob)
                        say(status.custom, '文件读取失败：' + e.message);
                }
                finally {
                    file.value = '';
                } };
                text.oninput = () => { importJob++; importName = ''; preview.replaceChildren(); say(status.custom, ''); };
                urlInput.oninput = () => importJob++;
                const customScroll=node('div',undefined,'g-script-custom-scroll'),customFooter=node('div',undefined,'g-script-custom-footer'),footerRow=node('div',undefined,'g-script-custom-actions'),help=node('p','支持多文件／多剧本 JSON · 8 MB 以内','g-script-help');help.title='支持标准角色 ID 和完整自制角色，保留明确填写的夜序；Ctrl / ⌘ + Enter 载入。';footerRow.append(help,load);customFooter.append(status.custom,footerRow);customScroll.append(banner,recentBox,fileTools,urlRow,preview,text);panels.custom.replaceChildren(customScroll,customFooter);
                drawRecent();
                function activate(key) { active = key; dialog.dataset.scriptTab = key; selection++; importJob++; for (const name of Object.keys(panels)) {
                    panels[name].hidden = name !== key;
                    tabButtons[name].setAttribute('aria-selected', String(name === key));
                    tabButtons[name].tabIndex = name === key ? 0 : -1;
                } if (key === 'library')
                    loadLibrary(); if (key === 'custom')
                    say(status.custom, recentWarning); onViewChange(panels[key]); }
            });
            dialog.classList.add('g-script-dialog');
            dialog.dataset.scriptTab = 'official';
            $('gDialogClose').textContent = '×';
        }
        return { open: show };
    }
    root.GrimoireScripts = { create };
})(globalThis);
