import Image from 'next/image';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <div 
      className="w-screen h-screen bg-sky-500 flex items-center justify-center"
      style={{
        aspectRatio: '16/9',
        minHeight: '100vh',
        minWidth: '100vw'
      }}
    >
      <main
        className="relative w-full h-full flex flex-col items-center justify-center px-4"
        style={{
          aspectRatio: '16/9',
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
      >
        {/* Logo at the top middle */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{
            top: '5%',
            width: 'min(25vw, 300px)',
            height: 'auto'
          }}
        >
          <Image 
            src="/Sluglet Logo.svg" 
            alt="Sluglet Logo" 
            width={300} 
            height={300}
            priority
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Login form below the logo */}
        <div 
          className="flex items-center justify-center"
          style={{
            marginTop: '25%',
            width: '100%',
            maxWidth: 'min(90vw, 500px)'
          }}
        >
          <LoginForm />
        </div>
      </main>
    </div>
  );
} 
