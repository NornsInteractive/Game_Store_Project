const { getDb } = require('../database/connection');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findAll({ categoryId, search, page, limit, status } = {}) {
  const db = getDb();
  const conditions = [];
  const vals = [];
  if (status !== undefined) { conditions.push('a.status = ?'); vals.push(status); }
  else { conditions.push("a.status = 'published'"); }
  if (categoryId) { conditions.push('a.category_id = ?'); vals.push(categoryId); }
  if (search) { conditions.push('(a.title LIKE ? OR a.content LIKE ?)'); vals.push(`%${search}%`, `%${search}%`); }
  const where = 'WHERE ' + conditions.join(' AND ');
  const p = page || 1;
  const l = limit || 9;
  const offset = (p - 1) * l;
  const rows = db.prepare(
    `SELECT a.*, u.username as author_name, u.avatar as author_avatar, c.name as category_name
     FROM articles a
     JOIN users u ON a.author_id = u.id
     LEFT JOIN categories c ON a.category_id = c.id
     ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
  ).all(...vals, l, offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM articles a ${where}`).get(...vals).count;
  return { rows, total, page: p, pages: Math.ceil(total / l) };
}

function findBySlug(slug) {
  const db = getDb();
  return db.prepare(
    `SELECT a.*, u.username as author_name, u.avatar as author_avatar, c.name as category_name
     FROM articles a JOIN users u ON a.author_id = u.id LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.slug = ?`
  ).get(slug);
}

function findById(id) {
  const db = getDb();
  return db.prepare(
    `SELECT a.*, u.username as author_name, c.name as category_name
     FROM articles a JOIN users u ON a.author_id = u.id LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.id = ?`
  ).get(id);
}

function create(data) {
  const db = getDb();
  if (data.authorId === undefined || data.authorId === null) {
    throw new Error('Article author is required.');
  }
  let slug = slugify(data.title);
  const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug);
  if (existing) slug = slug + '-' + Date.now().toString(36);
  db.prepare(
    'INSERT INTO articles (title, slug, excerpt, content, thumbnail, hero_image, category_id, author_id, is_featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(data.title, slug, data.excerpt || '', data.content || '', data.thumbnail || '/uploads/thumbnails/default.png', data.heroImage || null, data.categoryId || null, data.authorId, data.isFeatured ? 1 : 0, data.status || 'draft');
  return db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug);
}

function update(id, data) {
  const db = getDb();
  const sets = [];
  const vals = [];
  const fields = ['title', 'slug', 'excerpt', 'content', 'thumbnail', 'hero_image', 'category_id', 'is_featured', 'status'];
  for (const f of fields) {
    const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (data[camel] !== undefined) { sets.push(`${f} = ?`); vals.push(data[camel]); }
  }
  if (sets.length === 0) return findById(id);
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return findById(id);
}

function remove(id) {
  const db = getDb();
  db.prepare('DELETE FROM articles WHERE id = ?').run(id);
}

function incrementViews(id) {
  const db = getDb();
  db.prepare('UPDATE articles SET views_count = views_count + 1 WHERE id = ?').run(id);
}

function getFeatured(count = 3) {
  const db = getDb();
  return db.prepare(
    `SELECT a.*, u.username as author_name, c.name as category_name
     FROM articles a JOIN users u ON a.author_id = u.id LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.status = 'published' AND a.is_featured = 1 ORDER BY a.created_at DESC LIMIT ?`
  ).all(count);
}

module.exports = { findAll, findBySlug, findById, create, update, remove, incrementViews, getFeatured };
