import { prisma } from "@/lib/prisma";

async function removeUser() {
  const emailToRemove = "sandeepbalachandran22@gmail.com";

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailToRemove },
      include: {
        predictions: true,
        coinBalance: true,
        coinTransactions: true,
      },
    });

    if (!user) {
      console.log(`❌ User with email "${emailToRemove}" not found`);
      process.exit(0);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Predictions: ${user.predictions.length}`);
    console.log(`   Transactions: ${user.coinTransactions.length}`);

    // Delete in order (child records first)
    if (user.predictions.length > 0) {
      // Delete prediction scorers first (cascade)
      await prisma.predictionScorer.deleteMany({
        where: { prediction: { userId: user.id } },
      });

      // Delete predictions
      await prisma.prediction.deleteMany({
        where: { userId: user.id },
      });
      console.log(`   🗑️  Deleted ${user.predictions.length} prediction(s)`);
    }

    if (user.coinTransactions.length > 0) {
      await prisma.coinTransaction.deleteMany({
        where: { userId: user.id },
      });
      console.log(`   🗑️  Deleted ${user.coinTransactions.length} transaction(s)`);
    }

    if (user.coinBalance) {
      await prisma.coinBalance.delete({
        where: { userId: user.id },
      });
      console.log(`   🗑️  Deleted coin balance`);
    }

    // Delete user
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(`\n✅ User "${emailToRemove}" completely removed from database`);
    console.log(`\n📧 Ready to test registration flow — email is now available!`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeUser();
