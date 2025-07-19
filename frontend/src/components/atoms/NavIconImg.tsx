
interface NavIconImgProps {
  img_url: string;
  alt: string;
}

const NavIconImg = ({ img_url, alt }: NavIconImgProps): JSX.Element => {
  return (
    <img 
      src={img_url} 
      alt={alt} 
      className="h-12 w-auto object-contain transition-opacity duration-200 group-hover:opacity-80" 
    />
  );
};

export default NavIconImg; 