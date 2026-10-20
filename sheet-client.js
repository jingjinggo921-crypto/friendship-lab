/* Friendship Lab shared answer log client (Google Apps Script + Google Sheet). */
(function(){
'use strict';
const url=String(window.FRIENDSHIP_SHEET_URL||'');
const ready=/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(url);
const keys=new Set(['apps','birthday','conflictChoice','rank','threadReply','storyMessage','care','other']);
const names={apps:'最常使用的 App',birthday:'生日祝福',conflictChoice:'友情衝突：行為選擇',rank:'友情衝突：排序',threadReply:'Threads 回覆',storyMessage:'限動訊息',care:'關心朋友',other:'其他'};
let seq=0;
function read(question=''){
 return new Promise((resolve,reject)=>{
  if(!ready){reject(new Error('尚未設定 Google 試算表共用紀錄'));return}
  const callback='flSheetCallback'+(++seq);
  const script=document.createElement('script');
  const timeout=setTimeout(()=>finish(new Error('讀取逾時，請檢查試算表權限與部署網址')),12000);
  function finish(err,data){clearTimeout(timeout);delete window[callback];script.remove();err?reject(err):resolve(data)}
  window[callback]=data=>data&&data.ok?finish(null,data.rows||[]):finish(new Error(data.error||'讀取失敗'));
  const endpoint=new URL(url);endpoint.searchParams.set('action','list');endpoint.searchParams.set('question',question);endpoint.searchParams.set('callback',callback);
  script.src=endpoint.toString();script.onerror=()=>finish(new Error('無法讀取共用紀錄'));document.head.appendChild(script);
 });
}
async function submit(key,value){
 if(!ready)throw new Error('共用紀錄尚未啟用，不能跨裝置儲存');
 if(!keys.has(key))throw new Error('不支援此題目');
 const answer=(Array.isArray(value)?value.join('、'):String(value??'')).trim();
 if(!answer||answer.length>1500)throw new Error('請先填答，且最多 1500 字');
 const id=(window.crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));
 const form=new URLSearchParams({question:key,answer,id});
 await fetch(url,{method:'POST',mode:'no-cors',body:form,redirect:'follow'});
 // Apps Script cross-origin submissions return opaque responses; verify against GET.
 for(let attempt=0;attempt<3;attempt++){
  await new Promise(resolve=>setTimeout(resolve,750+attempt*650));
  const rows=await read(key);
  if(rows.some(x=>x.id===id))return true;
 }
 throw new Error('無法確認是否已儲存，請到歷史紀錄頁檢查後再試');
}
async function submitAnswers(answers){
 const pairs=Object.entries(answers||{}).filter(([k,v])=>keys.has(k)&&v!==''&&v!=null&&(!Array.isArray(v)||v.length));
 if(!pairs.length)throw new Error('目前沒有可送出的答案');
 const failures=[];
 for(const [key,value] of pairs){try{await submit(key,value)}catch(e){failures.push((names[key]||key)+'：'+e.message)}}
 return {total:pairs.length,failures};
}
window.FriendshipSheet={ready,names,read,submit,submitAnswers};
})();
