import { prisma } from "@/lib/prisma";

const BOOSTER_MULTIPLIER = 2;
const DEFAULT_BOOSTER_COST = 100; // Fallback if config not found

async function getBoosterCost(): Promise<number> {
  try {
    const config = await prisma.rewardConfig.findFirst();
    if (config) {
      return config.boosterCost;
    }
  } catch (error) {
    console.error("Error fetching booster cost:", error);
  }
  return DEFAULT_BOOSTER_COST;
}

export async function canActivateBooster(userId: string): Promise<boolean> {
  const [coinBalance, boosterCost] = await Promise.all([
    prisma.coinBalance.findUnique({
      where: { userId },
    }),
    getBoosterCost(),
  ]);
  return (coinBalance?.balance ?? 0) >= boosterCost;
}

export async function activateBooster(
  userId: string,
  predictionId: string
): Promise<{ success: boolean; reason?: string }> {
  try {
    const boosterCost = await getBoosterCost();

    // Check if user has enough coins
    const coinBalance = await prisma.coinBalance.findUnique({
      where: { userId },
    });

    if (!coinBalance || coinBalance.balance < boosterCost) {
      return { success: false, reason: "insufficient_coins" };
    }

    // Check if prediction exists and belongs to user
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction || prediction.userId !== userId) {
      return { success: false, reason: "prediction_not_found" };
    }

    if (prediction.usedPointsBooster) {
      return { success: false, reason: "already_used" };
    }

    // Update prediction and deduct coins
    const balanceBefore = coinBalance.balance;
    const balanceAfter = balanceBefore - boosterCost;

    await Promise.all([
      prisma.prediction.update({
        where: { id: predictionId },
        data: { usedPointsBooster: true },
      }),
      prisma.coinBalance.update({
        where: { userId },
        data: { balance: { decrement: boosterCost } },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          type: "spend",
          reason: "booster",
          amount: boosterCost,
          balanceBefore,
          balanceAfter,
          relatedId: predictionId,
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error activating booster:", error);
    return { success: false, reason: "error" };
  }
}

export function applyPointsBoosterMultiplier(
  value: number,
  hasBooster: boolean
): number {
  if (!hasBooster) return value;

  // Apply multiplier to positive points/money only
  if (value > 0) {
    return Math.round(value * BOOSTER_MULTIPLIER);
  }
  // Negative penalties are NOT affected by booster
  return value;
}

export const BOOSTER_MULTIPLIER_VALUE = BOOSTER_MULTIPLIER;
