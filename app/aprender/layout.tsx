import { requireProfile } from "@/lib/auth";
import { StudentHeader } from "@/components/learn/student-header";

export const dynamic = "force-dynamic";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile("/aprender");

  return (
    <div className="flex min-h-screen flex-col">
      <StudentHeader
        profile={{
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
        }}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
