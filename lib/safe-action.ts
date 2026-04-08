import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const actionClient = createSafeActionClient();

export const authActionClient = createSafeActionClient().use(async ({ next }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autorizado");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (!dbUser) {
    throw new Error("Usuário não encontrado");
  }

  return next({ ctx: { user, dbUser } });
});

export const organizerActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.dbUser.role !== "ORGANIZER") {
    throw new Error("Acesso restrito a organizadores");
  }
  return next({ ctx });
});
