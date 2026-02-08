import Image from "next/image"

export function PartnersSection() {
	return (
		<section className="mx-auto max-w-[1000px] px-6 pb-24 text-center">
			<p className="mb-12 text-[10px] uppercase tracking-[0.2em] text-gray-400">Powered By</p>
			<div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-10 opacity-70 transition-opacity duration-500 hover:opacity-100">
				<span className="flex items-center gap-2.5 text-xl font-bold">
					<Image src="/yellow.png" alt="Yellow Network" width={24} height={24} />
					Yellow
				</span>
				<span className="flex items-center gap-2 text-xl font-bold">
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="4" y="4" width="12" height="12" fill="currentColor" />
					</svg>
					Base
				</span>

				<span className="flex flex-col items-start gap-0.5 text-sm font-bold leading-none">
					<span>LUNAR</span>
					<span>CRUSH</span>
				</span>
			</div>
		</section>
	)
}
