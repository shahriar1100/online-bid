const API = process.env.NEXT_PUBLIC_WRANGLER_API_URL!;

export interface Notification {
  id: number;
  user_id: number;
  listing_id: number | null;
  type: string;
  title: string;
  link: string | null;
  is_read: boolean;
  created_at: number;
}

export interface GetNotificationsResponse {
  success: boolean;
  notifications: Notification[];
}

export interface GetUnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationResponse {
  success: boolean;
}

export async function getNotifications(
  limit = 10,
  offset = 0
): Promise<GetNotificationsResponse> {
  const token = localStorage.getItem("authToken") || "";

  const res = await fetch(
    `${API}/api/notifications?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return (await res.json()) as GetNotificationsResponse;
}

export async function getUnreadCount(): Promise<GetUnreadCountResponse> {
  const token = localStorage.getItem("authToken") || "";

  const res = await fetch(`${API}/api/notifications/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return (await res.json()) as GetUnreadCountResponse;
}

export async function markNotificationAsRead(
  notificationId: number
): Promise<NotificationResponse> {
  const token = localStorage.getItem("authToken") || "";

  const res = await fetch(`${API}/api/notifications/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      notificationId,
    }),
  });

  return (await res.json()) as NotificationResponse;
}