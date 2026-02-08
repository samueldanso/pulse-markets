"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { SparklineChart } from "@/components/markets/sparkline-chart"
import { generateSparklineData, getChangePercent, getLatestValue } from "@/lib/sparkline"

interface MarketCardProps {
	id: string
	question: string
	category: string
	topic: string
	closesAt: number
	status: string
	baseline: number
	upPool: string
	downPool: string
	totalPot: string
	upParticipants: number
	downParticipants: number
	result?: string
}

const TOPIC_ICONS: Record<string, string> = {
	"Elon Musk": "/images/elon-musk.jpg",
	"AI Agents": "/images/ai-agents.svg",
	"Viral Tweet": "/images/vitalik.jpg",
}

function formatUsdc(amount: string): string {
	const num = Number(amount) / 1_000_000
	if (num === 0) return "$0"
	if (num < 1) return `$${num.toFixed(2)}`
	return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function useCountdown(closesAt: number): string {
	const [timeLeft, setTimeLeft] = useState("")

	useEffect(() => {
		function update() {
			const diff = closesAt - Date.now()
			if (diff <= 0) {
				setTimeLeft("Expired")
				return
			}
			const mins = Math.floor(diff / 60000)
			const secs = Math.floor((diff % 60000) / 1000)
			setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`)
		}

		update()
		const interval = setInterval(update, 1000)
		return () => clearInterval(interval)
	}, [closesAt])

	return timeLeft
}

export function MarketCard(props: MarketCardProps) {
	const router = useRouter()
	const countdown = useCountdown(props.closesAt)
	const isClosed = props.status === "closed"
	const isExpired = countdown === "Expired"

	const sparklineData = useMemo(
		() => generateSparklineData(props.topic, props.baseline, 30),
		[props.topic, props.baseline]
	)

	const changePercent = useMemo(() => getChangePercent(sparklineData), [sparklineData])

	const latestValue = useMemo(() => getLatestValue(sparklineData), [sparklineData])

	const total = Number(props.upPool) + Number(props.downPool)
	const isPositive = total > 0 ? Number(props.upPool) > Number(props.downPool) : changePercent > 0

	const iconSrc = TOPIC_ICONS[props.topic]

	function handleSideBet(e: React.MouseEvent, side: "UP" | "DOWN") {
		e.preventDefault()
		e.stopPropagation()
		router.push(`/market/${props.id}?side=${side}`)
	}

	return (
		<div
			className="group flex h-[320px] cursor-pointer flex-col overflow-hidden rounded-xl border border-pulse-black/10 bg-white/3 transition-all hover:border-pulse-black/20 hover:bg-white/5 dark:border-white/10 dark:hover:border-white/15"
			onClick={() => router.push(`/market/${props.id}`)}
			onKeyDown={(e) => {
				if (e.key === "Enter") router.push(`/market/${props.id}`)
			}}
		>
			{/* Header with icon */}
			<div className="flex items-start justify-between px-4 pt-4 pb-2">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					{iconSrc && (
						<Image
							src={iconSrc}
							alt={props.topic}
							width={36}
							height={36}
							className="shrink-0 rounded-full"
						/>
					)}
					<div className="min-w-0">
						<h3 className="truncate text-sm font-semibold text-pulse-black">
							{props.question}
						</h3>
						<p className="text-xs text-pulse-gray">{formatUsdc(props.totalPot)} Vol.</p>
					</div>
				</div>
				<div className="ml-3 text-right">
					<p className="font-mono text-lg font-bold text-pulse-black">
						{latestValue.toLocaleString(undefined, {
							maximumFractionDigits: 2,
						})}
					</p>
					<p
						className={`text-xs font-semibold ${isPositive ? "text-pulse-up" : "text-pulse-down"}`}
					>
						{changePercent >= 0 ? "+" : ""}
						{changePercent.toFixed(1)}%
					</p>
				</div>
			</div>

			{/* Sparkline chart fills middle space */}
			<div className="flex-1">
				<SparklineChart
					data={sparklineData}
					isPositive={isPositive}
					variant="card"
					height={100}
				/>
			</div>

			{/* Bottom: UP/DOWN buttons + status */}
			<div className="px-4 pb-4">
				{isClosed ? (
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-pulse-up">
							{props.result} Won
						</span>
						<span className="text-xs text-pulse-gray">Settled</span>
					</div>
				) : isExpired ? (
					<div className="flex items-center justify-between">
						<span className="font-mono text-xs text-pulse-down">Expired</span>
						<span className="text-xs text-pulse-gray">Awaiting settlement</span>
					</div>
				) : (
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={(e) => handleSideBet(e, "UP")}
							className="flex-1 rounded-lg bg-pulse-up/15 py-2 text-sm font-semibold text-pulse-up transition-colors hover:bg-pulse-up/25"
						>
							Up
						</button>
						<button
							type="button"
							onClick={(e) => handleSideBet(e, "DOWN")}
							className="flex-1 rounded-lg bg-pulse-down/15 py-2 text-sm font-semibold text-pulse-down transition-colors hover:bg-pulse-down/25"
						>
							Down
						</button>
						<span className="font-mono text-xs text-pulse-gray">{countdown}</span>
					</div>
				)}
			</div>
		</div>
	)
}
