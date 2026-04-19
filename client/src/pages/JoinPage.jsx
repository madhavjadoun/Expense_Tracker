import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useAppStore } from "../store/useAppStore";

export default function JoinPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {

    if (!token) {
      setStatus("error");
      setMessage("No invite token found in the URL.");
      return;
    }
    sessionStorage.setItem("pending_invite_token", token);

    if (!user) {
      const currentPath = `/app/join/${token}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
      return;
    }

    async function verify() {
      // Call the authenticated backend to verify the JWT
      const result = await api.verifyInviteToken(token);

      if (!result.ok) {
        setStatus("error");
        setMessage(result.message || "Invalid or expired invite link.");
        return;
      }

      const { workspaceId } = result;

      // Add workspace to local store if it doesn't exist, since backend workspaces are implied
      const exists = workspaces.some((w) => w.id === workspaceId);
      if (!exists) {
        const newWs = { id: workspaceId, name: result.name || "Shared Workspace", role: result.role || "member", createdAt: new Date().toISOString() };
        useWorkspaceStore.setState((s) => ({
          workspaces: [...s.workspaces, newWs]
        }));
        // Update local storage
        localStorage.setItem("xpense_workspaces", JSON.stringify([...workspaces, newWs]));
      } else {
        // Upgrade existing local workspace object with role and actual name
        const updatedWorkspaces = workspaces.map((w) =>
          w.id === workspaceId ? { ...w, role: result.role || "member", name: result.name || w.name } : w
        );
        useWorkspaceStore.setState({ workspaces: updatedWorkspaces });
        localStorage.setItem("xpense_workspaces", JSON.stringify(updatedWorkspaces));
      }

      setActiveWorkspace(workspaceId);
      setStatus("success");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1600);
    }

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/4 p-8 text-center backdrop-blur-xl">

        {status === "verifying" && (
          <>
            <div className="mb-4 text-3xl">🔗</div>
            <div className="text-base font-semibold text-white/90">Verifying invite…</div>
            <div className="mt-2 text-sm text-white/45">Please wait a moment.</div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-4 text-3xl">✅</div>
            <div className="text-base font-semibold text-white/90">Invite accepted!</div>
            <div className="mt-2 text-sm text-white/45">
              {user ? "Switching to workspace…" : "Redirecting to login…"}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-4 text-3xl">❌</div>
            <div className="text-base font-semibold text-white/90">Invalid invite</div>
            <div className="mt-2 text-sm text-white/50">{message}</div>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/8 hover:text-white/90"
            >
              Go to login
            </button>
          </>
        )}

      </div>
    </div>
  );
}
