import { AiOutlineMail } from "react-icons/ai";
import { MdOutlineLock } from "react-icons/md";
import { useNavigate, Link, useLocation } from "react-router-dom";
import FormInput from "../components/molecules/FormInput";
import { useZodForm } from "../hooks/useZodForm";
import { loginFormSchema } from "../lib/validations/forms";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import SocialLoginButtons from "../components/molecules/SocialLoginButtons";
import { motion } from "framer-motion";
import main_logo from "../imgs/logo.png";
import useAuthStore from "../stores/useAuthStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  
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
      rememberMe: false,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/dashboard');
    } catch (error: any) {
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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, delay: 0.1 }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-blue-100/30"></div>
      </div>
      
      {/* Floating gradient orbs for visual appeal */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={cardVariants}>
          <Card className="backdrop-blur-sm bg-white/80 shadow-2xl border border-white/50 relative overflow-hidden">
            {/* Card gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-blue-50/30 pointer-events-none"></div>
            
            <CardHeader className="space-y-6 text-center relative z-10">
              <div className="flex justify-center">
                <motion.div 
                  className="w-24 h-24 overflow-hidden mb-2 relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full"></div>
                  <img
                    src={main_logo}
                    alt="Logo"
                    className="rounded-full object-cover w-full h-full shadow-lg relative z-10"
                  />
                </motion.div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-to-br from-main-text to-searchbar-text bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-searchbar-text text-sm mt-2">
                  Sign in to access your job search dashboard and saved applications
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              {location.state?.message && (
                <Alert className="bg-blue-50/50 border-blue-200/50">
                  <AlertDescription>{location.state.message}</AlertDescription>
                </Alert>
              )}

              {errors.root && (
                <Alert variant="destructive" className="animate-shake bg-red-50/50 border-red-200/50">
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <FormInput
                  inputType="email"
                  label="Email Address"
                  Icon={AiOutlineMail}
                  error={errors.email?.message}
                  autoComplete="email"
                  {...register("email")}
                />
                <FormInput
                  inputType="password"
                  label="Password"
                  Icon={MdOutlineLock}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  {...register("password")}
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("rememberMe")}
                      className="w-4 h-4 rounded border-input bg-white/80 accent-blue-500"
                    />
                    <span className="text-searchbar-text">Remember me</span>
                  </label>
                  <Link
                    to="/reset-password"
                    className="bg-gradient-to-r from-pill-text to-blue-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-600 font-medium transition-all duration-200"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner className="w-4 h-4" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span className="font-semibold">Sign In</span>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-navbar-border to-transparent"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-searchbar-text">Or continue with</span>
                </div>
              </div>

              <SocialLoginButtons />
            </CardContent>

            <CardFooter className="justify-center relative z-10">
              <p className="text-center text-sm text-searchbar-text">
                Don't have an account?{" "}
                <Link to="/signup" className="bg-gradient-to-r from-pill-text to-blue-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-600 font-medium transition-all duration-200">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
