from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
start="$('#answers').onclick=()=>{"
marker='<script src="./sheet-client.js"></script>'
if marker in s:
    print('Homepage already patched')
    raise SystemExit(0)
a=s.find(start)
if a<0:
    raise SystemExit('Cannot find answer-copy handler; refused to change homepage')
b=s.find(';\nlet current=',a)
if b<0:
    raise SystemExit('Cannot find end of handler; refused to change homepage')
replacement="""$('#answers').onclick=async()=>{
 const v=Object.entries(answers).map(([k,v])=>k+'：'+(Array.isArray(v)?v.join('、'):v)).join('\\n');
 if(!v.trim()){alert('請先完成填答，再查看歷史紀錄');return}
 try{if(navigator.clipboard)await navigator.clipboard.writeText(v)}catch(e){console.warn('複製失敗',e)}
 if(!window.FriendshipSheet?.ready){alert('尚未啟用全班共享紀錄，將先開啟歷史頁面。');location.href='./class-history.html';return}
 if(!confirm('要公開送出答案，讓全班都能看到嗎？請確認沒有姓名、電話等個人資料。')){location.href='./class-history.html';return}
 const button=$('#answers');button.disabled=true;
 try{
   const result=await FriendshipSheet.submitAnswers(answers);
   if(result.failures.length)alert('部分答案儲存失敗：\\n'+result.failures.join('\\n'));
   else alert('已確認儲存 '+result.total+' 題回答');
   location.href='./class-history.html';
 }catch(e){alert('儲存未完成：'+e.message)}finally{button.disabled=false}
};"""
s=s[:a]+replacement+s[b+1:]
end='</body></html>'
if end not in s:
    raise SystemExit('Cannot find HTML ending; refused to change homepage')
s=s.replace(end,'<script src="./sheet-config.js"></script><script src="./sheet-client.js"></script>'+end,1)
p.write_text(s,encoding='utf-8')
print('Updated existing index.html')
