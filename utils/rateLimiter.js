let callCount = 0;
let startTime = Date.now();

export async function rateLimitedFetch(fetchFn, ...args) {
  const now = Date.now();

  // 2분 내 90회 제한
  if (callCount >= 90 && now - startTime < 130000) {
    const waitTime = 130000 - (now - startTime);
    console.log(`⏳ 2분 제한 도달, ${Math.ceil(waitTime / 1000)}초 대기`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    callCount = 0;
    startTime = Date.now();
  }

  // 1초당 호출 제한 (약 16회/sec)
  await new Promise(resolve => setTimeout(resolve, 60));

  callCount++;

  try {
    return await fetchFn(...args);
  } catch (err) {
    if (err.response?.status === 429) {
      console.log('⚠ 429 발생, 1초 후 재시도');
      await new Promise(r => setTimeout(r, 1000));
      return rateLimitedFetch(fetchFn, ...args); // 재시도
    }
    throw err;
  }
}