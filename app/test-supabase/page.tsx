import { createClient } from "@/utils/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Supabase Test</h1>

      <pre className="mt-4">
        {JSON.stringify(
          {
            user: data.user,
            error: error?.message,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
