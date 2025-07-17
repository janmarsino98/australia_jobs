import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineMail, AiOutlineLock } from "react-icons/ai";
import { useZodForm } from "../hooks/useZodForm";
import { resetPasswordSchema, resetPasswordRequestSchema } from "../lib/validations/forms";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import FormInput from "../components/molecules/FormInput";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { motion } from "framer-motion";
import main_logo from "../imgs/logo.png";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // "request" or "reset"
  const [email, setEmail] = useState("");

  const requestForm = useZodForm({
    schema: resetPasswordRequestSchema,
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useZodForm({
    schema: resetPasswordSchema,
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onRequestSubmit = async (data) => {
    try {
      // TODO: Implement password reset request
      setEmail(data.email);
      setStep("reset");
    } catch (error) {
      requestForm.setError("root", {
        message: error.response?.data?.message || "Failed to send reset code. Please try again.",
      });
    }
  };

  const onResetSubmit = async (data) => {
    try {
      // TODO: Implement password reset
      navigate("/login", { 
        state: { message: "Password reset successful. Please login with your new password." }
      });
    } catch (error) {
      resetForm.setError("root", {
        message: error.response?.data?.message || "Failed to reset password. Please try again.",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen bg-main-white-bg flex items-center justify-center px-6">
      <motion.div 
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="shadow-lg border-navbar-border">
          <CardHeader className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 overflow-hidden mb-2 transform hover:scale-105 transition-transform duration-200">
                <img
                  src={main_logo}
                  alt="Logo"
                  className="rounded-full object-cover w-full h-full shadow-md"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-main-text">
                {step === "request" ? "Reset Password" : "Enter Reset Code"}
              </h1>
              <p className="text-searchbar-text text-sm mt-2">
                {step === "request" 
                  ? "Enter your email to receive a password reset code"
                  : "Check your email for the reset code"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "request" ? (
              <form className="space-y-6" onSubmit={requestForm.handleSubmit(onRequestSubmit)}>
                {requestForm.formState.errors.root && (
                  <Alert variant="destructive" className="animate-shake">
                    <AlertDescription>{requestForm.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                <FormInput
                  inputType="email"
                  label="Email Address"
                  Icon={AiOutlineMail}
                  error={requestForm.formState.errors.email?.message}
                  className="bg-dark-white text-searchbar-text text-[16px]"
                  autoComplete="email"
                  {...requestForm.register("email")}
                />

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={requestForm.formState.isSubmitting}
                >
                  {requestForm.formState.isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Sending Code...</span>
                    </div>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
                {resetForm.formState.errors.root && (
                  <Alert variant="destructive" className="animate-shake">
                    <AlertDescription>{resetForm.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                <FormInput
                  inputType="text"
                  label="Reset Code"
                  error={resetForm.formState.errors.code?.message}
                  className="bg-dark-white text-searchbar-text text-[16px]"
                  {...resetForm.register("code")}
                />

                <FormInput
                  inputType="password"
                  label="New Password"
                  Icon={AiOutlineLock}
                  error={resetForm.formState.errors.newPassword?.message}
                  className="bg-dark-white text-searchbar-text text-[16px]"
                  {...resetForm.register("newPassword")}
                />

                <FormInput
                  inputType="password"
                  label="Confirm Password"
                  Icon={AiOutlineLock}
                  error={resetForm.formState.errors.confirmPassword?.message}
                  className="bg-dark-white text-searchbar-text text-[16px]"
                  {...resetForm.register("confirmPassword")}
                />

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={resetForm.formState.isSubmitting}
                >
                  {resetForm.formState.isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-center text-sm text-searchbar-text">
              Remember your password?{" "}
              <Link to="/login" className="text-pill-text hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage; 