import React from "react";

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
    "badge badge-lg text-xs text-black badge-outline rounded-full border-base-300 flex-shrink-0 gap-1";

  const isOwner = ownerId === userId;

  return (
    <span className={`${baseStyles} ${className}`}>
      <a className="link link-hover" href={`/project/${id}`}>
        {children}
      </a>{" "}
      <span className="text-content-medium">by </span>
      {isOwner ? (
        <span className="text-content-medium">you</span>
      ) : (
        <a className="link link-hover" href={`/user/${ownerId}`}>
          {ownerName}
        </a>
      )}
    </span>
  );
};

export default Badge;