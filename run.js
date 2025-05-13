// run.js

async function main() {
  // … your existing fetch + map logic …
  for (const job of allJobs) {
    // temporarily force every job through
    const passesFilter = true;
    console.log(`🔍 [✔] ${job.title}`);
    await insertJobIntoSupabase(job);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
