"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/actions/auth";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    setLoading(true);
    setServerError(null);

    try {
      const result = await signIn(data);
      if (result?.serverError) {
        setServerError(result.serverError);
        return;
      }
      const role = result?.data?.role;
      router.push(role === "ORGANIZER" ? "/dashboard" : "/feed");
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background suit decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="font-cormorant italic text-[32vw] font-light leading-none"
          style={{ color: "rgba(255,255,255,0.02)", userSelect: "none" }}
        >
          ♠
        </span>
      </div>

      <div className="w-full max-w-[360px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-cormorant italic text-4xl font-light text-white tracking-wide">
            FindPoker
          </h1>
          <p className="tag text-[#6B6660] mt-2">Plataforma de Poker Brasileiro</p>
        </div>

        {/* Suits decoration */}
        <div className="flex justify-center gap-4 mb-8 text-[#6B6660] text-lg opacity-40">
          <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
        </div>

        {/* Card */}
        <div className="bg-[#141412] border border-sidebar-border p-6 rounded-sm">
          <h2 className="text-white text-[15px] font-semibold mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="tag text-[#6B6660] block mb-1.5">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-transparent border border-sidebar-border text-white text-[13px] px-3 py-2.5 placeholder:text-[#3A3835] focus:border-[#6B6660] transition-colors duration-150 rounded-sm"
              />
              {errors.email && (
                <p className="text-[11px] text-red mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="tag text-[#6B6660] block mb-1.5">Senha</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-transparent border border-sidebar-border text-white text-[13px] px-3 py-2.5 placeholder:text-[#3A3835] focus:border-[#6B6660] transition-colors duration-150 rounded-sm"
              />
              {errors.password && (
                <p className="text-[11px] text-red mt-1">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="text-[12px] text-red bg-red/10 border border-red/20 px-3 py-2 rounded-sm">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#1E1D1A] py-3 text-[12px] font-semibold tracking-wide hover:bg-[#F2F0EC] active:scale-[0.98] transition-all duration-150 rounded-sm disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center tag text-[#6B6660] mt-6">
          Não tem conta?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
