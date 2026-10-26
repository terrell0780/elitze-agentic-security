import assert from "node:assert/strict";
import { configureRuntimeRole } from "../src/lib/database-runtime-role.ts";

class MockClient {
  calls = [];
  released = undefined;
  failRoleSetup = false;

  query(sql, callback) {
    this.calls.push(sql);
    const error = this.failRoleSetup ? new Error("role initialization denied") : null;
    if (typeof callback === "function") {
      queueMicrotask(() => callback(error, error ? undefined : { rows: [] }));
      return this;
    }
    return error ? Promise.reject(error) : Promise.resolve({ rows: [] });
  }

  release(error) {
    this.released = error ?? true;
  }
}

class MockPool {
  client;
  connect(callback) {
    const release = (error) => this.client.release(error);
    if (typeof callback === "function") {
      queueMicrotask(() => callback(null, this.client, release));
      return undefined;
    }
    return Promise.resolve(this.client);
  }
}

const plainClient = new MockClient();
const plainPool = new MockPool();
plainPool.client = plainClient;
configureRuntimeRole(plainPool, undefined);
assert.equal(await plainPool.connect(), plainClient, "no configured role should preserve the normal pool path");
assert.equal(plainClient.calls.length, 0, "no role query should run when the setting is absent");

const promiseClient = new MockClient();
const promisePool = new MockPool();
promisePool.client = promiseClient;
configureRuntimeRole(promisePool, "elitze_app_runtime");
const acquired = await promisePool.connect();
assert.equal(acquired, promiseClient);
assert.deepEqual(promiseClient.calls, ['SET ROLE "elitze_app_runtime"'], "role setup must complete before a promise-based connect returns");

const callbackClient = new MockClient();
const callbackPool = new MockPool();
callbackPool.client = callbackClient;
configureRuntimeRole(callbackPool, "elitze_app_runtime");
const callbackResult = await new Promise((resolve, reject) => {
  callbackPool.connect((error, client) => error ? reject(error) : resolve(client));
});
assert.equal(callbackResult, callbackClient);
assert.deepEqual(callbackClient.calls, ['SET ROLE "elitze_app_runtime"'], "role setup must complete before a callback-based connect returns");

const failedPromiseClient = new MockClient();
failedPromiseClient.failRoleSetup = true;
const failedPromisePool = new MockPool();
failedPromisePool.client = failedPromiseClient;
configureRuntimeRole(failedPromisePool, "elitze_app_runtime");
await assert.rejects(() => failedPromisePool.connect(), /role initialization denied/);
assert.ok(failedPromiseClient.released instanceof Error, "failed promise initialization must destroy/release the client");

const failedCallbackClient = new MockClient();
failedCallbackClient.failRoleSetup = true;
const failedCallbackPool = new MockPool();
failedCallbackPool.client = failedCallbackClient;
configureRuntimeRole(failedCallbackPool, "elitze_app_runtime");
const failedCallbackResult = await new Promise((resolve) => {
  failedCallbackPool.connect((error, client) => resolve({ error, client }));
});
assert.match(String(failedCallbackResult.error), /role initialization denied/);
assert.equal(failedCallbackResult.client, undefined, "failed callback initialization must not expose a client");
assert.ok(failedCallbackClient.released instanceof Error, "failed callback initialization must destroy/release the client");

assert.throws(() => configureRuntimeRole(new MockPool(), 'safe"; RESET ROLE; --'), /valid PostgreSQL role identifier/);

console.log("ELITZE database runtime-role initialization self-test: PASS");
