import { Navbar } from '@/components/layout/navbar'
import { SearchBox } from '@/components/search/search-box'

const POPULAR = ['Paracetamol', 'Ibuprofeno', 'Amoxicilina', 'Metformina', 'Atorvastatina']

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col">
        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4 pb-24 pt-16">
          <div className="w-full max-w-2xl text-center">
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Compara precios de<br className="hidden sm:block" />
              <span className="text-emerald-600"> medicamentos</span>
            </h1>
            <p className="mb-8 text-lg text-gray-600">
              Cruz Verde, Salcobrand, Ahumada y Dr. Simi — en un solo lugar
            </p>

            <SearchBox autoFocus placeholder="Busca un medicamento..." />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-gray-400">Populares:</span>
              {POPULAR.map((name) => (
                <a
                  key={name}
                  href={`/search?q=${encodeURIComponent(name)}`}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-100 bg-white py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 sm:grid-cols-3">
            {[
              { icon: '🔍', title: 'Busca al instante', desc: 'Autocompletado con más de 11.000 medicamentos del catálogo MINSAL' },
              { icon: '💰', title: 'Compara precios', desc: 'Precios actualizados cada 6 horas en las 4 principales cadenas del país' },
              { icon: '🔔', title: 'Alerta de precios', desc: 'Te avisamos cuando el precio baja del umbral que defines' },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="mb-3 text-4xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
