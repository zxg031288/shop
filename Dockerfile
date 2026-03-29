# ===== 多阶段构建 Dockerfile =====
# 阶段1: 构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 阶段2: 构建后端依赖
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production

# 阶段3: 最终运行镜像
FROM node:20-alpine
WORKDIR /app

# 安装 dumb-init (优雅停机)
RUN apk add --no-cache dumb-init

# 从阶段2复制依赖
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ ./backend/

# 创建数据目录
RUN mkdir -p /data /app/uploads /app/screenshots

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 复制支付二维码图片（客户提供的收款码）
COPY play/ ./play/

# 设置环境变量
ENV NODE_ENV=production
ENV DB_PATH=/data/shop.db
ENV UPLOAD_DIR=/app/uploads
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/src/index.js"]
