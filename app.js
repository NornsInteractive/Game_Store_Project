require('dotenv').config();
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const { initDb, getDb } = require('./database/connection');
const { ensureSeedData } = require('./database/bootstrap');
const SqliteSessionStore = require('./database/session-store');
const { setLocals } = require('./middleware/auth');
const i18n = require('./middleware/i18n');
const { notFound, globalError } = require('./middleware/error-handler');

let appPromise = null;

async function createServer() {
  if (appPromise) {
    return appPromise;
  }

  appPromise = (async () => {
    await initDb();
    await ensureSeedData();

    const app = express();
    const port = process.env.PORT || 3000;

    app.set('trust proxy', 1);
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.set('layout', 'layouts/main');

    app.use(expressLayouts);
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(
      session({
        store: new SqliteSessionStore({ db: getDb() }),
        secret: process.env.SESSION_SECRET || 'cyberpulse-default-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      })
    );
    app.use(i18n);
    app.use(setLocals);

    app.use('/', require('./routes/index'));
    app.use('/', require('./routes/auth'));
    app.use('/', require('./routes/games'));
    app.use('/', require('./routes/news'));
    app.use('/', require('./routes/comments'));
    app.use('/dashboard', require('./routes/user'));
    app.use('/admin', require('./routes/admin'));
    app.use('/api', require('./routes/api'));

    app.use(notFound);
    app.use(globalError);

    return { app, port };
  })();

  return appPromise;
}

module.exports = { createServer };
