import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { todayDateString } from "@/lib/quiz";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const today = todayDateString();

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "No quiz attempt found for today" },
        { status: 404 }
      );
    }

    // Fetch the current coin balance
    const coinBalance = await prisma.coinBalance.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      correctCount: attempt.correctCount,
      coinsAwarded: attempt.coinsAwarded,
      newBalance: coinBalance?.balance || 0,
    });
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz results" },
      { status: 500 }
    );
  }
}
