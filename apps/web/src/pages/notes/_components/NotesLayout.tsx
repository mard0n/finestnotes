import { useEffect, useState } from "react";
import DrawerControllerIcon from "@assets/drawer-controller.svg?react";
import type { FilterType } from "./Notes";

const NotesLayout: React.FC<{
  sidebar: React.ReactNode;
  noteList: React.ReactNode;
  editor: React.ReactNode;
  selectedNoteId: string | null;
  deselectNote: () => void;
  filter: FilterType;
}> = ({ sidebar, noteList, editor, selectedNoteId, deselectNote, filter }) => {
  const [screenSize, setScreenSize] = useState<
    "mobile" | "tablet" | "desktop" | null
  >(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScreenSize("mobile");
      } else if (window.innerWidth < 1280) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // Close the drawer when filter changes
    const drawerCheckbox = document.getElementById(
      "my-finest-drawer-mobile"
    ) as HTMLInputElement;
    if (drawerCheckbox) {
      drawerCheckbox.checked = false;
    }
  }, [filter]);

  if (!screenSize) {
    return null;
  }

  if (screenSize === "mobile" && selectedNoteId) {
    return (
      <div className="flex flex-col h-screen">
        <div>
          <button className="btn mt-4 ml-4 px-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
              onClick={deselectNote}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        </div>
        {editor}
      </div>
    );
  }

  if (screenSize === "mobile") {
    return (
      <div className="drawer">
        <input
          id="my-finest-drawer-mobile"
          type="checkbox"
          className="drawer-toggle"
        />
        <div className="drawer-side">
          <label
            htmlFor="my-finest-drawer-mobile"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <div className="menu p-0 @container/sidebar bg-base-200 min-h-full w-10/12 max-w-sm">
            {sidebar}
          </div>
        </div>
        <div className="drawer-content">
          <div className="flex justify-between items-center mt-4 mx-4">
            <label
              htmlFor="my-finest-drawer-mobile"
              className="btn drawer-button px-2"
            >
              <DrawerControllerIcon />
            </label>
            <div className="dropdown dropdown-end">
              <span tabIndex={0} role="link" className="">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              </span>
              <div className="dropdown-content menu z-1 w-52 p-2">
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
                    <a href="/auth/signout" id="signout">
                      Sign out
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {noteList}
        </div>
      </div>
    );
  }

  if (screenSize === "tablet") {
    return (
      <div className="drawer h-full">
        <input
          id="my-finest-drawer-tablet"
          type="checkbox"
          className="drawer-toggle"
          defaultChecked={false}
        />
        <div className="drawer-side">
          <label
            htmlFor="my-finest-drawer-tablet"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <div className="@container/sidebar w-64 min-h-full bg-base-200 flex flex-col items-start">
            <div className="w-full grow py-0">{sidebar}</div>
            <div className="m-2" data-tip="Open">
              <label
                htmlFor="my-finest-drawer-tablet"
                className="btn btn-ghost btn-circle drawer-button rotate-y-180"
              >
                <DrawerControllerIcon />
              </label>
            </div>
          </div>
        </div>
        <div className="drawer-content flex">
          <div className="@container/sidebar overflow-visible w-14 flex flex-col justify-between border-r border-neutral-300">
            {sidebar}
            <div className="m-2 tooltip tooltip-right" data-tip="Open">
              <label
                htmlFor="my-finest-drawer-tablet"
                className="btn btn-ghost btn-circle drawer-button"
              >
                <DrawerControllerIcon />
              </label>
            </div>
          </div>
          <div className="w-4/12 max-w-sm border-r border-neutral-300 h-full">
            {noteList}
          </div>
          <div className="grow">{editor}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="drawer drawer-open">
      <input
        id="my-finest-drawer-desktop"
        type="checkbox"
        className="drawer-toggle"
        defaultChecked={true}
      />
      <div className="drawer-side is-drawer-close:overflow-visible">
        <label
          htmlFor="my-finest-drawer-desktop"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="@container/sidebar is-drawer-close:w-14 is-drawer-open:w-64 bg-base-200 flex flex-col items-start min-h-full border-r border-neutral-300">
          <div className="w-full grow py-0">{sidebar}</div>

          <div
            className="m-2 is-drawer-close:tooltip is-drawer-close:tooltip-right"
            data-tip="Open"
          >
            <label
              htmlFor="my-finest-drawer-desktop"
              className="btn btn-ghost btn-circle drawer-button is-drawer-open:rotate-y-180"
            >
              <DrawerControllerIcon />
            </label>
          </div>
        </div>
      </div>
      <div className="drawer-content flex">
        <div className="w-4/12 max-w-sm border-r border-neutral-300 h-full">
          {noteList}
        </div>
        <div className="grow">{editor}</div>
      </div>
    </div>
  );
};

export default NotesLayout;
