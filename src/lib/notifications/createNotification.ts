import { drizzle } from "drizzle-orm/d1";
import { notifications } from "../../db/model/notification";

export async function createNotificationRecord(
  db: ReturnType<typeof drizzle>,
  data: {
    userId: number;
    listingId?: number;
    type:
      | "message"
      | "outbid"
      | "auction_won"
      | "auction_ended"
      | "listing_approved"
      | "listing_rejected";
    title: string;
    link?: string;
  }
) {
  const [notification] = await db
    .insert(notifications)
    .values({
      user_id: data.userId,
      listing_id: data.listingId ?? null,
      type: data.type,
      title: data.title,
      link: data.link ?? null,
      is_read: false,
      created_at: new Date(),
    })
    .returning();

  return notification;
}