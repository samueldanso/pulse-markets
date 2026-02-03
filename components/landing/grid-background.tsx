const ROWS = 9;
const COLS = 15;

function getOpacity(row: number, col: number): number {
  const centerCol = COLS / 2 - 0.5;
  const distX = Math.abs(col - centerCol);
  const slope = 0.65;
  const maxWidthAtRow = centerCol + 1 - row * slope;

  let opacity = 0;

  if (distX < maxWidthAtRow) {
    const verticalStrength = 1 - (row / ROWS) * 0.7;
    const horizontalStrength = 1 - distX / centerCol;
    opacity = 0.15 + verticalStrength * horizontalStrength * 0.45;

    if (row < 3 && distX < 2) {
      opacity += 0.2;
    }
  }

  return opacity;
}

export function GridBackground() {
  return (
    <div className="pointer-events-none absolute top-0 left-0 z-0 size-full select-none overflow-hidden">
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-[#FAFAFA] to-90%" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#FAFAFA] via-transparent to-[#FAFAFA] opacity-60" />
      <div
        className="grid size-full gap-px"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const opacity = getOpacity(row, col);

          if (opacity <= 0.02)
            return <div key={i} className="bg-transparent" />;

          return (
            <div
              key={i}
              className="backdrop-blur-[2px]"
              style={{
                backgroundColor: `rgba(191, 209, 8, ${opacity})`,
                borderColor: `rgba(255, 255, 255, ${opacity * 0.3})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
