// Inicio: tablero del administrador o "Mi membresía" del afiliado
// Autora: Heidy Viviana Cardenas Soler
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { servicios } from '../services/api.js';
import { Alerta, Cargando, EstadoBadge, fechaCorta, fechaHora } from '../components/Comunes.jsx';

function TableroAdmin() {
  const afiliados = useApi(() => servicios.afiliados.listar());
  const alertas = useApi(() => servicios.membresias.alertas());
  const clases = useApi(() => servicios.clases.listar());

  if (afiliados.cargando || alertas.cargando || clases.cargando) return <Cargando />;
  const error = afiliados.error || alertas.error || clases.error;
  if (error) return <Alerta>{error}</Alerta>;

  const activos = afiliados.datos.filter((a) => a.activo);
  const cuenta = (estado) => activos.filter((a) => a.estado === estado).length;

  return (
    <>
      <h1>Panel de control</h1>
      <section className="indicadores" aria-label="Resumen">
        <article className="indicador"><span>{activos.length}</span>Afiliados activos</article>
        <article className="indicador ok"><span>{cuenta('vigente')}</span>Membresías vigentes</article>
        <article className="indicador aviso"><span>{cuenta('por_vencer')}</span>Por vencer (7 días)</article>
        <article className="indicador peligro"><span>{cuenta('vencida') + cuenta('sin_membresia')}</span>Vencidas o sin plan</article>
      </section>

      <div className="rejilla-2">
        <section className="tarjeta">
          <h2>Cobros pendientes</h2>
          {alertas.datos.length === 0 ? (
            <p className="vacio">No hay membresías vencidas ni por vencer.</p>
          ) : (
            <ul className="lista">
              {alertas.datos.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.nombre}</strong>
                    <small>{a.fecha_fin ? `Vence: ${fechaCorta(a.fecha_fin)}` : 'Nunca ha pagado'}</small>
                  </div>
                  <EstadoBadge estado={a.estado} dias={a.dias_restantes} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/membresias" className="btn btn-primario">Registrar pago</Link>
        </section>

        <section className="tarjeta">
          <h2>Próximas clases</h2>
          <ul className="lista">
            {clases.datos.slice(0, 5).map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.nombre}</strong>
                  <small>{fechaHora(c.fecha_hora)} · {c.instructor}</small>
                </div>
                <span className={`cupos ${c.disponibles === 0 ? 'lleno' : ''}`}>{c.reservados}/{c.cupo}</span>
              </li>
            ))}
          </ul>
          <Link to="/clases" className="btn btn-secundario">Ver clases</Link>
        </section>
      </div>
    </>
  );
}

function MiMembresia({ afiliadoId }) {
  const { datos, cargando, error } = useApi(() => servicios.afiliados.obtener(afiliadoId), [afiliadoId]);
  if (cargando) return <Cargando />;
  if (error) return <Alerta>{error}</Alerta>;
  return (
    <>
      <h1>Hola, {datos.nombre.split(' ')[0]}</h1>
      <section className="tarjeta destacado">
        <h2>Mi membresía</h2>
        <p className="estado-grande"><EstadoBadge estado={datos.estado} dias={datos.dias_restantes} /></p>
        {datos.fecha_fin && <p>Tu plan vence el <strong>{fechaCorta(datos.fecha_fin)}</strong>.</p>}
        {datos.estado !== 'vigente' && <p>Acércate a la recepción para renovar tu plan.</p>}
        <Link to="/clases" className="btn btn-primario">Reservar una clase</Link>
      </section>
      <section className="tarjeta">
        <h2>Historial de pagos</h2>
        <table>
          <thead><tr><th>Plan</th><th>Pago</th><th>Desde</th><th>Hasta</th></tr></thead>
          <tbody>
            {datos.membresias.map((m) => (
              <tr key={m.id}>
                <td>{m.plan}</td><td>{fechaCorta(m.fecha_pago)}</td><td>{fechaCorta(m.fecha_inicio)}</td><td>{fechaCorta(m.fecha_fin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default function Inicio() {
  const { esAdmin, usuario } = useAuth();
  if (esAdmin) return <TableroAdmin />;
  if (!usuario.afiliado_id) return <Alerta>Su usuario no está vinculado a un afiliado.</Alerta>;
  return <MiMembresia afiliadoId={usuario.afiliado_id} />;
}
