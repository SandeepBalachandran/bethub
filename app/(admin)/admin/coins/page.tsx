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
    <main className="mx-auto max-w-6xl space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">💰 Coin Transactions</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-semibold">{totalCount}</span> transactions
          </p>
        </div>
        <Link href="/admin" className="text-xs sm:text-sm text-accent hover:underline self-start sm:self-auto">
          ← Back to Admin
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {typeStats.map((stat) => (
          <div
            key={stat.type}
            className="card p-3 sm:p-4 border-t-2"
            style={{
              borderTopColor:
                stat.type === "spend"
                  ? "var(--color-danger)"
                  : "var(--color-success)",
            }}
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize font-medium">
              {stat.type}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1">{stat._count}</p>
          </div>
        ))}
      </div>

      {/* Top Reasons */}
      <div className="card space-y-3 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold">Top Reasons</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {reasonStats.slice(0, 8).map((stat) => (
            <div key={stat.reason} className="p-2 sm:p-3 bg-accent/5 rounded text-xs sm:text-sm">
              <p className="font-medium truncate">{stat.reason}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {stat._count}×
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-3 sm:space-y-4 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold">Transactions</h2>
        <div className="flex flex-col gap-2 sm:gap-3">
          <form className="flex flex-col sm:flex-row gap-2 sm:gap-3" method="get">
            <select
              name="userId"
              defaultValue={params.userId || ""}
              className="flex-1 input-pill text-xs sm:text-sm"
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
              className="flex-1 sm:flex-0 input-pill text-xs sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="spend">Spend</option>
              <option value="award">Award</option>
            </select>
            <button
              type="submit"
              className="btn btn-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm touch-none"
            >
              Filter
            </button>
          </form>
          <Link
            href="/admin/coins"
            className="btn btn-secondary px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-center"
          >
            Clear
          </Link>
        </div>

        {/* Table - Mobile Card View for small screens */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-xs sm:text-sm">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-semibold">User</th>
                <th className="text-center py-2 sm:py-3 px-2 sm:px-3 font-semibold">Type</th>
                <th className="hidden md:table-cell text-center py-2 sm:py-3 px-2 sm:px-3 font-semibold">Reason</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold">Amount</th>
                <th className="hidden lg:table-cell text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold">Before</th>
                <th className="hidden lg:table-cell text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold">After</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="block sm:table-row border-b border-[color-mix(in_srgb,var(--foreground)_4%,transparent)] mb-3 sm:mb-0 p-3 sm:p-0 sm:hover:bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] rounded sm:rounded-none"
                >
                  <td className="block sm:table-cell before:content-['User:'] before:font-bold before:mr-2 before:text-gray-600 dark:before:text-gray-400 sm:before:content-none py-1 sm:py-2 px-0 sm:px-3">
                    {tx.user.name}
                  </td>
                  <td className="block sm:table-cell before:content-['Type:'] before:font-bold before:mr-2 before:text-gray-600 dark:before:text-gray-400 sm:before:content-none text-center sm:text-center py-1 sm:py-2 px-0 sm:px-3">
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
                  <td className="hidden md:table-cell before:content-['Reason:'] before:font-bold before:mr-2 before:text-gray-600 dark:before:text-gray-400 md:before:content-none text-center py-1 sm:py-2 px-0 sm:px-3 text-gray-600 dark:text-gray-400">
                    {tx.reason}
                  </td>
                  <td className="block sm:table-cell before:content-['Amount:'] before:font-bold before:mr-2 before:text-gray-600 dark:before:text-gray-400 sm:before:content-none text-right py-1 sm:py-2 px-0 sm:px-3 font-semibold">
                    {tx.type === "spend" ? "-" : "+"}{tx.amount}
                  </td>
                  <td className="hidden lg:table-cell before:content-['Before:'] before:font-bold before:mr-2 before:text-gray-600 dark:before:text-gray-400 lg:before:content-none text-right py-1 sm:py-2 px-0 sm:px-3 text-gray-600 dark:text-gray-400">
                    {tx.balanceBefore}
                  </td>
                  <td className="hidden lg:table-cell before:content-['After:'] before:font-bold before:mr-2 before:text-gray-600 dark:before:text-gray-400 lg:before:content-none text-right py-1 sm:py-2 px-0 sm:px-3 font-semibold text-success">
                    {tx.balanceAfter}
                  </td>
                  <td className="block sm:table-cell before:content-['Date:'] before:font-bold before:mr-2 before:text-gray-600 dark:before:text-gray-400 sm:before:content-none text-left py-1 sm:py-2 px-0 sm:px-3 text-xs text-gray-600 dark:text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No transactions found
          </div>
        )}
      </div>
    </main>
  );
}
