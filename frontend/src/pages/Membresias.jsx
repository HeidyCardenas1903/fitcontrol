// Registro de pagos de membresías - Autora: Heidy Viviana Cardenas Soler
import { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { mensajeDeError, servicios } from '../services/api.js';
import { Alerta, Cargando, EstadoBadge, fechaCorta, pesos } from '../components/Comunes.jsx';

export default function Membresias() {
  const afiliados = useApi(() => servicios.afiliados.listar());
  const planes = useApi(() => servicios.planes.listar());
  const [afiliadoId, setAfiliadoId] = useState('');
  const [planId, setPlanId] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const afiliado = useMemo(
    () => afiliados.datos?.find((a) => a.id === Number(afiliadoId)),
    [afiliados.datos, afiliadoId]
  );
  const plan = planes.datos?.find((p) => p.id === Number(planId));

  if (afiliados.cargando || planes.cargando) return <Cargando />;
  if (afiliados.error || planes.error) return <Alerta>{afiliados.error || planes.error}</Alerta>;

  const registrar = async (e) => {
    e.preventDefault();
    if (!afiliadoId || !planId) return setError('Seleccione el afiliado y el plan.');
    setEnviando(true);
    setError('');
    try {
      const r = await servicios.membresias.pagar({ afiliado_id: Number(afiliadoId), plan_id: Number(planId) });
      setResultado({ ...r, nombre: afiliado.nombre });
      setPlanId('');
      afiliados.recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <h1>Registrar pago</h1>
      <div className="rejilla-2">
        <form className="tarjeta formulario" onSubmit={registrar} noValidate>
          <Alerta>{error}</Alerta>
          <label>
            Afiliado
            <select value={afiliadoId} onChange={(e) => { setAfiliadoId(e.target.value); setResultado(null); }}>
              <option value="">Seleccione…</option>
              {afiliados.datos.filter((a) => a.activo).map((a) => (
                <option key={a.id} value={a.id}>{a.nombre} — {a.documento}</option>
              ))}
            </select>
          </label>
          {afiliado && (
            <p className="nota">
              Estado actual: <EstadoBadge estado={afiliado.estado} dias={afiliado.dias_restantes} />
              {afiliado.fecha_fin && <> · vence {fechaCorta(afiliado.fecha_fin)}</>}
            </p>
          )}
          <fieldset className="planes">
            <legend>Plan</legend>
            {planes.datos.map((p) => (
              <label key={p.id} className={`plan ${Number(planId) === p.id ? 'elegido' : ''}`}>
                <input type="radio" name="plan" value={p.id} checked={Number(planId) === p.id} onChange={(e) => setPlanId(e.target.value)} />
                <strong>{p.nombre}</strong>
                <span>{p.duracion_dias} días</span>
                <span className="precio">{pesos(p.precio)}</span>
              </label>
            ))}
          </fieldset>
          <button className="btn btn-primario btn-bloque" disabled={enviando}>
            {enviando ? 'Registrando…' : plan ? `Registrar pago de ${pesos(plan.precio)}` : 'Registrar pago'}
          </button>
        </form>

        <section className="tarjeta">
          <h2>Comprobante</h2>
          {resultado ? (
            <dl className="comprobante">
              <dt>Afiliado</dt><dd>{resultado.nombre}</dd>
              <dt>Plan</dt><dd>{resultado.plan}</dd>
              <dt>Valor</dt><dd>{pesos(resultado.valor_pagado)}</dd>
              <dt>Desde</dt><dd>{fechaCorta(resultado.fecha_inicio)}</dd>
              <dt>Hasta</dt><dd>{fechaCorta(resultado.fecha_fin)}</dd>
              <dt>Estado</dt><dd><EstadoBadge estado={resultado.estado} dias={resultado.dias_restantes} /></dd>
            </dl>
          ) : (
            <p className="vacio">Aquí verá el resumen del pago registrado. Si el afiliado todavía tiene días de su plan, el nuevo periodo empieza cuando termine el actual.</p>
          )}
        </section>
      </div>
    </>
  );
}
