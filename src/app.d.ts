// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

import type { User } from '$lib/server/user';
import type { Session } from '$lib/server/session';

declare namespace App {
  // interface Locals {}
  // interface PageData {}
  // interface Error {}
  // interface Platform {}
}
/// <reference types="lucia" />
declare global {
  namespace Lucia {
    type Auth = import('$lib/server/lucia').Auth;
    type DatabaseUserAttributes = Record<string, never>;
    type DatabaseSessionAttributes = Record<string, never>;
  }
  namespace App {
    // interface Locals {
    //   auth: import('lucia').AuthRequest;
    // }
    interface Locals {
      user: User | null;
      session: Session | null;
    }
  }
}

// THIS IS IMPORTANT!!!
export { App };
