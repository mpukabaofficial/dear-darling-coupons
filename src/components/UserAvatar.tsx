import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDefaultAvatar } from "@/data/avatars";

interface UserAvatarProps {
  /** Avatar URL from profile */
  avatarUrl?: string | null;
  /** Size of the avatar */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
  /** Whether to show a ring/border */
  showRing?: boolean;
}

const UserAvatar = ({
  avatarUrl,
  size = "md",
  className,
  showRing = true,
}: UserAvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
  };

  // Use provided avatar, or fall back to default avatar, or show icon fallback
  const displayUrl = avatarUrl || getDefaultAvatar().url;

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden flex items-center justify-center",
        sizeClasses[size],
        showRing && "ring-2 ring-border",
        className
      )}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt="User avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.classList.add("bg-gradient-to-br", "from-primary", "to-accent");
              const icon = document.createElement("div");
              icon.innerHTML = `<svg class="${iconSizeClasses[size]} text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
              parent.appendChild(icon.firstChild!);
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <User className={cn(iconSizeClasses[size], "text-white")} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
