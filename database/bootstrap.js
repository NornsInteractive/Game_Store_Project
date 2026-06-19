const bcrypt = require('bcryptjs');
const { getDb } = require('./connection');
const game = require('../models/game');
const article = require('../models/article');
const comment = require('../models/comment');
const rating = require('../models/rating');
const activity = require('../models/activity');

function createCategoryMap(db, categories) {
  categories.forEach((category) => {
    db.prepare('INSERT OR IGNORE INTO categories (name, slug, type) VALUES (?, ?, ?)').run(
      category.name,
      category.slug,
      category.type
    );
  });

  const rows = db.prepare('SELECT id, slug FROM categories').all();
  return rows.reduce((map, row) => {
    map[row.slug] = row.id;
    return map;
  }, {});
}

function ensureUser(db, data) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
  if (existing) {
    return existing.id;
  }

  const passwordHash = bcrypt.hashSync(data.password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, display_name, role, bio) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.username, data.email, passwordHash, data.displayName, data.role || 'user', data.bio || '');

  return result.lastInsertRowid;
}

function createDemoGames(categoryMap) {
  return [
    {
      title: 'Cyber Pulse: Revenant',
      description: 'A neon-soaked flagship shooter blending kinetic combat, corporate espionage, and tactical hacking.',
      shortDescription: 'Flagship cyberpunk shooter with tactical hacking.',
      developer: 'Void Labs',
      publisher: 'CyberPulse Interactive',
      downloadUrl: 'https://example.com/downloads/cyber-pulse-revenant',
      releaseDate: '2026-03-15',
      categoryId: categoryMap.action,
      status: 'published',
      isFeatured: true,
      tags: ['Cyberpunk', 'Action', 'FPS']
    },
    {
      title: 'Void Walker',
      description: 'Atmospheric exploration through abandoned alien megastructures on the edge of known space.',
      shortDescription: 'Atmospheric sci-fi exploration adventure.',
      developer: 'Stellar Drift',
      publisher: 'Nexus Games',
      downloadUrl: 'https://example.com/downloads/void-walker',
      releaseDate: '2025-12-10',
      categoryId: categoryMap.adventure,
      status: 'published',
      isFeatured: true,
      tags: ['Sci-Fi', 'Exploration', 'Puzzle']
    },
    {
      title: 'Neon Drift',
      description: 'Arcade street racing across rain-slick megacity districts with deep tuning and drift-focused handling.',
      shortDescription: 'Arcade racer built around style and speed.',
      developer: 'Velocity Studios',
      publisher: 'CyberPulse Interactive',
      downloadUrl: 'https://example.com/downloads/neon-drift',
      releaseDate: '2026-02-28',
      categoryId: categoryMap.racing,
      status: 'published',
      isFeatured: true,
      tags: ['Racing', 'Arcade', 'Open World']
    },
    {
      title: 'Aether Blade',
      description: 'An action RPG where elemental magic and weapon forging collide in a luminous fantasy frontier.',
      shortDescription: 'Action RPG with deep elemental combat.',
      developer: 'Myth Forge',
      publisher: 'CyberPulse Interactive',
      downloadUrl: 'https://example.com/downloads/aether-blade',
      releaseDate: '2025-11-05',
      categoryId: categoryMap.rpg,
      status: 'published',
      isFeatured: true,
      tags: ['Fantasy', 'RPG', 'Magic']
    },
    {
      title: 'Command Grid',
      description: 'A competitive RTS about drone swarms, terrain control, and rapid strategic pivots.',
      shortDescription: 'Competitive RTS with drone-swarm warfare.',
      developer: 'Logic Gate',
      publisher: 'Nexus Games',
      downloadUrl: 'https://example.com/downloads/command-grid',
      releaseDate: '2025-10-18',
      categoryId: categoryMap.strategy,
      status: 'published',
      isFeatured: false,
      tags: ['RTS', 'Strategy', 'Multiplayer']
    },
    {
      title: 'Echoes of the Deep',
      description: 'Survival horror inside a drowning research facility where every corridor feels alive.',
      shortDescription: 'Underwater survival horror with strong atmosphere.',
      developer: 'Abyss Team',
      publisher: 'Indie Forge',
      downloadUrl: 'https://example.com/downloads/echoes-of-the-deep',
      releaseDate: '2026-03-01',
      categoryId: categoryMap.adventure,
      status: 'published',
      isFeatured: false,
      tags: ['Horror', 'Survival', 'Atmospheric']
    }
  ].map((entry) => game.create(entry));
}

function createDemoArticles(categoryMap, adminId) {
  return [
    {
      title: 'System Update 2.0: Neural Link Stability',
      excerpt: 'Platform-wide latency and matchmaking improvements are now live.',
      content: 'System Update 2.0 lowers server latency, improves matchmaking consistency, and introduces better moderation tooling for creators.',
      categoryId: categoryMap['patch-notes'],
      authorId: adminId,
      isFeatured: true,
      status: 'published'
    },
    {
      title: 'Neon Fest 2026 Tickets Are Live',
      excerpt: 'Our annual showcase returns with exclusive reveals and creator spotlights.',
      content: 'Neon Fest 2026 is back with hands-on demos, publishing talks, and a much bigger indie showcase than last year.',
      categoryId: categoryMap.events,
      authorId: adminId,
      isFeatured: true,
      status: 'published'
    },
    {
      title: 'The Rise of Boutique Game Publishing',
      excerpt: 'Smaller teams are shipping sharper, stranger, more memorable games.',
      content: 'The storefront is shifting toward curated, high-identity titles from smaller studios that know exactly who they are building for.',
      categoryId: categoryMap.reviews,
      authorId: adminId,
      isFeatured: false,
      status: 'published'
    },
    {
      title: 'Hardware Watch: Controllers Without Drift',
      excerpt: 'Hall-effect sticks are finally becoming the standard they always should have been.',
      content: 'Modern hall-effect components are becoming affordable enough for mainstream controllers, and competitive players should care.',
      categoryId: categoryMap.hardware,
      authorId: adminId,
      isFeatured: false,
      status: 'published'
    }
  ].map((entry) => article.create(entry));
}

function clearData(db) {
  [
    'activity_log',
    'comment_votes',
    'ratings',
    'user_favorites',
    'comments',
    'articles',
    'games',
    'categories',
    'users',
    'sessions'
  ].forEach((table) => {
    db.prepare(`DELETE FROM ${table}`).run();
  });
}

async function ensureSeedData({ reset = false } = {}) {
  const db = getDb();

  if (reset) {
    clearData(db);
  }

  const currentCounts = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    games: db.prepare('SELECT COUNT(*) AS count FROM games WHERE deleted_at IS NULL').get().count,
    articles: db.prepare('SELECT COUNT(*) AS count FROM articles').get().count
  };

  if (!reset && currentCounts.users > 0 && currentCounts.games > 0 && currentCounts.articles > 0) {
    return currentCounts;
  }

  const categoryMap = createCategoryMap(db, [
    { name: 'Action', slug: 'action', type: 'game' },
    { name: 'RPG', slug: 'rpg', type: 'game' },
    { name: 'Strategy', slug: 'strategy', type: 'game' },
    { name: 'Racing', slug: 'racing', type: 'game' },
    { name: 'Adventure', slug: 'adventure', type: 'game' },
    { name: 'Patch Notes', slug: 'patch-notes', type: 'article' },
    { name: 'Hardware', slug: 'hardware', type: 'article' },
    { name: 'Events', slug: 'events', type: 'article' },
    { name: 'Reviews', slug: 'reviews', type: 'article' }
  ]);

  const adminId = ensureUser(db, {
    username: 'admin',
    email: 'admin@cyberpulse.sys',
    password: 'admin123',
    displayName: 'System Admin',
    role: 'admin',
    bio: 'Maintains platform operations and content curation.'
  });

  const runnerId = ensureUser(db, {
    username: 'neon_runner',
    email: 'runner@cyberpulse.sys',
    password: 'password123',
    displayName: 'Kenta Sato',
    bio: 'Competitive action player and forum regular.'
  });

  const walkerId = ensureUser(db, {
    username: 'void_walker',
    email: 'void@cyberpulse.sys',
    password: 'password123',
    displayName: 'Elara Vance',
    bio: 'Sci-fi explorer with a soft spot for atmospheric games.'
  });

  const witchId = ensureUser(db, {
    username: 'pixel_witch',
    email: 'pixel@cyberpulse.sys',
    password: 'password123',
    displayName: 'Mira Chen',
    bio: 'Builds indie prototypes and writes long comment threads.'
  });

  const games = createDemoGames(categoryMap);
  const articles = createDemoArticles(categoryMap, adminId);

  comment.create({
    userId: runnerId,
    gameId: games[0].id,
    content: 'Combat feels sharp and the storefront presentation nails the vibe.'
  });
  comment.create({
    userId: walkerId,
    gameId: games[1].id,
    content: 'Void Walker is carrying the entire atmospheric sci-fi genre on its back.'
  });
  comment.create({
    userId: witchId,
    articleId: articles[0].id,
    content: 'The moderation tooling note is great news for smaller publishing teams.'
  });

  rating.set(runnerId, games[0].id, 5);
  rating.set(walkerId, games[0].id, 4);
  rating.set(witchId, games[1].id, 5);
  rating.set(runnerId, games[2].id, 4);
  rating.set(walkerId, games[3].id, 5);
  rating.set(witchId, games[4].id, 4);
  games.forEach((entry) => game.updateRating(entry.id));

  activity.log(adminId, 'system_init', 'system', null, { version: '1.0.0' });
  activity.log(runnerId, 'register', 'user', runnerId, {});
  activity.log(walkerId, 'register', 'user', walkerId, {});
  activity.log(witchId, 'register', 'user', witchId, {});

  return {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    games: db.prepare('SELECT COUNT(*) AS count FROM games WHERE deleted_at IS NULL').get().count,
    articles: db.prepare('SELECT COUNT(*) AS count FROM articles').get().count
  };
}

module.exports = { ensureSeedData };
