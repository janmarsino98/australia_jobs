import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-main-white-bg flex items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-semibold text-main-text mb-4">
          Access Denied
        </h1>
        <p className="text-searchbar-text text-lg mb-8">
          You don't have permission to access this page.
        </p>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="min-w-[120px]"
          >
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="min-w-[120px]"
          >
            Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage; 