import { authRouter } from './router/auth-router';
import { router } from './trpc';

export const appRouter = router({
  auth: authRouter,
});
export type AppRouter = typeof appRouter;
