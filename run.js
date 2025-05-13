// run.js

// (Optional) load .env locally—safe to leave commented if you only use GitHub Secrets
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
