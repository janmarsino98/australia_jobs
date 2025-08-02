import { useState } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { LoadingSpinner } from "./LoadingSpinner";
import { useToast } from "../ui/use-toast";
import { buildApiUrl } from "../../config";
import * as z from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onEmailChangeRequested: () => void;
}

const EmailChangeModal = ({ 
  isOpen, 
  onClose, 
  currentEmail, 
  onEmailChangeRequested 
}: EmailChangeModalProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "verification">("input");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate emails
    try {
      emailSchema.parse({ email: newEmail });
    } catch {
      setError("Please enter a valid email address");
      return;
    }

    if (newEmail !== confirmEmail) {
      setError("Email addresses do not match");
      return;
    }

    if (newEmail === currentEmail) {
      setError("New email address must be different from current email");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/users/profile"), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request email change');
      }

      const result = await response.json();
      
      if (result.email_verification_pending) {
        setStep("verification");
        toast({
          title: "Verification Email Sent",
          description: `A verification email has been sent to ${newEmail}`,
        });
        onEmailChangeRequested();
      } else {
        // This shouldn't happen based on our implementation, but handle it
        toast({
          title: "Email Updated",
          description: "Your email has been updated successfully",
        });
        onClose();
      }
    } catch (error: any) {
      setError(error.message || "Failed to request email change. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewEmail("");
    setConfirmEmail("");
    setError("");
    setStep("input");
    onClose();
  };

  const resendVerification = async () => {
    if (!newEmail) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(buildApiUrl("/users/profile"), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail }),
      });

      if (response.ok) {
        toast({
          title: "Verification Email Sent",
          description: `A new verification email has been sent to ${newEmail}`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Change Email Address
          </DialogTitle>
          <DialogDescription>
            {step === "input" 
              ? "Enter your new email address. You'll need to verify it before the change takes effect."
              : "A verification email has been sent to your new email address."
            }
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Current Email
              </label>
              <Input
                type="email"
                value={currentEmail}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Email Address
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirm New Email
              </label>
              <Input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Confirm new email address"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Sending Verification...
                  </>
                ) : (
                  "Send Verification Email"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verification Email Sent
              </h3>
              <p className="text-gray-600 mb-4">
                We've sent a verification email to <strong>{newEmail}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Click the verification link in the email to complete your email change.
                Your current email address will remain active until the new one is verified.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> The verification link will expire in 24 hours.
                If you don't verify within this time, you'll need to request a new email change.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={resendVerification}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Resending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailChangeModal;