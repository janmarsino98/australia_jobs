import React, { useState } from "react";
import { AiOutlineMail } from "react-icons/ai";
import { MdOutlineLock } from "react-icons/md";
import FormInput from "../molecules/FormInput";
import logo from "../../imgs/AJ_Logo.png";
import { useNavigate } from "react-router-dom";
import httpClient from "../../httpClient";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const loginActive = email && password;

  const logUser = async () => {
    console.log(email, password);

    try {
      const response = await httpClient.post("http://localhost:5000/login", {
        email,
        password,
      });
      window.location.href = "/";
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="w-full h-full items-center justify-center flex">
      <div className="flex border border-dark-white flex-col px-5 py-10 max-w-[50%] gap-5 rounded-lg">
        <div className="w-full flex flex-col justify-center items-center">
          <div className="w-[80px] flex items-center justify-center h-[80px] overflow-hidden">
            <img
              src={logo}
              alt="No img"
              className="rounded-full object-fill h-full w-full"
            />
          </div>
        </div>
        <FormInput
          inputType={"email"}
          label={"email"}
          Icon={AiOutlineMail}
          onChange={handleEmailChange}
        />
        <FormInput
          inputType={"password"}
          label={"password"}
          Icon={MdOutlineLock}
          onChange={handlePasswordChange}
        />
        <button
          className={`rounded-full py-3 text-white ${
            loginActive ? "bg-blue-500" : "bg-gray-400"
          }`}
          disabled={!loginActive}
          onClick={logUser}
        >
          Login
        </button>
        <div className="flex flex-row justify-between text-[12px]">
          <a href="/signup">
            <span>Signup</span>
          </a>
          <a href="/resetpassword">
            <span>Forgot Password?</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
