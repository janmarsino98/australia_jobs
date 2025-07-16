import { AiOutlineMail } from "react-icons/ai";
import { MdOutlineLock } from "react-icons/md";
import FormInput from "../components/molecules/FormInput";
import httpClient from "../httpClient";
import main_logo from "../imgs/logo.png";
import { useZodForm } from "../hooks/useZodForm";
import { loginFormSchema } from "../lib/validations/forms";
import { Alert, AlertDescription } from "../components/ui/alert";

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useZodForm({
    schema: loginFormSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await httpClient.post("http://localhost:5000/auth/login", data);
      window.location.href = "/";
    } catch (error) {
      setError("root", {
        message: "Invalid email or password. Please try again.",
      });
    }
  };

  return (
    <div className="w-full h-full items-center justify-center flex">
      <div className="flex border border-dark-white flex-col px-5 py-10 max-w-[50%] gap-5 rounded-lg">
        <div className="w-full flex flex-col justify-center items-center">
          <div className="w-[80px] flex items-center justify-center h-[80px] overflow-hidden">
            <img
              src={main_logo}
              alt="No img"
              className="rounded-full object-fill h-full w-full"
            />
          </div>
        </div>

        {errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <FormInput
          inputType="email"
          label="Email"
          Icon={AiOutlineMail}
          error={errors.email?.message}
          {...register("email")}
        />
        <FormInput
          inputType="password"
          label="Password"
          Icon={MdOutlineLock}
          error={errors.password?.message}
          {...register("password")}
        />

        <button
          className={`rounded-full py-3 text-white ${
            isSubmitting ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? "Logging in..." : "Login"}
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
