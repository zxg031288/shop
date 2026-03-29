# 月芽湾湾日本淘 · 产品设计文档

> 版本：v1.2 | 日期：2026-03-29 | 品牌：月芽湾湾日本淘

---

## 一、项目概述

### 1.1 产品定位

一个面向个人代购商家的小型海外代购平台。商家通过拍照上传商品（价格/库存/快递费/描述/图片），买家像淘宝一样浏览、加购物车、结算，支持微信和支付宝收款。

**核心原则：简单、够用、不复杂。**

### 1.2 目标用户

| 角色 | 描述 |
|------|------|
| 代购商家（Admin） | 个人代购卖家，需要快速上架商品、管理订单 |
| 买家（Buyer） | 需要购买海外商品的消费者，注重价格和正品保障 |

### 1.3 核心功能（极简版）

```
商家端：拍照上传商品 → 管理商品 → 处理订单 → 查看数据
买家端：浏览商品 → 加入购物车 → 结算 → 微信/支付宝支付
```

---

## 二、功能设计

### 2.1 商家后台（PC 端）

#### 2.1.1 上传商品（核心功能）

商家通过**拍照**上传商品，支持同时上传多张图片（最多6张）。

| 字段 | 说明 | 必填 |
|------|------|------|
| 商品图片 | 拍照或从相册选择，支持 JPG/PNG | ✅ |
| 商品名称 | 如：澳洲 Aesop 护肤套装 | ✅ |
| 商品分类 | 美妆护肤 / 包包 / 鞋履 / 手表 / 保健品 / 服饰 / 其他 | ✅ |
| 售价 (¥) | 人民币定价 | ✅ |
| 库存数量 | 整数 | ✅ |
| 国际运费 (¥) | 每件固定运费（简化版不按重量计费） | ❌（默认 0） |
| 商品产地 | 澳大利亚 / 美国 / 英国 / 日本 / 法国 / 德国 / 瑞典 | ❌（默认 澳大利亚） |
| 商品描述 | 描述商品特点、规格、使用方法等 | ❌ |

> **简化设计**：不涉及多语言、货币换算、进货成本管理，只做最核心的"拍照卖货"。

#### 2.1.2 商品管理

| 功能 | 说明 |
|------|------|
| 商品列表 | 展示所有商品（名称、价格、库存、运费、状态） |
| 搜索/筛选 | 按名称、分类搜索 |
| 编辑商品 | 修改任意字段 |
| 上下架 | 在售 / 售罄 / 下架 |

库存状态规则：
- 库存 > 5：在售
- 库存 1~5：库存紧张（橙色提示）
- 库存 = 0：售罄（灰色）

#### 2.1.3 订单管理

| 功能 | 说明 |
|------|------|
| 订单列表 | 全部 / 待支付 / 待发货 / 已发货 / 已完成 |
| 查看详情 | 收货人信息、商品明细、支付方式、支付流水号、支付截图 |
| 确认收款 | 商家审核买家的支付凭证后，手动确认收款 |
| 标记发货 | 手动操作（简化版无物流追踪） |
| 导出 Excel | 销售记录导出（包含完整交易信息、支付凭证） |

订单状态流转：

```
待支付(pending) → 已付款(paid) → 已发货(shipped) → 已完成(done)
```

> 买家提交订单后状态为 `pending`，商家确认支付凭证后改为 `paid`，然后发货。

#### 2.1.4 数据概览

- 今日订单数 & 较昨日变化
- 今日营收 & 较昨日变化
- 在售商品数 & 库存预警
- 待发货订单数
- 本月营收 / 订单数 / 客单价 / 复购率
- TOP 5 热卖商品

### 2.2 买家前端（H5 移动端）

#### 2.2.1 首页

| 模块 | 说明 |
|------|------|
| 顶部导航 | Logo + 搜索框 + 购物车入口 |
| 分类导航 | 横向滑动分类标签 |
| 促销 Banner | 展示活动（可由商家在后台配置） |
| 商品网格 | 双列瀑布流展示商品卡片 |
| 底部导航 | 首页 / 发现 / 购物车 / 我的 |

#### 2.2.2 商品详情页

| 模块 | 说明 |
|------|------|
| 商品图片轮播 | 多图可左右滑动 |
| 价格 + 运费 | 醒目展示 |
| 商品名称 | 大字标题 |
| 产地 / 库存 / 销量 | 元数据标签 |
| 数量选择器 | +1 / -1 操作 |
| 商品描述 | 富文本展示 |
| 操作栏 | 加入购物车 / 立即购买 |

#### 2.2.3 购物车页

| 功能 | 说明 |
|------|------|
| 商品列表 | 图片 + 名称 + 单价 + 数量调整 + 删除 |
| 数量增减 | 实时更新总价 |
| 费用汇总 | 商品合计 + 运费合计 + 总计 |
| 结算按钮 | 跳转到结算页 |

#### 2.2.4 结算页（确认订单）

| 模块 | 说明 |
|------|------|
| 收货地址 | 手动输入（简化版不做地址簿管理） |
| 商品清单 | 展示购物车选中商品 |
| 支付方式 | 微信支付 / 支付宝（单选） |
| 费用明细 | 商品金额 + 国际运费 + 代购服务费 + 实付款 |
| 支付按钮 | 唤起支付 |

> **简化设计**：不接入真实微信/支付宝支付 SDK，使用**模拟支付**演示流程。
> 真实接入方案见"支付接入方案"章节。

#### 2.2.5 支付成功页

- 展示订单号
- 预计送达时间提示
- 继续购物按钮

#### 2.2.6 我的（个人中心）

简化版仅展示：
- 用户头像和昵称（可编辑）
- 我的订单入口（待付款 / 待发货 / 已发货 / 已完成）

---

## 三、技术架构

### 3.1 技术栈选择（极简优先）

| 层级 | 技术选型 | 选型理由 |
|------|---------|---------|
| **前端** | React + Vite | 轻量、快速构建现代 Web 应用 |
| **移动端 H5** | React（响应式） | 一套代码适配手机浏览器 |
| **后端** | Node.js + Express | 轻量、JS 同构、学习成本低 |
| **数据库** | SQLite | 零配置、单文件、够用，适合个人项目 |
| **图片存储** | 本地文件系统（`/uploads`） | 简化方案，不引入 OSS |
| **支付** | 沙箱模拟（演示用） | 真实接入见 3.4 |
| **部署** | Docker + Docker Compose | 一键部署，跨平台 |
| **反向代理** | Nginx | 静态资源服务 + API 代理 |

### 3.2 系统架构图

```
                        ┌─────────────────────┐
                        │      Nginx          │
                        │  (反向代理 + 静态)    │
                        └────────┬────────────┘
                                 │
              ┌─────────────────┴─────────────────┐
              │                                   │
    ┌─────────▼──────────┐             ┌──────────▼──────────┐
    │   前端 (React H5)   │             │   后端 (Node.js)     │
    │   localhost:5173    │             │   localhost:3000     │
    │   买家移动端 H5      │             │   REST API           │
    └─────────────────────┘             └──────────┬──────────┘
                                                   │
                                      ┌────────────┴────────────┐
                                      │                         │
                            ┌──────────▼──────────┐  ┌─────────▼─────────┐
                            │   SQLite 数据库     │  │  商家后台（端口3001）│
                            │   /data/shop.db    │  │  admin-server.js  │
                            └─────────────────────┘  └───────────────────┘
```

### 3.3 部署架构（Docker）

```
宿主机 (你的服务器/VPS)
├── Docker
│   ├── nginx (容器)
│   │     端口: 80, 443
│   ├── frontend (React build, Nginx serve)
│   │     端口: 内部 80
│   └── backend (Node.js + Express)
│         端口: 内部 3000
│
└── 数据持久化目录 (宿主机)
    ├── ./data/shop.db        (SQLite 数据库)
    ├── ./uploads/            (商品图片)
    └── ./logs/               (日志)
```

### 3.4 支付接入方案

> 由于微信支付和支付宝的**商家资质申请**（需要营业执照等）需要时间，
> 本项目采用**分阶段接入**方案：

#### 阶段一：扫码支付演示（当前版本）

- 买家提交订单 → 弹出收款二维码（微信/支付宝）
- 买家扫码支付后 → 填写支付流水号或上传支付截图
- 商家在后台审核凭证 → 确认收款 → 订单变为 `paid` → 发货
- 支持导出 Excel 销售记录（含支付凭证信息）

#### 阶段二：真实接入（后续）

| 支付方式 | 接入方式 | 资质要求 |
|---------|---------|---------|
| 微信支付 | V3 JSAPI / H5 支付 | 需要微信商户号（企业/个体工商户） |
| 支付宝 | 当面付 / 手机网站支付 | 需要支付宝商户号（企业/个体工商户） |

> **个人代购建议**：可以考虑 [Xorpay](https://xorpay.com)、[PaymentSpring](https://www.paymentspring.com) 等第三方聚合支付平台，个人即可接入，支持微信/支付宝。

---

## 四、数据库设计（极简）

### 4.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   products  │       │    orders   │       │ order_items │
│  (商品表)    │       │  (订单表)    │       │ (订单明细)   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ name        │       │ order_no    │──────<│ order_id    │
│ category    │       │ buyer_name   │       │ product_id  │──> products
│ price       │       │ buyer_phone │       │ quantity    │
│ stock       │       │ buyer_addr  │       │ price       │
│ shipping    │       │ status      │       │ shipping    │
│ origin      │       │ pay_method  │       └─────────────┘
│ description │       │ total_amount│
│ images      │       │ created_at  │
│ status      │       └─────────────┘
│ created_at  │
└─────────────┘

┌─────────────┐
│   carts     │
│  (购物车)    │
├─────────────┤
│ id          │
│ session_id  │
│ product_id  │──> products
│ quantity    │
│ added_at    │
└─────────────┘
```

### 4.2 详细表结构

#### products（商品表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增 ID |
| name | TEXT NOT NULL | 商品名称 |
| category | TEXT | 分类 |
| price | REAL NOT NULL | 售价（人民币，元） |
| stock | INTEGER DEFAULT 0 | 库存数量 |
| shipping | REAL DEFAULT 0 | 每件国际运费（元） |
| origin | TEXT | 产地 |
| description | TEXT | 商品描述 |
| images | TEXT | 图片路径，JSON 数组，如 `["/uploads/1.jpg","/uploads/2.jpg"]` |
| status | TEXT DEFAULT 'active' | active=在售, off=下架 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### orders（订单表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增 ID |
| order_no | TEXT UNIQUE | 订单号，如 HT2024032800088 |
| buyer_name | TEXT | 收货人姓名 |
| buyer_phone | TEXT | 收货人电话 |
| buyer_addr | TEXT | 收货地址 |
| status | TEXT DEFAULT 'pending' | pending=待支付, paid=已付款, shipped=已发货, done=已完成 |
| pay_transaction_id | TEXT | 买家填写的支付流水号 |
| pay_screenshot | TEXT | 买家上传的支付截图 URL |
| pay_method | TEXT | wechat/alipay |
| total_amount | REAL | 实付总额（商品+运费） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### order_items（订单明细表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增 ID |
| order_id | INTEGER | 关联 orders.id |
| product_id | INTEGER | 关联 products.id |
| product_name | TEXT | 商品名称快照（下单时的值） |
| product_image | TEXT | 商品图片快照 |
| quantity | INTEGER | 购买数量 |
| price | REAL | 单价快照 |
| shipping | REAL | 运费快照 |

#### carts（购物车表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 自增 ID |
| session_id | TEXT | 浏览器会话 ID（简化版替代用户体系） |
| product_id | INTEGER | 关联 products.id |
| quantity | INTEGER DEFAULT 1 | 数量 |
| created_at | DATETIME | 加入时间 |

---

## 五、API 设计

### 5.1 基础规范

- 协议：HTTP / REST
- 数据格式：JSON
- Base URL：`/api/v1`
- 认证方式：Session ID（简化版，存 Cookie）

### 5.2 API 列表

#### 买家端 API

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| GET | `/products` | 商品列表（支持 category/keyword 筛选） | - |
| GET | `/products/:id` | 商品详情 | - |
| GET | `/categories` | 分类列表 | - |
| GET | `/cart` | 获取购物车 | - |
| POST | `/cart` | 加入购物车 | `{product_id, quantity}` |
| PUT | `/cart/:id` | 更新数量 | `{quantity}` |
| DELETE | `/cart/:id` | 删除购物车项 | - |
| DELETE | `/cart` | 清空购物车 | - |
| POST | `/orders` | 创建订单 | `{buyer_name, buyer_phone, buyer_addr, pay_method}` |
| GET | `/orders` | 我的订单列表 | - |
| GET | `/orders/:id` | 订单详情 | - |
| PUT | `/orders/:id/ship` | 商家发货（前端演示用） | `{status}` |

#### 商家端 API

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | `/admin/products` | 上传商品（含图片） | FormData |
| PUT | `/admin/products/:id` | 编辑商品 | FormData |
| PUT | `/admin/products/:id/status` | 上下架 | `{status}` |
| DELETE | `/admin/products/:id` | 删除商品 | - |
| POST | `/admin/orders/:id/ship` | 标记发货 | `{status}` |
| GET | `/admin/stats` | 数据概览统计 | - |
| POST | `/admin/login` | 商家登录 | `{username, password}` |

### 5.3 响应格式

成功：
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

失败：
```json
{
  "code": 400,
  "message": "库存不足",
  "data": null
}
```

---

## 六、项目结构

```
shop/
├── README.md                  # 项目说明
├── docker-compose.yml         # Docker Compose 配置
├── Dockerfile                 # 多阶段构建 Dockerfile
├── nginx.conf                 # Nginx 配置
│
├── frontend/                  # 前端（React + Vite）
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── pages/
│       │   ├── Home.tsx           # 首页
│       │   ├── ProductDetail.tsx  # 商品详情
│       │   ├── Cart.tsx           # 购物车
│       │   ├── Checkout.tsx      # 结算
│       │   ├── OrderSuccess.tsx   # 支付成功
│       │   ├── MyOrders.tsx       # 我的订单
│       │   └── admin/
│       │       ├── Dashboard.tsx  # 数据概览
│       │       ├── ProductUpload.tsx # 上传商品
│       │       ├── ProductList.tsx  # 商品管理
│       │       └── OrderList.tsx    # 订单管理
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── ProductCard.tsx
│       │   ├── CartItem.tsx
│       │   └── BottomNav.tsx
│       ├── api/
│       │   └── index.ts           # API 请求封装
│       ├── hooks/
│       │   └── useCart.ts         # 购物车状态管理
│       └── styles/
│           └── global.css
│
├── backend/                  # 后端（Node.js + Express）
│   ├── package.json
│   ├── src/
│   │   ├── index.js            # 入口文件
│   │   ├── db/
│   │   │   ├── init.js         # 数据库初始化
│   │   │   └── schema.sql      # 建表 SQL
│   │   ├── routes/
│   │   │   ├── products.js     # 商品相关 API
│   │   │   ├── cart.js         # 购物车 API
│   │   │   ├── orders.js       # 订单 API
│   │   │   └── admin.js        # 商家管理 API
│   │   ├── middleware/
│   │   │   └── upload.js       # 图片上传中间件
│   │   └── utils/
│   │       └── orderNo.js     # 订单号生成
│   └── uploads/                # 图片上传目录（容器内）
│
└── data/                      # 数据持久化目录（宿主机挂载）
    ├── shop.db                # SQLite 数据库文件
    └── uploads/               # 商品图片（宿主机挂载）
```

---

## 七、Docker 部署方案

### 7.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # Nginx 反向代理 + 静态资源
  nginx:
    image: nginx:alpine
    container_name: shop-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./data/uploads:/usr/share/nginx/uploads:ro
    depends_on:
      - backend
    restart: unless-stopped

  # 后端 API 服务
  backend:
    image: node:20-alpine
    container_name: shop-backend
    working_dir: /app
    volumes:
      - ./backend:/app
      - ./data:/data
      - ./data/uploads:/app/uploads
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_PATH=/data/shop.db
      - UPLOAD_DIR=/app/uploads
      - PORT=3000
    command: sh -c "npm install --production && node src/index.js"
    restart: unless-stopped

networks:
  default:
    name: shop-network
```

### 7.2 nginx.conf 关键配置

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # 静态资源（前端）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 图片资源
    location /uploads/ {
        alias /usr/share/nginx/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://shop-backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 7.3 部署步骤

```bash
# 1. 服务器安装 Docker（如果未安装）
curl -fsSL https://get.docker.com | bash

# 2. 上传项目到服务器
scp -r shop/ root@your-server:/opt/shop

# 3. SSH 登录服务器
ssh root@your-server

# 4. 进入项目目录
cd /opt/shop

# 5. 构建并启动
docker-compose up -d --build

# 6. 查看日志
docker-compose logs -f

# 7. 访问
# 前端：http://your-server-ip
# 后端 API：http://your-server-ip/api/v1/products
```

---

## 八、里程碑计划

| 阶段 | 内容 | 预计工时 |
|------|------|---------|
| **Phase 1** | 基础框架搭建（前端 + 后端 + 数据库 + Docker） | 4h |
| **Phase 2** | 商家功能：上传商品 + 商品管理 | 6h |
| **Phase 3** | 买家功能：浏览 + 详情 + 购物车 | 6h |
| **Phase 4** | 买家功能：结算 + 订单 + 模拟支付 | 4h |
| **Phase 5** | 商家功能：订单管理 + 数据概览 | 4h |
| **Phase 6** | 样式美化 + 响应式适配 + Bug 修复 | 4h |
| **Phase 7** | Docker 部署 + 域名配置 + HTTPS | 2h |

> **总工时估算**：约 30 小时（单人）

---

## 九、风险与注意事项

1. **图片存储**：当前方案使用本地文件系统，单服务器足够。如果未来图片量超过 1 万张，建议迁移到对象存储（阿里云 OSS / 腾讯云 COS），成本约 0.12 元/GB/月。

2. **支付合规**：微信/支付宝必须要有商户资质才能接入真实支付。建议先使用沙箱演示，等店铺流水上来后申请商户号。

3. **数据库**：SQLite 适合单机部署。如需多实例部署，需迁移到 MySQL/PostgreSQL。

4. **移动端适配**：前端使用响应式 CSS 设计，移动端 H5 体验流畅即可，不需要独立开发小程序/App。

---

## 十、UI 设计参考（基于原型）

你的 HTML 原型已经非常完善，以下是实现时的 UI 原则：

- **配色**：主色 #FF4B2B（活力橙红），辅助色 #FF6B35
- **字体**：中文使用 Noto Sans SC，英文/数字使用 DM Sans
- **买家端**：手机 H5 布局，底部 Tab 导航，瀑布流商品卡片
- **商家端**：PC 管理后台，侧边导航，数据卡片 + 表格布局
- **交互**：加入购物车动画、数量增减、支付成功反馈

---

> 文档版本：v1.0 | 编写日期：2026-03-28
