import { calculateMatchPoints } from "@/lib/scoring";

// Worked example from PROJECT.MD: predict Messi/Mbappe/Vinicius, actual scorers Messi/Alvarez.
// Expected: Messi +10, Mbappe -5, Vinicius -5 => scorerPoints 0. Winner assumed wrong => 0. Total 0.
const result = calculateMatchPoints(
  {
    winnerTeamId: "predicted-team",
    scorerPlayerIds: ["messi", "mbappe", "vinicius"],
  },
  { winnerTeamId: "actual-team" },
  ["messi", "alvarez"]
);

console.log("Result:", result);

if (result.total !== 0) {
  console.error(`FAILED: expected total 0, got ${result.total}`);
  process.exitCode = 1;
} else {
  console.log("PASSED: worked example produces total 0.");
}

// Additional sanity checks from PROJECT.MD's stated min/max per match.
const maxCase = calculateMatchPoints(
  { winnerTeamId: "team-a", scorerPlayerIds: ["p1", "p2", "p3"] },
  { winnerTeamId: "team-a" },
  ["p1", "p2", "p3"]
);
console.log("Max case (expect total 60):", maxCase);
if (maxCase.total !== 60) {
  console.error(`FAILED: expected max total 60, got ${maxCase.total}`);
  process.exitCode = 1;
}

const minCase = calculateMatchPoints(
  { winnerTeamId: "team-a", scorerPlayerIds: ["p1", "p2", "p3"] },
  { winnerTeamId: "team-b" },
  ["p4", "p5", "p6"]
);
console.log("Min case (expect total -15):", minCase);
if (minCase.total !== -15) {
  console.error(`FAILED: expected min total -15, got ${minCase.total}`);
  process.exitCode = 1;
}
