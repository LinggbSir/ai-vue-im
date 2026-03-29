// controllers/proxy.js
const axios = require('axios');
const pool = require('../config/db'); // 假设你的数据库连接池

async function AIChat(ctx) {
  const { sessionId } = ctx.query; // 或者从 body 获取
  if (!sessionId) {
    ctx.status = 400;
    ctx.body = { success: false, error: '缺少 sessionId' };
    return;
  }

  console.log('sessionId:', ctx.query);

  try {
    // 1. 获取该会话最近10条消息（按时间升序）
    const [rows] = await pool.query(
      `SELECT sender_id, content, receiver_type 
       FROM messages 
       WHERE session_id = ? 
       ORDER BY created_at ASC 
       LIMIT 10`,
      [sessionId]
    );

    if (rows.length === 0) {
      ctx.body = { success: false, error: '没有历史消息，无法生成回复' };
      return;
    }

    // 2. 构建对话历史（需要区分用户和 AI 角色）
    // 假设当前用户 ID 可以从 JWT 获取：ctx.state.user.id
    const currentUserId = ctx.state.user.id;
    const conversation = rows.map(msg => ({
      role: msg.sender_id === currentUserId ? 'assistant' : 'user',
      content: msg.content
    }));

    // 3. 添加系统提示
    const systemPrompt = `你是一个聊天助手，请根据以下对话历史，生成一条自然、得体的回复建议。回复要符合上下文，语气友好。只输出回复内容，不要包含任何额外解释或标点符号之外的修饰。`;

    // 4. 调用 DeepSeek API
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY; // 后端环境变量，不要用 VITE_ 前缀
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API Key 未配置');
    }

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation
        ],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        }
      }
    );

    const reply = response.data.choices[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('AI 未返回有效回复');
    }

    ctx.body = { success: true, reply };
  } catch (err) {
    console.error('AI帮聊失败:', err);
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };
  }
}

module.exports = { AIChat };