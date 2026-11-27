// Clases grupales y reservas - Autora: Heidy Viviana Cardenas Soler
import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { mensajeDeError, servicios } from '../services/api.js';
import { Alerta, Cargando, Modal, fechaHora } from '../components/Comunes.jsx';

const NUEVA = { nombre: '', instructor: '', fecha_hora: '', cupo: 10 };

export default function Clases() {
  const { esAdmin } = useAuth();
  const { datos, cargando, error, recargar } = useApi(() => servicios.clases.listar());
  const afiliados = useApi(() => (esAdmin ? servicios.afiliados.listar({ estado: undefined }) : Promise.resolve([])), [esAdmin]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [modal, setModal] = useState(false);
  const [nueva, setNueva] = useState(NUEVA);
  const [paraAfiliado, setParaAfiliado] = useState({});
  const [ocupado, setOcupado] = useState(null);

  const cerrar = useCallback(() => setModal(false), []);

  const accion = async (id, fn, exito) => {
    setOcupado(id);
    try {
      await fn();
      setMensaje({ tipo: 'exito', texto: exito });
      recargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeDeError(err) });
    } finally {
      setOcupado(null);
    }
  };

  const crear = async (e) => {
    e.preventDefault();
    if (nueva.nombre.trim().length < 3 || nueva.instructor.trim().length < 3 || !nueva.fecha_hora || nueva.cupo < 1) {
      setMensaje({ tipo: 'error', texto: 'Complete todos los campos de la clase (cupo mínimo 1).' });
      return;
    }
    await accion('nueva', () => servicios.clases.crear({ ...nueva, cupo: Number(nueva.cupo) }), 'Clase creada.');
    setNueva(NUEVA);
    setModal(false);
  };

  return (
    <>
      <div className="encabezado">
        <h1>{esAdmin ? 'Clases grupales' : 'Reservar clases'}</h1>
        {esAdmin && <button type="button" className="btn btn-primario" onClick={() => setModal(true)}>+ Nueva clase</button>}
      </div>
      <Alerta tipo={mensaje.tipo} onCerrar={() => setMensaje({ tipo: '', texto: '' })}>{mensaje.texto}</Alerta>
      {cargando && <Cargando />}
      <Alerta>{error}</Alerta>

      <section className="clases">
        {datos?.length === 0 && <p className="vacio">No hay clases programadas.</p>}
        {datos?.map((c) => {
          const porcentaje = Math.round((c.reservados / c.cupo) * 100);
          const lleno = c.disponibles <= 0;
          return (
            <article key={c.id} className={`clase ${lleno ? 'llena' : ''}`}>
              <header>
                <h2>{c.nombre}</h2>
                <span className="cuando">{fechaHora(c.fecha_hora)}</span>
              </header>
              <p className="instructor">Con {c.instructor}</p>
              <div className="barra-cupo" role="progressbar" aria-valuenow={c.reservados} aria-valuemin={0} aria-valuemax={c.cupo} aria-label="Cupos ocupados">
                <span style={{ width: `${porcentaje}%` }} />
              </div>
              <p className="cupos-texto">{lleno ? 'Sin cupos' : `${c.disponibles} de ${c.cupo} cupos disponibles`}</p>

              {!esAdmin && (c.reservada ? (
                <button type="button" className="btn btn-secundario btn-bloque" disabled={ocupado === c.id}
                  onClick={() => accion(c.id, () => servicios.clases.cancelar(c.id), 'Reserva cancelada.')}>
                  Cancelar reserva
                </button>
              ) : (
                <button type="button" className="btn btn-primario btn-bloque" disabled={lleno || ocupado === c.id}
                  onClick={() => accion(c.id, () => servicios.clases.reservar(c.id), '¡Cupo reservado!')}>
                  {lleno ? 'Clase llena' : 'Reservar cupo'}
                </button>
              ))}

              {esAdmin && (
                <div className="reserva-admin">
                  <select value={paraAfiliado[c.id] || ''} aria-label={`Afiliado para ${c.nombre}`}
                    onChange={(e) => setParaAfiliado({ ...paraAfiliado, [c.id]: e.target.value })}>
                    <option value="">Reservar para…</option>
                    {afiliados.datos?.filter((a) => a.activo).map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                  <button type="button" className="btn btn-primario btn-pequeno" disabled={!paraAfiliado[c.id] || lleno || ocupado === c.id}
                    onClick={() => accion(c.id, () => servicios.clases.reservar(c.id, Number(paraAfiliado[c.id])), 'Reserva registrada.')}>
                    Reservar
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <Modal titulo="Nueva clase" abierto={modal} onCerrar={cerrar}>
        <form onSubmit={crear} className="formulario" noValidate>
          <label>Nombre<input value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} /></label>
          <label>Instructor<input value={nueva.instructor} onChange={(e) => setNueva({ ...nueva, instructor: e.target.value })} /></label>
          <label>Fecha y hora<input type="datetime-local" value={nueva.fecha_hora} onChange={(e) => setNueva({ ...nueva, fecha_hora: e.target.value })} /></label>
          <label>Cupo<input type="number" min="1" value={nueva.cupo} onChange={(e) => setNueva({ ...nueva, cupo: e.target.value })} /></label>
          <div className="botones">
            <button type="button" className="btn btn-secundario" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-primario" disabled={ocupado === 'nueva'}>Crear clase</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
