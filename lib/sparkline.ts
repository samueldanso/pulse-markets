interface SparklinePoint {
  time: number;
  value: number;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateSparklineData(
  topic: string,
  baseline: number,
  points = 30,
): SparklinePoint[] {
  const seed = hashString(topic);
  const random = seededRandom(seed);
  const now = Date.now();
  const intervalMs = (60 * 60 * 1000) / points;

  const noise = baseline * 0.08;
  let value = baseline;

  const data: SparklinePoint[] = [];
  for (let i = 0; i < points; i++) {
    const delta = (random() - 0.48) * noise;
    value = Math.max(baseline * 0.5, value + delta);
    data.push({
      time: now - (points - i) * intervalMs,
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
}

export function getChangePercent(data: SparklinePoint[]): number {
  if (data.length < 2) return 0;
  const first = data[0].value;
  const last = data[data.length - 1].value;
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

export function getLatestValue(data: SparklinePoint[]): number {
  if (data.length === 0) return 0;
  return data[data.length - 1].value;
}
