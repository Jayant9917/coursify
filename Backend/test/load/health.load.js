const autocannon = require("autocannon");

const url = process.env.LOAD_TEST_URL || "http://127.0.0.1:3002/health/live";
const duration = Number(process.env.LOAD_TEST_DURATION || 10);
const connections = Number(process.env.LOAD_TEST_CONNECTIONS || 25);

autocannon(
  {
    url,
    duration,
    connections,
    pipelining: 1,
  },
  (error, result) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({
      url,
      durationSeconds: duration,
      connections,
      requestsPerSecond: result.requests.average,
      latencyMs: result.latency.average,
      errors: result.errors,
      timeouts: result.timeouts,
    }, null, 2));
  }
);
