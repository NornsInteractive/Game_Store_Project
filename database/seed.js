const { initDb, closeDb } = require('./connection');
const { ensureSeedData } = require('./bootstrap');

async function seed() {
  await initDb();
  const counts = await ensureSeedData({ reset: true });

  console.log('Seeding complete!');
  console.log('  Admin: admin@cyberpulse.sys / admin123');
  console.log(`  Users: ${counts.users}`);
  console.log(`  Games: ${counts.games}`);
  console.log(`  Articles: ${counts.articles}`);

  closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
