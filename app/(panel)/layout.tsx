import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import AdminBottomBar from "@/components/AdminBottomBar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("[panel-layout] auth failed:", error);
    redirect("/login");
  }
  if (!session?.user) redirect("/login");

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <AdminBottomBar />
    </div>
  );
}
