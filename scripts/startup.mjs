await import("./migrate.mjs");

if (process.env.SEED_ON_START?.trim().toLowerCase() === "true") {
  await import("./seed.mjs");
}
