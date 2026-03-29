// controllers/file.js
const pool = require('../config/db');
const fileModel = require('../models/file');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const uploadDir = require('../middlewares/upload').uploadDirThumb; // 新增：从中间件获取缩略图目录

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

async function uploadFile(ctx) {
  const file = ctx.file;
  if (!file) {
    ctx.status = 400;
    ctx.body = { success: false, error: '没有上传文件' };
    return;
  }

  const userId = ctx.state.user.id; // 从 JWT 中获取
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const fileUrl = `${baseUrl}/uploads/file/${file.filename}`;
  let thumbnailUrl = '';

    // 确保 thumb 目录存在
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (file.mimetype.startsWith('image/')) {
    const thumbnailPath = path.join(uploadDir, 'thumb_' + file.filename);
    await sharp(file.path)
      .resize(200, 200, { fit: 'cover' })
      .toFile(thumbnailPath);
    thumbnailUrl = `${baseUrl}/uploads/thumb/thumb_${file.filename}`;
  } else if (file.mimetype.startsWith('video/')) {
    // 提取第一帧
    const thumbnailPath = path.join(uploadDir, 'thumb_' + file.filename + '.jpg');
    await new Promise((resolve, reject) => {
      ffmpeg(file.path)
        .on('end', resolve)
        .on('error', reject)
        .screenshots({
          count: 1,
          folder: uploadDir,
          filename: 'thumb_' + file.filename + '.jpg',
          size: '200x200'
        });
    });
    thumbnailUrl = `${baseUrl}/thumb/thumb_${file.filename}.jpg`;
  }


  try {
    // 插入 files 表
    const fileId = await fileModel.uploadFile({
      user_id: userId,
      url: fileUrl,
      name: file.originalname,
      size: file.size,
      mime_type: file.mimetype,
      thumbnail_url: thumbnailUrl
    });

    ctx.body = {
      success: true,
      data: {
        fileId,
        url: fileUrl,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        thumbnailUrl
      }
    };
  } catch (err) {
    console.error('文件上传数据库错误:', err);
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };
  }
};

module.exports = {
  uploadFile
}