const tg=window.Telegram?.WebApp;tg?.ready();tg?.expand();
const ui=new TON_CONNECT_UI.TonConnectUI({manifestUrl:window.location.origin+'/tonconnect-manifest.json',buttonRootId:'ton-connect'});
const $=s=>document.querySelector(s),status=$('#status'),welcome=$('#welcome-screen'),walletScreen=$('#wallet-screen'),balance=$('#balance'),address=$('#wallet-address'),receiveAddress=$('#receive-address');
const say=(text,type='')=>{status.textContent=text;status.className='status '+type};
const short=a=>a.slice(0,6)+'…'+a.slice(-5);
const copy=async text=>{try{await navigator.clipboard.writeText(text);say('Адресу скопійовано.','success')}catch{say('Не вдалося скопіювати адресу.','error')}};
async function loadBalance(a){balance.textContent='…';try{const r=await fetch('https://testnet.tonapi.io/v2/accounts/'+encodeURIComponent(a));if(!r.ok)throw Error();const d=await r.json();balance.textContent=(Number(d.balance)/1e9).toFixed(2)}catch{balance.textContent='—';say('Не вдалося отримати баланс.','error')}}
function changeWallet(w){document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));if(!w){welcome.classList.remove('hidden');walletScreen.classList.add('hidden');return}const a=w.account.address;welcome.classList.add('hidden');walletScreen.classList.remove('hidden');address.textContent=short(a);address.title=a;receiveAddress.textContent=a;loadBalance(a);say('Гаманець підключено до testnet.','success')}
ui.onStatusChange(changeWallet);changeWallet(ui.wallet);
$('#connect-main').onclick=()=>ui.openModal();
$('#copy-address').onclick=()=>ui.wallet&&copy(ui.wallet.account.address);$('#copy-receive').onclick=()=>ui.wallet&&copy(ui.wallet.account.address);
[['#show-send','#send-panel'],['#show-receive','#receive-panel'],['#show-settings','#settings-panel']].forEach(([b,p])=>$(b).onclick=()=>$(p).classList.toggle('hidden'));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).classList.add('hidden'));
$('#disconnect').onclick=async()=>{await ui.disconnect();say('Гаманець від’єднано.')};
$('#send-form').addEventListener('submit',async e=>{e.preventDefault();const to=$('#recipient').value.trim(),amount=Number($('#amount').value);if(!ui.wallet)return;if(!/^[EU]Q[A-Za-z0-9_-]{46,}$/.test(to))return say('Некоректна адреса.','error');if(!Number.isFinite(amount)||amount<=0)return say('Вкажіть коректну суму.','error');const b=$('#send-button');b.disabled=true;say('Відкриваємо гаманець для підтвердження…');try{await ui.sendTransaction({validUntil:Math.floor(Date.now()/1000)+300,network:'-3',messages:[{address:to,amount:String(Math.round(amount*1e9))}]});say('Запит надіслано у гаманець.','success');loadBalance(ui.wallet.account.address)}catch{say('Переказ скасовано або не виконано.','error')}finally{b.disabled=false}});
