import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ComponentType } from "react";

interface LandingCardProps {
  title: string;
  text: string;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
}

const LandingCard = ({ title, text, href, icon: Icon }: LandingCardProps) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold mb-2 text-gray-800 flex flex-row items-center">
        {Icon && <Icon className="mr-2 text-blue-500" />} {title}
      </h2>
      <p className="text-gray-600">{text}</p>
      {href && (
        <Link
          to={href}
          className="mt-4 inline-block text-blue-500 hover:underline"
        >
          Learn more →
        </Link>
      )}
    </div>
  );
};

LandingCard.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  href: PropTypes.string,
  icon: PropTypes.elementType,
};

export default LandingCard;
