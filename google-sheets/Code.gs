/**
 * Friendship Lab shared answer log (Google Sheets, no Supabase).
 * In a NEW Google Sheet: Extensions > Apps Script, paste this file.
 * Deploy > New deployment > Web app:
 *   Execute as: Me; Who has access: Anyone.
 * Copy the deployment URL into sheet-config.js.
 * WARNING: ALL saved answers are intentionally public to anyone with the class URL.
 */
const SHEET_NAME='全班填答紀錄';
const ALLOWED=new Set(['apps','birthday','conflictChoice','rank','threadReply','storyMessage','care','other']);
function sheet_(){
  const file=SpreadsheetApp.getActiveSpreadsheet();
  let sheet=file.getSheetByName(SHEET_NAME);
  if(!sheet){sheet=file.insertSheet(SHEET_NAME);sheet.appendRow(['時間','題目代碼','填答內容','紀錄ID']);sheet.setFrozenRows(1);}
  return sheet;
}
function jsonp_(payload,callback){
  const encoded=JSON.stringify(payload).replace(/</g,'\\u003c');
  if(!/^[A-Za-z_$][A-Za-z0-9_$]{0,60}$/.test(callback||''))return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  return ContentService.createTextOutput(callback+'('+encoded+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function doGet(e){
  const p=(e&&e.parameter)||{};
  const action=p.action||'list';
  if(action!=='list')return jsonp_({ok:false,error:'Unsupported action'},p.callback);
  const filter=String(p.question||'');
  const values=sheet_().getDataRange().getValues().slice(1);
  const rows=values.slice(-3000).reverse().filter(r=>!filter||r[1]===filter).slice(0,300).map(r=>({
    time:r[0] instanceof Date?r[0].toISOString():String(r[0]),key:String(r[1]),answer:String(r[2]),id:String(r[3])
  }));
  return jsonp_({ok:true,rows},p.callback);
}
function doPost(e){
  const p=(e&&e.parameter)||{};
  const key=String(p.question||'').trim();
  const answer=String(p.answer||'').trim();
  const id=String(p.id||'').trim();
  if(!ALLOWED.has(key)||!answer||answer.length>1500||!/^[a-zA-Z0-9-]{10,80}$/.test(id))return ContentService.createTextOutput('invalid');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000))return ContentService.createTextOutput('busy');
  try{
    const sheet=sheet_();
    const last=sheet.getLastRow();
    // Avoid duplicates from retry/navigation using recent IDs.
    if(last>1){
      const recent=sheet.getRange(Math.max(2,last-100),4,Math.min(last-1,101),1).getDisplayValues().flat();
      if(recent.includes(id))return ContentService.createTextOutput('duplicate');
    }
    sheet.appendRow([new Date(),key,answer.replace(/^[=+\\-@]/,'\''+'$&'),id]);
    return ContentService.createTextOutput('ok');
  }finally{lock.releaseLock();}
}
