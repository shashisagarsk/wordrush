import Link from "next/link";

import JoinRoomCard from "@/components/home/JoinRoomCard";

export default function JoinPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[90vh] max-w-xl flex-col justify-center">
        <Link
          href="/"
          className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to Home
        </Link>

        <JoinRoomCard />
      </div>
    </main>
  );
}