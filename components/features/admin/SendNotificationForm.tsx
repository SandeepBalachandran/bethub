"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendAdminNotification } from "@/actions/push";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export function SendNotificationForm({
  users,
}: {
  readonly users: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await sendAdminNotification({
          title,
          body,
          userId: userId || undefined,
        });
        toast.success(`Sent to ${result.recipientCount} device(s)`);
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} failed: ${result.errors[0]}`);
        }
        setTitle("");
        setBody("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send notification.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-4">
      <LoadingOverlay show={isPending} label="Sending notification..." />
      <p className="font-semibold">Send a push notification</p>
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="input-pill w-full"
      >
        <option value="">Everyone</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Lock in 30 minutes!)"
        maxLength={80}
        required
        className="input-pill w-full"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        maxLength={200}
        required
        rows={2}
        className="input-pill w-full resize-none"
      />
      <button
        type="submit"
        disabled={isPending || !title.trim() || !body.trim()}
        className="btn btn-primary"
      >
        {userId ? "Send to selected player" : "Send to all players"}
      </button>
    </form>
  );
}
