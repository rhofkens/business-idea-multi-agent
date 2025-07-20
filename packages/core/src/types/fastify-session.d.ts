import 'fastify';
import { SessionUser } from '@business-idea/shared';

declare module 'fastify' {
  interface Session {
    user?: SessionUser;
  }
}