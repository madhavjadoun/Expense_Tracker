import { useEffect } from "react";
import { motion as Motion } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import ProfileForm from "../components/ProfileForm";
import { Skeleton, SkeletonText } from "../components/Skeleton";
import { useAppStore } from "../store/useAppStore";
import { useUserStore } from "../store/useUserStore";

export default function ProfilePage() {
  const authUser = useAppStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const loading = useUserStore((s) => s.loading);
  const setLoading = useUserStore((s) => s.setLoading);
  const syncProfileFromServer = useUserStore((s) => s.syncProfileFromServer);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      if (authUser?.uid) {
        setLoading(true);
        await syncProfileFromServer(authUser);
        if (isMounted) setLoading(false);
      }
    }
    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authUser, syncProfileFromServer, setLoading]);

  const shouldRenderSkeleton = loading && !profile?.name && !authUser?.name;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="mx-auto w-full max-w-4xl"
    >
      <div className="mb-5">
        <div className="text-xs text-white/50">Profile</div>
        <div className="text-xl font-semibold text-white/90">Account settings</div>
      </div>

      <ScrollReveal>
        <Motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6 shadow-xl backdrop-blur-md"
        >
          {shouldRenderSkeleton ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-40" />
                  <div className="mt-2">
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              </div>
              <SkeletonText lines={4} />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <ProfileForm />
          )}
        </Motion.div>
      </ScrollReveal>
    </Motion.div>
  );
}
