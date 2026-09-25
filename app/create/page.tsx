import Link from "next/link";
import CreateRoomCard from "@/components/home/CreateRoomCard";

export default function CreatePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-block text-gray-400 hover:text-white"
        >
          ← Back
        </Link>

        <CreateRoomCard />
      </div>
    </main>
  );
}