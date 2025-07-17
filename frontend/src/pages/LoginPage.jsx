import { AiOutlineMail } from "react-icons/ai";
import { MdOutlineLock } from "react-icons/md";
import { useNavigate, Link } from "react-router-dom";
import FormInput from "../components/molecules/FormInput";
import { useZodForm } from "../hooks/useZodForm";
import { loginFormSchema } from "../lib/validations/forms";
import { Alert, AlertDescription } from "../components/ui/alert";
import useAuthStore from "../stores/useAuthStore";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { motion } from "framer-motion";
import main_logo from "../imgs/logo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useZodForm({
    schema: loginFormSchema,
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/dashboard');
    } catch (error) {
      setError("root", {
        message: error.response?.data?.message || "Invalid email or password. Please try again.",
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="bg-white shadow-xl rounded-2xl px-8 py-10 space-y-8">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 overflow-hidden mb-6 transform hover:scale-105 transition-transform duration-200">
              <img
                src={main_logo}
                alt="Logo"
                className="rounded-full object-cover w-full h-full shadow-md"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-center max-w-sm">
              Sign in to access your job search dashboard and saved applications
            </p>
          </div>

          {errors.root && (
            <Alert variant="destructive" className="animate-shake">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              inputType="email"
              label="Email Address"
              Icon={AiOutlineMail}
              error={errors.email?.message}
              className="focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
              {...register("email")}
            />
            <FormInput
              inputType="password"
              label="Password"
              Icon={MdOutlineLock}
              error={errors.password?.message}
              className="focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
              {...register("password")}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Remember me</span>
              </label>
              <Link
                to="/reset-password"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className={`w-full flex justify-center items-center space-x-2 rounded-lg py-3 px-4 text-white font-medium transition-all duration-200 ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-95"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {/* TODO: Implement Google OAuth */}}
            >
              <img
                className="h-5 w-5 mr-2"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google logo"
              />
              <span>Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {/* TODO: Implement LinkedIn OAuth */}}
            >
              <img
                className="h-5 w-5 mr-2"
                src="https://www.svgrepo.com/show/448234/linkedin.svg"
                alt="LinkedIn logo"
              />
              <span>LinkedIn</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
