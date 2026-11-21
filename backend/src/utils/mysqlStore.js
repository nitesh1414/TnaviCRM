const { Worker } = require('worker_threads');
const path = require('path');
const worker = new Worker(path.join(__dirname,'mysqlWorker.js'));
worker.unref();
function call(op, args = {}) {
  const buffer = new SharedArrayBuffer(8 + 16 * 1024 * 1024);
  const signal = new Int32Array(buffer,0,2);
  worker.postMessage({op,args,buffer});
  if (Atomics.wait(signal,0,0,30000) === 'timed-out') throw new Error('MySQL operation timed out; its outcome may be unknown');
  const length = Atomics.load(signal,1);
  const response = JSON.parse(Buffer.from(new Uint8Array(buffer,8,length)).toString('utf8'));
  if (response.error) throw new Error(`MySQL: ${response.error}`);
  return response.result;
}
module.exports = { call };
