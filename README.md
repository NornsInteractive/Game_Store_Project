# CyberPulse Game Store

一个基于 `Node.js + Express + EJS + sql.js` 的游戏销售网站原型项目，风格参考 `stitch_game_portal_publishing_system` 目录中的模板，包含首页、游戏列表、游戏详情、新闻文章、用户登录注册、用户中心、后台管理等页面。

## 功能概览

- 首页、游戏列表、游戏详情页
- 新闻列表、新闻详情页
- 用户注册、登录、登出
- 用户中心、资料页、游戏提交页
- 后台管理页
- 评论、评分、基础内容管理
- 自动注入演示数据，启动后可直接预览

## 技术栈

- `Express`：Web 服务框架
- `EJS` + `express-ejs-layouts`：服务端模板渲染
- `express-session`：登录会话
- `sql.js`：SQLite 的内存/文件模式封装
- `bcryptjs`：密码哈希
- `multer`：图片上传
- `Tailwind CSS CDN`：页面样式

## 项目结构

```text
Game_Store_Project/
├─ api/                              # Vercel Serverless 入口
│  └─ index.js
├─ database/                         # 数据库连接、结构、演示数据
│  ├─ bootstrap.js                   # 启动时补齐演示数据
│  ├─ connection.js                  # sql.js 封装
│  ├─ schema.sql                     # 表结构定义
│  ├─ seed.js                        # 重置并写入演示数据
│  ├─ session-store.js               # session 存储
│  └─ store.db                       # 本地数据库文件
├─ middleware/                       # 中间件
│  ├─ auth.js
│  ├─ error-handler.js
│  └─ upload.js
├─ models/                           # 数据访问层
├─ public/                           # 静态资源
│  ├─ css/
│  └─ js/
├─ routes/                           # 路由层
│  ├─ admin.js
│  ├─ api.js
│  ├─ auth.js
│  ├─ comments.js
│  ├─ games.js
│  ├─ index.js
│  ├─ news.js
│  └─ user.js
├─ stitch_game_portal_publishing_system/  # 参考模板，不参与运行
├─ views/                            # EJS 页面与布局
│  ├─ layouts/
│  ├─ pages/
│  └─ partials/
├─ app.js                            # Express 应用工厂
├─ server.js                         # 本地 Node 启动入口
├─ vercel.json                       # Vercel 重写配置
├─ package.json
└─ README.md
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

项目根目录下创建或修改 `.env`：

```env
PORT=3000
SESSION_SECRET=replace-with-a-strong-secret
DATABASE_PATH=./database/store.db
```

说明：

- `SESSION_SECRET` 建议改成你自己的随机字符串
- `DATABASE_PATH` 不填时会使用默认值
- 在 Vercel / Cloudflare 这类无状态环境中，数据库默认会落到临时目录

### 3. 启动项目

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

### 4. 重置演示数据

```bash
npm run seed
```

默认管理员账号：

```text
邮箱：admin@cyberpulse.sys
密码：admin123
```

## 运行机制说明

项目在启动时会执行 `database/bootstrap.js` 中的 `ensureSeedData()`：

- 如果数据库为空，会自动写入演示用户、游戏、文章、评论和评分
- 如果数据库已有内容，则不会重复插入
- 本地开发可以依赖这个机制快速看到完整页面

## 部署方法

## 方案一：Vercel 直接部署

这是当前项目最适合的“直接可用”部署方式。

### 已完成的适配

- `api/index.js` 作为 Vercel Serverless 入口
- `vercel.json` 将所有请求重写到 `api/index`
- `app.js` 采用工厂模式，兼容本地启动和 Serverless 调用

### 部署步骤

1. 将项目推送到 GitHub
2. 在 Vercel 中导入该仓库
3. Framework Preset 选择 `Other`
4. Build Command 留空或使用默认
5. Output Directory 留空
6. 在环境变量中至少配置：

```text
SESSION_SECRET=your-production-secret
NODE_ENV=production
```

7. 点击部署

### 注意事项

- 当前数据库基于 `sql.js`，在 Vercel 中属于“无状态/临时存储”
- 会话和后台新增内容不适合作为长期持久化生产数据
- 项目适合原型演示、视觉展示、流程验证
- 如果要正式商用，建议迁移数据库到 `Postgres / Turso / D1 / Supabase`

## 方案二：传统 Node.js 服务器部署

如果你有自己的 Linux 服务器、云主机或宝塔环境，可以直接按普通 Node 项目部署。

### 步骤

1. 上传项目代码
2. 安装 Node.js 20+
3. 安装依赖

```bash
npm install
```

4. 配置环境变量
5. 启动服务

```bash
npm run start
```

6. 使用 `Nginx` 反向代理到 Node 端口
7. 建议使用 `pm2` 守护进程

例如：

```bash
pm2 start server.js --name cyberpulse
pm2 save
```

### 优点

- 比 Serverless 更适合当前这套 `session + 文件数据库` 结构
- 本地数据库和会话更稳定
- 更适合继续开发后台功能

## 方案三：Cloudflare Pages

当前项目**不能原样直接部署到 Cloudflare Pages 并完整运行**，原因是：

- Cloudflare Pages 主要面向静态站点和 Functions
- 当前项目是标准 Express 服务器
- 使用了 `express-session`
- 使用了 `sql.js` 文件写入与 Node 文件系统

这些都和 Pages/Workers 的运行模型不完全一致。

### 如果一定要部署到 Cloudflare

需要做二次改造，通常包括：

- 将 Express 迁移到 `Cloudflare Workers` 兼容方案
- 将 session 改为 `JWT` 或 KV / D1 方案
- 将数据库迁移到 `Cloudflare D1`
- 将上传改成 `R2` 或第三方对象存储

结论：

- `Vercel`：当前项目可以直接部署演示版
- `Cloudflare Pages`：需要改造后再部署

## 上传与存储说明

当前上传逻辑在 `middleware/upload.js` 中使用内存方式处理文件，并将图片以 Data URL 形式写入数据库字段。

这样做的目的：

- 避免 Serverless 环境下依赖本地上传目录
- 让演示项目在 Vercel 中也能显示上传后的图片

缺点：

- 不适合大文件
- 不适合正式生产环境
- 数据库体积会快速膨胀

正式上线建议：

- 图片上传到 `Cloudinary / S3 / R2`
- 数据库里只保存图片 URL

## 后续建议

如果你准备继续把这个原型做成正式可上线产品，下一步建议优先处理：

1. 把数据库从 `sql.js` 迁移到真正持久化的云数据库
2. 把 session 改为更适合云部署的方案
3. 把上传改为对象存储
4. 为后台表单补上更严格的校验
5. 补充购买、订单、支付、库存等正式商城能力

## 许可与素材说明

- `stitch_game_portal_publishing_system` 用于页面风格和结构参考
- 其中的模板资源请按你的实际授权情况使用

