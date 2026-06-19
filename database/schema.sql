CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY,
    username        TEXT    NOT NULL UNIQUE,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    display_name    TEXT,
    avatar          TEXT    DEFAULT '/uploads/avatars/default.png',
    bio             TEXT,
    role            TEXT    NOT NULL DEFAULT 'admin',
    banned_at       TEXT,
    last_login_at   TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id              INTEGER PRIMARY KEY,
    name            TEXT    NOT NULL UNIQUE,
    slug            TEXT    NOT NULL UNIQUE,
    type            TEXT    NOT NULL DEFAULT 'game',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS games (
    id                INTEGER PRIMARY KEY,
    title             TEXT    NOT NULL,
    slug              TEXT    NOT NULL UNIQUE,
    description       TEXT    NOT NULL DEFAULT '',
    short_description TEXT,
    developer         TEXT    DEFAULT '',
    publisher         TEXT    DEFAULT '',
    download_url      TEXT    DEFAULT '',
    release_date      TEXT,
    category_id       INTEGER,
    cover_image       TEXT    DEFAULT '/uploads/covers/default.png',
    hero_image        TEXT,
    screenshots       TEXT    DEFAULT '[]',
    system_requirements TEXT  DEFAULT '{}',
    tags              TEXT    DEFAULT '[]',
    status            TEXT    NOT NULL DEFAULT 'draft',
    views_count       INTEGER DEFAULT 0,
    is_featured       INTEGER DEFAULT 0,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    deleted_at        TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_featured ON games(is_featured);
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category_id);

CREATE TABLE IF NOT EXISTS articles (
    id            INTEGER PRIMARY KEY,
    title         TEXT    NOT NULL,
    slug          TEXT    NOT NULL UNIQUE,
    excerpt       TEXT,
    content       TEXT    NOT NULL DEFAULT '',
    thumbnail     TEXT    DEFAULT '/uploads/thumbnails/default.png',
    hero_image    TEXT,
    category_id   INTEGER,
    author_id     INTEGER NOT NULL,
    is_featured   INTEGER DEFAULT 0,
    status        TEXT    NOT NULL DEFAULT 'draft',
    views_count   INTEGER DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (author_id)  REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

CREATE TABLE IF NOT EXISTS activity_log (
    id            INTEGER PRIMARY KEY,
    user_id       INTEGER,
    action        TEXT    NOT NULL,
    target_type   TEXT,
    target_id     INTEGER,
    metadata      TEXT    DEFAULT '{}',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
    sid           TEXT PRIMARY KEY,
    expires       TEXT,
    sess          TEXT
);
