/**
 * Builds a UPI deep link (opens the user's UPI app pre-filled to pay).
 * No money moves through this app — it's just a shortcut to a manual transfer.
 */
export function buildUpiPayLink(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}): string {
  const query = new URLSearchParams({
    pa: params.upiId,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: "INR",
    ...(params.note ? { tn: params.note } : {}),
  });
  return `upi://pay?${query.toString()}`;
}
