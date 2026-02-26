import Image from "next/image";
import Wheel from "./components/Wheel";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-4 px-6 pb-6">
      <div className="flex justify-center mb-2">
        <Image
          src="/images/layson.jpg"
          alt="Layson"
          width={280}
          height={280}
          className="rounded-full object-cover w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64"
        />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-950 mb-6 text-center">
        Is Layson Right?
      </h1>
      <Wheel />
    </main>
  );
}
