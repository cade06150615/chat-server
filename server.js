const API_BASE = 'https://chat-server-1-pb4g.onrender.com';

// DOM 元素
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username');
const inviteCodeInput = document.getElementById('invite-code-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messageContainer = document.getElementById('message-container');
const usernameDisplay = document.getElementById('username-display');
const inviteBtn = document.getElementById('invite-btn');
const inviteModal = document.getElementById('invite-modal');
const inviteCodeDisplay = document.getElementById('invite-code');
const copyBtn = document.getElementById('copy-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

let currentUser = null;

// 登入功能，呼叫後端 API
loginBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const inviteCode = inviteCodeInput.value.trim();

  if (!username) {
    alert('請輸入使用者名稱');
    return;
  }

  try {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, inviteCode: inviteCode || undefined })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '登入失敗');
      return;
    }
    currentUser = data;

    // 更新 UI
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    usernameDisplay.textContent = currentUser.name;
    usernameDisplay.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');

    // 顯示歡迎訊息
    addSystemMessage(`歡迎 ${currentUser.name} 加入聊天室！`);

    if (inviteCode) {
      // 取得邀請人名稱
      const inviterRes = await fetch(API_BASE + '/invite/' + inviteCode);
      const inviterData = await inviterRes.json();
      if (inviterRes.ok) {
        addSystemMessage(`你是透過 ${inviterData.inviter} 的邀請加入的`);
      }
    }

    // 載入歷史訊息
    loadMessages();

  } catch (error) {
    alert('伺服器錯誤，請稍後再試');
    console.error(error);
  }
});

// 登出功能
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  authContainer.classList.remove('hidden');
  chatContainer.classList.add('hidden');
  usernameDisplay.textContent = '未登入';
  usernameDisplay.classList.add('hidden');
  logoutBtn.classList.add('hidden');
  usernameInput.value = '';
  inviteCodeInput.value = '';
  messageContainer.innerHTML = '<div class="text-center text-gray-500 text-sm py-2">— 開始聊天 —</div>';
});

// 發送訊息，呼叫後端 API
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || !currentUser) return;

  try {
    const res = await fetch(API_BASE + '/messages', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ user: currentUser.name, text: message })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '訊息發送失敗');
      return;
    }
    // 顯示訊息
    const newMessage = { user: currentUser.name, text: message, time: new Date().toISOString() };
    displayMessage(newMessage);
    messageInput.value = '';
    messageInput.focus();
  } catch (error) {
    alert('伺服器錯誤，訊息未發送');
    console.error(error);
  }
}

// 顯示訊息
function displayMessage(message) {
  const isCurrentUser = message.user === currentUser.name;
  const messageDiv = document.createElement('div');
  messageDiv.className = `flex ${isCurrentUser ? 'justify-end' : 'justify-start'} fade-in`;

  const time = new Date(message.time);
  const formattedTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  messageDiv.innerHTML = `
      <div class="message ${isCurrentUser ? 'bg-indigo-100 text-indigo-900' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-2 relative">
          ${!isCurrentUser ? `<div class="font-medium text-sm text-indigo-600">${escapeHtml(message.user)}</div>` : ''}
          <p>${escapeHtml(message.text)}</p>
          <div class="text-xs text-gray-500 text-right mt-1">${formattedTime}</div>
      </div>
  `;

  messageContainer.appendChild(messageDiv);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// 添加系統訊息
function addSystemMessage(text) {
  const systemDiv = document.createElement('div');
  systemDiv.className = 'text-center text-gray-500 text-sm py-2 fade-in';
  systemDiv.textContent = text;
  messageContainer.appendChild(systemDiv);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// 載入訊息歷史
async function loadMessages() {
  try {
    const res = await fetch(API_BASE + '/messages');
    const data = await res.json();
    if (Array.isArray(data)) {
      messageContainer.innerHTML = '<div class="text-center text-gray-500 text-sm py-2">— 開始聊天 —</div>';
      data.forEach(msg => displayMessage(msg));
    }
  } catch (error) {
    console.error('載入訊息失敗', error);
  }
}

// 邀請好友功能
inviteBtn.addEventListener('click', () => {
  if (!currentUser) {
    alert('請先登入');
    return;
  }

  inviteCodeDisplay.textContent = currentUser.inviteCode;
  inviteModal.classList.remove('hidden');
});

// 關閉邀請彈窗
closeModalBtn.addEventListener('click', () => {
  inviteModal.classList.add('hidden');
});

// 點擊彈窗外部關閉
inviteModal.addEventListener('click', (e) => {
  if (e.target === inviteModal) {
    inviteModal.classList.add('hidden');
  }
});

// 複製邀請碼
copyBtn.addEventListener('click', () => {
  const tempInput = document.createElement('input');
  tempInput.value = currentUser.inviteCode;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  copyBtn.textContent = '已複製！';
  setTimeout(() => {
    copyBtn.textContent = '複製邀請碼';
  }, 2000);
});

// HTML 轉義函數，防止 XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

