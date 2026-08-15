import { createClient } from "@/lib/supabase/server";
import { TeachersClient } from "./teachers-client";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const supabase = createClient();
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, cnic, contact, address, date_of_joining")
    .order("name");

  return <TeachersClient teachers={teachers ?? []} />;
}
