import React from "react";

const RemoteTag = ({ text }) => {
  return (
    <div className="border border-remote-tag-border text-remote-tag-text font-bold py-1 px-2 rounded-md w-max text-[12px]">
      {text.toUpperCase()}
    </div>
  );
};

export default RemoteTag;
