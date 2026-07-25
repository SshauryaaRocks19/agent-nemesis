import DashboardOverview from "./dashboard-client";
import { getRecentConversations } from "@/lib/checker/supabase-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const recentConversations = await getRecentConversations(100);
  
  return <DashboardOverview initialData={recentConversations} />;
}
