export function UserAvatar({
  name,
  image,
  role,
  size = 36,
  className = "",
}: {
  name?: string | null;
  image?: string | null;
  role?: string | null;
  size?: number;
  className?: string;
}) {
  const src =
    image ||
    (role === "teacher" ? "/images/default-teacher-pic.png" : "/images/default-profile-pic.png");
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full bg-violet-50 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name || "User"} className="h-full w-full object-cover" />
    </span>
  );
}
