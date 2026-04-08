"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@/lib/actions/auth";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { ModeToggle } from "@/components/layout/ModeToggle";

function isRedirectError(msg: string) {
  return msg.includes("NEXT_REDIRECT") || msg.includes("redirect");
}

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"PLAYER" | "ORGANIZER">("PLAYER");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: "PLAYER" },
  });

  const handleRoleChange = (val: "PLAYER" | "ORGANIZER") => {
    setRole(val);
    setValue("role", val);
  };

  const onSubmit = async (data: SignUpInput) => {
    setLoading(true);
    setServerError(null);

    try {
      const result = await signUp({ ...data, role });
      // Server redirects on success; only surface genuine errors
      const errorMsg = result?.serverError;
      if (errorMsg && !isRedirectError(errorMsg)) {
        setServerError(errorMsg);
        setLoading(false);
      }
      // If redirect happened the browser navigates — keep spinner visible
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar conta";
      if (!isRedirectError(msg)) {
        setServerError(msg);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="font-cormorant italic text-[32vw] font-light leading-none"
          style={{ color: "rgba(255,255,255,0.02)" }}
        >
          ♣
        </span>
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-cormorant italic text-4xl font-light text-white tracking-wide">
            FindPoker
          </h1>
          <p className="tag text-[#6B6660] mt-2">Criar nova conta</p>
        </div>

        <div className="flex justify-center gap-4 mb-8 text-[#6B6660] text-lg opacity-40">
          <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
        </div>

        {/* Card */}
        <div className="bg-[#141412] border border-sidebar-border p-6 rounded-sm">
          {/* Role selector */}
          <div className="mb-6">
            <label className="tag text-[#6B6660] block mb-2">Tipo de Conta</label>
            <ModeToggle value={role} onChange={handleRoleChange} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="tag text-[#6B6660] block mb-1.5">Nome completo</label>
              <input
                {...register("name")}
                type="text"
                placeholder="Seu nome"
                className="w-full bg-transparent border border-sidebar-border text-white text-[13px] px-3 py-2.5 placeholder:text-[#3A3835] focus:border-[#6B6660] transition-colors rounded-sm"
              />
              {errors.name && (
                <p className="text-[11px] text-red mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="tag text-[#6B6660] block mb-1.5">Handle</label>
              <div className="flex">
                <span className="bg-[#1A1917] border border-r-0 border-sidebar-border text-[#6B6660] px-3 flex items-center text-[13px] rounded-l-sm">@</span>
                <input
                  {...register("handle")}
                  type="text"
                  placeholder="seuhandle"
                  className="flex-1 bg-transparent border border-sidebar-border text-white text-[13px] px-3 py-2.5 placeholder:text-[#3A3835] focus:border-[#6B6660] transition-colors rounded-r-sm"
                />
              </div>
              <p className="text-[10px] text-[#6B6660] mt-1">
                Opcional — ex: ripperl (letras minúsculas, números e _)
              </p>
              {errors.handle && (
                <p className="text-[11px] text-red mt-1">{errors.handle.message}</p>
              )}
            </div>

            <div>
              <label className="tag text-[#6B6660] block mb-1.5">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-transparent border border-sidebar-border text-white text-[13px] px-3 py-2.5 placeholder:text-[#3A3835] focus:border-[#6B6660] transition-colors rounded-sm"
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
                placeholder="Mín. 8 caracteres"
                className="w-full bg-transparent border border-sidebar-border text-white text-[13px] px-3 py-2.5 placeholder:text-[#3A3835] focus:border-[#6B6660] transition-colors rounded-sm"
              />
              {errors.password && (
                <p className="text-[11px] text-red mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="tag text-[#6B6660] block mb-1.5">Cidade <span className="opacity-50">(opcional)</span></label>
              <input
                {...register("city")}
                type="text"
                placeholder="São Paulo"
                className="w-full bg-transparent border border-sidebar-border text-white text-[13px] px-3 py-2.5 placeholder:text-[#3A3835] focus:border-[#6B6660] transition-colors rounded-sm"
              />
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
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>
        </div>

        <p className="text-center tag text-[#6B6660] mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-white hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
