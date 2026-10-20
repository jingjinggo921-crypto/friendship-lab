/* Friendship Lab classroom archive. Requires window.FRIENDSHIP_CLOUD={url,publishableKey}.
   This intentionally never uploads local drafts or historical localStorage.
   A student must actively press "送出到全班紀錄" on an answered question. */
(function(){
'use strict';
const cfg=window.FRIENDSHIP_CLOUD||{};
const active=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.url||'')&&typeof cfg.publishableKey==='string'&&cfg.publishableKey.length>15;
const keys=['apps','birthday','conflictChoice','rank','threadReply','storyMessage'];
const names={apps:'最常使用的 App',birthday:'生日祝福',conflictChoice:'友情衝突：選擇',rank:'友情衝突：行為排序',threadReply:'Threads 回覆',storyMessage:'限動訊息'};
const headers={'apikey':cfg.publishableKey||'','Content-Type':'application/json'};
async function query(path,options={}){
 if(!active)throw Error('尚未設定雲端資料庫');
 const response=await fetch(cfg.url.replace(/\/$/,'')+'/rest/v1/'+path,{...options,headers:{...headers,...options.headers}});
 if(!response.ok)throw Error('雲端請求失敗（HTTP '+response.status+'）');
 const text=await response.text();return text?JSON.parse(text):null;
}
async function submit(key,value){
 if(!keys.includes(key))throw Error('這個題目暫不支援公開投稿');
 const ans=Array.isArray(value)?value.join(' → '):String(value??'').trim();
 if(!ans||ans==='[]'||ans==='undefined')throw Error('請先填答');
 if(ans.length>1500)throw Error('回答超過 1500 字');
 return query('class_answers',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({question_key:key,answer_text:ans})});
}
async function list(key){
 const where=key?'&question_key=eq.'+encodeURIComponent(key):'';
 return query('class_answers?select=id,question_key,answer_text,created_at&order=created_at.desc&limit=200'+where);
}
window.FriendshipCloud={ready:active,submit,list,questionNames:names};
})();
