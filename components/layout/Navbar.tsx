import Logo from "@/components/ui/Logo";

export default function Navbar() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
      <a href="#" aria-label="Tokens home">
        <Logo />
      </a>
    </header>
  );
}
