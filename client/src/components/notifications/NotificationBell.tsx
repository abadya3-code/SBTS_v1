import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

function shortTime(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ar-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: unreadData, isLoading: unreadLoading } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  const { data: notifications, isLoading: listLoading } = trpc.notifications.list.useQuery(
    { unreadOnly: false, limit: 5 },
    {
      enabled: open,
      refetchOnWindowFocus: true,
    }
  );

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  const handleNotificationClick = (notification: NonNullable<typeof notifications>[number]) => {
    if (!notification.isRead) {
      markRead.mutate({ id: notification.id });
    }
    if (notification.linkUrl) {
      setLocation(notification.linkUrl);
      setOpen(false);
    }
  };

  const goToNotifications = () => {
    setLocation("/notifications");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        aria-label="Notifications"
      >
        {unreadLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <div className="text-sm font-extrabold text-slate-900">الإشعارات</div>
                <div className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} غير مقروء` : "لا توجد إشعارات غير مقروءة"}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 rounded-xl bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  قراءة الكل
                </button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {listLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !notifications?.length ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-slate-400">
                  <Bell className="h-9 w-9 opacity-30" />
                  <p className="text-sm font-semibold">لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-right transition hover:bg-slate-50 ${
                          notification.isRead ? "bg-white" : "bg-cyan-50/55"
                        }`}
                      >
                        <span
                          className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                            notification.isRead ? "bg-slate-200" : "bg-cyan-500"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-900">{notification.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">{notification.body}</span>
                          <span className="mt-1 flex items-center justify-end gap-2 text-[11px] text-slate-400">
                            {notification.linkUrl && <ExternalLink className="h-3 w-3 text-cyan-500" />}
                            {shortTime(notification.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={goToNotifications}
              className="flex w-full items-center justify-center border-t border-slate-100 px-4 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-50"
            >
              عرض كل الإشعارات
            </button>
          </div>
        </>
      )}
    </div>
  );
}
