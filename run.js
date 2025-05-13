// run.js

// load .env locally if you need it
// require('dotenv').config();

const { main } = require('./scrapers/aggregate');

main()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('🔥 Unhandled error:', err);
    process.exit(1);
  });
