// Gestión de afiliados (CRUD) - Autora: Heidy Viviana Cardenas Soler
import { useCallback, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { mensajeDeError, servicios } from '../services/api.js';
import { Alerta, Cargando, EstadoBadge, Modal } from '../components/Comunes.jsx';

const VACIO = { nombre: '', documento: '', correo: '', telefono: '' };

function validar(f) {
  const e = {};
  if (f.nombre.trim().length < 3) e.nombre = 'Mínimo 3 caracteres.';
  if (!/^\d{5,20}$/.test(f.documento.trim())) e.documento = 'Solo números, entre 5 y 20 dígitos.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo)) e.correo = 'Correo no válido.';
  if (f.telefono && !/^\d{7,15}$/.test(f.telefono)) e.telefono = 'Solo números, entre 7 y 15 dígitos.';
  return e;
}

export default function Afiliados() {
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const { datos, cargando, error, recargar } = useApi(
    () => servicios.afiliados.listar({ buscar, estado: estado || undefined }),
    [buscar, estado]
  );
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(null); // null = cerrado, 0 = nuevo, id = edición
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);

  const cerrar = useCallback(() => setEditando(null), []);

  const abrir = (a) => {
    setForm(a ? { nombre: a.nombre, documento: a.documento, correo: a.correo, telefono: a.telefono || '' } : VACIO);
    setErrores({});
    setEditando(a ? a.id : 0);
  };

  const guardar = async (e) => {
    e.preventDefault();
    const v = validar(form);
    setErrores(v);
    if (Object.keys(v).length) return;
    setGuardando(true);
    try {
      if (editando) await servicios.afiliados.actualizar(editando, form);
      else await servicios.afiliados.crear(form);
      setMensaje({ tipo: 'exito', texto: editando ? 'Afiliado actualizado.' : 'Afiliado registrado.' });
      setEditando(null);
      recargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeDeError(err) });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarActivo = async (a) => {
    try {
      if (a.activo) {
        if (!window.confirm(`¿Inactivar a ${a.nombre}? Conservará su historial.`)) return;
        await servicios.afiliados.inactivar(a.id);
      } else {
        await servicios.afiliados.actualizar(a.id, { activo: true });
      }
      recargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeDeError(err) });
    }
  };

  const campo = (nombre, etiqueta, tipo = 'text') => (
    <label>
      {etiqueta}
      <input
        name={nombre}
        type={tipo}
        value={form[nombre]}
        onChange={(e) => setForm({ ...form, [nombre]: e.target.value })}
        aria-invalid={!!errores[nombre]}
      />
      {errores[nombre] && <small className="error-campo">{errores[nombre]}</small>}
    </label>
  );

  return (
    <>
      <div className="encabezado">
        <h1>Afiliados</h1>
        <button type="button" className="btn btn-primario" onClick={() => abrir(null)}>+ Nuevo afiliado</button>
      </div>
      <Alerta tipo={mensaje.tipo} onCerrar={() => setMensaje({ tipo: '', texto: '' })}>{mensaje.texto}</Alerta>

      <div className="filtros">
        <input type="search" placeholder="Buscar por nombre o documento" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar afiliado" />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="vigente">Vigente</option>
          <option value="por_vencer">Por vencer</option>
          <option value="vencida">Vencida</option>
          <option value="sin_membresia">Sin membresía</option>
        </select>
      </div>

      {cargando && <Cargando />}
      <Alerta>{error}</Alerta>
      {datos && (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Documento</th><th>Correo</th><th>Teléfono</th><th>Membresía</th><th aria-label="Acciones" /></tr>
            </thead>
            <tbody>
              {datos.length === 0 && (
                <tr><td colSpan="6" className="vacio">No se encontraron afiliados.</td></tr>
              )}
              {datos.map((a) => (
                <tr key={a.id} className={a.activo ? '' : 'inactivo'}>
                  <td>{a.nombre} {!a.activo && <small>(inactivo)</small>}</td>
                  <td>{a.documento}</td>
                  <td>{a.correo}</td>
                  <td>{a.telefono || '—'}</td>
                  <td><EstadoBadge estado={a.estado} dias={a.dias_restantes} /></td>
                  <td className="acciones">
                    <button type="button" className="btn btn-secundario btn-pequeno" onClick={() => abrir(a)}>Editar</button>
                    <button type="button" className="btn btn-texto btn-pequeno" onClick={() => cambiarActivo(a)}>
                      {a.activo ? 'Inactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal titulo={editando ? 'Editar afiliado' : 'Nuevo afiliado'} abierto={editando !== null} onCerrar={cerrar}>
        <form onSubmit={guardar} noValidate className="formulario">
          {campo('nombre', 'Nombre completo')}
          {campo('documento', 'Documento')}
          {campo('correo', 'Correo', 'email')}
          {campo('telefono', 'Teléfono (opcional)', 'tel')}
          <div className="botones">
            <button type="button" className="btn btn-secundario" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
