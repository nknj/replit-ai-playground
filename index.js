import express from 'express';
import SSE from 'express-sse';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const app = express();
const port = 3000;
const openai = new OpenAI();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(compression());

const sse = new SSE();

const messages = [
  { role: "user", content: "Hello Assistant!" },
  { role: "assistant", content: "Hi there! How can I help you today?" },
];

app.get('/', async function(req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api/events', sse.init);

app.get('/api/messages', async function(req, res) {
  res.status(200).json(messages);
});


app.post('/api/send-message', async function(req, res) {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  messages.push({ role: "user", content: message });
  const chatStream = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-3.5-turbo",
    stream: true,
  });

  let responseMessage = '';
  for await (const part of chatStream) {
    responseMessage += part.choices[0]?.delta?.content || '';
    sse.send(
      {
        content: part.choices[0]?.delta?.content || '',
        finish_reason: part.choices[0]?.finish_reason
      });
  }
  messages.push({ role: 'assistant', content: responseMessage });
  res.status(200).end();
});

app.listen(port, async () => {
  // ... ?
});