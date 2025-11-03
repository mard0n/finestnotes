import React from "react";

interface AuthorNameProps {
  className?: string;
  ownerId: string;
  ownerName: string;
  userId: string | null | undefined;
  shouldAddBy?: boolean;
}

const AuthorName: React.FC<AuthorNameProps> = ({
  className = "",
  ownerId,
  ownerName,
  userId,
  shouldAddBy = false,
}) => {
  const baseStyles = "text-xs";

  const isOwner = ownerId === userId;

  return (
    <span className={`${baseStyles} ${className}`}>
      {shouldAddBy && <span>by </span>}
      {isOwner ? (
        <span>you</span>
      ) : (
        <a className="link link-hover" href={`/user/${ownerId}`}>
          {ownerName}
        </a>
      )}
    </span>
  );
};

export default AuthorName;
