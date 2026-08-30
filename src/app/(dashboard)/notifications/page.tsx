"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  useListMotion,
  defaultItemVariants,
  STAGGER_CHILDREN_LIMIT,
} from "@/lib/motion/list";
import {
  Bell,
  BellOff,
  ArrowUp,
  ArrowDown,
  CircleDot,
  AlertTriangle,
  CheckCheck,
  UserPlus,
  DollarSign,
  Shield,
  Info,
  Archive,
  CheckSquare,
  Square,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/hooks/use-notifications";
import { useWsState } from "@/hooks/use-ws-state";
import {
  TYPE_FILTERS,
  filterNotifications,
  groupNotificationsByType,
} from "@/lib/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTimeLocalized } from "@/lib/formatters";
import { useDateLocale } from "@/hooks/use-date-locale";
import { useTranslate } from "@/lib/locale/context";
import { cn } from "@/lib/cn";
import { patch } from "@/lib/api-client";
import { useUIStore } from "@/stores/ui-store";
import type { Notification } from "@/types";

const iconMap: Record<string, React.ReactNode> = {
  contribution: <ArrowUp className="h-4 w-4" />,
  contribution_received: <ArrowDown className="h-4 w-4" />,
  payout: <ArrowDown className="h-4 w-4" />,
  payout_received: <DollarSign className="h-4 w-4" />,
  circle: <CircleDot className="h-4 w-4" />,
  circle_joined: <UserPlus className="h-4 w-4" />,
  circle_completed: <CheckCheck className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  penalty: <Shield className="h-4 w-4" />,
};

const gradientMap: Record<string, string> = {
  contribution: "from-emerald-500/30 to-green-600/30",
  contribution_received: "from-emerald-500/30 to-green-600/30",
  payout: "from-aurora-indigo/30 to-aurora-violet/30",
  payout_received: "from-aurora-indigo/30 to-aurora-violet/30",
  circle: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_joined: "from-aurora-violet/30 to-fuchsia-500/30",
  circle_completed: "from-aurora-violet/30 to-fuchsia-500/30",
  system: "from-white/5 to-white/10",
  warning: "from-red-500/30 to-amber-500/30",
  penalty: "from-red-500/30 to-amber-500/30",
};

const iconColorMap: Record<string, string> = {
  contribution: "text-emerald-400",
  contribution_received: "text-emerald-400",
  payout: "text-aurora-violet",
  payout_received: "text-aurora-violet",
  circle: "text-fuchsia-400",
  circle_joined: "text-fuchsia-400",
  circle_completed: "text-fuchsia-400",
  system: "text-muted-foreground",
  warning: "text-red-400",
  penalty: "text-red-400",
};

const itemVariants = defaultItemVariants;

function NotificationItem({
  notification,
  onMarkRead,
  onClick,
  selected,
  onToggleSelect,
  largeList,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick: (n: Notification) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  largeList: boolean;
}) {
  const { dateFnsLocale } = useDateLocale();
  const { t } = useTranslate();
  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
    onClick(notification);
  };

  const link =
    notification.data &&
    typeof notification.data === "object" &&
    "link" in notification.data
      ? String(notification.data.link)
      : null;

  const icon = iconMap[notification.type] ?? <Bell className="h-4 w-4" />;
  const grad = gradientMap[notification.type] ?? gradientMap.system;
  const icol = iconColorMap[notification.type] ?? iconColorMap.system;
  const isUnread = !notification.isRead;

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "flex items-start gap-3 px-5 py-4 transition-colors hover:glass-whisper",
        isUnread && "glass-strong",
      )}
    >
      {/* Bulk select checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={
          selected
            ? `${t("notifications.deselectNotification").replace("{title}", notification.title)}`
            : `${t("notifications.selectNotification").replace("{title}", notification.title)}`
        }
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(notification.id);
        }}
        className="mt-2 shrink-0 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet/50"
      >
        {selected ? (
          <CheckSquare className="h-4 w-4 text-aurora-violet" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>

      <button
        type="button"
        onClick={handleClick}
        className="flex items-start gap-4 flex-1 min-w-0 text-left"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          {isUnread &&
            // layout animations are expensive on large lists; only enable when under threshold
            (!largeList ? (
              <motion.span
                layoutId="unread-dot"
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-aurora-cyan animate-pulse"
              />
            ) : (
              <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-aurora-cyan" />
            ))}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br",
              grad,
            )}
          >
            <span className={icol}>{icon}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "text-sm truncate font-body",
                isUnread
                  ? "font-semibold text-foreground dark:text-white"
                  : "font-medium text-muted-foreground",
              )}
            >
              {notification.title}
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground font-body">
              {notification.sentAt
                ? formatRelativeTimeLocalized(notification.sentAt, dateFnsLocale)
                : formatRelativeTimeLocalized(notification.createdAt, dateFnsLocale)}
            </span>
          </div>
          {notification.body && (
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2 font-body">
              {notification.body}
            </p>
          )}
          {link && (
            <span className="mt-1 inline-block text-xs gradient-text font-body">
              {t("notifications.viewDetails")} &rarr;
            </span>
          )}
        </div>
      </button>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const { t } = useTranslate();
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();
  // Read WS connection state from the global WsProvider context — no new
  // connection is created here; WsProvider already handles the events.
  const { connectionState } = useWsState();
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [archiving, setArchiving] = useState(false);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      const link =
        notification.data &&
        typeof notification.data === "object" &&
        "link" in notification.data
          ? String(notification.data.link)
          : null;
      if (link) router.push(link);
    },
    [router],
  );

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  // Compute filtered notifications first — shared implementation lives in
  // @/lib/notifications so the page and any future consumer stay in sync.
  const filteredNotifications = useMemo(() => {
    const start = typeof performance !== "undefined" ? performance.now() : 0;
    const result = filterNotifications(
      notifications,
      filter as "all" | "unread",
      typeFilter
    );
    const end = typeof performance !== "undefined" ? performance.now() : 0;
    if (notifications.length > 200) {
      // lightweight measurement to help diagnose filter perf on large lists
      // eslint-disable-next-line no-console
      console.log(
        `[perf] filtered ${notifications.length} -> ${result.length} in ${Math.max(0, end - start).toFixed(1)}ms`,
      );
    }
    return result;
  }, [notifications, filter, typeFilter]);

  // Group notifications by type category
  const groupedNotifications = useMemo(
    () => groupNotificationsByType(filteredNotifications),
    [filteredNotifications]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleBulkArchive = async () => {
    setArchiving(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          patch(`/notifications/${id}/read`).catch(() => {}),
        ),
      );
      addToast({
        type: "success",
        title: t("notifications.archived"),
        description: t("notifications.archiveSuccess").replace("{count}", String(selectedIds.size)),
      });
      setSelectedIds(new Set());
      fetchNotifications();
    } catch {
      addToast({ type: "error", title: t("notifications.archiveFailed") });
    } finally {
      setArchiving(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const totalFiltered = filteredNotifications.length;
  const { shouldReduce, variants } = useListMotion(totalFiltered);

  useEffect(() => {
    if (totalFiltered <= 200) return;
    let last =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const handler = () => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      // eslint-disable-next-line no-console
      console.log(
        `[perf][scroll] ${totalFiltered} items, dt=${(now - last).toFixed(1)}ms`,
      );
      last = now;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [totalFiltered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("notifications.title")}
        description={t("notifications.desc")}
        action={
          <div className="flex items-center gap-3">
            <LiveIndicator connectionState={connectionState} />
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                isLoading={markingAll}
                leftIcon={<CheckCheck className="h-4 w-4" />}
                className="glass-whisper"
              >
                {t("notifications.markAllRead")}
              </Button>
            )}
          </div>
        }
      />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList className="inline-flex gap-1 glass rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg text-sm font-body">
              {t("notifications.all")}
              {notifications.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/10 px-1.5 text-xs text-muted-foreground">
                  {notifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-lg text-sm font-body"
            >
              {t("notifications.unread")}
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-aurora-cyan/20 px-1.5 text-xs text-aurora-cyan animate-pulse-glow">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {/* Type filter */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {TYPE_FILTERS.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTypeFilter(tf.value)}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                  typeFilter === tf.value
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <Link href="/notifications/archive">
            <Button
              variant="outline"
              size="sm"
              className="glass-whisper text-xs"
            >
              {t("notifications.archive")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl">
          <button
            type="button"
            role="checkbox"
            aria-checked={
              filteredNotifications.length > 0 &&
              selectedIds.size === filteredNotifications.length
                ? true
                : selectedIds.size > 0
                  ? "mixed"
                  : false
            }
            aria-label={
              selectedIds.size === filteredNotifications.length
                ? t("notifications.deselectAll")
                : t("notifications.selectAll")
            }
            onClick={toggleSelectAll}
            className="text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet/50 rounded"
          >
            {selectedIds.size === filteredNotifications.length
              ? t("notifications.deselectAll")
              : t("notifications.selectAll")}
          </button>
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} {t("notifications.archiveSelected").toLowerCase().includes("selected") ? "selected" : "selected"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkArchive}
            isLoading={archiving}
            leftIcon={<Archive className="h-3.5 w-3.5" />}
            className="ml-auto"
          >
            {t("notifications.archiveSelected")}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="glass-premium rounded-2xl overflow-hidden holo-border">
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="55%" />
                  <Skeleton variant="text" width="85%" />
                </div>
                <Skeleton variant="text" width="12%" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-6 w-6" />}
          title="No notifications"
          description={
            filter === "unread"
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."
          }
        />
      ) : (
        <motion.div
          initial={shouldReduce ? undefined : "hidden"}
          animate={shouldReduce ? undefined : "show"}
          variants={variants}
          className="glass-premium rounded-2xl overflow-hidden holo-border"
        >
          <div className="divide-y divide-border">
            {(
              Object.entries(groupedNotifications) as [string, Notification[]][]
            ).map(([group, items]) => (
              <div key={group}>
                {/* Group header */}
                <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.04]">
                  <h4 className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                    {group}
                    <span className="ml-2 text-xs font-normal text-muted-foreground/60">
                      ({items.length})
                    </span>
                  </h4>
                </div>
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onClick={handleNotificationClick}
                    selected={selectedIds.has(notification.id)}
                    onToggleSelect={toggleSelect}
                    largeList={totalFiltered > STAGGER_CHILDREN_LIMIT}
                  />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
