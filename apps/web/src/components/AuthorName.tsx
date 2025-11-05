import React from "react";

interface AuthorNameProps {
  className?: string;
  ownerId: string | null | undefined;
  ownerName: string | null | undefined;
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
  const baseStyles = "";

  const skipOwnerName = !ownerId || !ownerName;
  const isOwner = ownerId === userId;

  return (
    <span className={`${baseStyles} ${className}`}>
      {shouldAddBy && <span>by </span>}
      {skipOwnerName ? (
        <></>
      ) : isOwner ? (
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
