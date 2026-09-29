// Up/down order-swap buttons for a list-page table row — each click
// immediately swaps this row's order with its neighbor and persists it
// (see moveServiceAction/moveTeamMemberAction/etc. in lib/admin-actions.ts),
// rather than requiring a separate "Save order" step. Shared by every
// admin list page that has an orderable resource, so the control looks and
// behaves the same everywhere.
export default function ReorderArrows({
  index,
  total,
  id,
  moveAction,
}: {
  index: number;
  total: number;
  id: string;
  moveAction: (id: string, direction: "up" | "down") => Promise<void>;
}) {
  return (
    <div className="flex flex-col">
      <form action={moveAction.bind(null, id, "up")}>
        <button
          type="submit"
          disabled={index === 0}
          aria-label="Move up"
          className="text-slate-400 hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed leading-none"
        >
          ▲
        </button>
      </form>
      <form action={moveAction.bind(null, id, "down")}>
        <button
          type="submit"
          disabled={index === total - 1}
          aria-label="Move down"
          className="text-slate-400 hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed leading-none"
        >
          ▼
        </button>
      </form>
    </div>
  );
}
