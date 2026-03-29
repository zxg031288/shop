# 月芽湾湾日本淘 (Shop)

一个极简的海外代购平台，支持商家拍照上传商品、买家购物车结算、微信/支付宝扫码支付。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + TypeScript |
| 后端 | Node.js + Express |
| 数据库 | SQLite |
| 部署 | Docker + Docker Compose |

## 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/zxg031288/shop.git
cd shop

# 2. 启动服务（会自动构建）
docker-compose up -d --build

# 3. 访问
# 前端: http://localhost
# 后端 API: http://localhost/api/v1/products
# 商家管理: http://localhost:3001/admin
```

### 方式二：本地开发

```bash
# 前端
cd frontend && npm install && npm run dev

# 后端（新开终端）
cd backend && npm install && npm start

# 商家管理（独立端口，可选）
cd backend && npm run admin
```

## 项目结构

```
shop/
├── frontend/          # React 前端
├── backend/           # Node.js 后端
│   └── src/
│       ├── index.js   # 主 API 服务 (端口 3000)
│       └── admin-server.js  # 商家管理服务 (端口 3001)
├── data/              # 数据目录（SQLite + 图片 + 支付截图）
├── play/              # 支付二维码图片
├── docker-compose.yml # Docker 编排
├── nginx.conf         # Nginx 配置
└── SPEC.md            # 产品设计文档
```

## 功能概览

- [x] **商家后台（月芽湾湾）**：拍照上传商品 / 商品管理 / 订单管理（含支付凭证审核）/ 数据概览
- [x] **买家前端（月芽湾湾日本淘）**：商品浏览 / 商品详情 / 购物车 / 结算 / 扫码支付
- [x] 微信 / 支付宝扫码支付（客户扫码 → 填写支付流水号/上传截图 → 商家确认）
- [x] 买家账号注册与登录
- [x] 收货地址管理（含地图定位）
- [x] 销售记录导出 Excel（含支付流水号、支付截图、商品明细）
- [x] Docker 一键部署

## 商家管理入口

买家端「我的」页面**不提供**商家入口；请直接在浏览器打开商家后台端口：

- 本地：`http://localhost:3001/admin`（需先 `cd backend && npm run admin`，并与主服务 `npm start` 同时运行）
- Docker：同上，将主机端口映射到容器 `3001` 后访问 `http://<主机>:3001/admin`
- 默认账号：`admin` / `admin123`

商家后台侧栏 **「首页活动」** 可编辑买家首页橙色活动条文案与可选跳转链接。

## 支付接入

当前为**扫码支付演示模式**：
1. 买家提交订单后，弹出收款二维码
2. 买家使用微信/支付宝扫码支付
3. 填写支付流水号或上传支付截图
4. 商家在后台确认收款后，订单生效并等待发货

真实接入需申请微信/支付宝商户号。

## 账号说明

### 买家账号
- 注册地址：`/register`
- 登录地址：`/login`
- 支持管理多个收货地址（含地图定位）

### 商家账号
- 入口：`/admin/login`
- 默认：`admin` / `admin123`
