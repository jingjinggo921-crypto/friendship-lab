/* Friendship Lab: device-local answer history viewer. No external database. */
(()=>{'use strict';
const HISTORY_KEY='friendship-lab-history-v1';
const ANSWER_KEYS=['friendship-lab-answers-v1','ig_threads_answers_v1'];
const HISTORY_LIMIT=2500;
const labels={apps:'平常最常用的 App',birthday:'生日祝福',conflictChoice:'友情衝突：行為選擇',ranking:'友情衝突：排序',rank:'友情衝突：排序',threads:'Threads 回覆',care:'關心朋友的方式'};
let entries=[];
try{const v=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');if(Array.isArray(v))entries=v}catch(_){}
const stringify=v=>typeof v==='string'?v:JSON.stringify(v);
function save(){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(entries.slice(-HISTORY_LIMIT)))}catch(_){}}
function remember(key,value,source='填答'){
 const serialized=stringify(value);if(serialized===undefined||serialized==='null'||serialized==='""')return;
 const prior=entries.at(-1);
 if(prior&&prior.key===key&&stringify(prior.value)===serialized)return;
 entries.push({key,value,time:new Date().toISOString(),source});entries=entries.slice(-HISTORY_LIMIT);save();
}
function loadOld(){
 if(entries.length)return;
 for(const k of ANSWER_KEYS){try{const v=JSON.parse(localStorage.getItem(k)||'{}');if(v&&typeof v==='object'){for(const [question,value]of Object.entries(v))remember(question,value,'舊資料')}}catch(_){}}
}
loadOld();
if(document.getElementById('historyOpen'))return;
const style=document.createElement('style');style.textContent=`
#flHistoryBtn{position:fixed;right:14px;bottom:18px;z-index:10000;background:#262626;color:#fff;border:0;border-radius:30px;padding:12px 16px;font-size:14px;box-shadow:0 3px 14px #0004;cursor:pointer}
#flHistoryDialog{position:fixed;inset:0;z-index:10001;background:#0009;display:none;align-items:center;justify-content:center;padding:14px}
#flHistoryDialog.fl-show{display:flex}
#flHistoryPanel{box-sizing:border-box;width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;color:#222;border-radius:17px;padding:18px;font:15px/1.6 system-ui,sans-serif}
#flHistoryPanel h2{margin:0;font-size:21px}#flHistoryPanel button,#flHistoryPanel select{font:inherit;cursor:pointer}
#flHistoryPanel .fl-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}
#flHistoryPanel .fl-toolbar button{padding:6px 10px;border:1px solid #bbb;border-radius:8px;background:white}
#flHistoryPanel .fl-item{padding:10px 2px;border-top:1px solid #eee;overflow-wrap:anywhere}
#flHistoryPanel .fl-date{color:#777;font-size:12px}
#flHistoryPanel .fl-answer{white-space:pre-wrap}
`;document.head.appendChild(style);
const btn=document.createElement('button');btn.id='flHistoryBtn';btn.type='button';btn.textContent='📚 歷史填答';document.body.appendChild(btn);
const overlay=document.createElement('div');overlay.id='flHistoryDialog';overlay.innerHTML='<section id="flHistoryPanel" role="dialog" aria-modal="true" aria-label="歷史填答紀錄"><div style="display:flex;justify-content:space-between;align-items:center"><h2>📚 歷史填答紀錄</h2><button type="button" id="flHistoryClose" aria-label="關閉">✕</button></div><p style="font-size:13px;color:#666">僅顯示這台裝置、這個瀏覽器儲存的紀錄，無法看到其他同學的資料。</p><div class="fl-toolbar"><select id="flHistoryFilter" aria-label="選擇題目"></select><button type="button" id="flExport">匯出 JSON</button><button type="button" id="flImport">匯入 JSON</button><input type="file" accept=".json,application/json" id="flImportFile" hidden></div><div id="flHistoryList"></div></section>';document.body.appendChild(overlay);
const filter=overlay.querySelector('#flHistoryFilter'),list=overlay.querySelector('#flHistoryList');
const format=v=>{try{return typeof v==='string'?v:JSON.stringify(v,null,2)}catch(_){return String(v)}};
function render(){
 filter.replaceChildren();const keys=[...new Set(entries.map(e=>e.key))];
 const all=document.createElement('option');all.value='';all.textContent='全部題目';filter.appendChild(all);
 for(const key of keys){const option=document.createElement('option');option.value=key;option.textContent=labels[key]||key;filter.appendChild(option)}
 list.replaceChildren();const selected=filter.dataset.selected||'';filter.value=keys.includes(selected)?selected:'';
 const shown=entries.filter(e=>!filter.value||e.key===filter.value).slice().reverse();
 if(!shown.length){list.textContent='目前還沒有歷史填答紀錄。';return}
 for(const e of shown){const item=document.createElement('div');item.className='fl-item';
 const q=document.createElement('strong');q.textContent=labels[e.key]||e.key;
 const time=document.createElement('div');time.className='fl-date';time.textContent=e.time?new Date(e.time).toLocaleString('zh-TW'):'時間未知';
 const ans=document.createElement('div');ans.className='fl-answer';ans.textContent=format(e.value);
 item.append(q,time,ans);list.appendChild(item)}
}
btn.onclick=()=>{render();overlay.classList.add('fl-show')};
overlay.querySelector('#flHistoryClose').onclick=()=>overlay.classList.remove('fl-show');
overlay.onclick=e=>{if(e.target===overlay)overlay.classList.remove('fl-show')};
filter.onchange=()=>{filter.dataset.selected=filter.value;render()};
overlay.querySelector('#flExport').onclick=()=>{const blob=new Blob([JSON.stringify(entries,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='friendship-lab-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};
overlay.querySelector('#flImport').onclick=()=>overlay.querySelector('#flImportFile').click();
overlay.querySelector('#flImportFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data))throw Error('JSON 必須是紀錄陣列');for(const item of data){if(item&&typeof item.key==='string'&&item.key.length<200)entries.push({key:item.key,value:item.value,time:item.time||new Date().toISOString(),source:'匯入'})}entries=entries.slice(-HISTORY_LIMIT);save();render()}catch(err){alert('匯入失敗：'+err.message)}e.target.value=''};
const nativeSetItem=Storage.prototype.setItem;
Storage.prototype.setItem=function(key,value){const result=nativeSetItem.apply(this,arguments);
 if(this===localStorage&&ANSWER_KEYS.includes(key)){try{const data=JSON.parse(value);if(data&&typeof data==='object')for(const [q,answer]of Object.entries(data)){const prev=[...entries].reverse().find(x=>x.key===q);if(!prev||format(prev.value)!==format(answer))remember(q,answer)}}catch(_){}}
 return result;};
})();