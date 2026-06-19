const { getDb } = require('../database/connection');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findAll({ status, categoryId, search, page, limit, featured, orderBy } = {}) {
  const db = getDb();
  const conditions = ['g.deleted_at IS NULL'];
  const vals = [];
  if (status) { conditions.push('g.status = ?'); vals.push(status); }
  if (categoryId) { conditions.push('g.category_id = ?'); vals.push(categoryId); }
  if (featured) { conditions.push('g.is_featured = 1'); }
  if (search) { conditions.push('(g.title LIKE ? OR g.description LIKE ? OR g.tags LIKE ?)'); vals.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const p = page || 1;
  const l = limit || 12;
  const offset = (p - 1) * l;
  let order = 'ORDER BY g.created_at DESC';
  if (orderBy === 'title') order = 'ORDER BY g.title ASC';
  const rows = db.prepare(`SELECT g.*, c.name as category_name FROM games g LEFT JOIN categories c ON g.category_id = c.id ${where} ${order} LIMIT ? OFFSET ?`).all(...vals, l, offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM games g ${where}`).get(...vals).count;
  return { rows, total, page: p, pages: Math.ceil(total / l) };
}

function findBySlug(slug) {
  const db = getDb();
  return db.prepare(
    'SELECT g.*, c.name as category_name FROM games g LEFT JOIN categories c ON g.category_id = c.id WHERE g.slug = ? AND g.deleted_at IS NULL'
  ).get(slug);
}

function findById(id) {
  const db = getDb();
  return db.prepare('SELECT g.*, c.name as category_name FROM games g LEFT JOIN categories c ON g.category_id = c.id WHERE g.id = ?').get(id);
}

function create(data) {
  const db = getDb();
  let slug = slugify(data.title);
  const existing = db.prepare('SELECT id FROM games WHERE slug = ?').get(slug);
  if (existing) slug = slug + '-' + Date.now().toString(36);
  const screenshots = JSON.stringify(data.screenshots || []);
  const sysReq = JSON.stringify(data.systemRequirements || {});
  const tags = JSON.stringify(data.tags || []);
  db.prepare(`INSERT INTO games (title, slug, description, short_description, developer, publisher, download_url, release_date, category_id, cover_image, hero_image, screenshots, system_requirements, tags, status, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(data.title, slug, data.description || '', data.shortDescription || '', data.developer || '', data.publisher || '', data.downloadUrl || '', data.releaseDate || '', data.categoryId || null, data.coverImage || '/uploads/covers/default.png', data.heroImage || null, screenshots, sysReq, tags, data.status || 'draft', data.isFeatured ? 1 : 0);
  return db.prepare('SELECT * FROM games WHERE slug = ?').get(slug);
}

function update(id, data) {
  const db = getDb();
  const sets = [];
  const vals = [];
  const fields = ['title', 'slug', 'description', 'short_description', 'developer', 'publisher', 'download_url', 'release_date', 'category_id', 'cover_image', 'hero_image', 'status', 'is_featured'];
  for (const f of fields) {
    const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (data[camel] !== undefined) { sets.push(`${f} = ?`); vals.push(data[camel]); }
  }
  if (data.screenshots) { sets.push('screenshots = ?'); vals.push(JSON.stringify(data.screenshots)); }
  if (data.systemRequirements) { sets.push('system_requirements = ?'); vals.push(JSON.stringify(data.systemRequirements)); }
  if (data.tags) { sets.push('tags = ?'); vals.push(JSON.stringify(data.tags)); }
  if (sets.length === 0) return findById(id);
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE games SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return findById(id);
}

function setStatus(id, status) {
  const db = getDb();
  db.prepare("UPDATE games SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

function softDelete(id) {
  const db = getDb();
  db.prepare("UPDATE games SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(id);
}

function bulkAction(ids, action) {
  const db = getDb();
  const stmts = { publish: "UPDATE games SET status = 'published' WHERE id IN (...)", delist: "UPDATE games SET status = 'delisted' WHERE id IN (...)", delete: "UPDATE games SET deleted_at = datetime('now') WHERE id IN (...)" };
  if (!stmts[action]) return;
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(stmts[action].replace('...', placeholders)).run(...ids);
}

function getFeatured(count = 6) {
  const db = getDb();
  return db.prepare('SELECT g.*, c.name as category_name FROM games g LEFT JOIN categories c ON g.category_id = c.id WHERE g.status = ? AND g.is_featured = 1 AND g.deleted_at IS NULL ORDER BY g.created_at DESC LIMIT ?').all('published', count);
}

function getTrending(count = 5) {
  const db = getDb();
  return db.prepare('SELECT g.*, c.name as category_name FROM games g LEFT JOIN categories c ON g.category_id = c.id WHERE g.status = ? AND g.deleted_at IS NULL ORDER BY g.views_count DESC, g.created_at DESC LIMIT ?').all('published', count);
}

function getCategories(type) {
  const db = getDb();
  if (type) return db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY name').all(type);
  return db.prepare('SELECT * FROM categories ORDER BY type, name').all();
}

function getCategoryCounts(type) {
  const db = getDb();
  return db.prepare(
    `SELECT c.id, c.name, c.slug, COUNT(g.id) as game_count FROM categories c
     LEFT JOIN games g ON g.category_id = c.id AND g.status = 'published' AND g.deleted_at IS NULL
     WHERE c.type = ? GROUP BY c.id ORDER BY c.name`
  ).all(type);
}

function incrementViews(id) {
  const db = getDb();
  db.prepare('UPDATE games SET views_count = views_count + 1 WHERE id = ?').run(id);
}

module.exports = { findAll, findBySlug, findById, create, update, setStatus, softDelete, bulkAction, getFeatured, getTrending, getCategories, getCategoryCounts, incrementViews };
