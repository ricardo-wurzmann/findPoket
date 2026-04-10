import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

let _adminClient: ReturnType<typeof createSupabaseClient> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

export async function getUserFromRequest(
  request: Request
): Promise<User | null> {
  // 1. Try Bearer token from Authorization header (mobile app)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const adminClient = getAdminClient();
    const {
      data: { user },
      error,
    } = await adminClient.auth.getUser(token);
    if (user && !error) {
      console.log(
        "[getUserFromRequest] Authenticated via Bearer token:",
        user.id
      );
      return user;
    }
    console.log(
      "[getUserFromRequest] Bearer token invalid:",
      error?.message
    );
  }

  // 2. Fall back to cookie-based auth (web browser)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    console.log("[getUserFromRequest] Authenticated via cookie:", user.id);
  } else {
    console.log("[getUserFromRequest] No valid auth found");
  }
  return user;
}
