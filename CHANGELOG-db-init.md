# 数据库初始化逻辑修改记录

## 修改文件

`database/connection.js` — `initDb()` 函数

## 修改前代码

```js
async function initDb() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await loadSqlJs();
    // Load existing DB or create new one
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
```

## 修改后代码

```js
async function initDb() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await loadSqlJs();
    // On serverless platforms, copy bundled db to tmp if not already there
    const bundledDbPath = path.join(__dirname, 'store.db');
    if (!fs.existsSync(DB_PATH) && DB_PATH !== bundledDbPath && fs.existsSync(bundledDbPath)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.copyFileSync(bundledDbPath, DB_PATH);
    }
    // Load existing DB or create new one
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
```

## 修改原因

Vercel 等 Serverless 平台上 `DB_PATH` 指向 `os.tmpdir()`，冷启动时该路径下没有数据库文件，导致每次都创建空库再 seed demo 数据，本地提交的 `store.db` 没有被使用。

新增的逻辑会在临时目录没有数据库时，从部署包中的 `database/store.db` 复制一份过去。

## 如何还原

删除这几行即可恢复原始行为：

```js
    // On serverless platforms, copy bundled db to tmp if not already there
    const bundledDbPath = path.join(__dirname, 'store.db');
    if (!fs.existsSync(DB_PATH) && DB_PATH !== bundledDbPath && fs.existsSync(bundledDbPath)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.copyFileSync(bundledDbPath, DB_PATH);
    }
```
