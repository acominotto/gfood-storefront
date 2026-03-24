import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    wpUserId?: number;
    role?: string;
  }

  interface Session {
    user: {
      id?: string;
      wpUserId?: number;
      role?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    wpUserId?: number;
    wpRole?: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  }
}
