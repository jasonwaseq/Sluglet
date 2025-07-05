import Image from 'next/image';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-black"
    >
      {/* Logo at the top middle */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <Image 
          src="/Sluglet Logo.svg" 
          alt="Sluglet Logo" 
          width={300} 
          height={150}
          priority
        />
      </div>

      {/* Login form below the logo */}
      <div className="mt-32">
        <LoginForm />
      </div>
    </main>
  );
} 
