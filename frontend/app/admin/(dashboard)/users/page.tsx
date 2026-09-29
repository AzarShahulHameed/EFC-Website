import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { createUserAction, setUserActiveAction, updateUserRoleAction } from "@/lib/admin-actions";

const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
};

const ROLE_HINT: Record<string, string> = {
  SUPER_ADMIN: "Full access, including Users & Roles and provisioning new accounts.",
  ADMIN: "Can manage all content and settings, but not other admins' roles.",
  EDITOR: "Can create and edit content, but not publish site-wide settings or manage users.",
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: (typeof ROLES)[number];
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { error?: string; created?: string };
}) {
  const meRes = await adminFetch("/auth/me");
  if (meRes.status === 401) redirect("/admin/login");
  const me: any = meRes.ok ? await meRes.json() : null;

  if (me?.role !== "SUPER_ADMIN") {
    return (
      <div className="px-9 py-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Users &amp; Roles</h1>
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 mt-6 max-w-xl text-[13.5px] text-amber-800">
          This page is only available to Super Admins. You're signed in as {me?.email ?? "an account"} ({ROLE_LABEL[me?.role] ?? me?.role}).
        </div>
      </div>
    );
  }

  const res = await adminFetch("/users");
  if (res.status === 401) redirect("/admin/login");
  const users: AdminUser[] = res.ok ? await res.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Users &amp; Roles</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Every admin dashboard account and its role (RBAC). Only Super Admins can see or change this page — every
        write below is also enforced on the API itself, not just hidden in this UI.
      </p>

      <div className="bg-white border border-line overflow-x-auto mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left">
              <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Name</th>
              <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Email</th>
              <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Role</th>
              <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">MFA</th>
              <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === me.id;
              return (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">
                    {user.name}
                    {isSelf ? <span className="ml-2 text-[11px] font-semibold text-slate-400">(you)</span> : null}
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-muted">{user.email}</td>
                  <td className="px-6 py-3.5 text-[13px]">
                    {isSelf ? (
                      <span className="text-ink font-medium">{ROLE_LABEL[user.role]}</span>
                    ) : (
                      <RoleSelect userId={user.id} currentRole={user.role} />
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-[12.5px] text-muted">{user.mfaEnabled ? "Enabled" : "—"}</td>
                  <td className="px-6 py-3.5 text-[12.5px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        user.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {user.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {!isSelf ? (
                      <form action={setUserActiveAction.bind(null, user.id, !user.isActive)}>
                        <button type="submit" className="text-[12.5px] font-semibold text-slate-500 underline">
                          {user.isActive ? "Disable" : "Enable"}
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-line p-6 max-w-xl">
        <h2 className="text-[15px] font-bold text-ink mb-1">Add a New User</h2>
        <p className="text-[13px] text-muted mb-4">
          Accounts are provisioned here — there's no public sign-up. The new user should change this password
          themselves from Security once they've signed in.
        </p>
        <form action={createUserAction} className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="name" className="block text-[13px] font-semibold text-ink mb-1.5">
              Full name
            </label>
            <input id="name" name="name" required minLength={2} maxLength={120} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-ink mb-1.5">
              Email
            </label>
            <input id="email" name="email" type="email" required maxLength={254} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <label htmlFor="password" className="block text-[13px] font-semibold text-ink mb-1.5">
              Temporary password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              maxLength={72}
              className="w-full border border-line px-3.5 py-2.5 text-[14px]"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-[13px] font-semibold text-ink mb-1.5">
              Role
            </label>
            <select id="role" name="role" defaultValue="EDITOR" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start mt-1"
          >
            Create Account
          </button>
        </form>
      </div>

      <div className="mt-6 max-w-xl text-[12px] text-slate-400 leading-relaxed">
        <div className="font-semibold text-slate-500 mb-1">What each role can do</div>
        {ROLES.map((r) => (
          <div key={r} className="mb-0.5">
            <span className="font-semibold text-slate-500">{ROLE_LABEL[r]}:</span> {ROLE_HINT[r]}
          </div>
        ))}
      </div>
    </div>
  );
}

// A role <select> plus a "Save" button, submitted via its own inline
// server action — kept as a plain server component (no client JS needed)
// since there's an explicit submit rather than an onChange handler.
function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  async function action(formData: FormData) {
    "use server";
    const role = formData.get("role")?.toString() as "SUPER_ADMIN" | "ADMIN" | "EDITOR";
    await updateUserRoleAction(userId, role);
  }
  return (
    <form action={action} className="flex items-center gap-2">
      <select name="role" defaultValue={currentRole} className="border border-line px-2 py-1.5 text-[13px] bg-white">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <button type="submit" className="text-[12px] font-semibold text-slate-500 underline">
        Save
      </button>
    </form>
  );
}
