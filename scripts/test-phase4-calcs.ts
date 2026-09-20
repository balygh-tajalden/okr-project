// Quick test for phase4 calculations
import { calculateObjectiveProgress, calculateDirectKRProgress, calculateKRProgress } from "@/lib/services/phase4-calculations";
import { SEED_OBJECTIVES, SEED_KEY_RESULTS } from "@/lib/data/phase3-seed";
import { SEED_UPDATE_REQUESTS } from "@/lib/data/phase4-seed";

const obj1 = SEED_OBJECTIVES.find(o => o.id === "obj-001")!;
const krs1 = SEED_KEY_RESULTS.filter(k => k.objectiveId === obj1.id);
const updates = SEED_UPDATE_REQUESTS;

console.log("=== Test obj-001 (approved, 2 KRs) ===");
for (const kr of krs1) {
  const progress = calculateKRProgress(kr, krs1, updates, []);
  console.log(`KR ${kr.id} (${kr.title}): progress = ${progress}%`);
}
const objProgress = calculateObjectiveProgress(obj1, krs1, updates, SEED_OBJECTIVES);
console.log(`Objective progress: ${objProgress}%`);

console.log("\n=== Test obj-006 (closed, 1 KR with approved value 70) ===");
const obj6 = SEED_OBJECTIVES.find(o => o.id === "obj-006")!;
const kr7 = SEED_KEY_RESULTS.find(k => k.id === "kr-007")!;
const progress7 = calculateKRProgress(kr7, SEED_KEY_RESULTS, updates, SEED_OBJECTIVES);
console.log(`KR-007 progress: ${progress7}% (expected ~100%, baseline 10, target 70, current 70)`);
