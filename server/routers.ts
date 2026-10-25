import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { sdk } from "./_core/sdk";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320), name: z.string().trim().max(80).optional() }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.toLowerCase();
        const openId = `local:${email}`;
        const name = input.name?.trim() || email.split("@")[0];
        await db.upsertUser({ openId, email, name, loginMethod: "local", lastSignedIn: new Date() });
        const token = await sdk.createSessionToken(openId, { name });
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        return { ok: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  profile: router({
    updateName: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(80) }))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserName(ctx.user.id, input.name);
      }),
  }),

  study: router({
    load: protectedProcedure.query(async ({ ctx }) => {
      const payload = await db.getStudyData(ctx.user.id);
      return payload ? JSON.parse(payload) : null;
    }),
    save: protectedProcedure
      .input(z.object({ payload: z.string().max(200_000) }))
      .mutation(async ({ ctx, input }) => {
        if (await db.hasActiveParentLink(ctx.user.id)) throw new TRPCError({ code: "FORBIDDEN", message: "保護者アカウントは共有データを変更できません" });
        return db.saveStudyData(ctx.user.id, input.payload);
      }),
  }),

  parent: router({
    list: protectedProcedure.query(({ ctx }) => db.listParentLinks(ctx.user.id)),
    sharedStudy: protectedProcedure.query(({ ctx }) => db.getSharedStudyData(ctx.user.id)),
    createInvite: protectedProcedure.mutation(({ ctx }) => db.createParentInvite(ctx.user.id)),
    redeemInvite: protectedProcedure
      .input(z.object({ code: z.string().trim().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/) }))
      .mutation(({ ctx, input }) => db.redeemParentInvite(ctx.user.id, input.code)),
    updateSharing: protectedProcedure
      .input(z.object({ linkId: z.number().int().positive(), sharePlan: z.number().int().min(0).max(1).optional(), shareStudy: z.number().int().min(0).max(1).optional(), shareScores: z.number().int().min(0).max(1).optional(), shareWeaknesses: z.number().int().min(0).max(1).optional() }))
      .mutation(({ ctx, input }) => {
        const { linkId, ...values } = input;
        return db.updateParentSharing(ctx.user.id, linkId, values).catch(() => {
          throw new TRPCError({ code: "FORBIDDEN", message: "共有設定を変更できるのは生徒本人だけです" });
        });
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
