"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { actionClient } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

export const signUp = actionClient
  .schema(signUpSchema)
  .action(async ({ parsedInput }) => {
    console.log("[signUp] parsedInput.role:", parsedInput.role);
    console.log("[signUp] full parsedInput:", JSON.stringify(parsedInput));

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: parsedInput.email,
      password: parsedInput.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Erro ao criar usuário");
    }

    await prisma.user.create({
      data: {
        supabaseId: data.user.id,
        email: parsedInput.email,
        name: parsedInput.name,
        handle: parsedInput.handle || null,
        role: parsedInput.role as "PLAYER" | "ORGANIZER",
        city: parsedInput.city ?? null,
      },
    });

    console.log("[signUp] user created with role:", parsedInput.role);
    console.log("[signUp] redirecting to:", parsedInput.role === "ORGANIZER" ? "/dashboard" : "/feed");

    if (parsedInput.role === "ORGANIZER") {
      redirect("/dashboard");
    } else {
      redirect("/feed");
    }
  });

export const signIn = actionClient
  .schema(signInSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsedInput.email,
      password: parsedInput.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
    });

    console.log("[signIn] dbUser.role:", dbUser?.role);
    console.log("[signIn] dbUser:", JSON.stringify(dbUser));

    const role = dbUser?.role ?? "PLAYER";

    console.log("[signIn] redirecting to:", role === "ORGANIZER" ? "/dashboard" : "/feed");

    if (role === "ORGANIZER") {
      redirect("/dashboard");
    } else {
      redirect("/feed");
    }
  });

export const signOut = actionClient
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  });
