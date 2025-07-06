import React, { useState } from "react";

export const InputBox = ({ name, type, id, value, placeholder, title }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="relative w-[100%] mb-4">
      <h4>{title}</h4>
      <input
        name={name}
        type={
          type == "password" ? (passwordVisible ? "text " : "password") : type
        }
        placeholder={placeholder}
        defaultValue={value}
        id={id}
        className="input-box"
      />

      {type == "password" ? (
        <i
          className={
            "fi fi-rr-eye" +
            (!passwordVisible ? "-crossed" : "") +
            " left-[auto] right-4 cursor-pointer input-icon"
          }
          onClick={() => setPasswordVisible((currentVal) => !currentVal)}
        ></i>
      ) : (
        ""
      )}
    </div>
  );
};
