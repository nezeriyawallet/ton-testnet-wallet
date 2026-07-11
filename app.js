/* global Telegram, TON_CONNECT_UI */
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const statusEl = document.querySelector('#status');
const balanceEl = document.querySelector('#balance');
const addressEl = document.querySelector('#wallet-address');
const sendButton = document.querySelector('#send-button');

// Після розміщення файлів manifest буде доступний за цією адресою.
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
  buttonRootId: 'ton-connect'
});

function setStatus(message, kind = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-5)}`;
}

async function loadBalance(address) {
  balanceEl.textContent = '…';
  try {
    const response = await fetch(`https://testnet.tonapi.io/v2/accounts/${encodeURIComponent(address)}`);
    if (!response.ok) throw new Error('Баланс тимчасово недоступний');
    const account = await response.json();
    balanceEl.textContent = (Number(account.balance) / 1_000_000_000).toFixed(2);
  } catch (error) {
    balanceEl.textContent = '—';
    setStatus('Не вдалося завантажити баланс. Підключення все ще доступне.', 'error');
  }
}

function updateWallet(wallet) {
  if (!wallet) {
    addressEl.textContent = 'Підключіть testnet-гаманець';
    balanceEl.textContent = '—';
    sendButton.disabled = true;
    sendButton.textContent = 'Підключіть гаманець';
    return;
  }
  const address = wallet.account.address;
  addressEl.textContent = shortAddress(address);
  addressEl.title = address;
  sendButton.disabled = false;
  sendButton.textContent = 'Надіслати тестові TON';
  setStatus('Гаманець підключено. Перевірте адресу та суму перед підтвердженням.');
  loadBalance(address);
}

tonConnectUI.onStatusChange(updateWallet);
updateWallet(tonConnectUI.wallet);

document.querySelector('#send-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const recipient = document.querySelector('#recipient').value.trim();
  const amount = Number(document.querySelector('#amount').value);
  if (!tonConnectUI.wallet) return setStatus('Спершу підключіть гаманець.', 'error');
  if (!/^[EU]Q[A-Za-z0-9_-]{46,}$/.test(recipient)) return setStatus('Схоже, адреса одержувача некоректна.', 'error');
  if (!Number.isFinite(amount) || amount <= 0) return setStatus('Вкажіть суму більшу за нуль.', 'error');

  sendButton.disabled = true;
  setStatus('Відкриваємо гаманець для підтвердження…');
  try {
    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      network: '-3',
      messages: [{ address: recipient, amount: String(Math.round(amount * 1_000_000_000)) }]
    });
    setStatus('Запит на переказ надіслано в гаманець.', 'success');
    loadBalance(tonConnectUI.wallet.account.address);
  } catch (error) {
    setStatus('Переказ скасовано або не виконано.', 'error');
  } finally {
    sendButton.disabled = false;
  }
});
