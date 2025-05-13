// …after fetching + mapping jobs…
for (const job of allJobs) {
  // ↓ temporarily force every job through
  const passesFilter = true;

  console.log(`🔍 [✔] ${job.title}`);      // show every title as passing
  await insertJobIntoSupabase(job);        // whatever your insert fn is
}
