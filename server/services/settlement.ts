/**
 * AI Settlement Service
 * Determines market outcome via deterministic rules + AI reasoning.
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { BetSide, Market } from "@/types";

interface SettlementInput {
	market: Market;
	currentValue: number;
	dataSource: "lunarcrush" | "mock";
}

interface SettlementResult {
	winner: BetSide;
	reasoning: string;
	attentionData: {
		baseline: number;
		current: number;
		change: number;
		changePercent: number;
	};
	confidence: number;
}

/**
 * Determine market outcome based on attention data
 */
function determineWinner(
	market: Market,
	currentValue: number,
): { winner: BetSide; change: number; changePercent: number } {
	const change = currentValue - market.baseline;
	const changePercent =
		market.baseline > 0 ? (change / market.baseline) * 100 : 0;

	let winner: BetSide;

	if (market.thresholdType === "percentage") {
		// UP wins if attention grew by more than threshold %
		winner = changePercent >= market.threshold ? "UP" : "DOWN";
	} else {
		// Absolute: UP wins if value exceeds threshold
		winner = currentValue >= market.threshold ? "UP" : "DOWN";
	}

	return { winner, change, changePercent };
}

/**
 * Generate AI reasoning for settlement
 */
async function generateReasoning(
	market: Market,
	winner: BetSide,
	currentValue: number,
	changePercent: number,
	dataSource: string,
): Promise<string> {
	try {
		const { text } = await generateText({
			model: openai("gpt-4o-mini"),
			maxTokens: 200,
			prompt: `You are an AI settlement agent for a prediction market about attention/sentiment.

Market: "${market.question}"
Topic: ${market.topic}
Baseline: ${market.baseline}
Current: ${currentValue}
Change: ${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%
Threshold: ${market.threshold}${market.thresholdType === "percentage" ? "%" : ""}
Winner: ${winner}
Data source: ${dataSource}

Write a concise 2-3 sentence analysis explaining why ${winner} won. Reference the data. Be factual and direct.`,
		});

		return text;
	} catch (error) {
		console.error("[Settlement] AI reasoning failed:", error);
		const direction = winner === "UP" ? "increased" : "decreased";
		return `Attention for ${market.topic} ${direction} from ${market.baseline} to ${currentValue} (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%). ${winner} wins based on ${market.thresholdType} threshold of ${market.threshold}.`;
	}
}

/**
 * Full settlement flow: determine winner + generate reasoning
 */
export async function settleMarket(
	input: SettlementInput,
): Promise<SettlementResult> {
	const { market, currentValue, dataSource } = input;

	const { winner, change, changePercent } = determineWinner(
		market,
		currentValue,
	);

	const reasoning = await generateReasoning(
		market,
		winner,
		currentValue,
		changePercent,
		dataSource,
	);

	return {
		winner,
		reasoning,
		attentionData: {
			baseline: market.baseline,
			current: currentValue,
			change,
			changePercent,
		},
		confidence: Math.min(Math.abs(changePercent) / 10, 1),
	};
}
