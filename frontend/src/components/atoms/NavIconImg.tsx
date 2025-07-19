
interface NavIconImgProps {
  img_url: string;
  alt: string;
}

const NavIconImg = ({ img_url, alt }: NavIconImgProps): JSX.Element => {
  return (
    <div className="w-24 h-24 -my-4 rounded-full transition-transform duration-200 group-hover:scale-105 shadow-md">
      <img 
        src={img_url} 
        alt={alt} 
        className="w-full h-full object-cover rounded-full" 
      />
    </div>
  );
};

export default NavIconImg; 