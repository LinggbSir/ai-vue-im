const jwt = require('jsonwebtoken');

module.exports = async (ctx, next) => {
  const token = ctx.headers.authorization?.split(' ')[1]; // Bearer token
  if (!token) {
    ctx.status = 401;
    ctx.body = { error: 'No token provided' };
    console.error('No token provided');
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ctx.state.user = decoded; // 关键：将用户信息挂载到 state
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
    console.error('Invalid token:', err);
  }
};