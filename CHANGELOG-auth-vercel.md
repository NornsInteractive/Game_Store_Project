# Vercel 环境屏蔽登录/管理功能

## 判断依据

Vercel 平台会自动注入 `process.env.VERCEL` 环境变量，以此区分本地和线上环境。

## 修改文件

### 1. `middleware/auth.js`

新增 `res.locals.authEnabled = !process.env.VERCEL`，供模板判断是否渲染登录按钮。

### 2. `views/partials/navbar.ejs`

登录按钮的显示条件从 `else` 改为 `else if (authEnabled)`：

```ejs
<% if (currentUser) { %>
  <!-- admin / logout 链接 -->
<% } else if (authEnabled) { %>
  <!-- 登录按钮 -->
<% } %>
```

### 3. `routes/auth.js`

在路由顶部增加中间件，Vercel 环境下 `/login`、`/logout` 返回 404：

```js
router.use(['/login', '/logout'], (req, res, next) => {
  if (process.env.VERCEL) {
    return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404, message: 'Page not found.' });
  }
  next();
});
```

### 4. `routes/admin.js`

在路由顶部增加中间件，Vercel 环境下所有 `/admin` 路由返回 404：

```js
router.use((req, res, next) => {
  if (process.env.VERCEL) {
    return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404, message: 'Page not found.' });
  }
  next();
});
```

## 如何还原

1. `middleware/auth.js` — 删除 `res.locals.authEnabled` 那一行
2. `views/partials/navbar.ejs` — 把 `else if (authEnabled)` 改回 `else`
3. `routes/auth.js` — 删除 `router.use(['/login', '/logout'], ...)` 中间件
4. `routes/admin.js` — 删除 `router.use(...)` 中间件
