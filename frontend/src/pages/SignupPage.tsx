import { AiOutlineMail, AiOutlineUser } from "react-icons/ai";
import { MdOutlineLock } from "react-icons/md";
import { useNavigate, Link } from "react-router-dom";
import FormInput from "../components/molecules/FormInput";
import { useZodForm } from "../hooks/useZodForm";
import { signupFormSchema } from "../lib/validations/forms";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import SocialLoginButtons from "../components/molecules/SocialLoginButtons";
import { motion } from "framer-motion";
import main_logo from "../imgs/logo.png";
import useAuthStore from "../stores/useAuthStore";

const SignupPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useZodForm({
    schema: signupFormSchema,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
      acceptTerms: false,
    },
  });


  const onSubmit = async (data: any) => {
    try {
      await registerUser(data.name, data.email, data.password, data.role);
      // Redirect to email verification page instead of dashboard
      navigate('/verify-email', {
        state: { 
          message: 'Account created successfully! Please check your email to verify your account.',
          email: data.email
        }
      });
    } catch (error: any) {
      setError("root", {
        message: error.message || "Registration failed. Please try again.",
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
                  Create Your Account
                </h1>
                <p className="text-searchbar-text text-sm mt-2">
                  Join thousands of job seekers and employers finding success
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10">
              {errors.root && (
                <Alert variant="destructive" className="animate-shake bg-red-50/50 border-red-200/50">
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <FormInput
                  inputType="text"
                  label="Full Name"
                  Icon={AiOutlineUser}
                  error={errors.name?.message}
                  autoComplete="name"
                  {...register("name")}
                />

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
                  autoComplete="new-password"
                  {...register("password")}
                />

                <FormInput
                  inputType="password"
                  label="Confirm Password"
                  Icon={MdOutlineLock}
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-searchbar-text">
                    I am a:
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-navbar-border hover:bg-pill-bg/30 transition-colors">
                      <input
                        type="radio"
                        value="job_seeker"
                        {...register("role")}
                        className="w-4 h-4 text-pill-text accent-blue-500"
                      />
                      <div>
                        <span className="font-medium text-main-text">Job Seeker</span>
                        <p className="text-xs text-searchbar-text">Looking for employment opportunities</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-navbar-border hover:bg-pill-bg/30 transition-colors">
                      <input
                        type="radio"
                        value="employer"
                        {...register("role")}
                        className="w-4 h-4 text-pill-text accent-blue-500"
                      />
                      <div>
                        <span className="font-medium text-main-text">Employer</span>
                        <p className="text-xs text-searchbar-text">Posting jobs and finding talent</p>
                      </div>
                    </label>
                  </div>
                  {errors.role && (
                    <p className="text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("acceptTerms")}
                      className="w-4 h-4 mt-0.5 rounded border-input bg-white/80 accent-blue-500"
                    />
                    <span className="text-sm text-searchbar-text">
                      I accept the{" "}
                      <Link 
                        to="/terms" 
                        className="bg-gradient-to-r from-pill-text to-blue-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-600 font-medium transition-all duration-200"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link 
                        to="/privacy" 
                        className="bg-gradient-to-r from-pill-text to-blue-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-600 font-medium transition-all duration-200"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner className="w-4 h-4" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <span className="font-semibold">Create Account</span>
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
                Already have an account?{" "}
                <Link to="/login" className="bg-gradient-to-r from-pill-text to-blue-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-600 font-medium transition-all duration-200">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SignupPage; 