CREATE DATABASE IF NOT EXISTS im_db 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE im_db;

CREATE TABLE `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名，唯一索引',
    `password_hash` CHAR(60) NOT NULL COMMENT '密码哈希值 (bcrypt)',
    `nickname` VARCHAR(50) NULL COMMENT '用户昵称',
    `avatar` VARCHAR(255) NULL DEFAULT 'default_avatar_url' COMMENT '头像URL',
    `email` VARCHAR(100) NULL COMMENT '邮箱',
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '用户状态 1-正常 0-禁用',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';