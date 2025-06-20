const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const users = {};
const inviteCodes = {};
const chatMessages = [];

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.post('/login', (req, res) => {
  const { username, inviteCode } = req.body;
  if (!username) return res.status(400).json({ error: '請輸入使用者名稱' });
  if (inviteCode && !inviteCodes[inviteCode]) {
    return res.status(400).json({ error: '邀請碼無效' });
  }
  if (!users[username]) {
    const code = generateInviteCode();
    users[username] = { name: username, inviteCode: code };
    inviteCodes[code] = username;
  }
  res.json(users[username]);
});

app.get('/invite/:code', (req, res) => {
  const inviter = inviteCodes[req.params.code];
  if (!inviter) return res.status(404).json({ error: '邀請碼無效' });
  res.json({ inviter });
});

app.get('/messages', (req, res) => {
  res.json(chatMessages);
});

app.post('/messages', (req, res) => {
  const { user, text } = req.body;
  if (!user || !text) return res.status(400).json({ error: '訊息內容不完整' });
  const msg = { user, text, time: new Date().toISOString() };
  chatMessages.push(msg);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Chat server running on port ${port}`);
});
