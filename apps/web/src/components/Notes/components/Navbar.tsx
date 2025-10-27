import type { User } from "better-auth";

const Navbar: React.FC<{
  user: User | null;
  handleNewNoteCreation: () => void;
}> = ({ user, handleNewNoteCreation }) => {
  return (
    <nav className="flex items-stretch border-b border-neutral-200">
      <div className="w-xs border-r border-neutral-200 pl-8 pr-6 py-4 flex items-center">
        <a href="/" className="">
          Finest
        </a>
      </div>
      <div className="w-sm border-r border-neutral-200 px-6 py-4 flex gap-3 items-center justify-between">
        <label className="input input-ghost !outline-offset-0 w-full rounded-full bg-white">
          <svg
            className="h-[1.2em] opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <g
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.5"
              fill="none"
              stroke="#4A4846"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input
            type="search"
            name="search"
            className="grow"
            placeholder="Search"
          />
        </label>
        <button title="Create a new note" onClick={handleNewNoteCreation}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="#4A4846"
            className="size-6 cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>
      <div className="flex grow gap-10 items-center justify-end px-8 py-4">
        {!!user ? (
          <>
            <a href="/notes">my notes</a>
            <div className="dropdown dropdown-hover dropdown-end">
              <span tabIndex={0} role="link" className="m-1">
                {user.name}
              </span>
              <div className="dropdown-content menu  z-1 w-52 p-2">
                <ul className="bg-base-100 p-2 shadow-sm" tabIndex={-1}>
                  <li>
                    <a href="/notes">My notes</a>
                  </li>
                  <li>
                    <a href="https://chromewebstore.google.com/">
                      Browser Extension
                    </a>
                  </li>
                  <li>
                    <a href="/settings">Settings</a>
                  </li>
                  <li>
                    <a id="signout">Sign out</a>
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <>
            <a href="/login">Login</a>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
