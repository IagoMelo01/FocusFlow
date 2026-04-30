import { getCurrentUser } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/http";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return ok({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
