// run.js
const { main } = require('./scrapers/aggregate');

main().catch(err => {
  console.error('Fatal error in run.js:', err);
  process.exit(1);
});
