/**
 * Attention Data Service
 * Fetches attention/sentiment data for market settlement.
 * Uses LunarCrush API when available, falls back to randomized mock data.
 */

interface AttentionData {
	topic: string;
	current: number;
	source: "lunarcrush" | "mock";
}

const LUNARCRUSH_BASE_URL = "https://lunarcrush.com/api4/public";

async function fetchFromLunarCrush(topic: string): Promise<number | null> {
	const apiKey = process.env.LUNARCRUSH_API_KEY;
	if (!apiKey) return null;

	try {
		const url = `${LUNARCRUSH_BASE_URL}/coins/${topic.toLowerCase()}/v1`;
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: AbortSignal.timeout(5000),
		});

		if (!response.ok) return null;

		const data = (await response.json()) as {
			data?: { galaxy_score?: number; alt_rank?: number; social_volume?: number };
		};
		return data.data?.galaxy_score ?? data.data?.social_volume ?? null;
	} catch {
		console.warn(`[Attention] LunarCrush failed for ${topic}`);
		return null;
	}
}

function generateMockAttention(topic: string, baseline: number): number {
	// Deterministic seed from topic + current 5-min window
	const window = Math.floor(Date.now() / 300000);
	let seed = 0;
	for (let i = 0; i < topic.length; i++) {
		seed = (seed * 31 + topic.charCodeAt(i)) | 0;
	}
	seed = (seed * 37 + window) | 0;

	// Generate value within ±30% of baseline
	const normalizedSeed = Math.abs(seed % 1000) / 1000;
	const variation = (normalizedSeed - 0.5) * 0.6;
	return Math.round(baseline * (1 + variation));
}

export async function getAttentionValue(
	topic: string,
	baseline: number,
): Promise<AttentionData> {
	// Try LunarCrush first
	const lunarCrushValue = await fetchFromLunarCrush(topic);
	if (lunarCrushValue !== null) {
		return { topic, current: lunarCrushValue, source: "lunarcrush" };
	}

	// Fall back to mock
	return {
		topic,
		current: generateMockAttention(topic, baseline),
		source: "mock",
	};
}
