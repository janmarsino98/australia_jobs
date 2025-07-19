import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface NavProfileIconProps {
  profImg: string;
  alt: string;
}

const NavProfileIcon = ({ profImg, alt }: NavProfileIconProps): JSX.Element => {
  const [imageSrc, setImageSrc] = useState(profImg);
  const [hasError, setHasError] = useState(false);

  // Default fallback image
  const defaultImage = "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

  // Update imageSrc when profImg prop changes
  useEffect(() => {
    setImageSrc(profImg);
    setHasError(false);
  }, [profImg]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(defaultImage);
    }
  };

  const handleImageLoad = () => {
    // Only reset error state if we're not using the default image
    if (imageSrc !== defaultImage) {
      setHasError(false);
    }
  };

  return (
    <button 
      className="flex items-center space-x-2 rounded-full transition-all duration-200 hover:bg-pill-bg/50 p-1 focus:outline-none focus:ring-2 focus:ring-pill-text focus:ring-offset-2 group"
      aria-label="Open user menu"
    >
      <div className="relative w-8 h-8">
        <img 
          src={imageSrc} 
          alt={alt} 
          className="w-full h-full object-cover rounded-full transition-transform duration-200 group-hover:scale-105" 
          onError={handleImageError}
          onLoad={handleImageLoad}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 rounded-full ring-1 ring-black/5" />
      </div>
      <ChevronDown className="w-4 h-4 text-main-text transition-transform duration-200 group-hover:text-pill-text group-hover:-rotate-180" />
    </button>
  );
};

export default NavProfileIcon; 