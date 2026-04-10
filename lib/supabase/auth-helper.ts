import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

let _adminClient: ReturnType<typeof createAdminClient> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

export async function getUserFromRequest(
  request: Request
): Promise<User | null> {
  // Try Bearer token first (mobile clients)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const admin = getAdminClient();
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token);
    if (user && !error) return user;
  }

  // Fall back to cookie-based session (web)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
