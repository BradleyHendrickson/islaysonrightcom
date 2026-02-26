import Wheel from "./components/Wheel";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-950 mb-4 text-center">
        Is Layson Right?
      </h1>
      <Wheel />
    </main>
  );
}
