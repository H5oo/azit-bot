let callCount = 0;
let startTime = Date.now();

export async function rateLimitedFetch(fetchFn, ...args) {
  const now = Date.now();

  // 2분 내 100회 제한
  if (callCount >= 100 && now - startTime < 130000) {
    const waitTime = 130000 - (now - startTime);
    console.log(`⏳ 2분 제한 도달, ${Math.ceil(waitTime / 1000)}초 대기`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    callCount = 0;
    startTime = Date.now();
  }

  // 1초당 20회 제한
  await new Promise(resolve => setTimeout(resolve, 60)); // 60ms 간격 (약 16.6회/sec)

  callCount++;

  return await fetchFn(...args);
}