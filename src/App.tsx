import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { PlateTable } from './components/PlateTable';
import { usePlates } from './hooks/usePlates';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const { plates, savePlates, deletePlate, refresh, loading } = usePlates();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Inicio de Sesión</h2>
          <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>Acceso exclusivo para personal autorizado.</p>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Gestor de Placas</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Conectado como: {session.user.email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ background: '#ef4444' }}>Cerrar Sesión</button>
      </header>
      
      <main>
        <div className="card">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando placas...</p>
          ) : (
            <PlateTable 
              plates={plates} 
              onPlatesChange={savePlates} 
              onDelete={deletePlate}
              onRefresh={refresh}
            />
          )}
        </div>
      </main>

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        <p>Tip: Puedes pegar una lista de placas directamente en el buscador.</p>
      </footer>
    </div>
  );
}

function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Correo Electrónico</label>
        <input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>Error: {error}</p>}
      <button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
        {loading ? 'Iniciando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default App;
