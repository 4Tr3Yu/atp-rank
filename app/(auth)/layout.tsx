import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="mb-8 inline-flex items-baseline gap-2 text-2xl font-bold tracking-tight text-primary"
      >
        <Image src="/ria.svg" alt="RIA" width={40} height={28} />
        <span>ATP Rank</span>
      </Link>
      {children}
    </div>
  );
}
