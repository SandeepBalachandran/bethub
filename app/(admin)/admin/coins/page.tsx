import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminCoinsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ userId?: string; type?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const where: any = {};
  if (params.userId) where.userId = params.userId;
  if (params.type) where.type = params.type;

  const [transactions, users, totalCount] = await Promise.all([
    prisma.coinTransaction.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: "USER", active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.coinTransaction.count({ where }),
  ]);

  const typeStats = await prisma.coinTransaction.groupBy({
    by: ["type"],
    _count: true,
  });

  const reasonStats = await prisma.coinTransaction.groupBy({
    by: ["reason"],
    _count: true,
    orderBy: {
      _count: { reason: "desc" },
    },
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">💰 Coin Transactions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total: <span className="font-semibold">{totalCount}</span> transactions
          </p>
        </div>
        <Link href="/admin" className="text-sm text-accent hover:underline">
          ← Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {typeStats.map((stat) => (
          <div
            key={stat.type}
            className="card p-3 border-t-2"
            style={{
              borderTopColor:
                stat.type === "spend"
                  ? "var(--color-danger)"
                  : "var(--color-success)",
            }}
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
              {stat.type}
            </p>
            <p className="text-lg font-bold">{stat._count}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="text-lg font-medium">Top Reasons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {reasonStats.slice(0, 8).map((stat) => (
            <div key={stat.reason} className="p-2 bg-accent/5 rounded text-sm">
              <p className="font-medium truncate">{stat.reason}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stat._count} times
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form className="flex flex-1 gap-2" method="get">
            <select
              name="userId"
              defaultValue={params.userId || ""}
              className="input-pill flex-1 text-sm"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={params.type || ""}
              className="input-pill text-sm"
            >
              <option value="">All Types</option>
              <option value="spend">Spend</option>
              <option value="award">Award</option>
            </select>
            <button
              type="submit"
              className="btn btn-primary px-4"
            >
              Filter
            </button>
          </form>
          <Link
            href="/admin/coins"
            className="btn btn-secondary px-4"
          >
            Clear
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                <th className="text-left py-3 px-2">User</th>
                <th className="text-center py-3 px-2">Type</th>
                <th className="text-center py-3 px-2">Reason</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-right py-3 px-2">Before</th>
                <th className="text-right py-3 px-2">After</th>
                <th className="text-left py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-[color-mix(in_srgb,var(--foreground)_4%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)]"
                >
                  <td className="py-2 px-2">{tx.user.name}</td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        tx.type === "spend"
                          ? "bg-danger/20 text-danger"
                          : "bg-success/20 text-success"
                      }`}
                    >
                      {tx.type === "spend" ? "-" : "+"}{tx.amount}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                    {tx.reason}
                  </td>
                  <td className="text-right py-2 px-2 font-semibold">
                    {tx.type === "spend" ? "-" : "+"}{tx.amount}
                  </td>
                  <td className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">
                    {tx.balanceBefore}
                  </td>
                  <td className="text-right py-2 px-2 font-semibold text-success">
                    {tx.balanceAfter}
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-600 dark:text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        )}
      </div>
    </main>
  );
}
