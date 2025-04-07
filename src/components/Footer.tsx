
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <p className="text-sm">
        Appreciate this calculator? <a href="#" className="text-blue-400 hover:underline">Donate to support</a>
      </p>
      <p className="text-xs mt-2">© {new Date().getFullYear()} CNC Machining Cost Calculator Pro</p>
    </footer>
  );
};

export default Footer;
