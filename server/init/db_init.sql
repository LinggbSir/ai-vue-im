-- 创建数据库
CREATE DATABASE IF NOT EXISTS im_db 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 切换到目标数据库
USE im_db;

-- 删除旧表（按依赖顺序：先删 messages，再删 sessions，最后删其他）
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password_hash` CHAR(60) NOT NULL COMMENT '密码哈希',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `signature` VARCHAR(100) DEFAULT NULL COMMENT '个性签名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1-正常 0-禁用',
  `last_active_at` TIMESTAMP NULL COMMENT '最后在线时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 好友关系表
CREATE TABLE `friends` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `friend_id` INT UNSIGNED NOT NULL COMMENT '好友ID',
  `remark` VARCHAR(50) DEFAULT NULL COMMENT '好友备注',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0-待确认 1-已同意 2-拉黑 3-删除',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_friend` (`user_id`, `friend_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_friend_id` (`friend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 群聊表
CREATE TABLE `groups` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '群名称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '群头像',
  `owner_id` INT UNSIGNED NOT NULL COMMENT '群主ID',
  `notice` VARCHAR(200) DEFAULT NULL COMMENT '群公告',
  `max_members` SMALLINT DEFAULT 200 COMMENT '最大成员数',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 群聊成员表
CREATE TABLE `group_members` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` TINYINT NOT NULL DEFAULT 0 COMMENT '0-普通成员 1-管理员 2-群主',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '群内昵称',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 会话表
CREATE TABLE `sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `session_id` VARCHAR(50) NOT NULL COMMENT '公共会话ID，私聊为"较小ID_较大ID"，群聊为群组ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `target_id` INT UNSIGNED NOT NULL COMMENT '会话目标ID（好友ID或群ID）',
  `type` TINYINT NOT NULL DEFAULT 0 COMMENT '会话类型：0-私聊，1-群聊',
  `display` TINYINT NOT NULL DEFAULT 1 COMMENT '是否在会话列表显示：1-显示，0-隐藏',
  `last_read_msg_id` BIGINT UNSIGNED DEFAULT 0 COMMENT '该用户最后阅读的消息ID',
  `last_msg_time` TIMESTAMP NULL COMMENT '会话最后一条消息的时间（冗余，用于排序）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '会话创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_user` (`session_id`, `user_id`) COMMENT '每个用户在每个会话中只有一条记录',
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会话关系表';

-- 消息表（注意 session_id 改为 VARCHAR(50) 以匹配 sessions 表的公共标识）
CREATE TABLE `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(50) NOT NULL COMMENT '公共会话ID，与sessions.session_id一致',
  `sender_id` INT UNSIGNED NOT NULL COMMENT '发送者ID',
  `receiver_type` TINYINT NOT NULL COMMENT '0-私聊 1-群聊',
  `receiver_id` INT UNSIGNED NOT NULL COMMENT '接收方ID（好友ID或群ID）',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `type` TINYINT NOT NULL DEFAULT 0 COMMENT '消息类型：0-文本 1-图片 2-文件 3-撤回消息',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0-发送失败 1-发送成功 2-撤回',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id_type` (`receiver_id`, `receiver_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_session_time` (`session_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;