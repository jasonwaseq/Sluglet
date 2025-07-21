import React from "react";

type Props = {
  error: string;
};
const ProfileMessage: React.FC<Props> = ({ error }) => {
  return (
    <div className="mt-6 p-6 bg-red-500 text-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <span className="font-semibold">{error}</span>
      </div>
    </div>
  );
};

export default ProfileMessage;
