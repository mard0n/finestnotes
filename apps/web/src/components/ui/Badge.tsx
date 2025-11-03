import React from "react";
import AuthorName from "./AuthorName";

interface BadgeProps {
  children: React.ReactNode;
  id: string;
  ownerId: string;
  ownerName: string;
  userId?: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  ownerId,
  ownerName,
  userId,
  id,
}) => {
  const baseStyles =
    "badge badge-lg text-xs text-black badge-outline rounded-full border-base-300 flex-shrink-0 gap-1 whitespace-nowrap max-w-full";

  return (
    <span className={`${baseStyles} ${className}`}>
      <a className="link link-hover truncate" href={`/project/${id}`}>
        {children}
      </a>{" "}
      <AuthorName
        ownerId={ownerId}
        ownerName={ownerName}
        userId={userId}
        shouldAddBy
      />
    </span>
  );
};

export default Badge;
