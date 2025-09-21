"use client";

import Image from "next/image";
import { useEffect } from "react";

// SVG Icon Components
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const Toggle = ({ label, enabled, setEnabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-300">{label}</span>
    <button
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        enabled ? "bg-indigo-500" : "bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export default function SettingsModal({ isOpen, onClose, session }) {
  // Add an effect to handle the 'Escape' key to close the modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-full max-w-md text-gray-200 transform transition-all duration-300 animate-scale-in"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* User Profile Info */}
        <div className="p-6 text-center border-b border-white/10">
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full mx-auto mb-3 border-2 border-white/20"
            />
          )}
          <h3 className="font-bold text-lg text-white">
            {session?.user?.name}
          </h3>
          <p className="text-sm text-gray-400">{session?.user?.email}</p>
        </div>

        {/* Settings Options */}
        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Preferences</h4>
            <div className="space-y-3 p-4 bg-white/5 rounded-lg">
              <Toggle
                label="Email Notifications"
                enabled={true}
                setEnabled={() => {}}
              />
              <Toggle
                label="Sync Public Repos"
                enabled={true}
                setEnabled={() => {}}
              />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Theme</h4>
            <div className="p-4 bg-white/5 rounded-lg">
              <Toggle label="Dark Mode" enabled={true} setEnabled={() => {}} />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Account</h4>
            <div className="flex flex-col space-y-3">
              <button className="w-full text-left px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-300">
                Manage Subscription
              </button>
              <button className="w-full text-left px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors duration-300">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
